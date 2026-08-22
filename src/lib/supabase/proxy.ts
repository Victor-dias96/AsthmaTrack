import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * Reads Supabase auth cookies from the incoming request, creates a server
 * client that can mutate those cookies, calls supabase.auth.getClaims() to
 * trigger a silent token refresh when the access token is near expiry, and
 * copies any updated Set-Cookie headers onto the returned NextResponse.
 *
 * This function does NOT redirect. Routing decisions belong to a separate
 * issue. Its only responsibility is session synchronisation.
 */
export async function updateSupabaseSession(
  request: NextRequest
): Promise<NextResponse> {
  // Start with a plain "pass-through" response that preserves the original
  // request headers so RSC and other internal Next.js headers reach the app.
  let supabaseResponse = NextResponse.next({ request });

  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Step 1: mirror the updated cookies onto the forwarded request so
        // that Server Components reading cookies() see the fresh values.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );

        // Step 2: rebuild the response so that request headers (including the
        // freshly mutated Cookie header) are propagated upstream.
        supabaseResponse = NextResponse.next({ request });

        // Step 3: write the Set-Cookie headers onto the outgoing response so
        // the browser receives and stores the refreshed tokens.
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Validate the authenticated identity.
  // getClaims() is preferred because it avoids a network round-trip; it reads
  // the JWT claims from the access token stored in the session cookie.
  // It also triggers a silent refresh when the token is near expiry.
  // Do NOT use getSession() here — it does not re-validate with the server.
  await supabase.auth.getClaims();

  return supabaseResponse;
}
