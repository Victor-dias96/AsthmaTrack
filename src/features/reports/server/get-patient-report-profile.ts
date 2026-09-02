import { createClient } from "@/lib/supabase/server";

type ReportSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ReportProfileFullNameRow = {
  full_name: string | null;
};

export type PatientReportProfileResult =
  | { status: "ok"; fullName: string | null }
  | { status: "unavailable" };

/**
 * Loads the authenticated patient's display name for the report header.
 *
 * - Accepts the existing authenticated server Supabase client and the
 *   already-verified patient ID; never verifies identity itself.
 * - Selects only `full_name` from `public.profiles`, filtered by that ID.
 * - A missing row or empty name is `ok` with `fullName: null`.
 * - A provider or query error is `unavailable`, never a fabricated name.
 * - Never uses `service_role` and never logs the name.
 */
export async function getPatientReportProfile(
  supabase: ReportSupabaseClient,
  patientId: string
): Promise<PatientReportProfileResult> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", patientId)
      .limit(1)
      .maybeSingle()
      .overrideTypes<ReportProfileFullNameRow, { merge: false }>();

    if (error) {
      return { status: "unavailable" };
    }

    if (!data) {
      return { status: "ok", fullName: null };
    }

    const fullName = typeof data.full_name === "string" ? data.full_name : null;

    return { status: "ok", fullName };
  } catch {
    return { status: "unavailable" };
  }
}
