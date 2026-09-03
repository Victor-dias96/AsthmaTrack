import { REPORT_PATH, REPORT_PERIOD_PARAM, type ReportPeriod } from "../constants";
import { REPORT_PDF_FILENAME_PREFIX } from "../pdf/constants";

const PDF_ROUTE_PATH = `${REPORT_PATH}/pdf`;
const PDF_CONTENT_TYPE = "application/pdf";

export type ReportPdfBlobResult =
  | { status: "ready"; blob: Blob }
  | { status: "invalid" };

/**
 * Builds the internal PDF request URL from the already-validated current
 * period only. Never inserts patient data, metrics, or an arbitrary URL.
 */
export function buildReportPdfRequestUrl(period: ReportPeriod): string {
  const params = new URLSearchParams();
  params.set(REPORT_PERIOD_PARAM, String(period));
  return `${PDF_ROUTE_PATH}?${params.toString()}`;
}

/** Fixed, non-sensitive filename — matches the server's naming convention. */
export function buildReportPdfFilename(period: ReportPeriod): string {
  return `${REPORT_PDF_FILENAME_PREFIX}-${period}-dias.pdf`;
}

function isPdfContentType(value: string): boolean {
  return value.toLowerCase().includes(PDF_CONTENT_TYPE);
}

function isDisguisedNonPdf(contentType: string, blobType: string): boolean {
  const combined = `${contentType} ${blobType}`.toLowerCase();
  return combined.includes("text/html") || combined.includes("application/json");
}

/**
 * Confirms a Blob/File already in memory is a non-empty PDF, not an HTML
 * or JSON error body. Used before sharing or downloading a prepared file.
 */
export function isValidReportPdfBlob(blob: Blob): boolean {
  if (blob.size === 0) {
    return false;
  }

  return !isDisguisedNonPdf("", blob.type) && isPdfContentType(blob.type);
}

/**
 * Triggers exactly one temporary-anchor download for an already-validated
 * PDF Blob. Always removes the anchor and revokes the object URL. Call
 * only from an explicit user action; never from render or an effect.
 */
export function downloadReportPdfBlob(blob: Blob, filename: string): void {
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
 * Same-origin authenticated PDF request used by download and share.
 * Validates status, Content-Type, and non-empty PDF bytes. Never logs the
 * body. Network failures propagate to the caller.
 */
export async function requestReportPdfBlob(
  period: ReportPeriod
): Promise<ReportPdfBlobResult> {
  const response = await fetch(buildReportPdfRequestUrl(period), {
    method: "GET",
    credentials: "same-origin",
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok || !isPdfContentType(contentType)) {
    return { status: "invalid" };
  }

  const blob = await response.blob();

  if (blob.size === 0 || isDisguisedNonPdf(contentType, blob.type)) {
    return { status: "invalid" };
  }

  return { status: "ready", blob };
}
