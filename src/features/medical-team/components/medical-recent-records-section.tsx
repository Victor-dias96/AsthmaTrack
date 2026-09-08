import { AppCard } from "@/components/ui/app-card";

import { MedicalRecentRecordItem } from "./medical-recent-record-item";
import type { MedicalPatientDashboardRecord } from "../types/medical-patient-dashboard";

const MEDICAL_RECENT_RECORDS_TITLE_ID = "medical-dashboard-recent-records-title";
const MEDICAL_RECENT_RECORDS_DESCRIPTION_ID =
  "medical-dashboard-recent-records-description";

type MedicalRecentRecordsSectionProps = {
  records: readonly MedicalPatientDashboardRecord[];
};

/**
 * Read-only "Registros recentes" section for the medical dashboard (Issue
 * 110), displaying the patient's latest three overall records newest
 * first. Never renders a record ID, notes, or an edit/delete/duplicate/
 * "Ver histórico" action -- Issue 111 will introduce the secure medical
 * history destination.
 */
export function MedicalRecentRecordsSection({
  records,
}: MedicalRecentRecordsSectionProps) {
  return (
    <section aria-labelledby={MEDICAL_RECENT_RECORDS_TITLE_ID}>
      <AppCard className="min-w-0">
        <div className="mb-4 min-w-0">
          <h2
            id={MEDICAL_RECENT_RECORDS_TITLE_ID}
            className="text-lg font-semibold text-[var(--at-text-primary)]"
          >
            Registros recentes
          </h2>
          <p
            id={MEDICAL_RECENT_RECORDS_DESCRIPTION_ID}
            className="mt-0.5 text-sm text-[var(--at-text-secondary)]"
          >
            Últimos registros deste paciente.
          </p>
        </div>

        {records.length === 0 ? (
          <p className="text-sm leading-relaxed text-[var(--at-text-secondary)]">
            Nenhum registro recente.
          </p>
        ) : (
          <ul className="min-w-0 divide-y divide-[var(--at-border)]">
            {records.map((record, index) => (
              // No stable record id is exposed to this dashboard by design
              // (see ../types/medical-patient-dashboard.ts); the list is
              // server-rendered once per request and never reordered
              // client-side, so the array position is a safe React key.
              <MedicalRecentRecordItem
                key={`${record.recordedAt}-${index}`}
                record={record}
              />
            ))}
          </ul>
        )}
      </AppCard>
    </section>
  );
}
