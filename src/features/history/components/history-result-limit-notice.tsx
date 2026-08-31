import { HISTORY_INITIAL_LIMIT } from "../constants";

export function HistoryResultLimitNotice() {
  return (
    <p className="text-sm leading-relaxed text-[var(--at-text-secondary)]">
      Mostrando os {HISTORY_INITIAL_LIMIT} registros mais recentes. O período
      pode conter mais registros.
    </p>
  );
}
