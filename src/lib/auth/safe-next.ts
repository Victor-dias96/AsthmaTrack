const MAX_NEXT_LENGTH = 2048;
const DUMMY_ORIGIN = "https://asthmatrack.local";

function fullyDecode(value: string): string | null {
  let current = value;

  for (let i = 0; i < 5; i += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) {
        return current;
      }
      current = decoded;
    } catch {
      return null;
    }
  }

  return null;
}

function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

/**
 * Accepts a post-login `next` value only when it is a local relative path.
 * Rejects protocol-relative, absolute, encoded-external, and auth-entry destinations.
 */
export function getSafeNextPath(
  raw: string | null | undefined,
  options: { onboardingCompleted: boolean }
): string | null {
  if (
    typeof raw !== "string" ||
    raw.length === 0 ||
    raw.length > MAX_NEXT_LENGTH
  ) {
    return null;
  }

  const decoded = fullyDecode(raw);
  if (decoded === null) {
    return null;
  }

  if (
    decoded.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(decoded) ||
    decoded.includes("://")
  ) {
    return null;
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return null;
  }

  const pathPart = decoded.split("?", 1)[0];
  if (/\s/.test(pathPart)) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(decoded, DUMMY_ORIGIN);
  } catch {
    return null;
  }

  if (url.origin !== DUMMY_ORIGIN || url.protocol !== "https:") {
    return null;
  }

  if (url.username || url.password) {
    return null;
  }

  const pathname = url.pathname;
  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    return null;
  }

  if (
    matchesRoute(pathname, "/login") ||
    matchesRoute(pathname, "/cadastro") ||
    (options.onboardingCompleted && matchesRoute(pathname, "/onboarding"))
  ) {
    return null;
  }

  return pathname + url.search;
}
