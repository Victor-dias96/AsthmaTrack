export function formatHistoryBoolean(value: boolean): "Sim" | "Não" {
  return value ? "Sim" : "Não";
}

export function hasDailyRecordNotes(notes: string | null): notes is string {
  return notes !== null && notes.trim().length > 0;
}
