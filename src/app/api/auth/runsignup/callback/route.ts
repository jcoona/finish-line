import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  exchangeCodeForTokens,
  fetchCurrentUser,
  fetchRegisteredRaces,
} from "@/lib/runsignup";
import { enrichUserRaces } from "@/lib/enrichment";
import { SESSION_COOKIE, createSession } from "@/lib/session";
import { upsertUser } from "@/lib/db";
import { syncRegisteredRacesToDb } from "@/lib/sync";

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
    const runsignupUser = await fetchCurrentUser(tokens.access_token);
    const userId = await upsertUser(
      String(runsignupUser.user_id),
      `${runsignupUser.first_name} ${runsignupUser.last_name}`,
    );
    const sessionId = await createSession(tokens, userId);

    const payload = await fetchRegisteredRaces(tokens.access_token);
    const syncSummary = await syncRegisteredRacesToDb(userId, payload);
    const enrichmentSummary = await enrichUserRaces(userId);
    const params = new URLSearchParams({
      synced: "1",
      races: String(syncSummary.racesUpserted),
      registrations: String(syncSummary.registrationsUpserted),
      racesUpdated: String(enrichmentSummary.racesUpdated),
      eventsNamed: String(enrichmentSummary.eventsNamed),
      resultsMatched: String(enrichmentSummary.resultsMatched),
      nameFallbackMatches: String(enrichmentSummary.nameFallbackMatches),
    });

    const response = NextResponse.redirect(new URL(`/?${params.toString()}`, request.url));

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
