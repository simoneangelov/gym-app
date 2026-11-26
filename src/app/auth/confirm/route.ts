import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the link in Supabase confirmation and password-reset emails (both
// PKCE `code` links and `token_hash` links). `next` picks where to land.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");
  // Only same-site paths, so the link can't bounce users to another domain.
  const safeNext = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;
  const next = type === "recovery" ? "/reset-password" : (safeNext ?? "/");
  const supabase = await createClient();

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  }

  if (!ok) {
    const failed = next === "/reset-password" ? "/login/forgot?expired=1" : "/login";
    return NextResponse.redirect(new URL(failed, origin));
  }
  return NextResponse.redirect(new URL(next, origin));
}
