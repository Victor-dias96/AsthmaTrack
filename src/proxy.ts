import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 Proxy — session synchronisation only.
 *
 * Responsibilities:
 *   - Refresh Supabase auth cookies on every application request.
 *   - Protect /paciente routes by redirecting unauthenticated users to /login.
 *   - Return the response that carries the refreshed Set-Cookie headers.
 *
 * Out of scope (to be handled in a later issue):
 *   - Redirecting authenticated users away from /login or /cadastro.
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse, isAuthenticated } = await updateSupabaseSession(
    request
  );

  // Protect private patient routes
  if (
    !isAuthenticated &&
    request.nextUrl.pathname.startsWith("/paciente")
  ) {
    const loginUrl = new URL("/login", request.url);
    // Safely preserve the original path and query as a relative URL
    loginUrl.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search
    );

    // Create a redirect response
    const redirectResponse = NextResponse.redirect(loginUrl);

    // IMPORTANT: Preserve refreshed cookies from the updateSupabaseSession call
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  return supabaseResponse;
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
