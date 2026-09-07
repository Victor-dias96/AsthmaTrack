import { ShieldCheck } from "lucide-react";

import { formatGrantedAt } from "../lib/format-granted-at";
import type { ActiveAccessAuthorization } from "../types/active-access-authorization";
import { RevokeAccessAuthorizationAction } from "./revoke-access-authorization-action";

type ActiveAccessItemProps = {
  authorization: ActiveAccessAuthorization;
};

/**
 * One active access relationship (Issue 104), now extended with the Issue
 * 105 patient-controlled revocation action. Stays a Server Component --
 * only RevokeAccessAuthorizationAction (nested below) is a Client
 * Component, so the list query and presentation remain server-rendered.
 * Reading order matches the accessibility requirement: professional,
 * revoke action, status, permission, grant date. Rendered only for active
 * rows (revoked_at is null): callers never pass a revoked authorization
 * here, so the revoke action never appears for revoked history, and this
 * component is never used on medical-team pages.
 */
export function ActiveAccessItem({ authorization }: ActiveAccessItemProps) {
  const formattedGrantedAt = formatGrantedAt(authorization.grantedAt);

  return (
    <li className="min-w-0 rounded-[var(--at-radius-md)] border border-[var(--at-border)] bg-[var(--at-surface)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="min-w-0 break-words text-sm font-semibold text-[var(--at-text-primary)]">
          {authorization.professionalName}
        </p>

        <RevokeAccessAuthorizationAction authorizationId={authorization.id} />
      </div>

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
