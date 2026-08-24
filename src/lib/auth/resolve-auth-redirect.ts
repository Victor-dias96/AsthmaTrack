import { getSafeNextPath } from "./safe-next";

export type RoutingProfile = {
  role: string;
  onboarding_completed: boolean;
};

function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isAuthenticatedAuthRoute(pathname: string): boolean {
  return (
    matchesRoute(pathname, "/login") ||
    matchesRoute(pathname, "/cadastro") ||
    matchesRoute(pathname, "/onboarding")
  );
}

/**
 * Destination for an already-authenticated visitor.
 * Returns null when the current path should stay as-is (missing profile, medical
 * routing pending, or an allowed page such as incomplete-patient onboarding).
 */
export function resolveAuthRedirect({
  pathname,
  next,
  profile,
}: {
  pathname: string;
  next: string | null;
  profile: RoutingProfile | null;
}): string | null {
  if (!profile) {
    return null;
  }

  const onLogin = matchesRoute(pathname, "/login");
  const onCadastro = matchesRoute(pathname, "/cadastro");
  const onOnboarding = matchesRoute(pathname, "/onboarding");

  if (profile.role !== "patient") {
    // Medical dashboard routing is pending — keep a safe existing fallback.
    if (onLogin || onCadastro) {
      return "/onboarding";
    }
    return null;
  }

  if (!profile.onboarding_completed) {
    if (onLogin || onCadastro) {
      return "/onboarding";
    }
    return null;
  }

  if (onLogin) {
    return (
      getSafeNextPath(next, { onboardingCompleted: true }) ??
      "/paciente/dashboard"
    );
  }

  if (onCadastro || onOnboarding) {
    return "/paciente/dashboard";
  }

  return null;
}
