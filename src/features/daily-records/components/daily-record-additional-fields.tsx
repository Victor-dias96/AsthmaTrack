"use client";

import { useState } from "react";
import { AppTextarea } from "@/components/ui/app-textarea";
import { FormField } from "@/components/ui/form-field";
import { dailyRecordFormSchema } from "@/schemas/daily-record";

import { BooleanChoiceSelector } from "./boolean-choice-selector";

const HAD_ATTACK_GROUP_NAME = "hadAttack";
const HAD_ATTACK_LABEL_ID = "daily-record-had-attack-label";

const HAD_ATTACK_OPTIONS = [
  { value: false, label: "Não", id: "hadAttack-false" },
  { value: true, label: "Sim", id: "hadAttack-true" },
] as const;

const USED_RESCUE_MEDICATION_GROUP_NAME = "usedRescueMedication";
const USED_RESCUE_MEDICATION_LABEL_ID =
  "daily-record-used-rescue-medication-label";

const USED_RESCUE_MEDICATION_OPTIONS = [
  { value: false, label: "Não", id: "usedRescueMedication-false" },
  { value: true, label: "Sim", id: "usedRescueMedication-true" },
] as const;

const NOTES_FIELD_ID = "daily-record-notes";
const NOTES_MAX_LENGTH = 1000;

export function DailyRecordAdditionalFields() {
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

  function handleHadAttackChange(nextValue: boolean) {
    setHadAttack(nextValue);

    const result = dailyRecordFormSchema.shape.hadAttack.safeParse(nextValue);

    setHadAttackError(
      result.success ? undefined : result.error.issues[0]?.message
    );
  }

  function handleUsedRescueMedicationChange(nextValue: boolean) {
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

  function handleNotesChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const nextValue = event.target.value;
    setNotes(nextValue);

    if (notesError) {
      validateNotes(nextValue);
    }
  }

  function handleNotesBlur() {
    validateNotes(notes);
  }

  const notesDescribedBy = notesError
    ? `${NOTES_FIELD_ID}-error`
    : `${NOTES_FIELD_ID}-hint ${NOTES_FIELD_ID}-counter`;

  return (
    <div className="mt-4 min-w-0 space-y-4">
      <BooleanChoiceSelector
        groupName={HAD_ATTACK_GROUP_NAME}
        label="Teve uma crise de asma?"
        labelId={HAD_ATTACK_LABEL_ID}
        value={hadAttack}
        onChange={handleHadAttackChange}
        options={HAD_ATTACK_OPTIONS}
        hint="Informe se ocorreu uma crise no momento deste registro."
        error={hadAttackError}
      />

      <BooleanChoiceSelector
        groupName={USED_RESCUE_MEDICATION_GROUP_NAME}
        label="Usou medicação de alívio?"
        labelId={USED_RESCUE_MEDICATION_LABEL_ID}
        value={usedRescueMedication}
        onChange={handleUsedRescueMedicationChange}
        options={USED_RESCUE_MEDICATION_OPTIONS}
        error={usedRescueMedicationError}
      />

      <FormField
        label="Observações"
        htmlFor={NOTES_FIELD_ID}
        hint="Opcional. Adicione alguma informação que considere importante sobre este registro."
        error={notesError}
        className="min-w-0"
      >
        <AppTextarea
          id={NOTES_FIELD_ID}
          name="notes"
          value={notes}
          onChange={handleNotesChange}
          onBlur={handleNotesBlur}
          rows={4}
          maxLength={NOTES_MAX_LENGTH}
          hasError={!!notesError}
          aria-invalid={!!notesError}
          aria-describedby={notesDescribedBy}
          className="min-w-0 max-w-full"
        />
        <p
          id={`${NOTES_FIELD_ID}-counter`}
          aria-live="polite"
          className="text-right text-xs text-[var(--at-text-secondary)]"
        >
          {notes.length}/{NOTES_MAX_LENGTH}
        </p>
      </FormField>
    </div>
  );
}
