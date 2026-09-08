import { redirect } from "next/navigation";
import { MedicalTeamShell, MedicalTeamUnavailableState } from "@/features/medical-team";
import { loadVerifiedProfileRole } from "@/lib/auth/load-verified-profile-role";

/**
 * Protected server layout for the entire /equipe-medica subtree (Issue 106).
 *
 * Every request under this route is verified here, before any medical
 * navigation or content renders:
 *  1. Authentication via the established getClaims-then-getUser pattern.
 *     Unauthenticated visitors are redirected to /login — no profile query,
 *     no partial navigation.
 *  2. The caller's own persisted public.profiles role, loaded with an
 *     explicit id filter (see src/lib/auth/load-verified-profile-role.ts).
 *     Only the exact value "medical" may render the medical shell.
 *  3. A "patient" role is redirected to /paciente/dashboard — decided here,
 *     on the server, never by a client redirect or hidden navigation.
 *  4. A missing profile follows the existing onboarding fallback.
 *  5. A profile-query failure renders a safe unavailable state — never the
 *     medical shell, and never treated as a confirmed logout.
 */
export default async function EquipeMedicaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await loadVerifiedProfileRole();

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  if (result.status === "error") {
    return <MedicalTeamUnavailableState />;
  }

  if (result.status === "missing_profile") {
    redirect("/onboarding");
  }

  if (result.role === "patient") {
    redirect("/paciente/dashboard");
  }

  return <MedicalTeamShell displayName={result.fullName}>{children}</MedicalTeamShell>;
}
