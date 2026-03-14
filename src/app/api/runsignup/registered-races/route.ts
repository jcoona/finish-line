import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  fetchRegisteredRaces,
  isTokenExpired,
  refreshAccessToken,
} from "@/lib/runsignup";
import { SESSION_COOKIE, getSession, updateSessionTokens } from "@/lib/session";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const session = getSession(sessionId);

  if (!session) {
    return NextResponse.json(
      { error: "Not connected to RunSignup." },
      { status: 401 },
    );
  }

  try {
    const usableTokens =
      isTokenExpired(session.tokens) && session.tokens.refresh_token
        ? await refreshAccessToken(session.tokens.refresh_token)
        : session.tokens;

    if (usableTokens !== session.tokens && sessionId) {
      updateSessionTokens(sessionId, usableTokens);
    }

    const payload = await fetchRegisteredRaces(usableTokens.access_token);

    return NextResponse.json(payload);
  } catch (caughtError) {
    return NextResponse.json(
      {
        error:
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to fetch registered races.",
      },
      { status: 500 },
    );
  }
}
