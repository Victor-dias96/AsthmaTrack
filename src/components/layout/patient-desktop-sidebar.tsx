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
import { AppLogo } from "@/components/ui/app-logo";
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
    icon: <LayoutDashboard size={18} />,
  },
  {
    href: "/paciente/novo-registro",
    label: "Novo registro",
    icon: <PlusCircle size={18} />,
  },
  {
    href: "/paciente/historico",
    label: "Histórico",
    icon: <History size={18} />,
  },
  {
    href: "/paciente/relatorio",
    label: "Relatório",
    icon: <FileText size={18} />,
  },
  {
    href: "/paciente/configuracoes",
    label: "Configurações",
    icon: <Settings size={18} />,
  },
];

export function PatientDesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Menu lateral"
      className="hidden lg:flex flex-col w-60 shrink-0 min-h-svh bg-[var(--at-navy)] border-r border-[var(--at-navy-dark)]"
    >
      {/* Logo */}
      <div className="px-5 pt-7 pb-8">
        <AppLogo size="sm" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
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
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 pb-6 text-[10px] text-[var(--at-navy-muted)]">
        AsthmaTrack — uso pessoal
      </div>
    </aside>
  );
}
