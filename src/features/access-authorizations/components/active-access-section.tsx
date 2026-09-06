import { ActiveAccessEmptyState } from "./active-access-empty-state";
import { ActiveAccessList } from "./active-access-list";
import { ActiveAccessUnavailableState } from "./active-access-unavailable-state";
import { formatActiveAccessCount } from "../lib/format-active-access-count";
import type { GetPatientActiveAccessAuthorizationsResult } from "../server/get-patient-active-access-authorizations";

const ACTIVE_ACCESS_SECTION_HEADING_ID = "active-access-section-heading";

type ActiveAccessSectionProps = GetPatientActiveAccessAuthorizationsResult;

/**
 * Server-rendered active-access section for the Issue 103 access-management
 * page (Issue 104). Composes the section heading with the ready, empty and
 * unavailable states of `getPatientActiveAccessAuthorizations`. Performs no
 * query itself -- it only renders the already-loaded result.
 */
export function ActiveAccessSection(props: ActiveAccessSectionProps) {
  return (
    <section aria-labelledby={ACTIVE_ACCESS_SECTION_HEADING_ID}>
      <h2
        id={ACTIVE_ACCESS_SECTION_HEADING_ID}
        className="text-lg font-semibold text-[var(--at-text-primary)]"
      >
        Acessos ativos
      </h2>
      <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
        Integrantes da equipe médica autorizados a consultar seus dados.
      </p>

      <div className="mt-4">
        {props.status === "unavailable" && <ActiveAccessUnavailableState />}

        {props.status === "empty" && <ActiveAccessEmptyState />}

        {props.status === "ready" && (
          <>
            <p className="mb-3 text-sm text-[var(--at-text-secondary)]">
              {formatActiveAccessCount(props.authorizations.length)}
            </p>
            <ActiveAccessList authorizations={props.authorizations} />
          </>
        )}
      </div>
    </section>
  );
}
