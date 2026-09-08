import { LayoutDashboard, Users } from "lucide-react";
import type { MedicalNavItem } from "../types/medical-nav-item";

/**
 * Issue 106 navigation only. Deliberately excludes:
 *  - patient-only links (Novo registro, Histórico, Relatório)
 *  - any dynamic patient route
 *  - a "Configurações" item, since no medical-team settings route exists yet
 *  - "Sair", which is reused as the existing LogoutButton action, not a
 *    navigation destination
 */
export const MEDICAL_NAV_ITEMS: readonly MedicalNavItem[] = [
  {
    href: "/equipe-medica",
    label: "Início",
    icon: LayoutDashboard,
  },
  {
    href: "/equipe-medica/pacientes",
    label: "Pacientes",
    icon: Users,
  },
];
