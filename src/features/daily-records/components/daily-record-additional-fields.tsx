"use client";

import { AppTextarea } from "@/components/ui/app-textarea";
import { FormField } from "@/components/ui/form-field";

import { BooleanChoiceSelector } from "./boolean-choice-selector";
import {
  HAD_ATTACK_GROUP_NAME,
  HAD_ATTACK_LABEL_ID,
  HAD_ATTACK_OPTION_FALSE_ID,
  HAD_ATTACK_OPTION_TRUE_ID,
  NOTES_FIELD_ID,
  USED_RESCUE_MEDICATION_GROUP_NAME,
  USED_RESCUE_MEDICATION_LABEL_ID,
  USED_RESCUE_MEDICATION_OPTION_FALSE_ID,
  USED_RESCUE_MEDICATION_OPTION_TRUE_ID,
} from "../constants/field-ids";

const HAD_ATTACK_OPTIONS = [
  { value: false, label: "Não", id: HAD_ATTACK_OPTION_FALSE_ID },
  { value: true, label: "Sim", id: HAD_ATTACK_OPTION_TRUE_ID },
] as const;

const USED_RESCUE_MEDICATION_OPTIONS = [
  { value: false, label: "Não", id: USED_RESCUE_MEDICATION_OPTION_FALSE_ID },
  { value: true, label: "Sim", id: USED_RESCUE_MEDICATION_OPTION_TRUE_ID },
] as const;

const NOTES_MAX_LENGTH = 1000;

type DailyRecordAdditionalFieldsProps = {
  hadAttack: boolean;
  hadAttackError?: string;
  onHadAttackChange: (value: boolean) => void;

  usedRescueMedication: boolean;
  usedRescueMedicationError?: string;
  onUsedRescueMedicationChange: (value: boolean) => void;

  notes: string;
  notesError?: string;
  onNotesChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onNotesBlur: () => void;
};

export function DailyRecordAdditionalFields({
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
}: DailyRecordAdditionalFieldsProps) {
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
        onChange={onHadAttackChange}
        options={HAD_ATTACK_OPTIONS}
        hint="Informe se ocorreu uma crise no momento deste registro."
        error={hadAttackError}
      />

      <BooleanChoiceSelector
        groupName={USED_RESCUE_MEDICATION_GROUP_NAME}
        label="Usou medicação de alívio?"
        labelId={USED_RESCUE_MEDICATION_LABEL_ID}
        value={usedRescueMedication}
        onChange={onUsedRescueMedicationChange}
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
          onChange={onNotesChange}
          onBlur={onNotesBlur}
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
