import { ClipboardList } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";

const MEDICAL_PATIENT_REPORT_EMPTY_TITLE_ID =
  "medical-patient-report-empty-title";

/**
 * Authorized patient with zero records in the selected report period.
 * Does not invent summaries, does not offer a create-record action, and
 * does not claim the patient has no records outside this period.
 */
export function MedicalPatientReportEmptyState() {
  return (
    <section aria-labelledby={MEDICAL_PATIENT_REPORT_EMPTY_TITLE_ID}>
      <AppCard className="min-w-0">
        <div className="flex flex-col items-center text-center">
          <div
            className="flex size-12 items-center justify-center rounded-full bg-[var(--at-surface-input)]"
            aria-hidden="true"
          >
            <ClipboardList
              className="size-6 text-[var(--at-text-secondary)]"
              strokeWidth={1.75}
            />
          </div>

          <h2
            id={MEDICAL_PATIENT_REPORT_EMPTY_TITLE_ID}
            className="mt-4 text-lg font-semibold text-[var(--at-text-primary)]"
          >
            Nenhum registro no período selecionado.
          </h2>
        </div>
      </AppCard>
    </section>
  );
}
