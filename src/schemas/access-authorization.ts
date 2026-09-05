import { z } from "zod";

/**
 * Matches the exact format `public.find_medical_professional_by_code`
 * expects after normalization: 8 uppercase letters/digits (2-9 only, to
 * avoid the 0/1 ambiguity the database-generated codes already avoid).
 */
const PROFESSIONAL_CODE_PATTERN = /^[A-Z2-9]{8}$/;

/** Generous upper bound applied before normalization/format checks, so an
 * excessively long or pasted-in value never reaches the regex engine. */
const RAW_PROFESSIONAL_CODE_MAX_LENGTH = 64;

const INVALID_PROFESSIONAL_CODE_MESSAGE =
  "Código inválido. Verifique e tente novamente.";

function normalizeProfessionalCode(value: string): string {
  return value.trim().toUpperCase();
}

/**
 * Validates and normalizes the patient-entered professional code.
 *
 * Trims surrounding whitespace, upper-cases (documented, exact-match
 * normalization only -- never a fuzzy or partial transform), then requires
 * the exact 8-character format. Any other shape -- empty, too long, a URL,
 * JSON, multiple codes, control characters, punctuation -- fails the final
 * format check and produces the same generic message, so validation
 * internals are never exposed.
 */
export const professionalCodeSchema = z
  .string({ error: "Informe o código do profissional" })
  .min(1, { error: "Informe o código do profissional" })
  .max(RAW_PROFESSIONAL_CODE_MAX_LENGTH, {
    error: INVALID_PROFESSIONAL_CODE_MESSAGE,
  })
  .transform(normalizeProfessionalCode)
  .pipe(
    z.string().regex(PROFESSIONAL_CODE_PATTERN, {
      error: INVALID_PROFESSIONAL_CODE_MESSAGE,
    })
  );

export const authorizeMedicalTeamMemberFormSchema = z.object({
  professionalCode: professionalCodeSchema,
});

export type AuthorizeMedicalTeamMemberFormValues = z.infer<
  typeof authorizeMedicalTeamMemberFormSchema
>;
