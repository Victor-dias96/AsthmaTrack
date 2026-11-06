import { expect, test as setup } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Keeps the two fixture measurements inside the application's default
 * periods (7 days for the dashboard and history, 30 for the report).
 *
 * The fixture records are written once, when the fixtures are created, and
 * the E2E suites assert what the default periods show. A fixture that is
 * older than the window made those suites fail with "no records" even
 * though nothing in the application changed. This project re-anchors only
 * `recorded_at` of the two known fixture rows, and only when they are older
 * than FRESH_FOR_MS. The PEF, notes, ownership and every other row stay
 * untouched, so reruns inside the window write nothing at all.
 *
 * Each patient updates their own row through the same row-level security
 * policies the application uses. No privileged key is involved, and the
 * sessions opened here are discarded with the local sign-out scope so they
 * never revoke the browser storage states.
 */

setup.setTimeout(60_000);

// Far inside the 7-day default period, so a refreshed row stays valid for the
// rest of the window even when a suite starts a day later.
const FRESH_FOR_MS = 24 * 60 * 60 * 1000;
// Rows are never dated in the future, so "latest record" ordering and the
// period upper bound behave the same as for a record entered by the patient.
const BACKDATE_MS = 5 * 60 * 1000;

type FixtureRecord = {
  label: "Patient A" | "Patient B";
  emailVariable: string;
  passwordVariable: string;
  patientIdVariable: string;
  recordIdVariable: string;
  pefVariable: string;
};

const FIXTURES: readonly FixtureRecord[] = [
  {
    label: "Patient A",
    emailVariable: "E2E_PATIENT_A_EMAIL",
    passwordVariable: "E2E_PATIENT_A_PASSWORD",
    patientIdVariable: "E2E_PATIENT_A_ID",
    recordIdVariable: "E2E_PATIENT_A_RECORD_ID",
    pefVariable: "E2E_PATIENT_A_PEF",
  },
  {
    label: "Patient B",
    emailVariable: "E2E_PATIENT_B_EMAIL",
    passwordVariable: "E2E_PATIENT_B_PASSWORD",
    patientIdVariable: "E2E_PATIENT_B_ID",
    recordIdVariable: "E2E_PATIENT_B_RECORD_ID",
    pefVariable: "E2E_PATIENT_B_PEF",
  },
];

function requireEnv(name: string): string {
  const value = process.env[name];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required E2E variable: ${name}`);
  }

  return value.trim();
}

function requireLoopbackSupabaseUrl(): string {
  const value = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Refusing to refresh fixtures."
    );
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  const loopback =
    hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";

  if (!loopback) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not a loopback address. Refusing to refresh fixtures."
    );
  }

  return value;
}

async function refreshFixtureRecord(
  supabaseUrl: string,
  publishableKey: string,
  fixture: FixtureRecord
) {
  const email = requireEnv(fixture.emailVariable);
  const password = requireEnv(fixture.passwordVariable);
  const patientId = requireEnv(fixture.patientIdVariable);
  const recordId = requireEnv(fixture.recordIdVariable);
  const expectedPef = Number(requireEnv(fixture.pefVariable));

  const client = createClient(supabaseUrl, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  try {
    const { data: signedIn, error: signInError } =
      await client.auth.signInWithPassword({ email, password });

    if (signInError || !signedIn.user) {
      throw new Error(
        `${fixture.label} could not sign in to refresh the fixture record. Credentials were not printed.`
      );
    }

    if (signedIn.user.id !== patientId) {
      throw new Error(
        `${fixture.label} signed in as an unexpected account. Refusing to touch any record.`
      );
    }

    const { data: record, error: readError } = await client
      .from("daily_records")
      .select("id, patient_id, pef_value, recorded_at")
      .eq("id", recordId)
      .maybeSingle();

    if (readError) {
      throw new Error(
        `${fixture.label} fixture record could not be read (${readError.code ?? "unknown"}).`
      );
    }

    if (!record) {
      throw new Error(
        `${fixture.label} fixture record does not exist. Recreate the local fixtures; no record was created or changed.`
      );
    }

    if (record.patient_id !== patientId || record.pef_value !== expectedPef) {
      throw new Error(
        `${fixture.label} fixture record does not match its contract (owner or PEF). No record was changed.`
      );
    }

    const recordedAt = Date.parse(record.recorded_at);
    const now = Date.now();

    if (!Number.isFinite(recordedAt)) {
      throw new Error(`${fixture.label} fixture record has an invalid date.`);
    }

    const stale = now - recordedAt > FRESH_FOR_MS;
    const datedInFuture = recordedAt > now;

    if (!stale && !datedInFuture) {
      return;
    }

    const refreshedAt = new Date(now - BACKDATE_MS).toISOString();
    const { data: updated, error: updateError } = await client
      .from("daily_records")
      .update({ recorded_at: refreshedAt })
      .eq("id", recordId)
      .eq("patient_id", patientId)
      .select("id, pef_value");

    if (updateError) {
      throw new Error(
        `${fixture.label} fixture record date could not be refreshed (${updateError.code ?? "unknown"}).`
      );
    }

    expect(
      updated,
      `${fixture.label} fixture refresh must update exactly the one fixture row.`
    ).toHaveLength(1);
    expect(updated?.[0]?.pef_value).toBe(expectedPef);
  } finally {
    // Local scope only: a global sign-out would revoke every session of the
    // fixture account, including the browser storage states used by the suites.
    await client.auth.signOut({ scope: "local" }).catch(() => undefined);
  }
}

setup("keep fixture records inside the default periods", async () => {
  const supabaseUrl = requireLoopbackSupabaseUrl();
  const publishableKey = requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  for (const fixture of FIXTURES) {
    await refreshFixtureRecord(supabaseUrl, publishableKey, fixture);
  }
});
