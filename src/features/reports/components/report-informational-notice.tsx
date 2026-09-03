import { Info } from "lucide-react";

import {
  REPORT_INFORMATIONAL_NOTICE_BODY,
  REPORT_INFORMATIONAL_NOTICE_TITLE,
} from "../constants";

const REPORT_INFORMATIONAL_NOTICE_TITLE_ID = "report-informational-notice-title";

/**
 * Presentational report limitation notice. Static copy only; performs no
 * queries, authentication or record access.
 */
export function ReportInformationalNotice() {
  return (
    <aside
      aria-labelledby={REPORT_INFORMATIONAL_NOTICE_TITLE_ID}
      className="report-print-section min-w-0 rounded-[var(--at-radius-md)] border border-[var(--at-border)] bg-[var(--at-blue-light)] px-4 py-3"
    >
      <div className="flex items-start gap-2.5">
        <Info
          size={16}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-[var(--at-blue)]"
        />
        <div className="min-w-0">
          <h2
            id={REPORT_INFORMATIONAL_NOTICE_TITLE_ID}
            className="text-sm font-semibold leading-relaxed text-[var(--at-text-primary)]"
          >
            {REPORT_INFORMATIONAL_NOTICE_TITLE}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--at-text-secondary)]">
            {REPORT_INFORMATIONAL_NOTICE_BODY}
          </p>
        </div>
      </div>
    </aside>
  );
}
