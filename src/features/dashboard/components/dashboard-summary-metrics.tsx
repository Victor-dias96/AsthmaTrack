import {
  LatestRecordDateCard,
  type LatestRecordDateCardStatus,
} from "./latest-record-date-card";
import { LatestPefCard, type LatestPefCardStatus } from "./latest-pef-card";
import {
  DaysWithSymptomsCard,
  type DaysWithSymptomsCardStatus,
} from "./days-with-symptoms-card";
import {
  TotalRecordsCard,
  type TotalRecordsCardStatus,
} from "./total-records-card";
import {
  RecordedAttacksCard,
  type RecordedAttacksCardStatus,
} from "./recorded-attacks-card";
import {
  RescueMedicationUsageCard,
  type RescueMedicationUsageCardStatus,
} from "./rescue-medication-usage-card";

type DashboardSummaryMetricsProps = {
  latestPef: number | null;
  latestPefStatus?: LatestPefCardStatus;
  latestRecordDate?: string | null;
  latestRecordDateStatus?: LatestRecordDateCardStatus;
  totalRecords?: number | null;
  totalRecordsStatus?: TotalRecordsCardStatus;
  daysWithSymptoms?: number | null;
  daysWithSymptomsStatus?: DaysWithSymptomsCardStatus;
  recordedAttacks?: number | null;
  recordedAttacksStatus?: RecordedAttacksCardStatus;
  rescueMedicationUsage?: number | null;
  rescueMedicationUsageStatus?: RescueMedicationUsageCardStatus;
};

export function DashboardSummaryMetrics({
  latestPef,
  latestPefStatus = "ready",
  latestRecordDate = null,
  latestRecordDateStatus = "ready",
  totalRecords = null,
  totalRecordsStatus = "ready",
  daysWithSymptoms = null,
  daysWithSymptomsStatus = "ready",
  recordedAttacks = null,
  recordedAttacksStatus = "ready",
  rescueMedicationUsage = null,
  rescueMedicationUsageStatus = "ready",
}: DashboardSummaryMetricsProps) {
  return (
    <section
      aria-labelledby="dashboard-summary-heading"
      aria-describedby="dashboard-summary-description"
      className="min-w-0"
    >
      <h2
        id="dashboard-summary-heading"
        className="text-lg font-semibold text-[var(--at-text-primary)]"
      >
        Resumo
      </h2>
      <p
        id="dashboard-summary-description"
        className="mt-0.5 text-sm text-[var(--at-text-secondary)]"
      >
        Dados serão exibidos após a integração.
      </p>

      <ul className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <li className="min-w-0">
          <LatestPefCard pefValue={latestPef} status={latestPefStatus} />
        </li>
        <li className="min-w-0">
          <LatestRecordDateCard
            recordedAt={latestRecordDate}
            status={latestRecordDateStatus}
          />
        </li>
        <li className="min-w-0">
          <TotalRecordsCard
            totalRecords={totalRecords}
            status={totalRecordsStatus}
          />
        </li>
        <li className="min-w-0">
          <DaysWithSymptomsCard
            daysWithSymptoms={daysWithSymptoms}
            status={daysWithSymptomsStatus}
          />
        </li>
        <li className="min-w-0">
          <RecordedAttacksCard
            recordedAttacks={recordedAttacks}
            status={recordedAttacksStatus}
          />
        </li>
        <li className="min-w-0">
          <RescueMedicationUsageCard
            rescueMedicationUsage={rescueMedicationUsage}
            status={rescueMedicationUsageStatus}
          />
        </li>
      </ul>
    </section>
  );
}
