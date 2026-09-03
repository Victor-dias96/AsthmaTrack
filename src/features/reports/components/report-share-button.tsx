"use client";

import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";

import type { ReportPeriod } from "../constants";
import {
  buildReportPdfFilename,
  requestReportPdfBlob,
} from "../lib/request-report-pdf";
import { REPORT_PDF_METADATA } from "../pdf/constants";

const PDF_CONTENT_TYPE = "application/pdf";
const SHARE_ACTION_LABEL = "Compartilhar relatório";
const SHARE_PREPARING_LABEL = "Preparando relatório...";
const SHARE_NOW_LABEL = "Compartilhar agora";
const SHARE_SHARING_LABEL = "Compartilhando...";
const SHARE_TEXT = "Relatório de acompanhamento gerado no AsthmaTrack.";
const SUCCESS_MESSAGE = "Relatório compartilhado.";
const UNSUPPORTED_MESSAGE =
  "Compartilhamento de arquivos não disponível neste navegador.";
const PREPARE_ERROR_MESSAGE =
  "Não foi possível preparar o relatório para compartilhamento. Tente novamente.";
const SHARE_ERROR_MESSAGE =
  "Não foi possível compartilhar o relatório. Tente novamente.";

export type ReportShareButtonProps = {
  period: ReportPeriod;
};

type SharePhase = "idle" | "generating" | "ready" | "sharing";

type StatusMessage =
  | { kind: "error"; text: string }
  | { kind: "unsupported"; text: string }
  | { kind: "success"; text: string };

type PreparedPdf = {
  file: File;
  period: ReportPeriod;
};

function hasWebShareFileApi(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"
  );
}

function canSharePdfFile(file: File): boolean {
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

function isShareCancellation(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isActivationLost(error: unknown): boolean {
  return error instanceof DOMException && error.name === "NotAllowedError";
}

function buildShareData(file: File): ShareData {
  return {
    files: [file],
    title: REPORT_PDF_METADATA.title,
    text: SHARE_TEXT,
  };
}

function getButtonLabel(phase: SharePhase): string {
  switch (phase) {
    case "generating":
      return SHARE_PREPARING_LABEL;
    case "ready":
      return SHARE_NOW_LABEL;
    case "sharing":
      return SHARE_SHARING_LABEL;
    default:
      return SHARE_ACTION_LABEL;
  }
}

/**
 * Explicit "Compartilhar relatório" action (Issue 99). Smallest Client
 * Component boundary: the report page and PDF generation stay server-side.
 *
 * Reuses the Issue 98 authenticated PDF route for the current validated
 * period. Feature-detects Web Share file support only after an explicit
 * click, never at module init or during SSR. Cancellation is neutral;
 * unsupported file sharing is not treated as an application failure and
 * does not trigger a download (Issue 100). The report page remounts this
 * control with `key={period}` so a prepared file cannot outlive a period
 * change.
 */
export function ReportShareButton({ period }: ReportShareButtonProps) {
  const [phase, setPhase] = useState<SharePhase>("idle");
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const isRequestInFlightRef = useRef(false);
  const inFlightTokenRef = useRef(0);
  const isMountedRef = useRef(true);
  const preparedPdfRef = useRef<PreparedPdf | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      preparedPdfRef.current = null;
      inFlightTokenRef.current += 1;
      isRequestInFlightRef.current = false;
    };
  }, []);

  function clearPreparedPdf() {
    preparedPdfRef.current = null;
  }

  function applyIfCurrent(token: number, update: () => void) {
    if (!isMountedRef.current || inFlightTokenRef.current !== token) {
      return;
    }

    update();
  }

  async function invokeShare(
    token: number,
    file: File,
    requestPeriod: ReportPeriod,
    allowActivationFallback: boolean
  ) {
    if (!isMountedRef.current || inFlightTokenRef.current !== token) {
      return;
    }

    try {
      await navigator.share(buildShareData(file));
      applyIfCurrent(token, () => {
        clearPreparedPdf();
        setPhase("idle");
        setStatusMessage({ kind: "success", text: SUCCESS_MESSAGE });
      });
    } catch (error) {
      if (isShareCancellation(error)) {
        applyIfCurrent(token, () => {
          clearPreparedPdf();
          setPhase("idle");
          setStatusMessage(null);
        });
        return;
      }

      if (allowActivationFallback && isActivationLost(error)) {
        applyIfCurrent(token, () => {
          preparedPdfRef.current = { file, period: requestPeriod };
          setPhase("ready");
          setStatusMessage(null);
        });
        return;
      }

      applyIfCurrent(token, () => {
        clearPreparedPdf();
        setPhase("idle");
        setStatusMessage({ kind: "error", text: SHARE_ERROR_MESSAGE });
      });
    }
  }

  async function sharePreparedFile(token: number, requestPeriod: ReportPeriod) {
    const prepared = preparedPdfRef.current;

    if (
      !isMountedRef.current ||
      inFlightTokenRef.current !== token ||
      prepared === null ||
      prepared.period !== requestPeriod
    ) {
      clearPreparedPdf();
      applyIfCurrent(token, () => {
        setPhase("idle");
      });
      return;
    }

    setPhase("sharing");
    setStatusMessage(null);
    await invokeShare(token, prepared.file, requestPeriod, false);
  }

  async function prepareAndShare(token: number, requestPeriod: ReportPeriod) {
    setPhase("generating");
    setStatusMessage(null);

    if (!hasWebShareFileApi()) {
      applyIfCurrent(token, () => {
        setPhase("idle");
        setStatusMessage({ kind: "unsupported", text: UNSUPPORTED_MESSAGE });
      });
      return;
    }

    let result;

    try {
      result = await requestReportPdfBlob(requestPeriod);
    } catch {
      applyIfCurrent(token, () => {
        clearPreparedPdf();
        setPhase("idle");
        setStatusMessage({ kind: "error", text: PREPARE_ERROR_MESSAGE });
      });
      return;
    }

    if (!isMountedRef.current || inFlightTokenRef.current !== token) {
      return;
    }

    if (result.status !== "ready") {
      applyIfCurrent(token, () => {
        clearPreparedPdf();
        setPhase("idle");
        setStatusMessage({ kind: "error", text: PREPARE_ERROR_MESSAGE });
      });
      return;
    }

    const pdfFile = new File(
      [result.blob],
      buildReportPdfFilename(requestPeriod),
      { type: PDF_CONTENT_TYPE }
    );

    if (!canSharePdfFile(pdfFile)) {
      applyIfCurrent(token, () => {
        clearPreparedPdf();
        setPhase("idle");
        setStatusMessage({ kind: "unsupported", text: UNSUPPORTED_MESSAGE });
      });
      return;
    }

    applyIfCurrent(token, () => {
      setPhase("sharing");
    });

    await invokeShare(token, pdfFile, requestPeriod, true);
  }

  async function handleShareClick() {
    if (isRequestInFlightRef.current) {
      return;
    }

    isRequestInFlightRef.current = true;
    const token = ++inFlightTokenRef.current;
    const requestPeriod = period;
    const shouldSharePrepared = phase === "ready";

    try {
      if (shouldSharePrepared) {
        await sharePreparedFile(token, requestPeriod);
      } else {
        await prepareAndShare(token, requestPeriod);
      }
    } finally {
      if (inFlightTokenRef.current === token) {
        isRequestInFlightRef.current = false;
      }
    }
  }

  const isBusy = phase === "generating" || phase === "sharing";

  return (
    <div className="report-print-hidden flex min-w-0 flex-col items-start gap-1">
      <AppButton
        type="button"
        variant="outline"
        onClick={handleShareClick}
        disabled={isBusy}
        aria-busy={isBusy}
        className="w-full whitespace-normal sm:w-auto sm:whitespace-nowrap"
      >
        <Share2 size={16} aria-hidden="true" />
        {getButtonLabel(phase)}
      </AppButton>
      {statusMessage ? (
        <p
          role={statusMessage.kind === "error" ? "alert" : "status"}
          className={
            statusMessage.kind === "error"
              ? "text-sm leading-relaxed text-destructive"
              : "text-sm leading-relaxed text-[var(--at-text-secondary)]"
          }
        >
          {statusMessage.text}
        </p>
      ) : null}
    </div>
  );
}
