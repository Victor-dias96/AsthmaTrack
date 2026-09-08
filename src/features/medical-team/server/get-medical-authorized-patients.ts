import { createClient } from "@/lib/supabase/server";

import { buildMedicalAuthorizedPatientsResult } from "../lib/build-medical-authorized-patients-result";
import { parseMedicalAuthorizedPatientRows } from "../lib/map-medical-authorized-patient-row";
import type { MedicalAuthorizedPatientsResult } from "../types/medical-authorized-patient";

type MedicalTeamSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type { MedicalAuthorizedPatientsResult };

/**
 * Loads the authenticated medical-team professional's own active
 * (revoked_at is null) patient access authorizations, with each linked
 * patient's minimal display name (Issue 107), optional name search
 * (Issue 108), and the latest valid daily-record PEF + recorded_at
 * (Issue 109).
 *
 * - Accepts only the existing request-bound authenticated server Supabase
 *   client and an already-normalized search term. Never accepts a
 *   professional id, patient id or raw query string from the browser -- the
 *   caller (src/app/equipe-medica/pacientes/page.tsx) has already verified
 *   its own identity and parsed `q`, and the RPC below independently
 *   re-derives the caller from auth.uid() itself (it takes no arguments at
 *   all).
 * - Calls `public.get_medical_authorized_patients` once. That SECURITY
 *   DEFINER function re-verifies auth.uid() and the caller's persisted
 *   medical role itself, filters `professional_id = auth.uid()` and
 *   `revoked_at is null`, and laterally selects at most one latest daily
 *   record per authorized patient (pef_value and recorded_at only). One
 *   bounded query -- never N+1, never a broad daily_records scan, never
 *   notes or symptoms.
 * - Name search is applied in server memory on that already-bounded
 *   authorized collection. It never queries public.profiles by name, never
 *   uses LIKE/ILIKE (so `%`/`_` cannot broaden the set), never searches PEF
 *   or record dates, and never runs when `searchTerm` is empty.
 * - Filtering does not reorder: matches keep the RPC's created_at
 *   descending, authorization id descending order.
 * - Performs no rendering, no navigation and no client-side effects.
 * - Never uses service_role, never logs patient identities, PEF values,
 *   record timestamps, search terms or authorization rows, and never
 *   returns a raw Supabase error to the caller.
 */
export async function getMedicalAuthorizedPatients(
  supabase: MedicalTeamSupabaseClient,
  searchTerm = ""
): Promise<MedicalAuthorizedPatientsResult> {
  const { data, error } = await supabase.rpc("get_medical_authorized_patients");

  if (error) {
    return { status: "unavailable" };
  }

  const rows = parseMedicalAuthorizedPatientRows(data);

  // The RPC response didn't match its documented shape. Never trust it
  // silently -- surface the safe unavailable state rather than rendering a
  // partially-mapped or fabricated list.
  if (rows === null) {
    return { status: "unavailable" };
  }

  return buildMedicalAuthorizedPatientsResult(rows, searchTerm);
}
