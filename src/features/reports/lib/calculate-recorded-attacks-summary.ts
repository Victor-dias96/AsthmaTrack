import type { PatientReportRecord } from "./map-patient-report-record-row";

const ISO_TIMESTAMP_PREFIX = /^\d{4}-\d{2}-\d{2}T/;

export type RecordedAttackItem = {
  recordedAt: string;
};

export type RecordedAttacksSummary = {
  count: number;
  attacks: readonly RecordedAttackItem[];
};

type ValidatedRecordedAttack = {
  recordedAt: string;
  recordedAtMs: number;
  inputIndex: number;
};

/**
 * Parses an ISO-compatible recordedAt instant to milliseconds. Comparison
 * uses the parsed timestamp, never locale strings or the current time.
 */
function getValidRecordedAtMs(recordedAt: string): number | null {
  if (
    typeof recordedAt !== "string" ||
    !ISO_TIMESTAMP_PREFIX.test(recordedAt)
  ) {
    return null;
  }

  const recordedAtMs = new Date(recordedAt).getTime();

  if (!Number.isFinite(recordedAtMs)) {
    return null;
  }

  return recordedAtMs;
}

/**
 * True when hadAttack is exactly the boolean true or false. Does not accept
 * string or numeric pseudo-booleans and does not use truthiness.
 */
function isValidReportHadAttack(value: boolean): boolean {
  return value === true || value === false;
}

function compareValidatedAttacks(
  left: ValidatedRecordedAttack,
  right: ValidatedRecordedAttack
): number {
  if (left.recordedAtMs !== right.recordedAtMs) {
    return left.recordedAtMs - right.recordedAtMs;
  }

  return left.inputIndex - right.inputIndex;
}

/**
 * Recorded-attack summary for already-authorized selected-period records.
 *
 * Counts rows where `hadAttack === true`. Does not infer attacks from PEF,
 * symptoms, rescue medication or notes. Duplicate calendar days and equal
 * timestamps remain separate entries. Returns null when no valid row exists
 * or when a true attack cannot be dated, instead of fabricating a partial
 * count. Does not mutate the input collection.
 */
export function calculateRecordedAttacksSummary(
  records: readonly PatientReportRecord[]
): RecordedAttacksSummary | null {
  const validatedAttacks: ValidatedRecordedAttack[] = [];
  let validRecordCount = 0;
  let hasUntrustedAttack = false;

  for (let inputIndex = 0; inputIndex < records.length; inputIndex += 1) {
    const record = records[inputIndex];

    if (!isValidReportHadAttack(record.hadAttack)) {
      hasUntrustedAttack = true;
      continue;
    }

    const recordedAtMs = getValidRecordedAtMs(record.recordedAt);

    if (recordedAtMs === null) {
      if (record.hadAttack === true) {
        hasUntrustedAttack = true;
      }

      continue;
    }

    validRecordCount += 1;

    if (record.hadAttack === true) {
      validatedAttacks.push({
        recordedAt: record.recordedAt,
        recordedAtMs,
        inputIndex,
      });
    }
  }

  if (hasUntrustedAttack || validRecordCount === 0) {
    return null;
  }

  const attacks = validatedAttacks
    .slice()
    .sort(compareValidatedAttacks)
    .map((attack) => ({ recordedAt: attack.recordedAt }));

  return {
    count: attacks.length,
    attacks,
  };
}
