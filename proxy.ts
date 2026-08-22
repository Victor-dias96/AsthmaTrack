import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 Proxy — session synchronisation only.
 *
 * Responsibilities:
 *   - Refresh Supabase auth cookies on every application request.
 *   - Return the response that carries the refreshed Set-Cookie headers.
 *
 * Out of scope (to be handled in a later issue):
 *   - Redirecting unauthenticated users away from /paciente routes.
 *   - Redirecting authenticated users away from /login or /cadastro.
 */
export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
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
