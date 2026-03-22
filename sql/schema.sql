-- Finish Line schema for PostgreSQL
-- Run this once against a fresh database to initialize all tables.

CREATE TABLE IF NOT EXISTS users (
  id          BIGSERIAL PRIMARY KEY,
  provider    TEXT        NOT NULL,
  provider_user_id TEXT,
  display_name TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS oauth_sessions (
  id               TEXT        PRIMARY KEY,
  user_id          BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  encrypted_tokens TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS races (
  id                  BIGSERIAL   PRIMARY KEY,
  runsignup_race_id   TEXT        NOT NULL UNIQUE,
  name                TEXT        NOT NULL,
  start_date          TEXT,
  url                 TEXT,
  location_city       TEXT,
  location_state      TEXT,
  raw_payload         JSONB       NOT NULL,
  synced_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registrations (
  id                           BIGSERIAL   PRIMARY KEY,
  user_id                      BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  race_id                      BIGINT      NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  runsignup_registration_id    TEXT,
  runsignup_event_id           TEXT,
  event_name                   TEXT,
  event_start_time             TEXT,
  status                       TEXT,
  bib                          TEXT,
  raw_payload                  JSONB       NOT NULL,
  synced_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, race_id, runsignup_registration_id)
);

CREATE TABLE IF NOT EXISTS results (
  id               BIGSERIAL   PRIMARY KEY,
  user_id          BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  race_id          BIGINT      NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  registration_id  BIGINT,
  event_id         BIGINT,
  result_id        BIGINT,
  result_set_id    BIGINT,
  result_set_name  TEXT,
  place            TEXT,
  gender_place     TEXT,
  division_place   TEXT,
  chip_time        TEXT,
  gun_time         TEXT,
  pace             TEXT,
  raw_payload      JSONB       NOT NULL,
  synced_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, registration_id, event_id)
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id           BIGSERIAL   PRIMARY KEY,
  user_id      BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL,
  status       TEXT        NOT NULL,
  summary_json JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes to support common query patterns
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_user_id    ON oauth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id     ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_race_id     ON registrations(race_id);
CREATE INDEX IF NOT EXISTS idx_results_user_id           ON results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_race_id           ON results(race_id);
CREATE INDEX IF NOT EXISTS idx_results_registration_id   ON results(registration_id);
CREATE INDEX IF NOT EXISTS idx_sync_runs_user_id         ON sync_runs(user_id);
