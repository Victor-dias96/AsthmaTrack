import { z } from "zod";

import type { SymptomSeverity } from "@/types/daily-record";

/** Matches HTML datetime-local values: YYYY-MM-DDTHH:mm or with seconds. */
const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

function isValidDatetimeLocal(value: string): boolean {
  const match = DATETIME_LOCAL_PATTERN.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const hour = Number(value.slice(11, 13));
  const minute = Number(value.slice(14, 16));
  const second = match[1] ? Number(value.slice(17, 19)) : 0;

  const date = new Date(year, month - 1, day, hour, minute, second);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute &&
    date.getSeconds() === second
  );
}

function isNotFutureDatetimeLocal(value: string): boolean {
  const match = DATETIME_LOCAL_PATTERN.exec(value);
  if (!match) {
    return true;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const hour = Number(value.slice(11, 13));
  const minute = Number(value.slice(14, 16));

  const selected = new Date(year, month - 1, day, hour, minute, 0, 0);
  const now = new Date();
  now.setSeconds(0, 0);

  return selected.getTime() <= now.getTime();
}

const SYMPTOM_SEVERITY_INVALID = "Selecione uma intensidade válida";
const SYMPTOM_SEVERITY_RANGE = "A intensidade deve ser entre 0 e 3";

/**
 * Accepts the numeric state the form submits and the numeric strings a
 * control can send. Blank text, null and booleans are not severities:
 * `z.coerce.number()` would turn them into 0 or 1.
 */
function isSymptomSeverity(value: number): value is SymptomSeverity {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

const symptomSeveritySchema = z
  .union([z.number(), z.string()], { error: SYMPTOM_SEVERITY_INVALID })
  .transform((value) => {
    if (typeof value === "number") {
      return value;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return Number.NaN;
    }

    return Number(trimmed);
  })
  .superRefine((value, ctx) => {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      ctx.addIssue({
        code: "custom",
        message: SYMPTOM_SEVERITY_INVALID,
      });
      return;
    }

    if (!isSymptomSeverity(value)) {
      ctx.addIssue({
        code: "custom",
        message: SYMPTOM_SEVERITY_RANGE,
      });
    }
  })
  .transform((value): SymptomSeverity => {
    if (isSymptomSeverity(value)) {
      return value;
    }

    // Unreachable on success: superRefine already rejected this value.
    return value as SymptomSeverity;
  });

export const DAILY_RECORD_NOTES_MAX_LENGTH = 1000;

const PEF_REQUIRED = "Informe o valor de PEF";
const PEF_INVALID = "Informe um valor numérico válido";
const PEF_INTEGER = "O PEF deve ser um número inteiro";
const PEF_POSITIVE = "O PEF deve ser maior que zero";

export const dailyRecordFormSchema = z.object({
  recordedAt: z
    .string({ error: "Informe a data e hora" })
    .trim()
    .min(1, { error: "Informe a data e hora" })
    .refine((value) => DATETIME_LOCAL_PATTERN.test(value), {
      error: "Informe uma data e hora válidas",
    })
    .refine(isValidDatetimeLocal, {
      error: "Informe uma data e hora válidas",
    })
    .refine(isNotFutureDatetimeLocal, {
      error: "A data e hora não podem ser no futuro",
    }),
  pefValue: z
    .union([z.string(), z.number()], { error: PEF_REQUIRED })
    .refine(
      (value) => {
        if (typeof value === "string") {
          return value.trim().length > 0;
        }

        return value !== null && value !== undefined;
      },
      { error: PEF_REQUIRED }
    )
    .transform((value) =>
      typeof value === "number" ? value : Number(value.trim())
    )
    .superRefine((value, ctx) => {
      if (!Number.isFinite(value)) {
        ctx.addIssue({ code: "custom", message: PEF_INVALID });
        return;
      }

      if (!Number.isInteger(value)) {
        ctx.addIssue({ code: "custom", message: PEF_INTEGER });
        return;
      }

      if (value <= 0) {
        ctx.addIssue({ code: "custom", message: PEF_POSITIVE });
      }
    }),
  coughSeverity: symptomSeveritySchema,
  wheezingSeverity: symptomSeveritySchema,
  shortnessOfBreathSeverity: symptomSeveritySchema,
  chestTightnessSeverity: symptomSeveritySchema,
  hadAttack: z.boolean({
    error: "Valor inválido para crise",
  }),
  usedRescueMedication: z.boolean({
    error: "Valor inválido para medicação de resgate",
  }),
  notes: z
    .union([z.string(), z.null(), z.undefined()])
    .optional()
    .transform((value) => {
      if (value == null) {
        return null;
      }

      const trimmed = value.trim();
      return trimmed.length === 0 ? null : trimmed;
    })
    .pipe(
      z.union([
        z.null(),
        z.string().max(DAILY_RECORD_NOTES_MAX_LENGTH, {
          error: `As observações devem ter no máximo ${DAILY_RECORD_NOTES_MAX_LENGTH} caracteres`,
        }),
      ]),
    ),
});

export type DailyRecordFormValues = z.infer<typeof dailyRecordFormSchema>;
