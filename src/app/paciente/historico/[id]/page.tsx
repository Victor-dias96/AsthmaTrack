import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PatientShell } from "@/components/layout/patient-shell";
import {
  DailyRecordDetails,
  DailyRecordDetailsErrorState,
  DailyRecordDetailsHeader,
  getDailyRecordEditHref,
  getHistoryCalendarDate,
  getHistoryDeletedHref,
  getHistoryHref,
  loadPatientDailyRecord,
  parseDailyRecordIdParam,
  parseHistoryFilter,
} from "@/features/history";

export const metadata: Metadata = {
  title: "Detalhes do registro",
};

export const dynamic = "force-dynamic";

export default async function DailyRecordDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string | string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const routeParams = await params;
  const recordId = parseDailyRecordIdParam(routeParams.id);

  if (recordId === null) {
    notFound();
  }

  const result = await loadPatientDailyRecord(recordId);
  const query = await searchParams;
  const filter = parseHistoryFilter(query, getHistoryCalendarDate(new Date()));
  const historyHref = getHistoryHref(filter);

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "error") {
    return (
      <PatientShell>
        <div className="min-w-0 space-y-6">
          <DailyRecordDetailsHeader historyHref={historyHref} />
          <DailyRecordDetailsErrorState historyHref={historyHref} />
        </div>
      </PatientShell>
    );
  }

  return (
    <PatientShell>
      <div className="min-w-0 space-y-6">
        <DailyRecordDetailsHeader
          historyHref={historyHref}
          editHref={getDailyRecordEditHref(result.record.id)}
          recordId={recordId}
          deletedHref={getHistoryDeletedHref(filter)}
        />
        <DailyRecordDetails record={result.record} />
      </div>
    </PatientShell>
  );
}
