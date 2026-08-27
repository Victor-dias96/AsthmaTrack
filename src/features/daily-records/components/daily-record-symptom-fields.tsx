"use client";

import { useState } from "react";
import { dailyRecordFormSchema } from "@/schemas/daily-record";
import type { SymptomSeverity } from "@/types/daily-record";

import { SymptomSeveritySelector } from "./symptom-severity-selector";

const COUGH_SEVERITY_FIELD_ID = "daily-record-cough-severity";

export function DailyRecordSymptomFields() {
  const [coughSeverity, setCoughSeverity] = useState<SymptomSeverity>(0);
  const [coughError, setCoughError] = useState<string | undefined>(undefined);

  function handleCoughSeverityChange(nextValue: SymptomSeverity) {
    setCoughSeverity(nextValue);

    const result =
      dailyRecordFormSchema.shape.coughSeverity.safeParse(nextValue);

    if (!result.success) {
      setCoughError(result.error.issues[0]?.message);
      return;
    }

    setCoughError(undefined);
  }

  return (
    <div className="mt-4 min-w-0 space-y-4">
      <SymptomSeveritySelector
        id={COUGH_SEVERITY_FIELD_ID}
        name="coughSeverity"
        label="Tosse"
        value={coughSeverity}
        onChange={handleCoughSeverityChange}
        hint="Selecione a intensidade da tosse que você observou."
        error={coughError}
      />
    </div>
  );
}
