"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDateToDatetimeLocal } from "@/lib/format-datetime-local";
import { dailyRecordFormSchema } from "@/schemas/daily-record";
import type { SymptomSeverity } from "@/types/daily-record";

import {
  HAD_ATTACK_OPTION_FALSE_ID,
  NOTES_FIELD_ID,
  PEF_FIELD_ID,
  RECORDED_AT_FIELD_ID,
  USED_RESCUE_MEDICATION_OPTION_FALSE_ID,
} from "../constants/field-ids";
import {
  SYMPTOM_FIELDS,
  type SymptomFieldName,
} from "../constants/symptom-severity-options";
import {
  classifyDailyRecordAuthVerification,
  classifyDailyRecordInsertError,
  classifyDailyRecordNetworkError,
  classifyDailyRecordUnexpectedResponse,
} from "../lib/classify-daily-record-submit-error";
import {
  buildDailyRecordInsertPayload,
  convertLocalDatetimeToIso,
} from "../lib/daily-record-payload";

export type DailyRecordSubmissionState =
  | "idle"
  | "submitting"
  | "success"
  | "error";

const SUCCESS_REDIRECT_DELAY_MS = 1500;
const AUTH_REDIRECT_DELAY_MS = 2500;

type SeverityValues = Record<SymptomFieldName, SymptomSeverity>;
type SeverityErrors = Record<SymptomFieldName, string | undefined>;

/** Shape submitted to `dailyRecordFormSchema.safeParse` on final submission. */
type DailyRecordFormRawValues = {
  recordedAt: string;
  pefValue: string;
  coughSeverity: SymptomSeverity;
  wheezingSeverity: SymptomSeverity;
  shortnessOfBreathSeverity: SymptomSeverity;
  chestTightnessSeverity: SymptomSeverity;
  hadAttack: boolean;
  usedRescueMedication: boolean;
  notes: string;
};

type RawFieldName = keyof DailyRecordFormRawValues;

/** Render order of fields, used to pick which invalid field to focus first. */
const FIELD_ORDER: ReadonlyArray<RawFieldName> = [
  "recordedAt",
  "pefValue",
  "coughSeverity",
  "wheezingSeverity",
  "shortnessOfBreathSeverity",
  "chestTightnessSeverity",
  "hadAttack",
  "usedRescueMedication",
  "notes",
];

const FIELD_FOCUS_TARGET_ID: Record<RawFieldName, string> = {
  recordedAt: RECORDED_AT_FIELD_ID,
  pefValue: PEF_FIELD_ID,
  coughSeverity: "coughSeverity-0",
  wheezingSeverity: "wheezingSeverity-0",
  shortnessOfBreathSeverity: "shortnessOfBreathSeverity-0",
  chestTightnessSeverity: "chestTightnessSeverity-0",
  hadAttack: HAD_ATTACK_OPTION_FALSE_ID,
  usedRescueMedication: USED_RESCUE_MEDICATION_OPTION_FALSE_ID,
  notes: NOTES_FIELD_ID,
};

/** Deterministic initial values: every symptom starts at 0, never undefined. */
function createInitialSeverityValues(): SeverityValues {
  return SYMPTOM_FIELDS.reduce((values, field) => {
    values[field.name] = 0;
    return values;
  }, {} as SeverityValues);
}

function createInitialSeverityErrors(): SeverityErrors {
  return SYMPTOM_FIELDS.reduce((errors, field) => {
    errors[field.name] = undefined;
    return errors;
  }, {} as SeverityErrors);
}

function focusField(fieldName: RawFieldName) {
  if (typeof document === "undefined") {
    return;
  }

  document.getElementById(FIELD_FOCUS_TARGET_ID[fieldName])?.focus();
}

/**
 * Single source of truth for every field, error and submission state in the
 * daily-record form. Field components stay controlled and stateless; this
 * hook owns validation-on-interaction, final validation, identity
 * verification and the Supabase insert.
 */
export function useDailyRecordForm() {
  const router = useRouter();

  const [initialLocal, setInitialLocal] = useState("");
  const [recordedAtUserValue, setRecordedAtUserValue] = useState<
    string | null
  >(null);
  const [recordedAtError, setRecordedAtError] = useState<string | undefined>(
    undefined
  );

  const [pefValue, setPefValue] = useState("");
  const [pefError, setPefError] = useState<string | undefined>(undefined);

  const [severityValues, setSeverityValues] = useState<SeverityValues>(
    createInitialSeverityValues
  );
  const [severityErrors, setSeverityErrors] = useState<SeverityErrors>(
    createInitialSeverityErrors
  );

  const [hadAttack, setHadAttack] = useState(false);
  const [hadAttackError, setHadAttackError] = useState<string | undefined>(
    undefined
  );

  const [usedRescueMedication, setUsedRescueMedication] = useState(false);
  const [usedRescueMedicationError, setUsedRescueMedicationError] = useState<
    string | undefined
  >(undefined);

  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState<string | undefined>(undefined);

  const [formError, setFormError] = useState<string | null>(null);
  const [submissionState, setSubmissionState] =
    useState<DailyRecordSubmissionState>("idle");
  /** Blocks concurrent inserts before React can rerender `submissionState`. */
  const isInsertInFlightRef = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setInitialLocal(formatDateToDatetimeLocal(new Date()));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const recordedAtValue = recordedAtUserValue ?? initialLocal;
  const isRecordedAtReady = initialLocal.length > 0;

  function validateRecordedAt(nextValue: string) {
    const result = dailyRecordFormSchema.shape.recordedAt.safeParse(nextValue);
    setRecordedAtError(
      result.success ? undefined : result.error.issues[0]?.message
    );
  }

  function onRecordedAtChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setRecordedAtUserValue(nextValue);

    if (nextValue) {
      validateRecordedAt(nextValue);
    } else {
      setRecordedAtError(undefined);
    }
  }

  function onRecordedAtBlur() {
    if (recordedAtValue) {
      validateRecordedAt(recordedAtValue);
    }
  }

  function validatePef(nextValue: string) {
    const result = dailyRecordFormSchema.shape.pefValue.safeParse(nextValue);
    setPefError(result.success ? undefined : result.error.issues[0]?.message);
  }

  function onPefChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setPefValue(nextValue);

    if (nextValue) {
      validatePef(nextValue);
    } else {
      setPefError(undefined);
    }
  }

  function onPefBlur() {
    validatePef(pefValue);
  }

  function onSeverityChange(
    fieldName: SymptomFieldName,
    nextValue: SymptomSeverity
  ) {
    setSeverityValues((previous) => ({ ...previous, [fieldName]: nextValue }));

    const result = dailyRecordFormSchema.shape[fieldName].safeParse(nextValue);
    setSeverityErrors((previous) => ({
      ...previous,
      [fieldName]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  }

  function onHadAttackChange(nextValue: boolean) {
    setHadAttack(nextValue);

    const result = dailyRecordFormSchema.shape.hadAttack.safeParse(nextValue);
    setHadAttackError(
      result.success ? undefined : result.error.issues[0]?.message
    );
  }

  function onUsedRescueMedicationChange(nextValue: boolean) {
    setUsedRescueMedication(nextValue);

    const result =
      dailyRecordFormSchema.shape.usedRescueMedication.safeParse(nextValue);
    setUsedRescueMedicationError(
      result.success ? undefined : result.error.issues[0]?.message
    );
  }

  function validateNotes(nextValue: string) {
    const result = dailyRecordFormSchema.shape.notes.safeParse(nextValue);
    setNotesError(
      result.success ? undefined : result.error.issues[0]?.message
    );
  }

  function onNotesChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const nextValue = event.target.value;
    setNotes(nextValue);

    if (notesError) {
      validateNotes(nextValue);
    }
  }

  function onNotesBlur() {
    validateNotes(notes);
  }

  function applyFieldErrors(
    fieldErrors: Partial<Record<RawFieldName, string>>
  ) {
    setRecordedAtError(fieldErrors.recordedAt);
    setPefError(fieldErrors.pefValue);
    setSeverityErrors((previous) => ({
      ...previous,
      coughSeverity: fieldErrors.coughSeverity,
      wheezingSeverity: fieldErrors.wheezingSeverity,
      shortnessOfBreathSeverity: fieldErrors.shortnessOfBreathSeverity,
      chestTightnessSeverity: fieldErrors.chestTightnessSeverity,
    }));
    setHadAttackError(fieldErrors.hadAttack);
    setUsedRescueMedicationError(fieldErrors.usedRescueMedication);
    setNotesError(fieldErrors.notes);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isInsertInFlightRef.current) {
      return;
    }

    if (submissionState === "submitting" || submissionState === "success") {
      return;
    }

    const rawValues: DailyRecordFormRawValues = {
      recordedAt: recordedAtValue,
      pefValue,
      coughSeverity: severityValues.coughSeverity,
      wheezingSeverity: severityValues.wheezingSeverity,
      shortnessOfBreathSeverity: severityValues.shortnessOfBreathSeverity,
      chestTightnessSeverity: severityValues.chestTightnessSeverity,
      hadAttack,
      usedRescueMedication,
      notes,
    };

    const result = dailyRecordFormSchema.safeParse(rawValues);

    if (!result.success) {
      const fieldErrors: Partial<Record<RawFieldName, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in fieldErrors)) {
          fieldErrors[key as RawFieldName] = issue.message;
        }
      }

      applyFieldErrors(fieldErrors);

      const firstInvalidField = FIELD_ORDER.find((name) => fieldErrors[name]);
      if (firstInvalidField) {
        focusField(firstInvalidField);
      }

      return;
    }

    applyFieldErrors({});

    const recordedAtIso = convertLocalDatetimeToIso(result.data.recordedAt);

    if (!recordedAtIso) {
      setRecordedAtError("Informe uma data e hora válidas");
      focusField("recordedAt");
      return;
    }

    isInsertInFlightRef.current = true;
    setFormError(null);
    setSubmissionState("submitting");

    let recordSaved = false;
    let insertAttempted = false;

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      const authResult = classifyDailyRecordAuthVerification(user, authError);

      if (authResult.kind === "connection") {
        setSubmissionState("error");
        setFormError(authResult.message);
        return;
      }

      if (authResult.kind === "unauthenticated") {
        setSubmissionState("error");
        setFormError(authResult.message);
        window.setTimeout(() => {
          router.replace("/login");
        }, AUTH_REDIRECT_DELAY_MS);
        return;
      }

      const payload = buildDailyRecordInsertPayload(
        result.data,
        recordedAtIso,
        authResult.user.id
      );

      insertAttempted = true;
      const { error: insertError, status: insertStatus } = await supabase
        .from("daily_records")
        .insert(payload);

      if (insertError) {
        const classified = classifyDailyRecordInsertError(
          insertError,
          insertStatus
        );
        setSubmissionState("error");
        setFormError(classified.message);

        if (classified.kind === "auth") {
          window.setTimeout(() => {
            router.replace("/login");
          }, AUTH_REDIRECT_DELAY_MS);
        }

        return;
      }

      if (insertStatus < 200 || insertStatus >= 300) {
        const classified = classifyDailyRecordUnexpectedResponse();
        setSubmissionState("error");
        setFormError(classified.message);
        return;
      }

      recordSaved = true;
      setSubmissionState("success");
      window.setTimeout(() => {
        router.replace("/paciente/dashboard");
        router.refresh();
      }, SUCCESS_REDIRECT_DELAY_MS);
    } catch {
      const classified = classifyDailyRecordNetworkError(insertAttempted);
      setSubmissionState("error");
      setFormError(classified.message);
    } finally {
      if (!recordSaved) {
        isInsertInFlightRef.current = false;
      }
    }
  }

  return {
    recordedAtValue,
    recordedAtError,
    isRecordedAtReady,
    maxRecordedAt: initialLocal || undefined,
    onRecordedAtChange,
    onRecordedAtBlur,

    pefValue,
    pefError,
    onPefChange,
    onPefBlur,

    severityValues,
    severityErrors,
    onSeverityChange,

    hadAttack,
    hadAttackError,
    onHadAttackChange,

    usedRescueMedication,
    usedRescueMedicationError,
    onUsedRescueMedicationChange,

    notes,
    notesError,
    onNotesChange,
    onNotesBlur,

    formError,
    submissionState,
    handleSubmit,
  };
}

export type UseDailyRecordFormResult = ReturnType<typeof useDailyRecordForm>;
