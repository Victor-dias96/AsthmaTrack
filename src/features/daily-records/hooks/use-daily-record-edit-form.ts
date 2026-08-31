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
  classifyDailyRecordUpdateError,
  classifyDailyRecordUpdateNetworkError,
  classifyDailyRecordUpdateUnexpectedResponse,
  DAILY_RECORD_AUTH_ERROR_MESSAGE,
  DAILY_RECORD_UPDATE_CONNECTION_ERROR_MESSAGE,
} from "../lib/classify-daily-record-submit-error";
import {
  buildDailyRecordUpdatePayload,
  convertEditRecordedAtToIso,
} from "../lib/daily-record-payload";
import type { DailyRecordEditFormInitialValues } from "../lib/map-daily-record-to-edit-form-values";

export type DailyRecordEditSubmissionState =
  "idle" | "submitting" | "success" | "error" | "not-found";

const SUCCESS_REDIRECT_DELAY_MS = 1500;
const AUTH_REDIRECT_DELAY_MS = 2500;

type SeverityValues = Record<SymptomFieldName, SymptomSeverity>;
type SeverityErrors = Record<SymptomFieldName, string | undefined>;

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

function createInitialSeverityValues(
  initialValues: DailyRecordEditFormInitialValues
): SeverityValues {
  return {
    coughSeverity: initialValues.coughSeverity,
    wheezingSeverity: initialValues.wheezingSeverity,
    shortnessOfBreathSeverity: initialValues.shortnessOfBreathSeverity,
    chestTightnessSeverity: initialValues.chestTightnessSeverity,
  };
}

function createInitialSeverityErrors(): SeverityErrors {
  return SYMPTOM_FIELDS.reduce((errors, field) => {
    errors[field.name] = undefined;
    return errors;
  }, {} as SeverityErrors);
}

function isRawFieldName(value: unknown): value is RawFieldName {
  return (
    typeof value === "string" && FIELD_ORDER.some((name) => name === value)
  );
}

function focusField(fieldName: RawFieldName) {
  if (typeof document === "undefined") {
    return;
  }

  document.getElementById(FIELD_FOCUS_TARGET_ID[fieldName])?.focus();
}

type UseDailyRecordEditFormOptions = {
  recordId: string;
  detailsHref: string;
  initialValues: DailyRecordEditFormInitialValues;
};

export function useDailyRecordEditForm({
  recordId,
  detailsHref,
  initialValues,
}: UseDailyRecordEditFormOptions) {
  const router = useRouter();

  const [recordedAtValue, setRecordedAtValue] = useState(
    initialValues.recordedAt
  );
  const [recordedAtError, setRecordedAtError] = useState<string | undefined>(
    undefined
  );
  const [maxRecordedAt, setMaxRecordedAt] = useState<string | undefined>(
    undefined
  );

  const [pefValue, setPefValue] = useState(String(initialValues.pefValue));
  const [pefError, setPefError] = useState<string | undefined>(undefined);

  const [severityValues, setSeverityValues] = useState<SeverityValues>(() =>
    createInitialSeverityValues(initialValues)
  );
  const [severityErrors, setSeverityErrors] = useState<SeverityErrors>(
    createInitialSeverityErrors
  );

  const [hadAttack, setHadAttack] = useState(initialValues.hadAttack);
  const [hadAttackError, setHadAttackError] = useState<string | undefined>(
    undefined
  );

  const [usedRescueMedication, setUsedRescueMedication] = useState(
    initialValues.usedRescueMedication
  );
  const [usedRescueMedicationError, setUsedRescueMedicationError] = useState<
    string | undefined
  >(undefined);

  const [notes, setNotes] = useState(initialValues.notes);
  const [notesError, setNotesError] = useState<string | undefined>(undefined);

  const [formError, setFormError] = useState<string | null>(null);
  const [submissionState, setSubmissionState] =
    useState<DailyRecordEditSubmissionState>("idle");
  /** Blocks concurrent updates before React can rerender `submissionState`. */
  const isUpdateInFlightRef = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMaxRecordedAt(formatDateToDatetimeLocal(new Date()));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  function validateRecordedAt(nextValue: string) {
    const result = dailyRecordFormSchema.shape.recordedAt.safeParse(nextValue);
    setRecordedAtError(
      result.success ? undefined : result.error.issues[0]?.message
    );
  }

  function onRecordedAtChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    setRecordedAtValue(nextValue);

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
    setNotesError(result.success ? undefined : result.error.issues[0]?.message);
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

    if (isUpdateInFlightRef.current) {
      return;
    }

    if (
      submissionState === "submitting" ||
      submissionState === "success" ||
      submissionState === "not-found"
    ) {
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
        if (isRawFieldName(key) && !(key in fieldErrors)) {
          fieldErrors[key] = issue.message;
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

    const recordedAtIso = convertEditRecordedAtToIso(result.data.recordedAt);

    if (!recordedAtIso) {
      setRecordedAtError("Informe uma data e hora válidas");
      focusField("recordedAt");
      return;
    }

    isUpdateInFlightRef.current = true;
    setFormError(null);
    setSubmissionState("submitting");

    let recordUpdated = false;
    let recordUnavailable = false;

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      const authResult = classifyDailyRecordAuthVerification(user, authError);

      if (authResult.kind === "connection") {
        setSubmissionState("error");
        setFormError(DAILY_RECORD_UPDATE_CONNECTION_ERROR_MESSAGE);
        return;
      }

      if (authResult.kind === "unauthenticated") {
        setSubmissionState("error");
        setFormError(DAILY_RECORD_AUTH_ERROR_MESSAGE);
        window.setTimeout(() => {
          router.replace("/login");
        }, AUTH_REDIRECT_DELAY_MS);
        return;
      }

      const payload = buildDailyRecordUpdatePayload(result.data, recordedAtIso);

      const {
        data: updatedRow,
        error: updateError,
        status: updateStatus,
      } = await supabase
        .from("daily_records")
        .update(payload)
        .eq("id", recordId)
        .eq("patient_id", authResult.user.id)
        .select("id")
        .maybeSingle();

      if (updateError) {
        const classified = classifyDailyRecordUpdateError(
          updateError,
          updateStatus
        );

        if (classified.kind === "not-found") {
          recordUnavailable = true;
          setSubmissionState("not-found");
          return;
        }

        setSubmissionState("error");
        setFormError(classified.message);

        if (classified.kind === "auth") {
          window.setTimeout(() => {
            router.replace("/login");
          }, AUTH_REDIRECT_DELAY_MS);
        }

        return;
      }

      if (!updatedRow) {
        recordUnavailable = true;
        setSubmissionState("not-found");
        return;
      }

      if (updateStatus < 200 || updateStatus >= 300) {
        const classified = classifyDailyRecordUpdateUnexpectedResponse();
        setSubmissionState("error");
        setFormError(classified.message);
        return;
      }

      recordUpdated = true;
      setSubmissionState("success");
      window.setTimeout(() => {
        router.replace(detailsHref);
        router.refresh();
      }, SUCCESS_REDIRECT_DELAY_MS);
    } catch {
      const classified = classifyDailyRecordUpdateNetworkError();
      setSubmissionState("error");
      setFormError(classified.message);
    } finally {
      if (!recordUpdated && !recordUnavailable) {
        isUpdateInFlightRef.current = false;
      }
    }
  }

  return {
    recordedAtValue,
    recordedAtError,
    isRecordedAtReady: true,
    maxRecordedAt,
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

export type UseDailyRecordEditFormResult = ReturnType<
  typeof useDailyRecordEditForm
>;
