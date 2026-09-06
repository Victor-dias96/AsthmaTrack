import { ShieldCheck } from "lucide-react";

import { formatGrantedAt } from "../lib/format-granted-at";
import type { ActiveAccessAuthorization } from "../types/active-access-authorization";

type ActiveAccessItemProps = {
  authorization: ActiveAccessAuthorization;
};

/**
 * One active access relationship (Issue 104). Presentational and static --
 * no click handler, no menu, no revoke control. Reading order matches the
 * accessibility requirement: professional, status, permission, grant date.
 */
export function ActiveAccessItem({ authorization }: ActiveAccessItemProps) {
  const formattedGrantedAt = formatGrantedAt(authorization.grantedAt);

  return (
    <li className="min-w-0 rounded-[var(--at-radius-md)] border border-[var(--at-border)] bg-[var(--at-surface)] p-4">
      <p className="break-words text-sm font-semibold text-[var(--at-text-primary)]">
        {authorization.professionalName}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--at-text-secondary)]">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={14} className="shrink-0" aria-hidden="true" />
          Ativo
        </span>
        <span aria-hidden="true">·</span>
        <span>Somente leitura</span>
      </div>

      <p className="mt-2 text-sm text-[var(--at-text-secondary)]">
        Autorizado em{" "}
        {formattedGrantedAt ? (
          <time dateTime={authorization.grantedAt}>{formattedGrantedAt}</time>
        ) : (
          "data indisponível"
        )}
      </p>
    </li>
  );
}
