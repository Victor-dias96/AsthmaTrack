"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    href: "/paciente/dashboard",
    label: "Início",
    icon: <LayoutDashboard size={22} />,
  },
  {
    href: "/paciente/novo-registro",
    label: "Registrar",
    icon: <PlusCircle size={22} />,
  },
  {
    href: "/paciente/historico",
    label: "Histórico",
    icon: <History size={22} />,
  },
  {
    href: "/paciente/relatorio",
    label: "Relatório",
    icon: <FileText size={22} />,
  },
  {
    href: "/paciente/configuracoes",
    label: "Config.",
    icon: <Settings size={22} />,
  },
];

export function PatientMobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação do paciente"
      className="fixed bottom-0 inset-x-0 z-40 flex items-stretch bg-[var(--at-surface)] border-t border-[var(--at-border)] safe-area-inset-bottom lg:hidden"
    >
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
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
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
