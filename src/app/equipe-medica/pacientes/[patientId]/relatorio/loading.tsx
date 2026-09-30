import { Skeleton } from "@/components/ui/skeleton";

const PERIOD_OPTION_SKELETON_KEYS = [
  "medical-report-period-skeleton-1",
  "medical-report-period-skeleton-2",
  "medical-report-period-skeleton-3",
] as const;

const HEADER_METADATA_SKELETON_KEYS = [
  "medical-report-header-patient",
  "medical-report-header-period",
  "medical-report-header-generated",
] as const;

const PEF_METRIC_SKELETON_KEYS = [
  "medical-report-pef-latest",
  "medical-report-pef-average",
  "medical-report-pef-minimum",
  "medical-report-pef-maximum",
] as const;

const SYMPTOM_FREQUENCY_SKELETON_KEYS = [
  "medical-report-symptom-cough",
  "medical-report-symptom-wheezing",
  "medical-report-symptom-shortness",
  "medical-report-symptom-chest",
] as const;

const ATTACK_DATE_SKELETON_KEYS = [
  "medical-report-attack-date-1",
  "medical-report-attack-date-2",
] as const;

/**
 * Loading fallback for /equipe-medica/pacientes/[patientId]/relatorio.
 * Renders inside the parent MedicalTeamShell. Decorative skeletons only:
 * no fake name, PEF, date, symptom or attack, and no print, PDF or share
 * placeholder.
 */
export default function EquipeMedicaPacienteRelatorioLoading() {
  return (
    <div className="min-w-0 space-y-6" aria-busy="true">
      <p className="sr-only">Carregando relatório do paciente...</p>

      <div aria-hidden="true">
        <Skeleton className="h-7 w-72 max-w-full" />
        <Skeleton className="mt-1 h-4 w-full max-w-sm" />
        <Skeleton className="mt-1 h-4 w-full max-w-xs" />
        <Skeleton className="mt-3 h-4 w-64 max-w-full" />
      </div>

      <div aria-hidden="true" className="min-w-0">
        <Skeleton className="h-3 w-40 max-w-full" />
        <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          {PERIOD_OPTION_SKELETON_KEYS.map((key) => (
            <Skeleton key={key} className="h-10 w-full sm:w-36" />
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="min-w-0 rounded-[var(--at-radius-lg)] border border-[var(--at-border)] bg-[var(--at-surface)] p-5"
      >
        <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
          {HEADER_METADATA_SKELETON_KEYS.map((key) => (
            <div key={key} className="min-w-0">
              <Skeleton className="h-3 w-20 max-w-full" />
              <Skeleton className="mt-1 h-5 w-full max-w-xs" />
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="min-w-0 rounded-[var(--at-radius-lg)] border border-[var(--at-border)] bg-[var(--at-surface)] p-5"
      >
        <Skeleton className="h-6 w-40 max-w-full" />
        <Skeleton className="mt-3 h-4 w-32 max-w-full" />
        <Skeleton className="mt-2 h-4 w-full max-w-sm" />
        <Skeleton className="mt-2 h-4 w-44 max-w-full" />
      </div>

      <div
        aria-hidden="true"
        className="min-w-0 rounded-[var(--at-radius-lg)] border border-[var(--at-border)] bg-[var(--at-surface)] p-5"
      >
        <Skeleton className="h-6 w-40 max-w-full" />
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PEF_METRIC_SKELETON_KEYS.map((key) => (
            <div key={key} className="min-w-0">
              <Skeleton className="h-3 w-24 max-w-full" />
              <Skeleton className="mt-1 h-8 w-28 max-w-full" />
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="min-w-0 rounded-[var(--at-radius-lg)] border border-[var(--at-border)] bg-[var(--at-surface)] p-5"
      >
        <Skeleton className="h-6 w-48 max-w-full" />
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SYMPTOM_FREQUENCY_SKELETON_KEYS.map((key) => (
            <div key={key} className="min-w-0">
              <Skeleton className="h-3 w-24 max-w-full" />
              <Skeleton className="mt-1 h-4 w-32 max-w-full" />
              <Skeleton className="mt-1 h-8 w-20 max-w-full" />
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="min-w-0 rounded-[var(--at-radius-lg)] border border-[var(--at-border)] bg-[var(--at-surface)] p-5"
      >
        <Skeleton className="h-6 w-44 max-w-full" />
        <Skeleton className="mt-4 h-8 w-20 max-w-full" />
        <div className="mt-4 space-y-2">
          {ATTACK_DATE_SKELETON_KEYS.map((key) => (
            <Skeleton key={key} className="h-4 w-52 max-w-full" />
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="min-w-0 rounded-[var(--at-radius-lg)] border border-[var(--at-border)] bg-[var(--at-surface)] p-5"
      >
        <Skeleton className="h-6 w-40 max-w-full" />
        <Skeleton className="mt-4 h-48 w-full sm:h-56 md:h-64" />
      </div>

      <div
        aria-hidden="true"
        className="min-w-0 rounded-[var(--at-radius-md)] border border-[var(--at-border)] px-4 py-3"
      >
        <Skeleton className="h-4 w-40 max-w-full" />
        <Skeleton className="mt-2 h-4 w-full max-w-xl" />
      </div>
    </div>
  );
}
