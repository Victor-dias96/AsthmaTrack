/**
 * Stable DOM ids shared between the daily-record field components and the
 * shared form-state hook (used to describe fields via `aria-describedby`
 * and to focus the first invalid field after a failed submission).
 */
export const RECORDED_AT_FIELD_ID = "daily-record-recorded-at";
export const PEF_FIELD_ID = "daily-record-pef-value";
export const NOTES_FIELD_ID = "daily-record-notes";

export const HAD_ATTACK_GROUP_NAME = "hadAttack";
export const HAD_ATTACK_LABEL_ID = "daily-record-had-attack-label";
export const HAD_ATTACK_OPTION_FALSE_ID = "hadAttack-false";
export const HAD_ATTACK_OPTION_TRUE_ID = "hadAttack-true";

export const USED_RESCUE_MEDICATION_GROUP_NAME = "usedRescueMedication";
export const USED_RESCUE_MEDICATION_LABEL_ID =
  "daily-record-used-rescue-medication-label";
export const USED_RESCUE_MEDICATION_OPTION_FALSE_ID =
  "usedRescueMedication-false";
export const USED_RESCUE_MEDICATION_OPTION_TRUE_ID =
  "usedRescueMedication-true";
