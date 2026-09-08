"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "@/components/ui/app-logo";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { cn } from "@/lib/utils";
import { MEDICAL_NAV_ITEMS } from "../constants/nav-items";
import { isMedicalNavItemActive } from "../lib/is-medical-nav-item-active";

type MedicalDesktopSidebarProps = {
  /** Already-normalized, already-verified display name. Never an email or role code. */
  displayName?: string | null;
};

export function MedicalDesktopSidebar({ displayName }: MedicalDesktopSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Menu lateral"
      className="hidden lg:flex flex-col w-60 shrink-0 min-h-svh bg-[var(--at-navy)] border-r border-[var(--at-navy-dark)]"
    >
      {/* Logo */}
      <div className="px-5 pt-7 pb-1">
        <AppLogo size="sm" />
      </div>

      {/* Area identity */}
      <div className="px-5 pb-6 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--at-navy-muted)]">
          Equipe médica
        </p>
        {displayName && (
          <p className="mt-1 text-sm font-medium text-white truncate">
            {displayName}
          </p>
        )}
      </div>

      {/* Nav */}
      <nav aria-label="Navegação da equipe médica" className="flex-1 px-3 space-y-0.5">
        {MEDICAL_NAV_ITEMS.map((item) => {
          const isActive = isMedicalNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--at-radius-md)] px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-[var(--at-blue)] text-white"
                  : "text-[var(--at-navy-muted)] hover:bg-white/10 hover:text-white"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-6 space-y-3">
        <LogoutButton />
        <p className="px-3 text-[10px] text-[var(--at-navy-muted)]">
          AsthmaTrack — acesso somente leitura
        </p>
      </div>
    </aside>
  );
}
