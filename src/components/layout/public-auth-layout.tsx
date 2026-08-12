import { AppLogo } from "@/components/ui/app-logo";

type PublicAuthLayoutProps = {
  panelHeading: string;
  panelBody: React.ReactNode;
  children: React.ReactNode;
};

export function PublicAuthLayout({
  panelHeading,
  panelBody,
  children,
}: PublicAuthLayoutProps) {
  return (
    <div className="min-h-svh flex flex-col lg:flex-row">
      {/* ── Left / Top: navy brand panel ── */}
      <div className="flex flex-col bg-[var(--at-navy)] lg:w-[42%] lg:min-h-svh">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 lg:px-10 lg:pt-10">
          <AppLogo size="md" />
        </div>

        {/* Hero text — visible on desktop, hidden on mobile */}
        <div className="hidden lg:flex flex-1 flex-col justify-center px-10 pb-12">
          <h1 className="text-3xl font-bold text-white leading-tight">
            {panelHeading}
          </h1>
          <div className="mt-5 text-[var(--at-navy-muted)] text-base leading-relaxed">
            {panelBody}
          </div>
        </div>

        {/* Mobile subtitle */}
        <div className="lg:hidden px-6 pb-6 text-sm text-[var(--at-navy-muted)]">
          Controle da sua asma, na palma da mão.
        </div>

        {/* Footer — desktop only */}
        <div className="hidden lg:block px-10 pb-8 text-xs text-[var(--at-navy-muted)]">
          AsthmaTrack — uso pessoal e acompanhamento médico autorizado
        </div>
      </div>

      {/* ── Right / Bottom: white form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[var(--at-surface)] px-5 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
