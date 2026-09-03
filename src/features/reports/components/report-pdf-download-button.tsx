"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";

import type { ReportPeriod } from "../constants";
import {
  buildReportPdfFilename,
  requestReportPdfBlob,
} from "../lib/request-report-pdf";

const GENERIC_ERROR_MESSAGE = "Não foi possível gerar o PDF. Tente novamente.";

export type ReportPdfDownloadButtonProps = {
  period: ReportPeriod;
};

function triggerBlobDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revoke on the next tick so the browser has started the download.
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 0);
}

/**
 * Explicit "Baixar PDF" action (Issue 98). Smallest Client Component
 * boundary: the report page and its data stay server-rendered.
 *
 * Fetches the same-origin, authenticated PDF Route Handler for the current
 * validated period, validates the response before touching the DOM, and
 * downloads via a temporary Blob object URL that is always revoked. Never
 * shares, uploads, previews, or persists the PDF; never retries
 * automatically; never allows a second concurrent request from one click.
 */
export function ReportPdfDownloadButton({ period }: ReportPdfDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Synchronous guard: React state updates are asynchronous, so a rapid
  // double-click could otherwise start a second fetch before re-render.
  const isRequestInFlightRef = useRef(false);

  async function handleDownload() {
    if (isRequestInFlightRef.current) {
      return;
    }

    isRequestInFlightRef.current = true;
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const result = await requestReportPdfBlob(period);

      if (result.status !== "ready") {
        setErrorMessage(GENERIC_ERROR_MESSAGE);
        return;
      }

      triggerBlobDownload(result.blob, buildReportPdfFilename(period));
    } catch {
      setErrorMessage(GENERIC_ERROR_MESSAGE);
    } finally {
      isRequestInFlightRef.current = false;
      setIsGenerating(false);
    }
  }

  return (
    <div className="report-print-hidden flex min-w-0 flex-col items-start gap-1">
      <AppButton
        type="button"
        variant="outline"
        onClick={handleDownload}
        disabled={isGenerating}
        aria-busy={isGenerating}
        className="w-full sm:w-auto"
      >
        <Download size={16} aria-hidden="true" />
        {isGenerating ? "Gerando PDF..." : "Baixar PDF"}
      </AppButton>
      {errorMessage ? (
        <p role="alert" className="text-sm leading-relaxed text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
