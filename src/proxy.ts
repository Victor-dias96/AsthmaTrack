import { NextResponse, type NextRequest } from "next/server";
import {
  isAuthenticatedAuthRoute,
  resolveAuthRedirect,
} from "@/lib/auth/resolve-auth-redirect";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 Proxy — session synchronisation and auth routing.
 *
 * Responsibilities:
 *   - Refresh Supabase auth cookies on every application request.
 *   - Protect /paciente routes by redirecting unauthenticated users to /login.
 *   - Redirect authenticated users away from /login, /cadastro, and (when
 *     onboarding is complete) /onboarding.
 *   - Return the response that carries the refreshed Set-Cookie headers.
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse, isAuthenticated, supabase } =
    await updateSupabaseSession(request);
  const pathname = request.nextUrl.pathname;

  // Protect private patient routes
  if (!isAuthenticated && pathname.startsWith("/paciente")) {
    const loginUrl = new URL("/login", request.url);
    // Safely preserve the original path and query as a relative URL
    loginUrl.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search
    );

    return redirectWithRefreshedCookies(loginUrl, supabaseResponse);
  }

  if (isAuthenticated && isAuthenticatedAuthRoute(pathname)) {
    const { data } = await supabase
      .from("profiles")
      .select("role, onboarding_completed")
      .maybeSingle();

    const destination = resolveAuthRedirect({
      pathname,
      next: request.nextUrl.searchParams.get("next"),
      profile: data,
    });

    if (destination && destination !== pathname) {
      return redirectWithRefreshedCookies(
        new URL(destination, request.url),
        supabaseResponse
      );
    }
  }

  return supabaseResponse;
}

function redirectWithRefreshedCookies(
  location: URL,
  supabaseResponse: NextResponse
) {
  const redirectResponse = NextResponse.redirect(location);

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *   - _next/static  (bundled JS/CSS assets)
     *   - _next/image   (image optimisation pipeline)
     *   - favicon.ico, sitemap.xml, robots.txt (metadata files)
     *   - common static image extensions (.png, .jpg, .jpeg, .gif, .svg, .webp, .ico)
     *
     * This keeps every application route (/, /login, /cadastro, /paciente/*)
     * covered without accidentally blocking asset delivery.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
