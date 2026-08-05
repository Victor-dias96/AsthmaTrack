import { PatientDesktopSidebar } from "./patient-desktop-sidebar";
import { PatientMobileNavigation } from "./patient-mobile-navigation";

type PatientShellProps = {
  children: React.ReactNode;
};

export function PatientShell({ children }: PatientShellProps) {
  return (
    <div className="flex min-h-svh">
      {/* Sidebar — desktop only */}
      <PatientDesktopSidebar />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[var(--at-bg-app)]">
        {/* Scrollable content with bottom padding on mobile for the nav bar */}
        <div className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      <PatientMobileNavigation />
    </div>
  );
}
