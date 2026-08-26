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

const symptomSeveritySchema = z.coerce
  .number({ error: "Selecione uma intensidade válida" })
  .int({ error: "Selecione uma intensidade válida" })
  .min(0, { error: "A intensidade deve ser entre 0 e 3" })
  .max(3, { error: "A intensidade deve ser entre 0 e 3" })
  .refine((value): value is SymptomSeverity => [0, 1, 2, 3].includes(value), {
    error: "A intensidade deve ser entre 0 e 3",
  });

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
    }),
  pefValue: z
    .union([z.string(), z.number()])
    .refine((value) => value !== "" && value !== null && value !== undefined, {
      error: "Informe o valor de PEF",
    })
    .transform((value) => (typeof value === "number" ? value : Number(value)))
    .refine((value) => !Number.isNaN(value), {
      error: "Informe um valor numérico válido",
    })
    .refine(Number.isInteger, {
      error: "O PEF deve ser um número inteiro",
    })
    .refine((value) => value > 0, {
      error: "O PEF deve ser maior que zero",
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
        z.string().max(1000, {
          error: "As observações devem ter no máximo 1000 caracteres",
        }),
      ]),
    ),
});

export type DailyRecordFormValues = z.infer<typeof dailyRecordFormSchema>;
