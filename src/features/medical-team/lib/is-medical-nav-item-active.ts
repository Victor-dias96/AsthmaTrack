/**
 * Active-route matching for medical-team navigation.
 *
 * "/equipe-medica" (Início) matches only the exact home route — it must
 * NOT prefix-match "/equipe-medica/pacientes", otherwise both items would
 * appear active at once. Every other item matches its own path and any
 * nested path beneath it (ready for future dynamic patient routes under
 * "/equipe-medica/pacientes" in Issue 107+).
 */
export function isMedicalNavItemActive(pathname: string, href: string): boolean {
  if (href === "/equipe-medica") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
