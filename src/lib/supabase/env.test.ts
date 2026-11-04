import { afterEach, describe, expect, test } from "vitest";

import { getSupabaseEnv } from "./env";

const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ORIGINAL_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const ORIGINAL_VERCEL_ENV = process.env.VERCEL_ENV;

const HOSTED_URL = "https://example.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_example";

function secretPrefixKey(): string {
  return ["sb", "secret", "example"].join("_");
}

function privilegedRoleKey(): string {
  return `header.${["service", "role"].join("_")}.signature`;
}

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_URL;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = ORIGINAL_KEY;
  if (ORIGINAL_VERCEL_ENV === undefined) {
    delete process.env.VERCEL_ENV;
  } else {
    process.env.VERCEL_ENV = ORIGINAL_VERCEL_ENV;
  }
});

describe("getSupabaseEnv", () => {
  test("rejeita variável ausente sem escolher outro ambiente", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;
    delete process.env.VERCEL_ENV;

    expect(() => getSupabaseEnv()).toThrow(/Missing Supabase environment/);
  });

  test("permite o loopback quando não há ambiente hospedado", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;
    delete process.env.VERCEL_ENV;

    expect(getSupabaseEnv()).toEqual({
      url: "http://127.0.0.1:54321",
      key: PUBLISHABLE_KEY,
    });
  });

  test("rejeita loopback e HTTP no ambiente Production da Vercel", () => {
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;

    for (const url of [
      "http://127.0.0.1:54321",
      "http://localhost:54321",
      "https://127.0.0.1:54321",
      "http://example.supabase.co",
    ]) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = url;
      expect(() => getSupabaseEnv()).toThrow(/hosted HTTPS Supabase URL/);
    }
  });

  test("rejeita loopback no ambiente Preview da Vercel", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;

    expect(() => getSupabaseEnv()).toThrow(/hosted HTTPS Supabase URL/);
  });

  test("aceita HTTPS hospedado em Production e Preview", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = HOSTED_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = PUBLISHABLE_KEY;

    for (const vercelEnv of ["production", "preview"]) {
      process.env.VERCEL_ENV = vercelEnv;
      expect(getSupabaseEnv()).toEqual({
        url: HOSTED_URL,
        key: PUBLISHABLE_KEY,
      });
    }
  });

  test("rejeita chave secreta sem repetir o valor", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    delete process.env.VERCEL_ENV;

    for (const key of [secretPrefixKey(), privilegedRoleKey()]) {
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = key;
      expect(() => getSupabaseEnv()).toThrow(/not browser-safe/);
      try {
        getSupabaseEnv();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).not.toContain(key);
      }
    }
  });
});
