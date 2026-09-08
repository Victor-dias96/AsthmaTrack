/**
 * Product timezone for the Issue 107 authorized-patient list display. No
 * product-wide timezone policy exists yet; America/Maceio matches the same
 * convention already used by
 * src/features/access-authorizations/constants.ts and
 * src/features/history/constants.ts.
 */
export const MEDICAL_AUTHORIZED_PATIENTS_TIME_ZONE = "America/Maceio";

export const AUTHORIZED_PATIENTS_PATH = "/equipe-medica/pacientes";

/**
 * Canonical name-search query parameter for the authorized-patient list
 * (Issue 108). Missing, empty and whitespace-only values mean no active
 * search. Never used for patient IDs, emails, authorization IDs or health
 * data.
 */
export const AUTHORIZED_PATIENT_SEARCH_PARAM = "q";

/**
 * Safe upper bound for a normalized patient-name search. Shorter than
 * the stored full-name limit so a search URL cannot carry an oversized
 * identity string; oversized values are rejected rather than truncated.
 */
export const AUTHORIZED_PATIENT_SEARCH_MAX_LENGTH = 80;

export const AUTHORIZED_PATIENT_SEARCH_INPUT_ID = "authorized-patient-search-q";
