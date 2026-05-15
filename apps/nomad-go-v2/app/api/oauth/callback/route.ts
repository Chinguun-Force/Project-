import { NextRequest, NextResponse } from "next/server";
import { exchangeAuthCode, verifyAccessToken } from "@api/kimi/auth";
import { users as kimiUsers } from "@api/kimi/platform";
import { upsertUser } from "@api/queries/users";
import { signSessionToken } from "@api/kimi/session";
import { env } from "@api/lib/env";
import { getSessionCookieOptions } from "@api/lib/cookies";
import { Session } from "@contracts/constants";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    if (error === "access_denied") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.json({ error, error_description: errorDescription }, { status: 400 });
  }

  if (!code || !state) {
    return NextResponse.json({ error: "code and state are required" }, { status: 400 });
  }

  try {
    const redirectUri = atob(state);
    const tokenResp = await exchangeAuthCode(code, redirectUri);
    const { userId } = await verifyAccessToken(tokenResp.access_token);
    const userProfile = await kimiUsers.getProfile(tokenResp.access_token);
    
    if (!userProfile) {
      throw new Error("Failed to fetch user profile from Kimi Open");
    }

    await upsertUser({
      unionId: userId,
      name: userProfile.name,
      avatar: userProfile.avatar_url,
      lastSignInAt: new Date(),
    });

    const token = await signSessionToken({
      unionId: userId,
      clientId: env.appId,
    });

    const cookieStore = await cookies();
    const cookieOpts = getSessionCookieOptions(req.headers);
    
    cookieStore.set(Session.cookieName, token, {
      ...cookieOpts,
      maxAge: Session.maxAgeMs / 1000,
    } as any);

    return NextResponse.redirect(new URL("/", req.url));
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    return NextResponse.json({ error: "OAuth callback failed" }, { status: 500 });
  }
}
