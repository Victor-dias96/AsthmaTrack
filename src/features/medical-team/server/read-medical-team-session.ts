import { createClient } from "@/lib/supabase/server";

export type MedicalTeamSession =
  | { status: "unauthenticated" }
  | { status: "authenticated"; userId: string };

type MedicalTeamSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Verifies the request-bound authenticated medical-team caller with
 * getClaims then getUser, mirroring
 * src/features/access-authorizations/server/read-patient-access-session.ts.
 * Never uses getSession as the authorization decision, never queries
 * auth.users, and never accepts a professional identity from a
 * browser-supplied value.
 *
 * The /equipe-medica layout (src/app/equipe-medica/layout.tsx) already
 * verifies authentication and the persisted medical role before this page
 * ever renders. This repeated, request-bound check follows the same
 * established project convention as the patient-side access-management
 * page (readPatientAccessSession under
 * src/app/paciente/configuracoes/acessos/page.tsx) -- a Server Component
 * boundary re-verifies identity rather than trusting data implicitly
 * passed down from an ancestor layout.
 */
export async function readMedicalTeamSession(
  supabase: MedicalTeamSupabaseClient
): Promise<MedicalTeamSession> {
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData || Object.keys(claimsData).length === 0) {
    return { status: "unauthenticated" };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "unauthenticated" };
  }

  return { status: "authenticated", userId: user.id };
}
