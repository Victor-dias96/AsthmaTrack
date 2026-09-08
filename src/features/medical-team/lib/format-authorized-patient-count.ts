/**
 * Deterministic pt-BR singular/plural label for the ready-state authorized-
 * patient count. Derived only from the length of the successfully loaded
 * list -- never a second query, and never a claim about the total number
 * of patients in the application. Mirrors
 * src/features/access-authorizations/lib/format-active-access-count.ts.
 */
export function formatAuthorizedPatientCount(count: number): string {
  return count === 1
    ? "1 paciente com acesso autorizado"
    : `${count} pacientes com acesso autorizado`;
}
