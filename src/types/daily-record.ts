/** Symptom severity scale enforced by daily_records check constraints (0–3). */
export type SymptomSeverity = 0 | 1 | 2 | 3;

/** Complete application-facing row from public.daily_records. */
export type DailyRecord = {
  id: string;
  patientId: string;
  recordedAt: string;
  pefValue: number;
  coughSeverity: SymptomSeverity;
  wheezingSeverity: SymptomSeverity;
  shortnessOfBreathSeverity: SymptomSeverity;
  chestTightnessSeverity: SymptomSeverity;
  hadAttack: boolean;
  usedRescueMedication: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Insert payload before database-generated id and timestamps.
 * patientId is omitted; the data layer sets it from the authenticated user.
 */
export type DailyRecordInsert = {
  pefValue: number;
  recordedAt?: string;
  coughSeverity?: SymptomSeverity;
  wheezingSeverity?: SymptomSeverity;
  shortnessOfBreathSeverity?: SymptomSeverity;
  chestTightnessSeverity?: SymptomSeverity;
  hadAttack?: boolean;
  usedRescueMedication?: boolean;
  notes?: string | null;
};

/** Patient-editable fields for an existing record; ownership cannot change. */
export type DailyRecordUpdate = {
  recordedAt?: string;
  pefValue?: number;
  coughSeverity?: SymptomSeverity;
  wheezingSeverity?: SymptomSeverity;
  shortnessOfBreathSeverity?: SymptomSeverity;
  chestTightnessSeverity?: SymptomSeverity;
  hadAttack?: boolean;
  usedRescueMedication?: boolean;
  notes?: string | null;
};
