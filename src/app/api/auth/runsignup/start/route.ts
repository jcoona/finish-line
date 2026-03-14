import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  buildAuthorizationUrl,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  getMissingEnvVars,
} from "@/lib/runsignup";

export async function GET() {
  const missingEnvVars = getMissingEnvVars();

  if (missingEnvVars.length > 0) {
    return NextResponse.json(
      {
        error: "Missing required RunSignup environment variables.",
        missingEnvVars,
      },
      { status: 500 },
    );
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const cookieStore = await cookies();

  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  cookieStore.set(OAUTH_VERIFIER_COOKIE, codeVerifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return NextResponse.redirect(buildAuthorizationUrl(state, codeChallenge));
}
