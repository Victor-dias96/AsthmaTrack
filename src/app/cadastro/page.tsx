import type { Metadata } from "next";
import Link from "next/link";
import { Activity, TrendingUp, Share2 } from "lucide-react";
import { PublicAuthLayout } from "@/components/layout/public-auth-layout";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { FormField } from "@/components/ui/form-field";

export const metadata: Metadata = {
  title: "Criar conta",
};

const features = [
  { icon: <Activity size={16} />, text: "Registre PEF e sintomas diários" },
  { icon: <TrendingUp size={16} />, text: "Veja gráficos de evolução" },
  { icon: <Share2 size={16} />, text: "Compartilhe dados com seu médico" },
];

export default function CadastroPage() {
  return (
    <PublicAuthLayout
      panelHeading="Comece a acompanhar sua saúde hoje"
      panelBody={
        <ul className="mt-4 space-y-3">
          {features.map((f) => (
            <li key={f.text} className="flex items-center gap-3">
              <span className="flex items-center justify-center size-7 rounded-full bg-[var(--at-blue)] text-white shrink-0">
                {f.icon}
              </span>
              <span>{f.text}</span>
            </li>
          ))}
        </ul>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--at-text-primary)]">
            Criar conta
          </h1>
          <p className="mt-1 text-sm text-[var(--at-text-secondary)]">
            Preencha os dados abaixo para começar
          </p>
        </div>

        <form className="space-y-4" noValidate>
          <FormField label="Nome completo" htmlFor="register-name">
            <AppInput
              id="register-name"
              type="text"
              placeholder="Seu nome completo"
              autoComplete="name"
            />
          </FormField>

          <FormField label="E-mail" htmlFor="register-email">
            <AppInput
              id="register-email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </FormField>

          <FormField label="Senha" htmlFor="register-password">
            <AppInput
              id="register-password"
              type="password"
              placeholder="Crie uma senha forte"
              autoComplete="new-password"
            />
          </FormField>

          <FormField label="Confirmar senha" htmlFor="register-password-confirm">
            <AppInput
              id="register-password-confirm"
              type="password"
              placeholder="Repita a senha"
              autoComplete="new-password"
            />
          </FormField>

          <AppButton type="submit" fullWidth size="lg">
            Criar conta
          </AppButton>
        </form>

        <p className="text-center text-sm text-[var(--at-text-secondary)]">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="text-[var(--at-blue)] font-medium hover:underline"
          >
            Entrar
          </Link>
        </p>

        <p className="text-center text-xs text-[var(--at-text-secondary)]">
          Gratuito para pacientes
        </p>
      </div>
    </PublicAuthLayout>
  );
}
