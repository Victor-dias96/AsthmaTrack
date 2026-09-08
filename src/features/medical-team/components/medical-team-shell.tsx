import { AppLogo } from "@/components/ui/app-logo";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { MedicalDesktopSidebar } from "./medical-desktop-sidebar";
import { MedicalMobileNavigation } from "./medical-mobile-navigation";

type MedicalTeamShellProps = {
  children: React.ReactNode;
  /**
   * Already-normalized, already-verified display name for a safe greeting.
   * Optional — never required, never an email, never a role code, never a
   * user ID. The server layout resolves this; the shell never queries.
   */
  displayName?: string | null;
};

/**
 * Presentational medical-team application shell. Performs no Supabase
 * query, no authentication, and no authorization decision — the caller
 * (src/app/equipe-medica/layout.tsx) has already verified the request
 * before this component ever renders. Renders only the desktop sidebar,
 * a compact mobile header/logout bar, the mobile bottom navigation, and
 * the main content region.
 */
export function MedicalTeamShell({ children, displayName }: MedicalTeamShellProps) {
  return (
    <div className="flex min-h-svh">
      {/* Sidebar — desktop only */}
      <MedicalDesktopSidebar displayName={displayName} />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[var(--at-bg-app)]">
        {/* Compact brand/logout bar — mobile only. Intentionally does not
            duplicate the desktop sidebar's navigation links. */}
        <div className="lg:hidden flex items-center justify-between gap-3 px-4 py-3 bg-[var(--at-navy)] border-b border-[var(--at-navy-dark)]">
          <AppLogo size="sm" />
          <LogoutButton />
        </div>

        {/* Scrollable content with bottom padding on mobile for the nav bar */}
        <div className="flex-1 min-w-0 px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      <MedicalMobileNavigation />
    </div>
  );
}
