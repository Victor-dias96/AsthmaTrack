import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RESET_PATH = "/redefinir-senha";

function redirectToReset(request: NextRequest) {
  const destination = request.nextUrl.clone();
  destination.pathname = RESET_PATH;
  destination.search = "";
  destination.hash = "";
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const tokenHash = request.nextUrl.searchParams.get("token_hash");
    const type = request.nextUrl.searchParams.get("type");
    const flowId = request.nextUrl.searchParams.get("sb_flow_id");

    const supabase = await createClient();

    if (code) {
      await supabase.auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined
      );
    } else if (tokenHash && type === "recovery") {
      await supabase.auth.verifyOtp({
        type: "recovery",
        token_hash: tokenHash,
      });
    }
  } catch {
    // Missing configuration or unexpected Auth failure — show the invalid-link
    // state on /redefinir-senha without exposing internals.
  }

  return redirectToReset(request);
}
