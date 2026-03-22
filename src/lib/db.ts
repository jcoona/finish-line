import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const defaultDbPath = path.join(process.cwd(), "data", "finish-line.db");
const dbPath = process.env.FINISH_LINE_DB_PATH?.trim() || defaultDbPath;

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,
    provider_user_id TEXT,
    display_name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS oauth_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    encrypted_tokens TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS races (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    runsignup_race_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    start_date TEXT,
    url TEXT,
    location_city TEXT,
    location_state TEXT,
    raw_payload TEXT NOT NULL,
    synced_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    race_id INTEGER NOT NULL,
    runsignup_registration_id TEXT,
    runsignup_event_id TEXT,
    event_name TEXT,
    status TEXT,
    bib TEXT,
    raw_payload TEXT NOT NULL,
    synced_at TEXT NOT NULL,
    UNIQUE (user_id, race_id, runsignup_registration_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (race_id) REFERENCES races(id)
  );

  CREATE TABLE IF NOT EXISTS sync_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    summary_json TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    race_id INTEGER NOT NULL,
    registration_id INTEGER,
    event_id INTEGER,
    result_id INTEGER,
    result_set_id INTEGER,
    result_set_name TEXT,
    place TEXT,
    gender_place TEXT,
    division_place TEXT,
    chip_time TEXT,
    gun_time TEXT,
    pace TEXT,
    raw_payload TEXT NOT NULL,
    synced_at TEXT NOT NULL,
    UNIQUE (user_id, registration_id, event_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (race_id) REFERENCES races(id)
  );
`);

ensureColumn("registrations", "event_start_time", "TEXT");

export function getUser(userId: number): { display_name: string } | null {
  return (
    (db
      .prepare(`SELECT display_name FROM users WHERE id = ?`)
      .get(userId) as { display_name: string } | undefined) ?? null
  );
}

export function upsertUser(providerUserId: string, displayName: string): number {
  const now = new Date().toISOString();
  const existing = db
    .prepare(`SELECT id FROM users WHERE provider = 'runsignup' AND provider_user_id = ?`)
    .get(providerUserId) as { id: number } | undefined;

  if (existing) {
    db.prepare(`UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?`).run(
      displayName,
      now,
      existing.id,
    );
    return existing.id;
  }

  const result = db
    .prepare(
      `INSERT INTO users (provider, provider_user_id, display_name, created_at, updated_at)
       VALUES ('runsignup', ?, ?, ?, ?)`,
    )
    .run(providerUserId, displayName, now, now);

  return result.lastInsertRowid as number;
}

export function deleteUserData(userId: number) {
  const raceIds = (
    db.prepare(`SELECT DISTINCT race_id FROM registrations WHERE user_id = ?`).all(userId) as { race_id: number }[]
  ).map((r) => r.race_id);

  db.prepare(`DELETE FROM results WHERE user_id = ?`).run(userId);
  db.prepare(`DELETE FROM registrations WHERE user_id = ?`).run(userId);
  db.prepare(`DELETE FROM sync_runs WHERE user_id = ?`).run(userId);
  db.prepare(`DELETE FROM oauth_sessions WHERE user_id = ?`).run(userId);
  db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);

  if (raceIds.length > 0) {
    db.prepare(`DELETE FROM races WHERE id IN (${raceIds.map(() => "?").join(",")})`).run(...raceIds);
  }
}

function ensureColumn(tableName: string, columnName: string, columnDefinition: string) {
  const columns = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{ name: string }>;

  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
}
