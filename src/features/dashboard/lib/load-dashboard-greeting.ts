import { createClient } from "@/lib/supabase/server";

import { getFirstDisplayName } from "./get-first-display-name";

type ProfileFullNameRow = {
  full_name: string | null;
};

export type LoadDashboardGreetingResult =
  { status: "unauthenticated" } | { status: "ok"; firstName: string | null };

export async function loadDashboardGreeting(): Promise<LoadDashboardGreetingResult> {
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
      .select("full_name")
      .eq("id", user.id)
      .limit(1)
      .maybeSingle()
      .overrideTypes<ProfileFullNameRow, { merge: false }>();

    if (error || !data) {
      return { status: "ok", firstName: null };
    }

    const fullName = typeof data.full_name === "string" ? data.full_name : null;

    return {
      status: "ok",
      firstName: getFirstDisplayName(fullName),
    };
  } catch {
    return { status: "ok", firstName: null };
  }
}
