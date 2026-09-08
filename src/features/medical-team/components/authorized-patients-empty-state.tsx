/**
 * Neutral empty state for zero active patient authorizations (Issue 107).
 * Never shows an error, never shows fake patients, never instructs the
 * professional to alter the database, and never exposes revoked
 * relationships (this state is reached only when the query succeeds with
 * zero active rows). Mirrors
 * src/features/access-authorizations/components/active-access-empty-state.tsx.
 */
export function AuthorizedPatientsEmptyState() {
  return (
    <div className="rounded-[var(--at-radius-md)] border border-dashed border-[var(--at-border)] bg-[var(--at-surface-input)] p-4 text-center">
      <p className="text-sm font-semibold text-[var(--at-text-primary)]">
        Nenhum paciente autorizado
      </p>
      <p className="mt-1 text-sm text-[var(--at-text-secondary)]">
        Os pacientes que autorizarem seu acesso aparecerão aqui.
      </p>
    </div>
  );
}
