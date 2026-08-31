import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PatientShell } from "@/components/layout/patient-shell";
import {
  HISTORY_INITIAL_LIMIT,
  HistoryEmptyState,
  HistoryErrorState,
  HistoryPeriodFilter,
  HistoryRecordList,
  HistoryResultLimitNotice,
  getCustomHistoryPeriodRange,
  getHistoryCalendarDate,
  getHistoryPeriodRange,
  loadPatientHistory,
  parseHistoryFilter,
  verifyPatientHistorySession,
} from "@/features/history";

export const metadata: Metadata = {
  title: "Histórico",
};

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const today = getHistoryCalendarDate(new Date());
  const filter = parseHistoryFilter(params, today);

  if (filter.status === "custom-pending" || filter.status === "custom-invalid") {
    const session = await verifyPatientHistorySession();

    if (session.status === "unauthenticated") {
      redirect("/login");
    }

    return (
      <PatientShell>
        <div className="space-y-6">
          <HistoryPageHeader />
          <HistoryPeriodFilter
            period={filter.period}
            startValue={filter.startValue}
            endValue={filter.endValue}
            errors={
              filter.status === "custom-invalid" ? filter.errors : undefined
            }
          />
        </div>
      </PatientShell>
    );
  }

  const range =
    filter.status === "custom"
      ? getCustomHistoryPeriodRange(filter.start, filter.end)
      : getHistoryPeriodRange(filter.period);

  const result = await loadPatientHistory(range);

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  const startValue = filter.status === "custom" ? filter.startValue : "";
  const endValue = filter.status === "custom" ? filter.endValue : "";

  return (
    <PatientShell>
      <div className="space-y-6">
        <HistoryPageHeader />

        <HistoryPeriodFilter
          period={filter.period}
          startValue={startValue}
          endValue={endValue}
        />

        {result.status === "error" ? (
          <HistoryErrorState />
        ) : result.records.length === 0 ? (
          <HistoryEmptyState period={filter.period} />
        ) : (
          <div className="space-y-3">
            <HistoryRecordList records={result.records} filter={filter} />
            {result.records.length >= HISTORY_INITIAL_LIMIT ? (
              <HistoryResultLimitNotice />
            ) : null}
          </div>
        )}
      </div>
    </PatientShell>
  );
}

function HistoryPageHeader() {
  return (
    <div>
      <h1 className="text-xl font-bold text-[var(--at-text-primary)]">
        Histórico
      </h1>
      <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
        Consulte os registros de PEF e sintomas que você salvou
        anteriormente.
      </p>
    </div>
  );
}
