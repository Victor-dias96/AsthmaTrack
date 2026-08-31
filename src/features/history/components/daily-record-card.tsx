import Link from "next/link";
import { AppCard } from "@/components/ui/app-card";
import type { DailyRecord } from "@/types/daily-record";

import {
  formatHistoryBoolean,
  hasDailyRecordNotes,
} from "../lib/format-history-display";
import { formatRecordedAt } from "../lib/format-recorded-at";
import { formatSymptomSeverityLabel } from "../lib/format-symptom-severity-label";
import { HISTORY_SYMPTOM_FIELDS } from "../lib/history-symptom-fields";

type DailyRecordCardProps = {
  record: DailyRecord;
  detailsHref: string;
};

const detailsActionClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "border border-[var(--at-border-input)] bg-[var(--at-surface)] text-[var(--at-text-primary)] font-medium",
  "hover:bg-[var(--at-surface-input)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
].join(" ");

export function DailyRecordCard({ record, detailsHref }: DailyRecordCardProps) {
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
          <p>Crise registrada: {formatHistoryBoolean(record.hadAttack)}</p>
          <p>
            Medicação de alívio:{" "}
            {formatHistoryBoolean(record.usedRescueMedication)}
          </p>
          {hasDailyRecordNotes(record.notes) && (
            <p className="sm:col-span-2">Com observação</p>
          )}
        </div>

        <Link
          href={detailsHref}
          aria-label={`Ver detalhes do registro de ${formattedRecordedAt}`}
          className={detailsActionClasses}
        >
          Ver detalhes
        </Link>
      </article>
    </AppCard>
  );
}
