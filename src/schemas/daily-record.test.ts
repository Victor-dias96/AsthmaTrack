import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, expectTypeOf, test, vi } from "vitest";

import { SYMPTOM_FIELDS } from "@/features/daily-records/constants/symptom-severity-options";
import {
  buildDailyRecordInsertPayload,
  buildDailyRecordUpdatePayload,
} from "@/features/daily-records/lib/daily-record-payload";
import type { SymptomSeverity } from "@/types/daily-record";

import {
  DAILY_RECORD_NOTES_MAX_LENGTH,
  dailyRecordFormSchema,
  type DailyRecordFormValues,
} from "./daily-record";

const PEF_REQUIRED = "Informe o valor de PEF";
const PEF_INVALID = "Informe um valor numérico válido";
const PEF_INTEGER = "O PEF deve ser um número inteiro";
const PEF_POSITIVE = "O PEF deve ser maior que zero";
const SEVERITY_INVALID = "Selecione uma intensidade válida";
const SEVERITY_RANGE = "A intensidade deve ser entre 0 e 3";
const ATTACK_INVALID = "Valor inválido para crise";
const MEDICATION_INVALID = "Valor inválido para medicação de resgate";
const NOTES_TOO_LONG = `As observações devem ter no máximo ${DAILY_RECORD_NOTES_MAX_LENGTH} caracteres`;
const DATE_REQUIRED = "Informe a data e hora";
const DATE_INVALID = "Informe uma data e hora válidas";
const DATE_FUTURE = "A data e hora não podem ser no futuro";

const RECORDED_AT = "2020-01-15T10:30";
const NOTES = "Registro fictício para teste automatizado.";
const CALLER_FROM_AUTH = "sessao-autenticada";
const RECORDED_AT_ISO = "2020-01-15T13:30:00.000Z";

const PARSED_FIELDS = [
  "recordedAt",
  "pefValue",
  "coughSeverity",
  "wheezingSeverity",
  "shortnessOfBreathSeverity",
  "chestTightnessSeverity",
  "hadAttack",
  "usedRescueMedication",
  "notes",
] as const;

type DailyRecordField = (typeof PARSED_FIELDS)[number];

const severityScale = [
  ...new Set(
    SYMPTOM_FIELDS.flatMap((field) => field.options.map((option) => option.value))
  ),
].sort((left, right) => left - right);

const minSeverity = severityScale[0] ?? 0;
const maxSeverity = severityScale[severityScale.length - 1] ?? 0;

/**
 * Shape `useDailyRecordForm` and `useDailyRecordEditForm` pass to
 * `dailyRecordFormSchema.safeParse`: PEF and notes are raw strings, symptom
 * state is numeric, and the two choices are booleans rather than "true".
 */
const validRecord = {
  recordedAt: RECORDED_AT,
  pefValue: "450",
  coughSeverity: 1,
  wheezingSeverity: 0,
  shortnessOfBreathSeverity: 2,
  chestTightnessSeverity: 0,
  hadAttack: false,
  usedRescueMedication: true,
  notes: NOTES,
};

function record(overrides: Record<string, unknown> = {}) {
  return { ...validRecord, ...overrides };
}

function withoutField(field: string) {
  const input = record();
  delete input[field as keyof typeof input];
  return input;
}

function fieldMessages(input: unknown, field: DailyRecordField): string[] {
  const parsed = dailyRecordFormSchema.safeParse(input);
  expect(parsed.success).toBe(false);

  if (parsed.success) {
    return [];
  }

  return parsed.error.issues
    .filter((issue) => issue.path[0] === field)
    .map((issue) => issue.message);
}

function expectInvalid(
  input: unknown,
  field: DailyRecordField,
  message: string
) {
  const messages = fieldMessages(input, field);
  expect(messages[0]).toBe(message);
  expect(messages.every((item) => item === message)).toBe(true);
}

function expectFirstInvalid(
  input: unknown,
  field: DailyRecordField,
  message: string
) {
  expect(fieldMessages(input, field)[0]).toBe(message);
}

function expectValid(input: unknown) {
  const parsed = dailyRecordFormSchema.safeParse(input);
  expect(parsed.success).toBe(true);

  if (!parsed.success) {
    return undefined;
  }

  return parsed.data;
}

describe("dailyRecordFormSchema", () => {
  describe("registro válido", () => {
    test("aceita um registro completo e fictício", () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      try {
        const data = expectValid(validRecord);

        expect(data).toEqual({
          recordedAt: RECORDED_AT,
          pefValue: 450,
          coughSeverity: 1,
          wheezingSeverity: 0,
          shortnessOfBreathSeverity: 2,
          chestTightnessSeverity: 0,
          hadAttack: false,
          usedRescueMedication: true,
          notes: NOTES,
        });
        expect(Object.keys(data ?? {}).sort()).toEqual(
          [...PARSED_FIELDS].sort()
        );
        expect(fetchSpy).not.toHaveBeenCalled();
      } finally {
        fetchSpy.mockRestore();
      }
    });

    test("aceita as strings numéricas de intensidade que o schema converte", () => {
      const data = expectValid(
        record({
          coughSeverity: "1",
          wheezingSeverity: "0",
          shortnessOfBreathSeverity: "2",
          chestTightnessSeverity: "0",
        })
      );

      expect(data?.coughSeverity).toBe(1);
      expect(data?.wheezingSeverity).toBe(0);
      expect(data?.shortnessOfBreathSeverity).toBe(2);
      expect(data?.chestTightnessSeverity).toBe(0);
    });

    test("não altera o objeto de entrada", () => {
      const input = record({ notes: "  Registro fictício  " });
      const snapshot = { ...input };

      expectValid(input);

      expect(input).toEqual(snapshot);
    });

    test("o tipo parseado não inclui posse nem papel", () => {
      expectTypeOf<DailyRecordFormValues>().toEqualTypeOf<{
        recordedAt: string;
        pefValue: number;
        coughSeverity: SymptomSeverity;
        wheezingSeverity: SymptomSeverity;
        shortnessOfBreathSeverity: SymptomSeverity;
        chestTightnessSeverity: SymptomSeverity;
        hadAttack: boolean;
        usedRescueMedication: boolean;
        notes: string | null;
      }>();
    });
  });

  describe("PEF", () => {
    test.each([
      ["menor inteiro positivo", "1", 1],
      ["inteiro fictício", "450", 450],
      ["número já tipado", 450, 450],
    ])("aceita %s", (_label, pefValue, expected) => {
      const data = expectValid(record({ pefValue }));

      expect(data?.pefValue).toBe(expected);
      expect(Number.isInteger(data?.pefValue)).toBe(true);
    });

    test("rejeita PEF ausente", () => {
      expectInvalid(withoutField("pefValue"), "pefValue", PEF_REQUIRED);
    });

    test("rejeita PEF vazio sem transformá-lo em zero", () => {
      expectInvalid(record({ pefValue: "" }), "pefValue", PEF_REQUIRED);
    });

    test("rejeita PEF só com espaços sem transformá-lo em zero", () => {
      expectInvalid(record({ pefValue: "   " }), "pefValue", PEF_REQUIRED);
    });

    test.each([
      ["texto", "abc"],
      ["NaN", "NaN"],
      ["Infinity", "Infinity"],
    ])("rejeita PEF %s", (_label, pefValue) => {
      expectInvalid(record({ pefValue }), "pefValue", PEF_INVALID);
    });

    test.each([
      ["decimal em texto", "450.5"],
      ["decimal numérico", 450.5],
    ])("rejeita PEF %s sem arredondar", (_label, pefValue) => {
      expectInvalid(record({ pefValue }), "pefValue", PEF_INTEGER);
    });

    test.each([
      ["zero em texto", "0"],
      ["zero numérico", 0],
      ["negativo em texto", "-12"],
      ["negativo numérico", -12],
    ])("rejeita PEF %s", (_label, pefValue) => {
      expectInvalid(record({ pefValue }), "pefValue", PEF_POSITIVE);
    });

    test.each([
      ["booleano", true],
      ["nulo", null],
    ])("rejeita PEF com tipo %s", (_label, pefValue) => {
      expectInvalid(record({ pefValue }), "pefValue", PEF_REQUIRED);
    });
  });

  describe("sintomas", () => {
    test.each(
      SYMPTOM_FIELDS.flatMap((field) =>
        field.options.map((option) => [field.name, field.label, option.value] as const)
      )
    )("aceita %s (%s) = %s", (field, _label, value) => {
      const data = expectValid(record({ [field]: value }));

      expect(data?.[field]).toBe(value);
    });

    test.each(
      SYMPTOM_FIELDS.flatMap((field) =>
        field.options.map(
          (option) => [field.name, String(option.value), option.value] as const
        )
      )
    )("converte a string %s=%s no número %s", (field, raw, value) => {
      const data = expectValid(record({ [field]: raw }));

      expect(data?.[field]).toBe(value);
    });

    test.each(SYMPTOM_FIELDS.map((field) => field.name))(
      "rejeita %s ausente",
      (field) => {
        expectInvalid(withoutField(field), field, SEVERITY_INVALID);
      }
    );

    test.each([
      ["texto vazio", ""],
      ["só espaços", "   "],
      ["texto", "leve"],
      ["decimal", "1.5"],
      ["decimal numérico", 1.5],
      ["nulo", null],
      ["booleano verdadeiro", true],
      ["booleano falso", false],
    ])("rejeita tosse com %s", (_label, coughSeverity) => {
      expectInvalid(record({ coughSeverity }), "coughSeverity", SEVERITY_INVALID);
    });

    test("rejeita intensidade abaixo do mínimo", () => {
      expectInvalid(
        record({ wheezingSeverity: minSeverity - 1 }),
        "wheezingSeverity",
        SEVERITY_RANGE
      );
    });

    test("rejeita intensidade acima do máximo", () => {
      expectInvalid(
        record({ chestTightnessSeverity: String(maxSeverity + 1) }),
        "chestTightnessSeverity",
        SEVERITY_RANGE
      );
    });

    test.each(SYMPTOM_FIELDS.map((field) => field.name))(
      "um valor inválido em %s não é atribuído a outro sintoma",
      (field) => {
        const input = record({ [field]: maxSeverity + 1 });
        expectInvalid(input, field, SEVERITY_RANGE);

        const parsed = dailyRecordFormSchema.safeParse(input);
        expect(parsed.success).toBe(false);
        if (parsed.success) {
          return;
        }

        const otherFields = parsed.error.issues
          .map((issue) => issue.path[0])
          .filter((path) => path !== field);
        expect(otherFields).toEqual([]);
      }
    );
  });

  describe("crise", () => {
    test("aceita crise verdadeira", () => {
      const data = expectValid(record({ hadAttack: true }));

      expect(data?.hadAttack).toBe(true);
    });

    test("aceita crise falsa", () => {
      const data = expectValid(record({ hadAttack: false }));

      expect(data?.hadAttack).toBe(false);
    });

    test.each([
      ["ausente", undefined],
      ["texto false", "false"],
      ["texto true", "true"],
      ["on", "on"],
      ["vazio", ""],
      ["zero", 0],
      ["um", 1],
    ])("rejeita crise %s", (_label, hadAttack) => {
      const input =
        hadAttack === undefined ? withoutField("hadAttack") : record({ hadAttack });

      expectInvalid(input, "hadAttack", ATTACK_INVALID);
    });
  });

  describe("medicação de alívio", () => {
    test("aceita uso verdadeiro", () => {
      const data = expectValid(record({ usedRescueMedication: true }));

      expect(data?.usedRescueMedication).toBe(true);
    });

    test("aceita uso falso", () => {
      const data = expectValid(record({ usedRescueMedication: false }));

      expect(data?.usedRescueMedication).toBe(false);
    });

    test.each([
      ["ausente", undefined],
      ["texto false", "false"],
      ["texto true", "true"],
      ["on", "on"],
      ["vazio", ""],
      ["zero", 0],
      ["um", 1],
    ])("rejeita medicação %s", (_label, usedRescueMedication) => {
      const input =
        usedRescueMedication === undefined
          ? withoutField("usedRescueMedication")
          : record({ usedRescueMedication });

      expectInvalid(input, "usedRescueMedication", MEDICATION_INVALID);
    });
  });

  describe("observações", () => {
    test("trata observações ausentes como nulas", () => {
      const data = expectValid(withoutField("notes"));

      expect(data?.notes).toBeNull();
    });

    test.each([
      ["vazias", ""],
      ["só espaços", "   "],
      ["nulas", null],
    ])("trata observações %s como nulas", (_label, notes) => {
      const data = expectValid(record({ notes }));

      expect(data?.notes).toBeNull();
    });

    test("preserva texto fictício, acentos, quebra de linha e pontuação", () => {
      const notes = "Observação fictícia: não houve crise.\nLinha seguinte.";
      const data = expectValid(record({ notes }));

      expect(data?.notes).toBe(notes);
    });

    test("mantém texto semelhante a HTML como texto simples", () => {
      const notes = "<script>alert(1)</script>";
      const data = expectValid(record({ notes }));

      expect(data?.notes).toBe(notes);
    });

    test("aceita observações no tamanho máximo", () => {
      const notes = "á".repeat(DAILY_RECORD_NOTES_MAX_LENGTH);
      const data = expectValid(record({ notes }));

      expect(data?.notes).toHaveLength(DAILY_RECORD_NOTES_MAX_LENGTH);
    });

    test("rejeita observações acima do tamanho máximo", () => {
      expectInvalid(
        record({ notes: "á".repeat(DAILY_RECORD_NOTES_MAX_LENGTH + 1) }),
        "notes",
        NOTES_TOO_LONG
      );
    });
  });

  describe("data e hora", () => {
    test("aceita datetime-local fixo no passado", () => {
      const data = expectValid(validRecord);

      expect(data?.recordedAt).toBe(RECORDED_AT);
    });

    test("aceita datetime-local com segundos", () => {
      const recordedAt = "2020-01-15T10:30:45";
      const data = expectValid(record({ recordedAt }));

      expect(data?.recordedAt).toBe(recordedAt);
    });

    test("remove espaços ao redor da data", () => {
      const data = expectValid(record({ recordedAt: `  ${RECORDED_AT}  ` }));

      expect(data?.recordedAt).toBe(RECORDED_AT);
    });

    test("rejeita data ausente", () => {
      expectInvalid(withoutField("recordedAt"), "recordedAt", DATE_REQUIRED);
    });

    test("rejeita data vazia", () => {
      expectFirstInvalid(record({ recordedAt: "" }), "recordedAt", DATE_REQUIRED);
    });

    test.each([
      ["texto", "ontem"],
      ["data impossível", "2020-02-31T10:30"],
      ["ISO com fuso", "2020-01-15T10:30:00.000Z"],
    ])("rejeita data %s", (_label, recordedAt) => {
      expectInvalid(record({ recordedAt }), "recordedAt", DATE_INVALID);
    });

    test("rejeita data futura fixa", () => {
      expectInvalid(
        record({ recordedAt: "2099-06-01T08:00" }),
        "recordedAt",
        DATE_FUTURE
      );
    });
  });

  describe("campos não permitidos", () => {
    test("ignora posse, papel e identificadores enviados no formulário", () => {
      const data = expectValid(
        record({
          patient_id: "outro-paciente",
          professional_id: "outro-profissional",
          authorization_id: "outra-autorizacao",
          id: "outro-registro",
          created_at: "1999-01-01T00:00:00.000Z",
          updated_at: "1999-01-01T00:00:00.000Z",
          role: "medical",
          user_id: "outro-usuario",
        })
      );

      expect(data).toEqual(expectValid(validRecord));
      expect(data).not.toHaveProperty("patient_id");
      expect(data).not.toHaveProperty("professional_id");
      expect(data).not.toHaveProperty("authorization_id");
      expect(data).not.toHaveProperty("id");
      expect(data).not.toHaveProperty("role");
      expect(data).not.toHaveProperty("user_id");
    });

    test("a atualização não recebe posse nem id do formulário", () => {
      const data = expectValid(
        record({
          patient_id: "outro-paciente",
          id: "outro-registro",
          role: "medical",
        })
      );

      if (!data) {
        return;
      }

      const payload = buildDailyRecordUpdatePayload(data, RECORDED_AT_ISO);

      expect(payload).toEqual({
        recorded_at: RECORDED_AT_ISO,
        pef_value: 450,
        cough_severity: 1,
        wheezing_severity: 0,
        shortness_of_breath_severity: 2,
        chest_tightness_severity: 0,
        had_attack: false,
        used_rescue_medication: true,
        notes: NOTES,
      });
      expect(payload).not.toHaveProperty("patient_id");
      expect(payload).not.toHaveProperty("id");
      expect(payload).not.toHaveProperty("role");
    });

    test("a inserção usa o paciente do chamador autenticado", () => {
      const data = expectValid(record({ patient_id: "outro-paciente" }));

      if (!data) {
        return;
      }

      const payload = buildDailyRecordInsertPayload(
        data,
        RECORDED_AT_ISO,
        CALLER_FROM_AUTH
      );

      expect(payload.patient_id).toBe(CALLER_FROM_AUTH);
      expect(payload).not.toHaveProperty("id");
      expect(payload).not.toHaveProperty("role");
    });
  });

  describe("normalização", () => {
    test("converte PEF com espaços e zero à esquerda em inteiro", () => {
      const padded = expectValid(record({ pefValue: "  450  " }));
      const leadingZero = expectValid(record({ pefValue: "0450" }));

      expect(padded?.pefValue).toBe(450);
      expect(leadingZero?.pefValue).toBe(450);
    });

    test("converte PEF decimal de valor inteiro e rejeita fração", () => {
      const integerText = expectValid(record({ pefValue: "450.0" }));

      expect(integerText?.pefValue).toBe(450);
      expectInvalid(record({ pefValue: "450.5" }), "pefValue", PEF_INTEGER);
    });

    test("converte notação numérica aceita por Number", () => {
      const data = expectValid(record({ pefValue: "1e2" }));

      expect(data?.pefValue).toBe(100);
    });

    test("remove espaços das observações e preserva o miolo", () => {
      const data = expectValid(
        record({ notes: "  Observação fictícia.  " })
      );

      expect(data?.notes).toBe("Observação fictícia.");
    });

    test("aceita o máximo depois de remover espaços das pontas", () => {
      const notes = ` ${"b".repeat(DAILY_RECORD_NOTES_MAX_LENGTH)} `;
      const data = expectValid(record({ notes }));

      expect(data?.notes).toHaveLength(DAILY_RECORD_NOTES_MAX_LENGTH);
    });

    test("não infere crise a partir da medicação nem o contrário", () => {
      const attackOnly = expectValid(
        record({ hadAttack: true, usedRescueMedication: false })
      );
      const medicationOnly = expectValid(
        record({ hadAttack: false, usedRescueMedication: true })
      );

      expect(attackOnly?.hadAttack).toBe(true);
      expect(attackOnly?.usedRescueMedication).toBe(false);
      expect(medicationOnly?.hadAttack).toBe(false);
      expect(medicationOnly?.usedRescueMedication).toBe(true);
    });
  });

  describe("criação e edição", () => {
    test("criação e edição validam com o mesmo schema antes do Supabase", () => {
      const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
      const createHook = readFileSync(
        join(
          repoRoot,
          "src/features/daily-records/hooks/use-daily-record-form.ts"
        ),
        "utf8"
      );
      const editHook = readFileSync(
        join(
          repoRoot,
          "src/features/daily-records/hooks/use-daily-record-edit-form.ts"
        ),
        "utf8"
      );
      const schemaSource = readFileSync(
        join(repoRoot, "src/schemas/daily-record.ts"),
        "utf8"
      );

      for (const source of [createHook, editHook]) {
        expect(source).toContain(
          'import { dailyRecordFormSchema } from "@/schemas/daily-record"'
        );
        expect(source).toContain("dailyRecordFormSchema.safeParse(rawValues)");
        expect(source.indexOf("dailyRecordFormSchema.safeParse")).toBeLessThan(
          source.indexOf("createClient()")
        );
        expect(source).not.toContain("z.object(");
        expect(source).not.toContain("service_role");
      }

      expect(editHook).toContain('.eq("patient_id", authResult.user.id)');
      expect(editHook).toContain('.eq("id", recordId)');
      expect(schemaSource).not.toContain("supabase");
      expect(schemaSource).not.toContain("service_role");
    });
  });
});
