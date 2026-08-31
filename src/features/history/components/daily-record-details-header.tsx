import Link from "next/link";

const backLinkClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "border border-[var(--at-border-input)] bg-[var(--at-surface)] text-[var(--at-text-primary)] font-medium",
  "hover:bg-[var(--at-surface-input)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
  "shrink-0",
].join(" ");

const editLinkClasses = [
  "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "bg-[var(--at-blue)] text-white font-semibold",
  "hover:bg-[var(--at-blue-hover)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)] focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
  "shrink-0",
].join(" ");

type DailyRecordDetailsHeaderProps = {
  historyHref: string;
  editHref?: string;
};

export function DailyRecordDetailsHeader({
  historyHref,
  editHref,
}: DailyRecordDetailsHeaderProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1
          id="daily-record-details-title"
          className="text-xl font-bold text-[var(--at-text-primary)]"
        >
          Detalhes do registro
        </h1>
        <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
          Consulte os dados completos deste registro de PEF e sintomas.
        </p>
      </div>

      <div className="flex w-full min-w-0 shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        {editHref ? (
          <Link href={editHref} className={editLinkClasses}>
            Editar registro
          </Link>
        ) : null}
        <Link href={historyHref} className={backLinkClasses}>
          Voltar ao histórico
        </Link>
      </div>
    </div>
  );
}
