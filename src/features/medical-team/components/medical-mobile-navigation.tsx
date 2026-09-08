"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MEDICAL_NAV_ITEMS } from "../constants/nav-items";
import { isMedicalNavItemActive } from "../lib/is-medical-nav-item-active";

export function MedicalMobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação da equipe médica"
      className="fixed bottom-0 inset-x-0 z-40 flex items-stretch bg-[var(--at-surface)] border-t border-[var(--at-border)] safe-area-inset-bottom lg:hidden"
    >
      {MEDICAL_NAV_ITEMS.map((item) => {
        const isActive = isMedicalNavItemActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors duration-150",
              isActive
                ? "text-[var(--at-blue)]"
                : "text-[var(--at-text-secondary)] hover:text-[var(--at-text-primary)]"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={cn(
                "transition-transform duration-150",
                isActive && "scale-110"
              )}
            >
              <Icon size={22} aria-hidden="true" />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
