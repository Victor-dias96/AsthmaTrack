import { createClient } from "@/lib/supabase/server";

export type PatientProfile = {
  email: string;
  fullName: string | null;
  role: "patient" | "medical";
  onboardingCompleted: boolean;
  updatedAt: string;
};

export type LoadPatientProfileResult =
  | { status: "ok"; profile: PatientProfile }
  | { status: "unauthenticated" }
  | { status: "missing_profile" }
  | { status: "error" };

export async function loadPatientProfile(): Promise<LoadPatientProfileResult> {
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

  if (userError || !user?.email) {
    return { status: "unauthenticated" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, onboarding_completed, updated_at")
    .single();

  if (profileError?.code === "PGRST116" || !profile) {
    return { status: "missing_profile" };
  }

  if (profileError) {
    return { status: "error" };
  }

  return {
    status: "ok",
    profile: {
      email: user.email,
      fullName: profile.full_name,
      role: profile.role,
      onboardingCompleted: profile.onboarding_completed,
      updatedAt: profile.updated_at,
    },
  };
}
