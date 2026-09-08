import { ClipboardList } from "lucide-react";
import { AppCard } from "@/components/ui/app-card";

const MEDICAL_PATIENT_EMPTY_STATE_TITLE_ID = "medical-patient-empty-state-title";
const MEDICAL_PATIENT_EMPTY_STATE_DESCRIPTION_ID =
  "medical-patient-empty-state-description";

/**
 * Safe empty state for an actively authorized patient with zero daily
 * records (Issue 110). Never shows fake metrics, a chart frame or a
 * recent-records section, and never tells the medical user to create a
 * record -- zero records is never treated as an error or interpreted
 * medically.
 */
export function MedicalPatientEmptyState() {
  return (
    <section aria-labelledby={MEDICAL_PATIENT_EMPTY_STATE_TITLE_ID}>
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
            id={MEDICAL_PATIENT_EMPTY_STATE_TITLE_ID}
            className="mt-4 text-lg font-semibold text-[var(--at-text-primary)]"
          >
            Nenhum registro disponível
          </h2>

          <p
            id={MEDICAL_PATIENT_EMPTY_STATE_DESCRIPTION_ID}
            className="mt-1 max-w-md text-sm leading-relaxed text-[var(--at-text-secondary)]"
          >
            Este paciente ainda não possui registros no AsthmaTrack.
          </p>
        </div>
      </AppCard>
    </section>
  );
}
