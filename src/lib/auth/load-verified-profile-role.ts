import { createClient } from "@/lib/supabase/server";

export type VerifiedProfileRole = "patient" | "medical";

export type LoadVerifiedProfileRoleResult =
  | { status: "unauthenticated" }
  | { status: "missing_profile" }
  | { status: "error" }
  | {
      status: "ok";
      userId: string;
      role: VerifiedProfileRole;
      fullName: string | null;
    };

type VerifiedProfileRoleRow = {
  role: string;
  full_name: string | null;
};

/**
 * Verifies the request-bound authenticated identity using the established
 * getClaims-then-getUser pattern (see e.g.
 * src/features/access-authorizations/server/read-patient-access-session.ts),
 * then loads ONLY that verified user's own persisted `public.profiles` role
 * and full_name, explicitly filtered by id.
 *
 * Shared by the patient (`src/app/paciente/layout.tsx`) and medical-team
 * (`src/app/equipe-medica/layout.tsx`) protected layouts so role enforcement
 * lives in exactly one place. Never uses getSession, never trusts a
 * browser-supplied role, and never treats a missing profile or a query
 * failure as an authorized role.
 */
export async function loadVerifiedProfileRole(): Promise<LoadVerifiedProfileRoleResult> {
  const supabase = await createClient();

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

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .limit(1)
      .maybeSingle()
      .overrideTypes<VerifiedProfileRoleRow, { merge: false }>();

    if (error) {
      return { status: "error" };
    }

    if (!data || (data.role !== "patient" && data.role !== "medical")) {
      // No profile row, or a persisted value outside the known role
      // enum -- never inferred as "medical", never inferred as "patient".
      return { status: "missing_profile" };
    }

    return {
      status: "ok",
      userId: user.id,
      role: data.role,
      fullName: data.full_name,
    };
  } catch {
    return { status: "error" };
  }
}
