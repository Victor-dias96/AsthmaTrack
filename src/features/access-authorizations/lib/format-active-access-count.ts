/**
 * Deterministic pt-BR singular/plural label for the ready-state active
 * count. Derived only from the length of the successfully loaded active
 * list -- never a second query, and never interpreted medically.
 */
export function formatActiveAccessCount(count: number): string {
  return count === 1 ? "1 acesso ativo" : `${count} acessos ativos`;
}
