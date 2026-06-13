import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Supabase email-confirmation callback (App Router route handler).
 *
 * Supports both server-side auth flows so it works regardless of how the
 * "Confirm signup" email template is configured in the Supabase dashboard:
 *  - Token-hash flow: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
 *    → verified with `supabase.auth.verifyOtp`.
 *  - PKCE code flow (default `{{ .ConfirmationURL }}` redirect): `?code=...`
 *    → verified with `supabase.auth.exchangeCodeForSession`.
 *
 * On success the session cookie is set and the user is redirected to `next`
 * (defaults to the dashboard). On failure we send them to login with a flag
 * so the UI can surface a calm, actionable message.
 */
function safeNext(raw: string | null): string {
  // Only allow internal, absolute paths to avoid open-redirects.
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();

  try {
    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (!error) {
        return NextResponse.redirect(new URL(next, origin));
      }
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, origin));
      }
    }
  } catch {
    /* fall through to the error redirect */
  }

  return NextResponse.redirect(
    new URL("/login?auth_error=email_confirmation", origin)
  );
}
