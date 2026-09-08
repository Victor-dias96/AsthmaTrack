import { redirect } from "next/navigation";
import { loadVerifiedProfileRole } from "@/lib/auth/load-verified-profile-role";

export default async function PacienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await loadVerifiedProfileRole();

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  // Confirmed gap fix: a medical-team profile must not use patient-only
  // pages (e.g. novo-registro) under its own identity. Any other status
  // (missing profile, query failure, or role "patient") falls through
  // unchanged so legitimate patient access is never blocked here.
  if (result.status === "ok" && result.role === "medical") {
    redirect("/equipe-medica");
  }

  return <>{children}</>;
}
