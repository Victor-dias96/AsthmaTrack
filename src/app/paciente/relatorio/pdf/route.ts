import { renderToBuffer } from "@react-pdf/renderer";
import { type NextRequest } from "next/server";

import { REPORT_PERIOD_PARAM } from "@/features/reports/constants";
import { getPatientReportPdfData } from "@/features/reports/server/get-patient-report-pdf-data";
import { readPatientReportSession } from "@/features/reports/server/read-patient-report-session";
import { parseReportPeriod } from "@/features/reports/lib/parse-report-period";
import { PatientReportPdfDocument } from "@/features/reports/pdf/patient-report-pdf-document";
import { REPORT_PDF_FILENAME_PREFIX } from "@/features/reports/pdf/constants";
import { createClient } from "@/lib/supabase/server";

/**
 * `@react-pdf/renderer` depends on `pdfkit`, which uses Node.js Buffer and
 * stream APIs. The Edge runtime does not support them.
 */
export const runtime = "nodejs";

// PDF generation is a per-request, per-patient private document. Never
// statically generated and never cached.
export const dynamic = "force-dynamic";

const UNAUTHORIZED_RESPONSE_INIT = {
  status: 401,
  headers: {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  },
} as const;

const UNAVAILABLE_RESPONSE_INIT = {
  status: 503,
  headers: {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  },
} as const;

function buildPdfFilename(periodDays: number): string {
  return `${REPORT_PDF_FILENAME_PREFIX}-${periodDays}-dias.pdf`;
}

/**
 * Reproduces the exact `string | string[] | undefined` shape Next.js gives
 * page `searchParams` for a repeated query key, so `parseReportPeriod`
 * applies the identical safe-fallback policy for a repeated `periodo` in
 * this Route Handler as it does on the browser report page.
 */
function readPeriodParam(request: NextRequest): string | string[] | undefined {
  const values = request.nextUrl.searchParams.getAll(REPORT_PERIOD_PARAM);

  if (values.length === 0) {
    return undefined;
  }

  return values.length === 1 ? values[0] : values;
}

/**
 * Authenticated PDF report download (Issue 98).
 *
 * - Verifies the request-bound authenticated patient with the established
 *   getClaims-then-getUser pattern; never trusts a browser-supplied
 *   identity and never accepts a patientId from the request.
 * - Resolves the report period only from the existing allowlist parser;
 *   invalid or repeated values fall back to the established default.
 * - Reuses the same Issue 90 report-data architecture as the browser report
 *   through `getPatientReportPdfData`, so the PDF and the browser report can
 *   never diverge in calculation semantics for the same period.
 * - Returns a private, non-cacheable `application/pdf` response with a
 *   fixed, non-sensitive filename, or a safe non-PDF error response —
 *   never an HTML error page under an `application/pdf` content type.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const session = await readPatientReportSession(supabase);

  if (session.status === "unauthenticated") {
    return new Response(null, UNAUTHORIZED_RESPONSE_INIT);
  }

  const period = parseReportPeriod(readPeriodParam(request));

  const result = await getPatientReportPdfData(
    supabase,
    session.userId,
    period,
    new Date()
  );

  if (result.status === "unavailable") {
    return new Response(null, UNAVAILABLE_RESPONSE_INIT);
  }

  let pdfBuffer: Buffer;

  try {
    pdfBuffer = await renderToBuffer(PatientReportPdfDocument({ data: result.data }));
  } catch {
    // Never surface a rendering internal; never send a corrupt/partial PDF.
    return new Response(null, UNAVAILABLE_RESPONSE_INIT);
  }

  const filename = buildPdfFilename(period);

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
