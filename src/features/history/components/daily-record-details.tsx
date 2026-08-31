import { AppCard, AppCardHeader } from "@/components/ui/app-card";
import type { DailyRecord } from "@/types/daily-record";

import {
  formatHistoryBoolean,
  hasDailyRecordNotes,
} from "../lib/format-history-display";
import { formatRecordedAt } from "../lib/format-recorded-at";
import { formatSymptomSeverityLabel } from "../lib/format-symptom-severity-label";
import { HISTORY_SYMPTOM_FIELDS } from "../lib/history-symptom-fields";

type DailyRecordDetailsProps = {
  record: DailyRecord;
};

export function DailyRecordDetails({ record }: DailyRecordDetailsProps) {
  const formattedRecordedAt = formatRecordedAt(record.recordedAt);
  const notesContent = hasDailyRecordNotes(record.notes)
    ? record.notes
    : null;

  return (
    <article
      aria-labelledby="daily-record-details-title"
      className="min-w-0 space-y-4"
    >
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
        <AppCard className="min-w-0">
          <AppCardHeader title="Data da medição" />
          <p className="text-xl font-semibold text-[var(--at-text-primary)]">
            <time dateTime={record.recordedAt}>{formattedRecordedAt}</time>
          </p>
        </AppCard>

        <AppCard className="min-w-0">
          <AppCardHeader title="PEF" />
          <p className="text-[var(--at-text-primary)]">
            <span className="text-3xl font-bold tabular-nums">
              {record.pefValue}
            </span>
            <span className="ml-1.5 text-base font-normal text-[var(--at-text-secondary)]">
              L/min
            </span>
          </p>
        </AppCard>
      </div>

      <AppCard className="min-w-0">
        <AppCardHeader title="Sintomas" />
        <dl className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
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
      </AppCard>

      <AppCard className="min-w-0">
        <AppCardHeader title="Informações adicionais" />
        <div className="space-y-2 text-sm text-[var(--at-text-primary)]">
          <p>Crise registrada: {formatHistoryBoolean(record.hadAttack)}</p>
          <p>
            Medicação de alívio:{" "}
            {formatHistoryBoolean(record.usedRescueMedication)}
          </p>
        </div>
      </AppCard>

      <AppCard className="min-w-0">
        <AppCardHeader title="Observações" />
        {notesContent ? (
          <p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--at-text-primary)]">
            {notesContent}
          </p>
        ) : (
          <p className="text-sm text-[var(--at-text-secondary)]">
            Nenhuma observação adicionada.
          </p>
        )}
      </AppCard>
    </article>
  );
}
