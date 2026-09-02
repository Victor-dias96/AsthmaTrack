import { createClient } from "@/lib/supabase/server";

export type PatientReportSession =
  | { status: "unauthenticated" }
  | { status: "authenticated"; userId: string };

type ReportSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Verifies the request-bound authenticated patient with getClaims then
 * getUser. Never uses getSession as the authorization decision.
 */
export async function readPatientReportSession(
  supabase: ReportSupabaseClient
): Promise<PatientReportSession> {
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
