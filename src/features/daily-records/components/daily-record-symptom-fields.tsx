"use client";

import { useState } from "react";
import { dailyRecordFormSchema } from "@/schemas/daily-record";
import type { SymptomSeverity } from "@/types/daily-record";

import { WHEEZING_SEVERITY_OPTIONS } from "../constants/symptom-severity-options";
import { SymptomSeveritySelector } from "./symptom-severity-selector";

const COUGH_SEVERITY_FIELD_ID = "daily-record-cough-severity";
const WHEEZING_SEVERITY_FIELD_ID = "daily-record-wheezing-severity";

export function DailyRecordSymptomFields() {
  const [coughSeverity, setCoughSeverity] = useState<SymptomSeverity>(0);
  const [coughError, setCoughError] = useState<string | undefined>(undefined);
  const [wheezingSeverity, setWheezingSeverity] = useState<SymptomSeverity>(0);
  const [wheezingError, setWheezingError] = useState<string | undefined>(
    undefined
  );

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

  function handleWheezingSeverityChange(nextValue: SymptomSeverity) {
    setWheezingSeverity(nextValue);

    const result =
      dailyRecordFormSchema.shape.wheezingSeverity.safeParse(nextValue);

    if (!result.success) {
      setWheezingError(result.error.issues[0]?.message);
      return;
    }

    setWheezingError(undefined);
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
      <SymptomSeveritySelector
        id={WHEEZING_SEVERITY_FIELD_ID}
        name="wheezingSeverity"
        label="Chiado"
        value={wheezingSeverity}
        onChange={handleWheezingSeverityChange}
        options={WHEEZING_SEVERITY_OPTIONS}
        hint="Selecione a intensidade do chiado que você observou."
        error={wheezingError}
      />
    </div>
  );
}
