"use client";

import type { SymptomSeverity } from "@/types/daily-record";

import type { SymptomFieldName } from "../constants/symptom-severity-options";
import { DailyRecordAdditionalFields } from "./daily-record-additional-fields";
import { DailyRecordFormSection } from "./daily-record-form-section";
import { DailyRecordMeasurementFields } from "./daily-record-measurement-fields";
import { DailyRecordSymptomFields } from "./daily-record-symptom-fields";

export type DailyRecordFormFieldsProps = {
  recordedAtValue: string;
  recordedAtError?: string;
  isRecordedAtReady: boolean;
  maxRecordedAt?: string;
  onRecordedAtChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRecordedAtBlur: () => void;

  pefValue: string;
  pefError?: string;
  onPefChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPefBlur: () => void;

  severityValues: Record<SymptomFieldName, SymptomSeverity>;
  severityErrors: Record<SymptomFieldName, string | undefined>;
  onSeverityChange: (
    fieldName: SymptomFieldName,
    nextValue: SymptomSeverity
  ) => void;

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

export function DailyRecordFormFields(props: DailyRecordFormFieldsProps) {
  return (
    <div
      role="group"
      aria-label="Seções do registro diário"
      className="space-y-8"
    >
      <DailyRecordFormSection
        id="daily-record-section-datetime"
        title="Data e medição"
        description="Data, hora e valor de PEF medido."
      >
        <DailyRecordMeasurementFields
          recordedAtValue={props.recordedAtValue}
          recordedAtError={props.recordedAtError}
          isRecordedAtReady={props.isRecordedAtReady}
          maxRecordedAt={props.maxRecordedAt}
          onRecordedAtChange={props.onRecordedAtChange}
          onRecordedAtBlur={props.onRecordedAtBlur}
          pefValue={props.pefValue}
          pefError={props.pefError}
          onPefChange={props.onPefChange}
          onPefBlur={props.onPefBlur}
        />
      </DailyRecordFormSection>

      <DailyRecordFormSection
        id="daily-record-section-symptoms"
        title="Sintomas"
        description="Intensidade dos sintomas que você observou."
        className="border-t border-[var(--at-border)] pt-8"
      >
        <DailyRecordSymptomFields
          severityValues={props.severityValues}
          severityErrors={props.severityErrors}
          onSeverityChange={props.onSeverityChange}
        />
      </DailyRecordFormSection>

      <DailyRecordFormSection
        id="daily-record-section-additional"
        title="Informações adicionais"
        description="Crises, uso de medicação de resgate e observações."
        className="border-t border-[var(--at-border)] pt-8"
      >
        <DailyRecordAdditionalFields
          hadAttack={props.hadAttack}
          hadAttackError={props.hadAttackError}
          onHadAttackChange={props.onHadAttackChange}
          usedRescueMedication={props.usedRescueMedication}
          usedRescueMedicationError={props.usedRescueMedicationError}
          onUsedRescueMedicationChange={props.onUsedRescueMedicationChange}
          notes={props.notes}
          notesError={props.notesError}
          onNotesChange={props.onNotesChange}
          onNotesBlur={props.onNotesBlur}
        />
      </DailyRecordFormSection>
    </div>
  );
}
