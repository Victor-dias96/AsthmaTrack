/**
 * Deterministic pt-BR singular/plural label for a filtered authorized-
 * patient search. Derived only from the length of the already-authorized
 * match list -- never a second query, and never a claim about patients
 * outside the caller's active authorizations.
 */
export function formatAuthorizedPatientSearchCount(count: number): string {
  return count === 1
    ? "1 paciente encontrado"
    : `${count} pacientes encontrados`;
}
