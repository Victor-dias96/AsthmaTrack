import { AppCard } from "@/components/ui/app-card";
import type { DailyRecord, SymptomSeverity } from "@/types/daily-record";

import { formatRecordedAt } from "../lib/format-recorded-at";
import { formatSymptomSeverityLabel } from "../lib/format-symptom-severity-label";

type DailyRecordCardProps = {
  record: DailyRecord;
};

type HistorySymptomField = {
  label: string;
  gender: "masculine" | "feminine";
  getSeverity: (record: DailyRecord) => SymptomSeverity;
};

const HISTORY_SYMPTOM_FIELDS: HistorySymptomField[] = [
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

function formatBooleanStatus(value: boolean): "Sim" | "Não" {
  return value ? "Sim" : "Não";
}

function hasNotes(notes: string | null): notes is string {
  return notes !== null && notes.trim().length > 0;
}

export function DailyRecordCard({ record }: DailyRecordCardProps) {
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
          {HISTORY_SYMPTOM_FIELDS.map((field) => {
            const severity = field.getSeverity(record);
            const severityLabel = formatSymptomSeverityLabel(
              severity,
              field.gender
            );

            return (
              <div key={field.label} className="min-w-0">
                <dt className="text-sm text-[var(--at-text-secondary)]">
                  {field.label}
                </dt>
                <dd className="text-sm font-medium text-[var(--at-text-primary)]">
                  {severityLabel}
                </dd>
              </div>
            );
          })}
        </dl>

        <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-1 border-t border-[var(--at-border)] pt-3 text-sm text-[var(--at-text-secondary)] sm:grid-cols-2">
          <p>Crise registrada: {formatBooleanStatus(record.hadAttack)}</p>
          <p>
            Medicação de alívio:{" "}
            {formatBooleanStatus(record.usedRescueMedication)}
          </p>
          {hasNotes(record.notes) && (
            <p className="sm:col-span-2">Com observação</p>
          )}
        </div>
      </article>
    </AppCard>
  );
}
