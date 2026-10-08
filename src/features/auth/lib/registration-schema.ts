import { z } from "zod";

/** Minimum length enforced by the registration form. No other password rules exist. */
export const REGISTRATION_PASSWORD_MIN_LENGTH = 6;

const NAME_REQUIRED = "Informe seu nome completo";
const EMAIL_REQUIRED = "Informe seu e-mail";
const EMAIL_INVALID = "Informe um e-mail válido";
const PASSWORD_REQUIRED = "Crie uma senha";
const PASSWORD_TOO_SHORT = `A senha deve ter pelo menos ${REGISTRATION_PASSWORD_MIN_LENGTH} caracteres`;
const PASSWORD_CONFIRM_REQUIRED = "Confirme sua senha";
const PASSWORD_MISMATCH = "As senhas não coincidem";
const TERMS_REQUIRED = "Você precisa aceitar os termos de uso para continuar";

/** Same pattern the registration form used before this schema existed. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegistrationData = {
  name: string;
  email: string;
  password: string;
};

export type RegistrationFieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
  terms?: string;
};

export type RegistrationParseResult =
  | { success: true; data: RegistrationData }
  | { success: false; fieldErrors: RegistrationFieldErrors };

function addFieldIssue(
  ctx: z.RefinementCtx,
  path: "name" | "email" | "password" | "passwordConfirm" | "acceptedTerms",
  message: string
) {
  ctx.addIssue({
    code: "custom",
    path: [path],
    message,
  });
}

/**
 * Registration input accepted from the form. Unknown keys are stripped.
 * The persisted profile role is not an input: the database trigger inserts
 * `patient`, and {@link toRegistrationSignUpPayload} never forwards a role.
 */
export const registrationSchema = z
  .object({
    name: z.string({ error: NAME_REQUIRED }),
    email: z.string({ error: EMAIL_REQUIRED }),
    password: z.string({ error: PASSWORD_REQUIRED }),
    passwordConfirm: z.string({ error: PASSWORD_CONFIRM_REQUIRED }),
    // Optional so a missing checkbox does not surface Zod's English type
    // error. The refinement below requires the boolean true.
    acceptedTerms: z.unknown().optional(),
  })
  .superRefine(
    (value, ctx) => {
      if (typeof value.name === "string" && !value.name.trim()) {
        addFieldIssue(ctx, "name", NAME_REQUIRED);
      }

      if (typeof value.email === "string") {
        const email = value.email.trim();
        if (!email) {
          addFieldIssue(ctx, "email", EMAIL_REQUIRED);
        } else if (!EMAIL_PATTERN.test(email)) {
          addFieldIssue(ctx, "email", EMAIL_INVALID);
        }
      }

      if (typeof value.password === "string") {
        if (!value.password) {
          addFieldIssue(ctx, "password", PASSWORD_REQUIRED);
        } else if (value.password.length < REGISTRATION_PASSWORD_MIN_LENGTH) {
          addFieldIssue(ctx, "password", PASSWORD_TOO_SHORT);
        }
      }

      if (typeof value.passwordConfirm === "string") {
        if (!value.passwordConfirm) {
          addFieldIssue(ctx, "passwordConfirm", PASSWORD_CONFIRM_REQUIRED);
        } else if (value.password !== value.passwordConfirm) {
          addFieldIssue(ctx, "passwordConfirm", PASSWORD_MISMATCH);
        }
      }

      if (value.acceptedTerms !== true) {
        addFieldIssue(ctx, "acceptedTerms", TERMS_REQUIRED);
      }
    },
    { when: () => true }
  )
  .transform((value) => ({
    name: value.name.trim(),
    email: value.email.trim(),
    password: value.password,
  }));

export function mapRegistrationFieldErrors(
  error: z.ZodError
): RegistrationFieldErrors {
  const fieldErrors: RegistrationFieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path[0];

    if (key === "acceptedTerms") {
      if (!fieldErrors.terms) {
        fieldErrors.terms = issue.message;
      }
      continue;
    }

    if (
      key === "name" ||
      key === "email" ||
      key === "password" ||
      key === "passwordConfirm"
    ) {
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
  }

  return fieldErrors;
}

export function parseRegistration(input: unknown): RegistrationParseResult {
  const result = registrationSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      fieldErrors: mapRegistrationFieldErrors(result.error),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Payload passed to Supabase Auth. Built only from validated fields so a
 * supplied role, admin flag, or other extra key cannot be forwarded.
 */
export function toRegistrationSignUpPayload(data: RegistrationData) {
  return {
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.name,
      },
    },
  };
}
