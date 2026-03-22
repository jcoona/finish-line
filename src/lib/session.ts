import { randomUUID } from "node:crypto";

import { encryptJson, decryptJson } from "@/lib/crypto";
import { sql } from "@/lib/db";
import type { RunSignupTokens } from "@/lib/runsignup";

export const SESSION_COOKIE = "finish_line_session_id";

type StoredSessionRow = {
  id: string;
  user_id: number;
  encrypted_tokens: string;
  created_at: string;
  updated_at: string;
};

export async function createSession(tokens: RunSignupTokens, userId: number): Promise<string> {
  const id = randomUUID();

  await sql`
    INSERT INTO oauth_sessions (id, user_id, encrypted_tokens, created_at, updated_at)
    VALUES (${id}, ${userId}, ${encryptJson(tokens)}, now(), now())
  `;

  return id;
}

export async function getSession(sessionId: string | undefined) {
  if (!sessionId) {
    return null;
  }

  const rows = await sql`
    SELECT id, user_id, encrypted_tokens, created_at, updated_at
    FROM oauth_sessions
    WHERE id = ${sessionId}
  `;

  const row = rows[0] as StoredSessionRow | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    tokens: decryptJson<RunSignupTokens>(row.encrypted_tokens),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function updateSessionTokens(sessionId: string, tokens: RunSignupTokens): Promise<void> {
  await sql`
    UPDATE oauth_sessions
    SET encrypted_tokens = ${encryptJson(tokens)}, updated_at = now()
    WHERE id = ${sessionId}
  `;
}

export async function deleteSession(sessionId: string | undefined): Promise<void> {
  if (!sessionId) {
    return;
  }

  await sql`DELETE FROM oauth_sessions WHERE id = ${sessionId}`;
}
