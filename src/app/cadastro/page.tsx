import type { Metadata } from "next";
import { Activity, TrendingUp, Share2 } from "lucide-react";
import { PublicAuthLayout } from "@/components/layout/public-auth-layout";
import { RegisterForm } from "@/features/auth/components/register-form";

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
      <RegisterForm />
    </PublicAuthLayout>
  );
}
