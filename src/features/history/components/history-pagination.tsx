import Link from "next/link";
import { cn } from "@/lib/utils";

import { getHistoryHref } from "../lib/get-history-href";
import type { HistoryListFilter } from "../lib/parse-history-filter";

const paginationControlClasses = [
  "inline-flex min-h-10 items-center justify-center gap-2",
  "whitespace-nowrap select-none outline-none",
  "h-10 px-4 text-sm rounded-[var(--at-radius-md)] w-full sm:w-auto",
  "font-medium",
].join(" ");

const paginationLinkClasses = [
  paginationControlClasses,
  "border border-[var(--at-border-input)] bg-[var(--at-surface)]",
  "text-[var(--at-text-primary)]",
  "hover:bg-[var(--at-surface-input)]",
  "focus-visible:ring-2 focus-visible:ring-[var(--at-blue)]",
  "focus-visible:ring-offset-2",
  "active:translate-y-px transition-all duration-150",
].join(" ");

const paginationDisabledClasses = [
  paginationControlClasses,
  "border border-[var(--at-border)] bg-[var(--at-surface-input)]",
  "text-[var(--at-text-secondary)] cursor-not-allowed",
].join(" ");

type HistoryPaginationProps = {
  currentPage: number;
  totalPages: number;
  filter: HistoryListFilter;
};

function PaginationDisabledControl({ label }: { label: string }) {
  return (
    <span aria-disabled="true" className={paginationDisabledClasses}>
      {label}
      <span className="sr-only"> (indisponível)</span>
    </span>
  );
}

export function HistoryPagination({
  currentPage,
  totalPages,
  filter,
}: HistoryPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const previousHref = hasPrevious
    ? getHistoryHref(filter, currentPage - 1)
    : null;
  const nextHref = hasNext ? getHistoryHref(filter, currentPage + 1) : null;

  return (
    <nav aria-label="Paginação do histórico" className="min-w-0">
      <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {previousHref ? (
          <Link
            key="history-pagination-prev"
            href={previousHref}
            className={paginationLinkClasses}
          >
            Anterior
          </Link>
        ) : (
          <PaginationDisabledControl label="Anterior" />
        )}

        <p
          aria-current="page"
          className={cn(
            "min-w-0 text-center text-sm font-medium",
            "text-[var(--at-text-secondary)] sm:flex-1"
          )}
        >
          Página {currentPage} de {totalPages}
        </p>

        {nextHref ? (
          <Link
            key="history-pagination-next"
            href={nextHref}
            className={paginationLinkClasses}
          >
            Próxima
          </Link>
        ) : (
          <PaginationDisabledControl label="Próxima" />
        )}
      </div>
    </nav>
  );
}
