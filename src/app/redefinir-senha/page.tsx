import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicAuthLayout } from "@/components/layout/public-auth-layout";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { hasRecoveryAmr } from "@/lib/auth/is-recovery-session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Redefinir senha",
};

function firstSearchParam(
  value: string | string[] | undefined
): string | undefined {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string" && value[0]) {
    return value[0];
  }
  return undefined;
}

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code = firstSearchParam(params.code);
  const tokenHash = firstSearchParam(params.token_hash);
  const type = firstSearchParam(params.type);
  const flowId = firstSearchParam(params.sb_flow_id);

  if (code || (tokenHash && type === "recovery")) {
    const callbackParams = new URLSearchParams();
    if (code) {
      callbackParams.set("code", code);
    }
    if (tokenHash && type === "recovery") {
      callbackParams.set("token_hash", tokenHash);
      callbackParams.set("type", "recovery");
    }
    if (flowId) {
      callbackParams.set("sb_flow_id", flowId);
    }
    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const recoveryVerified = !error && hasRecoveryAmr(data?.claims);

  return (
    <PublicAuthLayout
      panelHeading="Atualize sua credencial de acesso"
      panelBody={
        <p>
          Escolha uma senha forte contendo pelo menos 6 caracteres. Após atualizar, use a nova senha para acessar sua conta.
        </p>
      }
    >
      <ResetPasswordForm recoveryVerified={recoveryVerified} />
    </PublicAuthLayout>
  );
}
