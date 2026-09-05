/**
 * Minimal, safe professional identity shown to the patient before
 * confirming an authorization. Deliberately excludes email, role text,
 * account timestamps and any other profile or authorization data --
 * `public.find_medical_professional_by_code` never returns more than this.
 */
export type ProfessionalSummary = {
  professionalId: string;
  fullName: string | null;
};
