"use client";

import { Download } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";

const DOWNLOAD_LABEL = "Baixar PDF";
const DOWNLOADING_LABEL = "Baixando PDF...";
const DISMISS_LABEL = "Fechar";

const FALLBACK_COPY = {
  unsupported: {
    title: "Compartilhamento não disponível",
    description:
      "Este navegador não permite compartilhar o relatório como arquivo. Você pode baixar o PDF para compartilhá-lo manualmente.",
  },
  blocked: {
    title: null,
    description:
      "Não foi possível abrir o compartilhamento. Você ainda pode baixar o PDF.",
  },
  failed: {
    title: null,
    description:
      "Não foi possível compartilhar o relatório. Você pode tentar novamente ou baixar o PDF.",
  },
} as const;

export type ReportShareFallbackVariant = keyof typeof FALLBACK_COPY;

export type ReportShareFallbackProps = {
  variant: ReportShareFallbackVariant;
  isDownloading: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onDownload: () => void;
  onDismiss: () => void;
};

/**
 * Contextual PDF-download fallback when native file sharing is unavailable
 * or a native share attempt cannot complete (Issue 100).
 *
 * Presentational: the parent owns the share/fallback state machine and
 * reuses the Issue 98 download helpers. Download starts only from the
 * explicit "Baixar PDF" action — never automatically.
 */
export function ReportShareFallback({
  variant,
  isDownloading,
  errorMessage,
  successMessage,
  onDownload,
  onDismiss,
}: ReportShareFallbackProps) {
  const copy = FALLBACK_COPY[variant];

  return (
    <div className="flex min-w-0 w-full flex-col items-start gap-2">
      {copy.title ? (
        <p className="text-sm font-medium text-[var(--at-text-primary)]">
          {copy.title}
        </p>
      ) : null}
      <p className="text-sm leading-relaxed text-[var(--at-text-secondary)]">
        {copy.description}
      </p>
      <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <AppButton
          type="button"
          variant="primary"
          onClick={onDownload}
          disabled={isDownloading}
          aria-busy={isDownloading}
          className="w-full whitespace-normal sm:w-auto sm:whitespace-nowrap"
        >
          <Download size={16} aria-hidden="true" />
          {isDownloading ? DOWNLOADING_LABEL : DOWNLOAD_LABEL}
        </AppButton>
        <AppButton
          type="button"
          variant="ghost"
          onClick={onDismiss}
          disabled={isDownloading}
          className="w-full whitespace-normal sm:w-auto sm:whitespace-nowrap"
        >
          {DISMISS_LABEL}
        </AppButton>
      </div>
      {errorMessage ? (
        <p role="alert" className="text-sm leading-relaxed text-destructive">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p
          role="status"
          className="text-sm leading-relaxed text-[var(--at-text-secondary)]"
        >
          {successMessage}
        </p>
      ) : null}
    </div>
  );
}
