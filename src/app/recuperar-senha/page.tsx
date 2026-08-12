import type { Metadata } from "next";
import { PublicAuthLayout } from "@/components/layout/public-auth-layout";
import { RecoverPasswordForm } from "@/features/auth/components/recover-password-form";

export const metadata: Metadata = {
  title: "Recuperar senha",
};

export default function RecuperarSenhaPage() {
  return (
    <PublicAuthLayout
      panelHeading="Acesso seguro à sua conta"
      panelBody={
        <p>
          Enviaremos um link de redefinição para o e-mail cadastrado. Por motivos de segurança, o link possui tempo de expiração.
        </p>
      }
    >
      <RecoverPasswordForm />
    </PublicAuthLayout>
  );
}
