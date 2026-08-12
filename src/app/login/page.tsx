import type { Metadata } from "next";
import { PublicAuthLayout } from "@/components/layout/public-auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <PublicAuthLayout
      panelHeading="Controle sua asma com confiança"
      panelBody={
        <p>
          Registre seus sintomas diários e medições de PEF. Acompanhe sua
          evolução e compartilhe dados com seu médico de forma segura.
        </p>
      }
    >
      <LoginForm />
    </PublicAuthLayout>
  );
}
