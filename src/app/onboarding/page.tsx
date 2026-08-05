import type { Metadata } from "next";
import { Activity, Gauge, Share2 } from "lucide-react";
import { AppLogo } from "@/components/ui/app-logo";
import { AppAlert } from "@/components/ui/app-alert";
import { AppButton } from "@/components/ui/app-button";

export const metadata: Metadata = {
  title: "Bem-vindo",
};

const steps = [
  {
    icon: <Activity size={22} />,
    title: "Registre seus sintomas diários",
    description:
      "Todo dia, em poucos segundos, anote como você se sentiu: tosse, chiado, falta de ar e aperto no peito.",
  },
  {
    icon: <Gauge size={22} />,
    title: "Meça seu PEF",
    description:
      "Insira os valores do seu peak flow meter (medidor de pico de fluxo). Acompanhe sua evolução em gráficos claros.",
  },
  {
    icon: <Share2 size={22} />,
    title: "Compartilhe com seu médico",
    description:
      "Gere relatórios e autorize seu médico a visualizar seus dados de forma segura.",
  },
];

const iconColors = ["text-blue-600", "text-green-600", "text-blue-600"];
const iconBgColors = ["bg-blue-50", "bg-green-50", "bg-blue-50"];

export default function OnboardingPage() {
  return (
    <div className="min-h-svh flex flex-col bg-[var(--at-surface)]">
      {/* Header — navy */}
      <header className="bg-[var(--at-navy)] px-6 pt-8 pb-8">
        <AppLogo size="md" />
        <h1 className="mt-6 text-2xl font-bold text-white">Bem-vindo!</h1>
        <p className="mt-1.5 text-sm text-[var(--at-navy-muted)]">
          Veja como o app vai te ajudar
        </p>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 py-8 space-y-6 max-w-lg mx-auto w-full">
        {steps.map((step, i) => (
          <div key={step.title} className="flex gap-4">
            <div
              className={`flex items-center justify-center size-12 rounded-[var(--at-radius-lg)] shrink-0 ${iconBgColors[i]} ${iconColors[i]}`}
            >
              {step.icon}
            </div>
            <div>
              <h2 className="font-semibold text-[var(--at-text-primary)]">
                {step.title}
              </h2>
              <p className="mt-1 text-sm text-[var(--at-text-secondary)] leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}

        <AppAlert variant="warning">
          O AsthmaTrack não substitui consultas médicas, não emite diagnósticos
          e não prescreve medicamentos.
        </AppAlert>

        <AppButton fullWidth size="lg" type="button">
          Começar agora
        </AppButton>

        <p className="text-center text-xs text-[var(--at-text-secondary)]">
          Passo 1 de 1 · Onboarding
        </p>
      </main>
    </div>
  );
}
