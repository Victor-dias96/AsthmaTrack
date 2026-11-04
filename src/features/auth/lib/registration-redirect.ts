const MAX_ORIGIN_LENGTH = 2048;
const CONFIRMATION_PATH = "/login";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/**
 * Builds the email-confirmation redirect from the browser origin.
 * Hosted HTTP origins are rejected. The path stays on /login so a
 * confirmation link does not enter the password-recovery callback.
 */
export function registrationConfirmationRedirect(
  origin: string
): string | null {
  if (
    typeof origin !== "string" ||
    origin.length === 0 ||
    origin.length > MAX_ORIGIN_LENGTH ||
    origin.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(origin)
  ) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return null;
  }

  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search !== "" ||
    url.hash !== "" ||
    url.origin === "null" ||
    !url.hostname ||
    url.hostname.includes("*")
  ) {
    return null;
  }

  if (url.protocol === "http:") {
    if (!LOOPBACK_HOSTS.has(url.hostname)) {
      return null;
    }
  } else if (url.protocol !== "https:") {
    return null;
  }

  return `${url.origin}${CONFIRMATION_PATH}`;
}
