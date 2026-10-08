import { describe, expect, expectTypeOf, test, vi } from "vitest";

import { validateRegistrationAction } from "@/features/auth/server/validate-registration";

import {
  REGISTRATION_PASSWORD_MIN_LENGTH,
  parseRegistration,
  registrationSchema,
  toRegistrationSignUpPayload,
  type RegistrationData,
  type RegistrationFieldErrors,
} from "./registration-schema";

const NAME_REQUIRED = "Informe seu nome completo";
const EMAIL_REQUIRED = "Informe seu e-mail";
const EMAIL_INVALID = "Informe um e-mail válido";
const PASSWORD_REQUIRED = "Crie uma senha";
const PASSWORD_TOO_SHORT = "A senha deve ter pelo menos 6 caracteres";
const PASSWORD_CONFIRM_REQUIRED = "Confirme sua senha";
const PASSWORD_MISMATCH = "As senhas não coincidem";
const TERMS_REQUIRED = "Você precisa aceitar os termos de uso para continuar";

const FIXTURE_PASSWORD = "SenhaFicticia123!";

const validRegistration = {
  name: "Paciente Teste",
  email: "paciente.teste@example.com",
  password: FIXTURE_PASSWORD,
  passwordConfirm: FIXTURE_PASSWORD,
  acceptedTerms: true,
};

function registration(overrides: Record<string, unknown> = {}) {
  return { ...validRegistration, ...overrides };
}

function withoutField(field: string) {
  const input = registration();
  delete input[field as keyof typeof input];
  return input;
}

function expectInvalid(
  input: unknown,
  field: keyof RegistrationFieldErrors,
  message: string
) {
  const parsed = registrationSchema.safeParse(input);
  expect(parsed.success).toBe(false);

  const result = parseRegistration(input);
  expect(result.success).toBe(false);
  if (result.success) {
    return;
  }

  expect(result.fieldErrors[field]).toBe(message);
}

function expectValid(input: unknown) {
  const parsed = registrationSchema.safeParse(input);
  expect(parsed.success).toBe(true);
  if (!parsed.success) {
    return undefined;
  }

  expect(parseRegistration(input)).toEqual({
    success: true,
    data: parsed.data,
  });

  return parsed.data;
}

describe("registrationSchema", () => {
  describe("dados válidos", () => {
    test("aceita um cadastro completo e fictício", () => {
      const data = expectValid(validRegistration);

      expect(data).toEqual({
        name: "Paciente Teste",
        email: "paciente.teste@example.com",
        password: FIXTURE_PASSWORD,
      });
      expect(Object.keys(data ?? {}).sort()).toEqual([
        "email",
        "name",
        "password",
      ]);
    });

    test("não altera o objeto de entrada", () => {
      const input = registration({ name: "  Paciente Teste  " });
      const snapshot = { ...input };

      expectValid(input);

      expect(input).toEqual(snapshot);
    });

    test("o tipo parseado não inclui papel privilegiado", () => {
      expectTypeOf<RegistrationData>().toEqualTypeOf<{
        name: string;
        email: string;
        password: string;
      }>();
    });
  });

  describe("nome completo", () => {
    test.each([
      ["nome completo", "Paciente Teste"],
      ["acentos", "João Conceição"],
      ["hífen", "Ana-Clara Teste"],
      ["apóstrofo", "D'Ávila Teste"],
      ["uma palavra", "Paciente"],
      ["dígitos", "Paciente 2"],
      ["texto semelhante a HTML", "<b>Paciente Teste</b>"],
    ])("aceita %s", (_label, name) => {
      const data = expectValid(registration({ name }));

      expect(data?.name).toBe(name);
    });

    test("aceita um nome de um caractere", () => {
      const data = expectValid(registration({ name: "A" }));

      expect(data?.name).toBe("A");
    });

    test("rejeita nome ausente", () => {
      expectInvalid(withoutField("name"), "name", NAME_REQUIRED);
    });

    test("rejeita nome vazio", () => {
      expectInvalid(registration({ name: "" }), "name", NAME_REQUIRED);
    });

    test("rejeita nome só com espaços", () => {
      expectInvalid(registration({ name: "   " }), "name", NAME_REQUIRED);
    });
  });

  describe("e-mail", () => {
    test("aceita e-mail fictício em example.com", () => {
      const data = expectValid(validRegistration);

      expect(data?.email).toBe("paciente.teste@example.com");
    });

    test("rejeita e-mail ausente", () => {
      expectInvalid(withoutField("email"), "email", EMAIL_REQUIRED);
    });

    test("rejeita e-mail vazio", () => {
      expectInvalid(registration({ email: "" }), "email", EMAIL_REQUIRED);
    });

    test("rejeita e-mail só com espaços", () => {
      expectInvalid(registration({ email: "   " }), "email", EMAIL_REQUIRED);
    });

    test.each([
      ["sem @", "paciente.example.com"],
      ["sem domínio", "paciente@"],
      ["sem ponto no domínio", "paciente@example"],
      ["com espaço interno", "paciente teste@example.com"],
    ])("rejeita e-mail %s", (_label, email) => {
      expectInvalid(registration({ email }), "email", EMAIL_INVALID);
    });
  });

  describe("senha", () => {
    test("rejeita senha ausente", () => {
      expectInvalid(withoutField("password"), "password", PASSWORD_REQUIRED);
    });

    test("rejeita senha vazia", () => {
      expectInvalid(
        registration({ password: "" }),
        "password",
        PASSWORD_REQUIRED
      );
    });

    test("rejeita senha abaixo do mínimo", () => {
      const tooShort = "a".repeat(REGISTRATION_PASSWORD_MIN_LENGTH - 1);

      expectInvalid(
        registration({ password: tooShort, passwordConfirm: tooShort }),
        "password",
        PASSWORD_TOO_SHORT
      );
    });

    test("aceita senha no limite mínimo", () => {
      const minimum = "a".repeat(REGISTRATION_PASSWORD_MIN_LENGTH);
      const data = expectValid(
        registration({ password: minimum, passwordConfirm: minimum })
      );

      expect(data?.password).toBe(minimum);
    });

    test("aceita senha longa porque não há limite máximo", () => {
      const longPassword = "a".repeat(128);
      const data = expectValid(
        registration({
          password: longPassword,
          passwordConfirm: longPassword,
        })
      );

      expect(data?.password).toHaveLength(128);
    });

    test("rejeita senha curta feita só de espaços", () => {
      const spaces = " ".repeat(REGISTRATION_PASSWORD_MIN_LENGTH - 1);

      expectInvalid(
        registration({ password: spaces, passwordConfirm: spaces }),
        "password",
        PASSWORD_TOO_SHORT
      );
    });

    test("aceita senha unicode que atinge o mínimo", () => {
      const password = "ação12";
      const data = expectValid(
        registration({ password, passwordConfirm: password })
      );

      expect(data?.password).toBe(password);
    });
  });

  describe("confirmação de senha", () => {
    test("aceita confirmação idêntica", () => {
      const data = expectValid(validRegistration);

      expect(data?.password).toBe(FIXTURE_PASSWORD);
      expect(data).not.toHaveProperty("passwordConfirm");
    });

    test("rejeita confirmação ausente", () => {
      expectInvalid(
        withoutField("passwordConfirm"),
        "passwordConfirm",
        PASSWORD_CONFIRM_REQUIRED
      );
    });

    test("rejeita confirmação vazia", () => {
      expectInvalid(
        registration({ passwordConfirm: "" }),
        "passwordConfirm",
        PASSWORD_CONFIRM_REQUIRED
      );
    });

    test("rejeita confirmação diferente", () => {
      expectInvalid(
        registration({ passwordConfirm: "SenhaFicticia123?" }),
        "passwordConfirm",
        PASSWORD_MISMATCH
      );
    });

    test("rejeita confirmação com caixa diferente", () => {
      expectInvalid(
        registration({ passwordConfirm: "senhaficticia123!" }),
        "passwordConfirm",
        PASSWORD_MISMATCH
      );
    });

    test("rejeita confirmação só com espaços", () => {
      expectInvalid(
        registration({ passwordConfirm: "   " }),
        "passwordConfirm",
        PASSWORD_MISMATCH
      );
    });
  });

  describe("termos", () => {
    test("rejeita termos ausentes", () => {
      expectInvalid(withoutField("acceptedTerms"), "terms", TERMS_REQUIRED);
    });

    test("rejeita termos recusados", () => {
      const result = parseRegistration(registration({ acceptedTerms: false }));

      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }

      expect(result.fieldErrors).toEqual({ terms: TERMS_REQUIRED });
    });

    test("rejeita o valor bruto de checkbox", () => {
      expectInvalid(
        registration({ acceptedTerms: "on" }),
        "terms",
        TERMS_REQUIRED
      );
    });
  });

  describe("papel do usuário", () => {
    test("ignora tentativa de papel medical e não a encaminha", () => {
      const data = expectValid(
        registration({
          role: "medical",
          isAdmin: true,
        })
      );

      expect(data).not.toHaveProperty("role");
      expect(data).not.toHaveProperty("isAdmin");

      const payload = toRegistrationSignUpPayload(
        data ?? {
          name: "",
          email: "",
          password: "",
        }
      );

      expect(payload).toEqual({
        email: "paciente.teste@example.com",
        password: FIXTURE_PASSWORD,
        options: {
          data: {
            full_name: "Paciente Teste",
          },
        },
      });
      expect(payload.options.data).not.toHaveProperty("role");
    });

    test("ignora papel admin informado junto do cadastro", () => {
      const data = expectValid(registration({ role: "admin" }));

      expect(data).not.toHaveProperty("role");
      expect(
        toRegistrationSignUpPayload(
          data ?? { name: "", email: "", password: "" }
        ).options.data
      ).toEqual({ full_name: "Paciente Teste" });
    });
  });

  describe("normalização", () => {
    test("remove espaços nas pontas do nome e preserva o miolo", () => {
      const data = expectValid(registration({ name: "  Paciente  Teste  " }));

      expect(data?.name).toBe("Paciente  Teste");
    });

    test("remove espaços do e-mail e preserva a caixa", () => {
      const data = expectValid(
        registration({ email: "  Paciente.Teste@Example.com  " })
      );

      expect(data?.email).toBe("Paciente.Teste@Example.com");
    });

    test("não altera a senha", () => {
      const password = ` ${"a".repeat(REGISTRATION_PASSWORD_MIN_LENGTH)}`;
      const data = expectValid(
        registration({ password, passwordConfirm: password })
      );

      expect(data?.password).toBe(password);
    });
  });

  describe("erros combinados", () => {
    test("associa cada campo obrigatório vazio à sua mensagem", () => {
      const result = parseRegistration({
        name: "",
        email: "",
        password: "",
        passwordConfirm: "",
        acceptedTerms: false,
      });

      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }

      expect(result.fieldErrors).toEqual({
        name: NAME_REQUIRED,
        email: EMAIL_REQUIRED,
        password: PASSWORD_REQUIRED,
        passwordConfirm: PASSWORD_CONFIRM_REQUIRED,
        terms: TERMS_REQUIRED,
      });
    });

    test("mantém o erro de e-mail e o de confirmação ao mesmo tempo", () => {
      const result = parseRegistration(
        registration({
          email: "paciente.example.com",
          passwordConfirm: "SenhaFicticia124!",
        })
      );

      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }

      expect(result.fieldErrors.email).toBe(EMAIL_INVALID);
      expect(result.fieldErrors.passwordConfirm).toBe(PASSWORD_MISMATCH);
      expect(result.fieldErrors.password).toBeUndefined();
    });
  });

  describe("validação no servidor", () => {
    test("repete a rejeição do schema sem rede e sem criar usuário", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      try {
        const result = await validateRegistrationAction(
          registration({ email: "   " })
        );

        expect(result).toEqual(
          parseRegistration(registration({ email: "   " }))
        );
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.fieldErrors.email).toBe(EMAIL_REQUIRED);
        }
        expect(fetchSpy).not.toHaveBeenCalled();
      } finally {
        fetchSpy.mockRestore();
      }
    });

    test("devolve o cadastro normalizado quando a entrada é válida", async () => {
      const result = await validateRegistrationAction(
        registration({
          name: "  Paciente Teste  ",
          email: "  paciente.teste@example.com  ",
          role: "medical",
        })
      );

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      expect(result.data).toEqual({
        name: "Paciente Teste",
        email: "paciente.teste@example.com",
        password: FIXTURE_PASSWORD,
      });
      expect(
        toRegistrationSignUpPayload(result.data).options.data
      ).not.toHaveProperty("role");
    });
  });
});
