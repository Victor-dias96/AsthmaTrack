import { createClient } from "@/lib/supabase/server";

import { parseActiveAccessAuthorizationRows } from "../lib/map-active-access-authorization-row";
import { normalizeProfessionalName } from "../lib/normalize-professional-name";
import type { ActiveAccessAuthorization } from "../types/active-access-authorization";

type AccessAuthorizationsSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type GetPatientActiveAccessAuthorizationsResult =
  | { status: "ready"; authorizations: readonly ActiveAccessAuthorization[] }
  | { status: "empty" }
  | { status: "unavailable" };

/**
 * Loads the authenticated patient's own active (revoked_at is null) access
 * authorizations, with each linked professional's minimal display name
 * (Issue 104).
 *
 * - Accepts the existing request-bound authenticated server Supabase client
 *   and the already-verified patient ID; never verifies or accepts an
 *   unverified ID.
 * - Calls `public.get_patient_active_access_authorizations`, the smallest
 *   safe database helper for this read (see the Issue 104 migration comment
 *   for why a SECURITY DEFINER function is required instead of a plain
 *   nested-select query). That function re-verifies auth.uid() itself and
 *   filters both `patient_id = auth.uid()` and `revoked_at is null` --
 *   RLS is not relied on here as the *only* layer, even though it also
 *   protects the underlying table.
 * - Performs no rendering, no navigation and no client-side effects.
 * - Never uses service_role, never logs authorization rows, and never
 *   returns a raw Supabase error to the caller.
 */
export async function getPatientActiveAccessAuthorizations(
  supabase: AccessAuthorizationsSupabaseClient,
  patientId: string
): Promise<GetPatientActiveAccessAuthorizationsResult> {
  const { data, error } = await supabase.rpc(
    "get_patient_active_access_authorizations",
    { p_patient_id: patientId }
  );

  if (error) {
    return { status: "unavailable" };
  }

  const rows = parseActiveAccessAuthorizationRows(data);

  // The RPC response didn't match its documented shape. Never trust it
  // silently -- surface the safe unavailable state rather than rendering a
  // partially-mapped or fabricated list.
  if (rows === null) {
    return { status: "unavailable" };
  }

  if (rows.length === 0) {
    return { status: "empty" };
  }

  const seenProfessionalIds = new Set<string>();
  const authorizations: ActiveAccessAuthorization[] = [];

  for (const row of rows) {
    // Defensive duplicate-active-pair guard. The Issue 101 partial unique
    // index on (patient_id, professional_id) where revoked_at is null
    // should make this impossible. If malformed legacy data ever produced
    // two active rows for the same professional, do not silently pick one
    // or merge them -- surface the safe unavailable state instead of
    // hiding a data-integrity defect.
    if (seenProfessionalIds.has(row.professionalId)) {
      return { status: "unavailable" };
    }
    seenProfessionalIds.add(row.professionalId);

    // created_at is a `not null` database-generated timestamp, but the RPC
    // response is still treated as unknown data: an unexpectedly invalid
    // value is malformed data, never replaced with the current time and
    // never rendered as "Invalid Date".
    if (Number.isNaN(new Date(row.grantedAt).getTime())) {
      return { status: "unavailable" };
    }

    authorizations.push({
      id: row.authorizationId,
      professionalName: normalizeProfessionalName(row.professionalFullName),
      grantedAt: row.grantedAt,
    });
  }

  return { status: "ready", authorizations };
}
