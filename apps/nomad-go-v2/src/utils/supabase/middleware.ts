import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "@/utils/supabase/config";
import {
  canAccessAdmin,
  canAccessGuide,
  canAccessModerator,
  getPostLoginPath,
  getStaffHomePath,
  isGuideStaff,
  isModeratorOnlyStaff,
  usesDedicatedAppShell,
  isTouristAppPath,
} from "@/lib/auth/roles";
import { PROFILES_TABLE } from "@/lib/auth/profile";

const PUBLIC_PREFIXES = ["/login", "/signup"];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export const updateSession = async (request: NextRequest) => {
  const { url, publishableKey } = getSupabaseConfig();

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  let profileRole: string | undefined;

  if (user) {
    const { data: profile } = await supabase
      .from(PROFILES_TABLE)
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    profileRole = profile?.role ?? undefined;
  }

  if (user && isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = getPostLoginPath(profileRole);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && usesDedicatedAppShell(profileRole) && isTouristAppPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = getStaffHomePath(profileRole);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname.startsWith("/admin") && !canAccessAdmin(profileRole)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = isModeratorOnlyStaff(profileRole) ? "/moderator" : "/";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname.startsWith("/moderator") && !canAccessModerator(profileRole)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = isGuideStaff(profileRole) ? "/guide" : "/";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname.startsWith("/guide") && !canAccessGuide(profileRole)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = isModeratorOnlyStaff(profileRole)
      ? "/moderator"
      : canAccessAdmin(profileRole)
        ? "/admin"
        : "/";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
};
