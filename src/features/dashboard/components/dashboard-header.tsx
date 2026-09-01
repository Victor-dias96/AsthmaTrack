type DashboardHeaderProps = {
  firstName: string | null;
};

export function DashboardHeader({ firstName }: DashboardHeaderProps) {
  const greeting = firstName ? `Olá, ${firstName}!` : "Olá!";

  return (
    <header className="min-w-0">
      <h1 className="text-xl font-bold break-words text-[var(--at-text-primary)]">
        {greeting}
      </h1>
      <p className="mt-0.5 text-sm text-[var(--at-text-secondary)]">
        Acompanhe seus registros e a evolução das suas medições.
      </p>
    </header>
  );
}
