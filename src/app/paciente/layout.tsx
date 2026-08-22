import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PacienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data || Object.keys(data).length === 0) {
    redirect("/login");
  }

  return <>{children}</>;
}
