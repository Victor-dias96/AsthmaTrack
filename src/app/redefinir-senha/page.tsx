import type { Metadata } from "next";
import { PublicAuthLayout } from "@/components/layout/public-auth-layout";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Redefinir senha",
};

export default function RedefinirSenhaPage() {
  return (
    <PublicAuthLayout
      panelHeading="Atualize sua credencial de acesso"
      panelBody={
        <p>
          Escolha uma senha forte contendo pelo menos 6 caracteres. Após atualizar, use a nova senha para acessar sua conta.
        </p>
      }
    >
      <ResetPasswordForm />
    </PublicAuthLayout>
  );
}
