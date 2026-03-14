import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  fetchRegisteredRaces,
  isTokenExpired,
  refreshAccessToken,
} from "@/lib/runsignup";
import { enrichUserRaces } from "@/lib/enrichment";
import { SESSION_COOKIE, getSession, updateSessionTokens } from "@/lib/session";
import { syncRegisteredRacesToDb } from "@/lib/sync";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const session = getSession(sessionId);

  if (!session) {
    return NextResponse.redirect(new URL("/?sync_error=not_connected", request.url));
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
    const syncSummary = syncRegisteredRacesToDb(session.userId, payload);
    const enrichmentSummary = await enrichUserRaces(session.userId);
    const params = new URLSearchParams({
      synced: "1",
      races: String(syncSummary.racesUpserted),
      registrations: String(syncSummary.registrationsUpserted),
      racesUpdated: String(enrichmentSummary.racesUpdated),
      eventsNamed: String(enrichmentSummary.eventsNamed),
      resultsMatched: String(enrichmentSummary.resultsMatched),
      nameFallbackMatches: String(enrichmentSummary.nameFallbackMatches),
    });

    return NextResponse.redirect(new URL(`/?${params.toString()}`, request.url));
  } catch (caughtError) {
    const message =
      caughtError instanceof Error ? caughtError.message : "sync_failed";

    return NextResponse.redirect(
      new URL(`/?sync_error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
