import { createClient } from "@/lib/supabase/server";

export type PatientAccessSession =
  | { status: "unauthenticated" }
  | { status: "authenticated"; userId: string };

type AccessAuthorizationsSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Verifies the request-bound authenticated patient with getClaims then
 * getUser, mirroring src/features/history/lib/read-patient-history-session.ts
 * and src/features/reports/server/read-patient-report-session.ts. Never
 * uses getSession as the authorization decision, never queries auth.users,
 * and never accepts patient identity from a browser-supplied value.
 */
export async function readPatientAccessSession(
  supabase: AccessAuthorizationsSupabaseClient
): Promise<PatientAccessSession> {
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
