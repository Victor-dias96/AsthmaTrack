"use client";

import { useState } from "react";
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

export function DailyRecordAdditionalFields() {
  const [hadAttack, setHadAttack] = useState(false);
  const [hadAttackError, setHadAttackError] = useState<string | undefined>(
    undefined
  );
  const [usedRescueMedication, setUsedRescueMedication] = useState(false);
  const [usedRescueMedicationError, setUsedRescueMedicationError] = useState<
    string | undefined
  >(undefined);

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
    </div>
  );
}
