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

export function DailyRecordAdditionalFields() {
  const [hadAttack, setHadAttack] = useState(false);
  const [hadAttackError, setHadAttackError] = useState<string | undefined>(
    undefined
  );

  function handleHadAttackChange(nextValue: boolean) {
    setHadAttack(nextValue);

    const result = dailyRecordFormSchema.shape.hadAttack.safeParse(nextValue);

    setHadAttackError(
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
    </div>
  );
}
