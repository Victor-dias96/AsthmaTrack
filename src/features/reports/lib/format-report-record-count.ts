/**
 * Neutral pt-BR record count copy. Does not interpret the value medically.
 */
export function formatReportRecordCount(count: number): string {
  if (count === 1) {
    return "1 registro encontrado";
  }

  return `${count} registros encontrados`;
}
