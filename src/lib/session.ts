import { randomUUID } from "node:crypto";

import { encryptJson, decryptJson } from "@/lib/crypto";
import { db } from "@/lib/db";
import type { RunSignupTokens } from "@/lib/runsignup";

export const SESSION_COOKIE = "finish_line_session_id";

type StoredSessionRow = {
  id: string;
  user_id: number;
  encrypted_tokens: string;
  created_at: string;
  updated_at: string;
};

export function createSession(tokens: RunSignupTokens, userId: number) {
  const id = randomUUID();
  const timestamp = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO oauth_sessions (id, user_id, encrypted_tokens, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `,
  ).run(id, userId, encryptJson(tokens), timestamp, timestamp);

  return id;
}

export function getSession(sessionId: string | undefined) {
  if (!sessionId) {
    return null;
  }

  const row = db
    .prepare(
      `
        SELECT id, user_id, encrypted_tokens, created_at, updated_at
        FROM oauth_sessions
        WHERE id = ?
      `,
    )
    .get(sessionId) as StoredSessionRow | undefined;

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

export function updateSessionTokens(sessionId: string, tokens: RunSignupTokens) {
  db.prepare(
    `
      UPDATE oauth_sessions
      SET encrypted_tokens = ?, updated_at = ?
      WHERE id = ?
    `,
  ).run(encryptJson(tokens), new Date().toISOString(), sessionId);
}

export function deleteSession(sessionId: string | undefined) {
  if (!sessionId) {
    return;
  }

  db.prepare(`DELETE FROM oauth_sessions WHERE id = ?`).run(sessionId);
}
