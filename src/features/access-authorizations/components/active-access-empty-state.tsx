/**
 * Neutral empty state for zero active authorizations (Issue 104). Never
 * claims no authorization ever existed -- revoked history rows may exist
 * but are out of scope here -- and never shows an error. The Issue 103
 * authorization form remains visible above this section on the page.
 */
export function ActiveAccessEmptyState() {
  return (
    <div className="rounded-[var(--at-radius-md)] border border-dashed border-[var(--at-border)] bg-[var(--at-surface-input)] p-4 text-center">
      <p className="text-sm font-semibold text-[var(--at-text-primary)]">
        Nenhum acesso ativo
      </p>
      <p className="mt-1 text-sm text-[var(--at-text-secondary)]">
        Você ainda não autorizou integrantes da equipe médica a consultar seus
        dados.
      </p>
    </div>
  );
}
