const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return LOOPBACK_HOSTS.has(host);
}

function publishableKeyIsSecret(key: string): boolean {
  const normalized = key.trim().toLowerCase();
  const secretPrefix = ["sb", "secret"].join("_");
  const privilegedRole = ["service", "role"].join("_");
  return (
    normalized.startsWith(`${secretPrefix}_`) ||
    normalized.includes(privilegedRole)
  );
}

function hostedSupabaseUrlIsUnsafe(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return true;
  }

  if (
    parsed.username ||
    parsed.password ||
    parsed.search !== "" ||
    parsed.hash !== ""
  ) {
    return true;
  }

  return (
    parsed.protocol !== "https:" || isLoopbackHostname(parsed.hostname)
  );
}

function pageRequiresHostedSupabase(pageUrl: string | undefined): boolean {
  if (!pageUrl) {
    return false;
  }

  try {
    const page = new URL(pageUrl);
    return !isLoopbackHostname(page.hostname);
  } catch {
    return true;
  }
}

function deploymentRequiresHostedSupabase(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview"
  );
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set."
    );
  }

  if (publishableKeyIsSecret(key)) {
    throw new Error(
      "The Supabase publishable key is not browser-safe. Refusing to create a client."
    );
  }

  const pageUrl =
    typeof window === "undefined" ? undefined : window.location.href;

  if (
    (deploymentRequiresHostedSupabase() || pageRequiresHostedSupabase(pageUrl)) &&
    hostedSupabaseUrlIsUnsafe(url)
  ) {
    throw new Error(
      "This deployment must use the hosted HTTPS Supabase URL for its own environment. Local and non-HTTPS URLs are rejected."
    );
  }

  return { url, key };
}
