import { NextResponse } from "next/server";

import { deleteUserData } from "@/lib/db";
import { OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE } from "@/lib/runsignup";
import { SESSION_COOKIE, deleteSession, getSession } from "@/lib/session";

export async function POST(request: Request) {
  const sessionId = request.headers
    .get("cookie")
    ?.match(/finish_line_session_id=([^;]+)/)?.[1];
  const response = NextResponse.redirect(new URL("/", request.url));

  const session = getSession(sessionId);
  if (session) {
    deleteUserData(session.userId);
  } else {
    deleteSession(sessionId);
  }

  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_VERIFIER_COOKIE);

  return response;
}
