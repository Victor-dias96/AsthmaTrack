import { AppCard } from "@/components/ui/app-card";
import { formatHistoryBoolean } from "@/features/history/lib/format-history-display";
import { formatRecordedAt } from "@/features/history/lib/format-recorded-at";
import { formatSymptomSeverityLabel } from "@/features/history/lib/format-symptom-severity-label";
import type { SymptomSeverity } from "@/types/daily-record";

import type { MedicalPatientHistoryRecord } from "../types/medical-patient-history";

type SymptomField = {
  label: string;
  gender: "masculine" | "feminine";
  getSeverity: (record: MedicalPatientHistoryRecord) => SymptomSeverity;
};

const SYMPTOM_FIELDS: readonly SymptomField[] = [
  {
    label: "Tosse",
    gender: "feminine",
    getSeverity: (record) => record.coughSeverity,
  },
  {
    label: "Chiado",
    gender: "masculine",
    getSeverity: (record) => record.wheezingSeverity,
  },
  {
    label: "Falta de ar",
    gender: "feminine",
    getSeverity: (record) => record.shortnessOfBreathSeverity,
  },
  {
    label: "Aperto no peito",
    gender: "masculine",
    getSeverity: (record) => record.chestTightnessSeverity,
  },
];

type MedicalPatientHistoryRecordItemProps = {
  record: MedicalPatientHistoryRecord;
};

/**
 * One read-only history card. Shows the same factual fields as the patient
 * history card except notes and any detail, edit or delete action. No
 * record id is rendered.
 */
export function MedicalPatientHistoryRecordItem({
  record,
}: MedicalPatientHistoryRecordItemProps) {
  const formattedRecordedAt = formatRecordedAt(record.recordedAt);

  return (
    <AppCard padding="sm" className="min-w-0">
      <article
        aria-label={`Registro de ${formattedRecordedAt}`}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-base font-semibold text-[var(--at-text-primary)]">
          <time dateTime={record.recordedAt}>{formattedRecordedAt}</time>
        </h2>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--at-text-secondary)]">
            PEF
          </p>
          <p className="mt-0.5 text-[var(--at-text-primary)]">
            <span className="text-2xl font-bold tabular-nums">
              {record.pefValue}
            </span>
            <span className="ml-1 text-sm font-normal text-[var(--at-text-secondary)]">
              L/min
            </span>
          </p>
        </div>

        <dl className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {SYMPTOM_FIELDS.map((field) => (
            <div key={field.label} className="min-w-0">
              <dt className="text-sm text-[var(--at-text-secondary)]">
                {field.label}
              </dt>
              <dd className="text-sm font-medium text-[var(--at-text-primary)]">
                {formatSymptomSeverityLabel(
                  field.getSeverity(record),
                  field.gender
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-1 border-t border-[var(--at-border)] pt-3 text-sm text-[var(--at-text-secondary)] sm:grid-cols-2">
          <p>Crise registrada: {formatHistoryBoolean(record.hadAttack)}</p>
          <p>
            Medicação de alívio:{" "}
            {formatHistoryBoolean(record.usedRescueMedication)}
          </p>
        </div>
      </article>
    </AppCard>
  );
}
