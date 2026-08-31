import { createClient } from "@/lib/supabase/server";

export type PatientHistorySession =
  | { status: "unauthenticated" }
  | { status: "authenticated"; userId: string };

type HistorySupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function readPatientHistorySession(
  supabase: HistorySupabaseClient
): Promise<PatientHistorySession> {
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

export async function verifyPatientHistorySession(): Promise<PatientHistorySession> {
  const supabase = await createClient();
  return readPatientHistorySession(supabase);
}
