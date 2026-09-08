import { formatLatestRecordDateParts, parseLatestRecordRecordedAt } from "@/features/dashboard/lib/format-latest-record-date";

import { formatMedicalRecordSymptomIndication } from "../lib/format-medical-record-symptom-indication";
import type { MedicalPatientDashboardRecord } from "../types/medical-patient-dashboard";

type MedicalRecentRecordItemProps = {
  record: MedicalPatientDashboardRecord;
};

/**
 * One compact, read-only recent-record row for the medical dashboard
 * (Issue 110). Deliberately never renders a record ID and never links to a
 * patient-only record-detail route -- Issue 111 will introduce the secure
 * medical history destination. Displays only the recorded date/time, PEF
 * and a neutral symptom-presence summary, matching what
 * src/features/dashboard/components/recent-record-item.tsx already shows
 * beyond its "Ver detalhes" link.
 */
export function MedicalRecentRecordItem({
  record,
}: MedicalRecentRecordItemProps) {
  const parsedDate = parseLatestRecordRecordedAt(record.recordedAt);

  if (parsedDate === null) {
    return null;
  }

  const { date, time } = formatLatestRecordDateParts(parsedDate);
  const symptomIndication = formatMedicalRecordSymptomIndication(record);

  return (
    <li className="min-w-0 border-b border-[var(--at-border)] py-3 last:border-b-0">
      <div className="min-w-0 space-y-1">
        <p className="min-w-0 break-words text-sm font-semibold text-[var(--at-text-primary)]">
          <time dateTime={record.recordedAt}>
            <span>{date}</span>
            <span className="mt-0.5 block tabular-nums text-[var(--at-text-secondary)] font-normal sm:mt-0 sm:ml-2 sm:inline">
              {time}
            </span>
          </time>
        </p>
        <p className="text-sm text-[var(--at-text-primary)]">
          PEF: <span className="tabular-nums">{record.pefValue}</span>{" "}
          <span aria-hidden="true">L/min</span>
          <span className="sr-only"> litros por minuto</span>
        </p>
        <p className="text-sm text-[var(--at-text-secondary)]">
          {symptomIndication}
        </p>
      </div>
    </li>
  );
}
