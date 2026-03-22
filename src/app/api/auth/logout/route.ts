import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { deleteUserData } from "@/lib/db";
import { OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE } from "@/lib/runsignup";
import { SESSION_COOKIE, deleteSession, getSession } from "@/lib/session";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const response = NextResponse.redirect(new URL("/", request.url));

  const session = await getSession(sessionId);
  if (session) {
    await deleteUserData(session.userId);
  } else {
    await deleteSession(sessionId);
  }

  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_VERIFIER_COOKIE);

  return response;
}
