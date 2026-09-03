"use client";

import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";

import type { ReportPeriod } from "../constants";
import {
  buildReportPdfFilename,
  downloadReportPdfBlob,
  isValidReportPdfBlob,
  requestReportPdfBlob,
} from "../lib/request-report-pdf";
import { REPORT_PDF_METADATA } from "../pdf/constants";
import {
  ReportShareFallback,
  type ReportShareFallbackVariant,
} from "./report-share-fallback";

const PDF_CONTENT_TYPE = "application/pdf";
const SHARE_ACTION_LABEL = "Compartilhar relatório";
const SHARE_PREPARING_LABEL = "Preparando relatório...";
const SHARE_NOW_LABEL = "Compartilhar agora";
const SHARE_SHARING_LABEL = "Compartilhando...";
const SHARE_TEXT = "Relatório de acompanhamento gerado no AsthmaTrack.";
const SHARE_SUCCESS_MESSAGE = "Relatório compartilhado.";
const DOWNLOAD_SUCCESS_MESSAGE = "PDF baixado.";
const PREPARE_ERROR_MESSAGE =
  "Não foi possível preparar o relatório. Tente novamente.";
const FALLBACK_ERROR_MESSAGE = "Não foi possível baixar o PDF. Tente novamente.";

export type ReportShareButtonProps = {
  period: ReportPeriod;
};

type FallbackSource = "unsupported" | "shareBlocked" | "shareFailed";

type ShareState =
  | { status: "idle" }
  | { status: "preparing" }
  | { status: "readyToShare" }
  | { status: "sharing" }
  | { status: "unsupported" }
  | { status: "shareBlocked" }
  | { status: "shareFailed" }
  | { status: "prepareError" }
  | { status: "fallbackDownloading"; from: FallbackSource }
  | { status: "downloadSuccess"; from: FallbackSource }
  | { status: "fallbackError"; from: FallbackSource }
  | { status: "shareSuccess" };

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

function getShareButtonLabel(state: ShareState): string {
  switch (state.status) {
    case "preparing":
      return SHARE_PREPARING_LABEL;
    case "readyToShare":
      return SHARE_NOW_LABEL;
    case "sharing":
      return SHARE_SHARING_LABEL;
    default:
      return SHARE_ACTION_LABEL;
  }
}

function getFallbackSource(state: ShareState): FallbackSource | null {
  switch (state.status) {
    case "unsupported":
    case "shareBlocked":
    case "shareFailed":
      return state.status;
    case "fallbackDownloading":
    case "downloadSuccess":
    case "fallbackError":
      return state.from;
    default:
      return null;
  }
}

function getFallbackVariant(source: FallbackSource): ReportShareFallbackVariant {
  switch (source) {
    case "shareBlocked":
      return "blocked";
    case "shareFailed":
      return "failed";
    default:
      return "unsupported";
  }
}

function shouldShowShareButton(state: ShareState): boolean {
  const source = getFallbackSource(state);
  if (source === "unsupported") {
    return false;
  }

  return true;
}

function shouldShowFallback(state: ShareState): boolean {
  if (state.status === "downloadSuccess" && state.from !== "unsupported") {
    return false;
  }

  return getFallbackSource(state) !== null;
}

/**
 * Explicit "Compartilhar relatório" action (Issue 99) with a user-activated
 * PDF download fallback when native file sharing is unavailable (Issue 100).
 *
 * Smallest Client Component boundary: the report page and PDF generation
 * stay server-side. Reuses the Issue 98 authenticated PDF route and
 * download helpers for the current validated period. Feature-detects Web
 * Share file support only after an explicit click, never at module init or
 * during SSR. Cancellation is neutral and never starts a download. The
 * report page remounts this control with `key={period}` so a prepared file
 * cannot outlive a period change.
 */
export function ReportShareButton({ period }: ReportShareButtonProps) {
  const [state, setState] = useState<ShareState>({ status: "idle" });
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
  }, [period]);

  function clearPreparedPdf() {
    preparedPdfRef.current = null;
  }

  function applyIfCurrent(token: number, update: () => void) {
    if (!isMountedRef.current || inFlightTokenRef.current !== token) {
      return;
    }

    update();
  }

  function getReusablePreparedFile(requestPeriod: ReportPeriod): File | null {
    const prepared = preparedPdfRef.current;

    if (prepared === null || prepared.period !== requestPeriod) {
      return null;
    }

    if (!isValidReportPdfBlob(prepared.file)) {
      clearPreparedPdf();
      return null;
    }

    return prepared.file;
  }

  function storePreparedFile(file: File, requestPeriod: ReportPeriod) {
    preparedPdfRef.current = { file, period: requestPeriod };
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
        setState({ status: "shareSuccess" });
      });
    } catch (error) {
      if (isShareCancellation(error)) {
        applyIfCurrent(token, () => {
          clearPreparedPdf();
          setState({ status: "idle" });
        });
        return;
      }

      if (allowActivationFallback && isActivationLost(error)) {
        applyIfCurrent(token, () => {
          storePreparedFile(file, requestPeriod);
          setState({ status: "readyToShare" });
        });
        return;
      }

      if (isActivationLost(error)) {
        applyIfCurrent(token, () => {
          storePreparedFile(file, requestPeriod);
          setState({ status: "shareBlocked" });
        });
        return;
      }

      applyIfCurrent(token, () => {
        storePreparedFile(file, requestPeriod);
        setState({ status: "shareFailed" });
      });
    }
  }

  async function sharePreparedFile(token: number, requestPeriod: ReportPeriod) {
    const prepared = getReusablePreparedFile(requestPeriod);

    if (
      !isMountedRef.current ||
      inFlightTokenRef.current !== token ||
      prepared === null
    ) {
      clearPreparedPdf();
      applyIfCurrent(token, () => {
        setState({ status: "idle" });
      });
      return;
    }

    if (!hasWebShareFileApi() || !canSharePdfFile(prepared)) {
      applyIfCurrent(token, () => {
        setState({ status: "unsupported" });
      });
      return;
    }

    setState({ status: "sharing" });
    await invokeShare(token, prepared, requestPeriod, false);
  }

  async function prepareAndShare(token: number, requestPeriod: ReportPeriod) {
    if (!hasWebShareFileApi()) {
      applyIfCurrent(token, () => {
        clearPreparedPdf();
        setState({ status: "unsupported" });
      });
      return;
    }

    setState({ status: "preparing" });

    let result;

    try {
      result = await requestReportPdfBlob(requestPeriod);
    } catch {
      applyIfCurrent(token, () => {
        clearPreparedPdf();
        setState({ status: "prepareError" });
      });
      return;
    }

    if (!isMountedRef.current || inFlightTokenRef.current !== token) {
      return;
    }

    if (result.status !== "ready") {
      applyIfCurrent(token, () => {
        clearPreparedPdf();
        setState({ status: "prepareError" });
      });
      return;
    }

    const pdfFile = new File(
      [result.blob],
      buildReportPdfFilename(requestPeriod),
      { type: PDF_CONTENT_TYPE }
    );

    if (!isValidReportPdfBlob(pdfFile)) {
      applyIfCurrent(token, () => {
        clearPreparedPdf();
        setState({ status: "prepareError" });
      });
      return;
    }

    if (!canSharePdfFile(pdfFile)) {
      applyIfCurrent(token, () => {
        storePreparedFile(pdfFile, requestPeriod);
        setState({ status: "unsupported" });
      });
      return;
    }

    applyIfCurrent(token, () => {
      setState({ status: "sharing" });
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

    try {
      if (state.status === "readyToShare") {
        await sharePreparedFile(token, requestPeriod);
        return;
      }

      const reusable = getReusablePreparedFile(requestPeriod);
      if (
        reusable !== null &&
        (state.status === "shareFailed" || state.status === "shareBlocked")
      ) {
        if (!hasWebShareFileApi() || !canSharePdfFile(reusable)) {
          applyIfCurrent(token, () => {
            setState({ status: "unsupported" });
          });
          return;
        }

        setState({ status: "sharing" });
        await invokeShare(token, reusable, requestPeriod, false);
        return;
      }

      await prepareAndShare(token, requestPeriod);
    } finally {
      if (inFlightTokenRef.current === token) {
        isRequestInFlightRef.current = false;
      }
    }
  }

  async function handleFallbackDownload() {
    if (isRequestInFlightRef.current) {
      return;
    }

    const from = getFallbackSource(state);
    if (from === null) {
      return;
    }

    isRequestInFlightRef.current = true;
    const token = ++inFlightTokenRef.current;
    const requestPeriod = period;

    setState({ status: "fallbackDownloading", from });

    try {
      const prepared = getReusablePreparedFile(requestPeriod);

      if (prepared !== null) {
        downloadReportPdfBlob(prepared, buildReportPdfFilename(requestPeriod));
        clearPreparedPdf();
        applyIfCurrent(token, () => {
          setState({ status: "downloadSuccess", from });
        });
        return;
      }

      const result = await requestReportPdfBlob(requestPeriod);

      if (!isMountedRef.current || inFlightTokenRef.current !== token) {
        return;
      }

      if (result.status !== "ready") {
        applyIfCurrent(token, () => {
          setState({ status: "fallbackError", from });
        });
        return;
      }

      downloadReportPdfBlob(result.blob, buildReportPdfFilename(requestPeriod));
      applyIfCurrent(token, () => {
        setState({ status: "downloadSuccess", from });
      });
    } catch {
      applyIfCurrent(token, () => {
        setState({ status: "fallbackError", from });
      });
    } finally {
      if (inFlightTokenRef.current === token) {
        isRequestInFlightRef.current = false;
      }
    }
  }

  function handleFallbackDismiss() {
    if (isRequestInFlightRef.current) {
      return;
    }

    clearPreparedPdf();
    setState({ status: "idle" });
  }

  const isShareBusy = state.status === "preparing" || state.status === "sharing";
  const isFallbackDownloading = state.status === "fallbackDownloading";
  const fallbackSource = getFallbackSource(state);
  const showShareButton = shouldShowShareButton(state);
  const showFallback = shouldShowFallback(state);
  const fallbackError =
    state.status === "fallbackError" ? FALLBACK_ERROR_MESSAGE : null;
  const fallbackSuccess =
    state.status === "downloadSuccess" ? DOWNLOAD_SUCCESS_MESSAGE : null;

  return (
    <div
      className={
        showFallback
          ? "report-print-hidden flex w-full min-w-0 basis-full flex-col items-start gap-2 sm:max-w-lg"
          : "report-print-hidden flex min-w-0 flex-col items-start gap-1"
      }
    >
      {showShareButton ? (
        <AppButton
          type="button"
          variant="outline"
          onClick={handleShareClick}
          disabled={isShareBusy || isFallbackDownloading}
          aria-busy={isShareBusy}
          className="w-full whitespace-normal sm:w-auto sm:whitespace-nowrap"
        >
          <Share2 size={16} aria-hidden="true" />
          {getShareButtonLabel(state)}
        </AppButton>
      ) : null}
      {state.status === "prepareError" ? (
        <p role="alert" className="text-sm leading-relaxed text-destructive">
          {PREPARE_ERROR_MESSAGE}
        </p>
      ) : null}
      {state.status === "shareSuccess" ? (
        <p
          role="status"
          className="text-sm leading-relaxed text-[var(--at-text-secondary)]"
        >
          {SHARE_SUCCESS_MESSAGE}
        </p>
      ) : null}
      {state.status === "downloadSuccess" && state.from !== "unsupported" ? (
        <p
          role="status"
          className="text-sm leading-relaxed text-[var(--at-text-secondary)]"
        >
          {DOWNLOAD_SUCCESS_MESSAGE}
        </p>
      ) : null}
      {showFallback && fallbackSource !== null ? (
        <ReportShareFallback
          variant={getFallbackVariant(fallbackSource)}
          isDownloading={isFallbackDownloading}
          errorMessage={fallbackError}
          successMessage={fallbackSuccess}
          onDownload={handleFallbackDownload}
          onDismiss={handleFallbackDismiss}
        />
      ) : null}
    </div>
  );
}
