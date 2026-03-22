import postgres from "postgres";

type SqlClient = ReturnType<typeof postgres>;

// Lazily initialized — the connection is created on first use, not at module load.
// This allows Next.js to build without DATABASE_URL (e.g. in demo mode or CI type-checks).
const globalForPg = globalThis as unknown as { _sql: SqlClient | undefined };

function getSql(): SqlClient {
  if (globalForPg._sql) {
    return globalForPg._sql;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is required. Add it to .env.local or your hosting environment.",
    );
  }

  const client = postgres(connectionString, {
    ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : false,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPg._sql = client;
  }

  return client;
}

// The target must be a function so tagged template literals (sql`...`) are callable.
export const sql = new Proxy((() => {}) as unknown as SqlClient, {
  get(_target, prop) {
    return (getSql() as unknown as Record<string | symbol, unknown>)[prop];
  },
  apply(_target, _this, args: unknown[]) {
    return (getSql() as unknown as (...args: unknown[]) => unknown)(...args);
  },
}) as SqlClient;

export async function getUser(userId: number): Promise<{ display_name: string } | null> {
  const rows = await sql`SELECT display_name FROM users WHERE id = ${userId}`;
  return (rows[0] as { display_name: string } | undefined) ?? null;
}

export async function upsertUser(providerUserId: string, displayName: string): Promise<number> {
  const rows = await sql`
    INSERT INTO users (provider, provider_user_id, display_name, created_at, updated_at)
    VALUES ('runsignup', ${providerUserId}, ${displayName}, now(), now())
    ON CONFLICT (provider, provider_user_id) DO UPDATE
      SET display_name = EXCLUDED.display_name,
          updated_at   = now()
    RETURNING id
  `;
  return (rows[0] as { id: number }).id;
}

export async function deleteUserData(userId: number): Promise<void> {
  // ON DELETE CASCADE on all child tables means this single delete cleans everything up.
  await sql`DELETE FROM users WHERE id = ${userId}`;
}
