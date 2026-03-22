import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE, getSession } from "@/lib/session";
import { enrichUserRaces } from "@/lib/enrichment";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await getSession(sessionId);

  if (!session) {
    return NextResponse.redirect(new URL("/?sync_error=not_connected", request.url));
  }

  try {
    const summary = await enrichUserRaces(session.userId);
    const params = new URLSearchParams({
      enriched: "1",
      racesUpdated: String(summary.racesUpdated),
      eventsNamed: String(summary.eventsNamed),
      resultsMatched: String(summary.resultsMatched),
      nameFallbackMatches: String(summary.nameFallbackMatches),
    });

    return NextResponse.redirect(new URL(`/?${params.toString()}`, request.url));
  } catch (caughtError) {
    const message =
      caughtError instanceof Error ? caughtError.message : "enrichment_failed";

    return NextResponse.redirect(
      new URL(`/?sync_error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
