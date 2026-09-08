import { createClient } from "@/lib/supabase/server";

import { parseMedicalAuthorizedPatientRows } from "../lib/map-medical-authorized-patient-row";
import { normalizePatientName } from "../lib/normalize-patient-name";
import type { MedicalAuthorizedPatient } from "../types/medical-authorized-patient";

type MedicalTeamSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type MedicalAuthorizedPatientsResult =
  | { status: "ready"; patients: readonly MedicalAuthorizedPatient[] }
  | { status: "empty" }
  | { status: "unavailable" };

/**
 * Loads the authenticated medical-team professional's own active
 * (revoked_at is null) patient access authorizations, with each linked
 * patient's minimal display name (Issue 107).
 *
 * - Accepts only the existing request-bound authenticated server Supabase
 *   client. Never accepts a professional id from the browser -- the caller
 *   (src/app/equipe-medica/pacientes/page.tsx) has already verified its
 *   own identity, and the RPC below independently re-derives the caller
 *   from auth.uid() itself (it takes no arguments at all).
 * - Calls `public.get_medical_authorized_patients`, the smallest safe
 *   database helper for this read (see the Issue 107 migration comment for
 *   why a SECURITY DEFINER function is required instead of a plain
 *   nested-select query, mirroring Issue 104's
 *   getPatientActiveAccessAuthorizations). That function re-verifies
 *   auth.uid() and the caller's persisted medical role itself, and filters
 *   both `professional_id = auth.uid()` and `revoked_at is null` -- RLS is
 *   not relied on here as the *only* layer, even though it also protects
 *   the underlying table.
 * - Performs no rendering, no navigation and no client-side effects.
 * - Never uses service_role, never logs patient identities or
 *   authorization rows, and never returns a raw Supabase error to the
 *   caller.
 * - Queries no public.daily_records.
 */
export async function getMedicalAuthorizedPatients(
  supabase: MedicalTeamSupabaseClient
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

  if (rows.length === 0) {
    return { status: "empty" };
  }

  const seenPatientIds = new Set<string>();
  const patients: MedicalAuthorizedPatient[] = [];

  for (const row of rows) {
    // Defensive duplicate-active-pair guard. The Issue 101 partial unique
    // index on (patient_id, professional_id) where revoked_at is null
    // should make this impossible. If malformed legacy data ever produced
    // two active rows for the same patient, do not silently pick one or
    // merge them -- surface the safe unavailable state instead of hiding a
    // data-integrity defect.
    if (seenPatientIds.has(row.patientId)) {
      return { status: "unavailable" };
    }
    seenPatientIds.add(row.patientId);

    // created_at is a `not null` database-generated timestamp, but the RPC
    // response is still treated as unknown data: an unexpectedly invalid
    // value is malformed data, never replaced with the current time and
    // never rendered as "Invalid Date".
    if (Number.isNaN(new Date(row.grantedAt).getTime())) {
      return { status: "unavailable" };
    }

    patients.push({
      authorizationId: row.authorizationId,
      patientId: row.patientId,
      patientName: normalizePatientName(row.patientFullName),
      authorizedAt: row.grantedAt,
    });
  }

  return { status: "ready", patients };
}
