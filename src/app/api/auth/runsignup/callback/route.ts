import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  exchangeCodeForTokens,
} from "@/lib/runsignup";
import { SESSION_COOKIE, createSession } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  const codeVerifier = cookieStore.get(OAUTH_VERIFIER_COOKIE)?.value;

  if (error) {
    return NextResponse.redirect(
      new URL(`/?oauth_error=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!code || !state || !expectedState || state !== expectedState || !codeVerifier) {
    return NextResponse.redirect(
      new URL("/?oauth_error=invalid_callback_state", request.url),
    );
  }

  try {
    const tokens = await exchangeCodeForTokens({ code, codeVerifier });
    const sessionId = createSession(tokens);
    const response = NextResponse.redirect(new URL("/?connected=1", request.url));

    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.delete(OAUTH_VERIFIER_COOKIE);

    return response;
  } catch (caughtError) {
    const message =
      caughtError instanceof Error ? caughtError.message : "token_exchange_failed";

    return NextResponse.redirect(
      new URL(`/?oauth_error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
