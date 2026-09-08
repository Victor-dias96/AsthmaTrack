import { ShieldCheck } from "lucide-react";

import { formatAuthorizedAt } from "../lib/format-authorized-at";
import { formatLatestRecordedAt } from "../lib/format-latest-recorded-at";
import type {
  MedicalAuthorizedLatestRecord,
  MedicalAuthorizedPatient,
} from "../types/medical-authorized-patient";

type AuthorizedPatientItemProps = {
  patient: MedicalAuthorizedPatient;
};

function LatestPefValue({ pefValue }: { pefValue: number }) {
  return (
    <span className="whitespace-nowrap tabular-nums">
      {pefValue} L/min
    </span>
  );
}

function LatestRecordTime({ recordedAt }: { recordedAt: string }) {
  const formatted = formatLatestRecordedAt(recordedAt);

  if (formatted === null) {
    return "Dados do último registro indisponíveis";
  }

  return <time dateTime={recordedAt}>{formatted}</time>;
}

function AuthorizedPatientLatestRecord({
  latestRecord,
}: {
  latestRecord: MedicalAuthorizedLatestRecord;
}) {
  if (latestRecord.kind === "unavailable") {
    return (
      <p className="mt-3 break-words text-sm text-[var(--at-text-secondary)]">
        Dados do último registro indisponíveis
      </p>
    );
  }

  const pefContent =
    latestRecord.kind === "ready" ? (
      <LatestPefValue pefValue={latestRecord.pefValue} />
    ) : (
      "Sem registros"
    );

  const recordedAtContent =
    latestRecord.kind === "ready" ? (
      <LatestRecordTime recordedAt={latestRecord.recordedAt} />
    ) : (
      "Sem registros"
    );

  return (
    <dl className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="min-w-0">
        <dt className="text-sm text-[var(--at-text-secondary)]">Último PEF</dt>
        <dd className="mt-0.5 min-w-0 break-words text-sm font-medium text-[var(--at-text-primary)]">
          {pefContent}
        </dd>
      </div>
      <div className="min-w-0">
        <dt className="text-sm text-[var(--at-text-secondary)]">
          Último registro
        </dt>
        <dd className="mt-0.5 min-w-0 break-words text-sm font-medium text-[var(--at-text-primary)]">
          {recordedAtContent}
        </dd>
      </div>
    </dl>
  );
}

/**
 * One patient linked through an active authorization directed to the
 * authenticated medical-team professional (Issues 107 and 109).
 * Presentational only -- no Supabase query, no authentication, no
 * mutation, no clickable card, and no patient, authorization or record
 * identifier is ever rendered. Displays the latest PEF and latest record
 * date as factual recorded values only -- no clinical interpretation,
 * charts, notes, symptoms or write actions.
 */
export function AuthorizedPatientItem({ patient }: AuthorizedPatientItemProps) {
  const formattedAuthorizedAt = formatAuthorizedAt(patient.authorizedAt);

  return (
    <li className="min-w-0 overflow-hidden rounded-[var(--at-radius-md)] border border-[var(--at-border)] bg-[var(--at-surface)] p-4">
      <p className="min-w-0 break-words text-sm font-semibold text-[var(--at-text-primary)]">
        {patient.patientName}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--at-text-secondary)]">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={14} className="shrink-0" aria-hidden="true" />
          Acesso ativo
        </span>
        <span aria-hidden="true">·</span>
        <span>Somente leitura</span>
      </div>

      <p className="mt-2 break-words text-sm text-[var(--at-text-secondary)]">
        Acesso autorizado em{" "}
        {formattedAuthorizedAt ? (
          <time dateTime={patient.authorizedAt}>{formattedAuthorizedAt}</time>
        ) : (
          "data indisponível"
        )}
      </p>

      <AuthorizedPatientLatestRecord latestRecord={patient.latestRecord} />
    </li>
  );
}
