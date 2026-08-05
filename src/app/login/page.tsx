import type { Metadata } from "next";
import Link from "next/link";
import { PublicAuthLayout } from "@/components/layout/public-auth-layout";
import { AppAlert } from "@/components/ui/app-alert";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { FormField } from "@/components/ui/form-field";

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--at-text-primary)]">
            Entrar
          </h1>
          <p className="mt-1 text-sm text-[var(--at-text-secondary)]">
            Acesse sua conta para continuar
          </p>
        </div>

        <form className="space-y-4" noValidate>
          <FormField label="E-mail" htmlFor="login-email">
            <AppInput
              id="login-email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </FormField>

          <FormField label="Senha" htmlFor="login-password">
            <AppInput
              id="login-password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </FormField>

          <div className="text-right">
            <Link
              href="#"
              className="text-sm text-[var(--at-blue)] hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>

          <AppButton type="submit" fullWidth size="lg">
            Entrar
          </AppButton>
        </form>

        <p className="text-center text-sm text-[var(--at-text-secondary)]">
          Não tem conta?{" "}
          <Link
            href="/cadastro"
            className="text-[var(--at-blue)] font-medium hover:underline"
          >
            Criar conta
          </Link>
        </p>

        <AppAlert variant="warning">
          Seus dados são armazenados com segurança e nunca são compartilhados
          sem sua autorização.
        </AppAlert>
      </div>
    </PublicAuthLayout>
  );
}
