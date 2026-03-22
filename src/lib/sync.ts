import { sql } from "@/lib/db";

type NormalizedRegisteredRace = {
  runsignupRaceId: string;
  name: string;
  url: string | null;
  city: string | null;
  state: string | null;
  registrationId: string | null;
  eventId: string | null;
  eventName: string | null;
  status: string | null;
  bib: string | null;
  rawPayload: unknown;
};

type SyncSummary = {
  candidatesFound: number;
  racesUpserted: number;
  registrationsUpserted: number;
};

export async function syncRegisteredRacesToDb(
  userId: number,
  payload: unknown,
): Promise<SyncSummary> {
  const candidates = extractRegisteredRaceCandidates(payload);
  let racesUpserted = 0;
  let registrationsUpserted = 0;

  await sql.begin(async (txSql) => {
    const sql = txSql as unknown as typeof import("@/lib/db").sql;
    for (const candidate of candidates) {
      const raceRows = await sql`
        INSERT INTO races (
          runsignup_race_id, name, start_date, url, location_city, location_state, raw_payload, synced_at
        ) VALUES (
          ${candidate.runsignupRaceId},
          ${candidate.name},
          ${null},
          ${candidate.url},
          ${candidate.city},
          ${candidate.state},
          ${sql.json(JSON.parse(JSON.stringify(candidate.rawPayload)))},
          now()
        )
        ON CONFLICT (runsignup_race_id) DO UPDATE SET
          name           = EXCLUDED.name,
          start_date     = EXCLUDED.start_date,
          url            = EXCLUDED.url,
          location_city  = EXCLUDED.location_city,
          location_state = EXCLUDED.location_state,
          raw_payload    = EXCLUDED.raw_payload,
          synced_at      = EXCLUDED.synced_at
        RETURNING id
      `;

      const raceId = (raceRows[0] as { id: number } | undefined)?.id;

      if (raceId == null) {
        continue;
      }

      racesUpserted += 1;

      await sql`
        INSERT INTO registrations (
          user_id, race_id, runsignup_registration_id, runsignup_event_id,
          event_name, status, bib, raw_payload, synced_at, event_start_time
        ) VALUES (
          ${userId},
          ${raceId},
          ${candidate.registrationId},
          ${candidate.eventId},
          ${candidate.eventName},
          ${candidate.status},
          ${candidate.bib},
          ${sql.json(JSON.parse(JSON.stringify(candidate.rawPayload)))},
          now(),
          ${null}
        )
        ON CONFLICT (user_id, race_id, runsignup_registration_id) DO UPDATE SET
          runsignup_event_id = EXCLUDED.runsignup_event_id,
          event_name         = EXCLUDED.event_name,
          status             = EXCLUDED.status,
          bib                = EXCLUDED.bib,
          raw_payload        = EXCLUDED.raw_payload,
          synced_at          = EXCLUDED.synced_at,
          event_start_time   = EXCLUDED.event_start_time
      `;

      registrationsUpserted += 1;
    }

    await sql`
      INSERT INTO sync_runs (user_id, type, status, summary_json, created_at)
      VALUES (
        ${userId},
        'registered-races',
        'success',
        ${sql.json({ candidatesFound: candidates.length, racesUpserted, registrationsUpserted })},
        now()
      )
    `;
  });

  return {
    candidatesFound: candidates.length,
    racesUpserted,
    registrationsUpserted,
  };
}

export async function getSyncedRaces(userId: number) {
  const rows = await sql`
    SELECT
      races.id,
      races.runsignup_race_id,
      races.name,
      races.start_date,
      races.url,
      races.location_city,
      races.location_state,
      races.synced_at,
      registrations.runsignup_registration_id,
      registrations.runsignup_event_id,
      registrations.event_name,
      registrations.event_start_time,
      registrations.status,
      registrations.bib,
      results.chip_time,
      results.pace,
      results.place,
      results.result_set_name
    FROM registrations
    INNER JOIN races ON races.id = registrations.race_id
    LEFT JOIN results
      ON results.user_id = registrations.user_id
     AND results.registration_id = NULLIF(registrations.runsignup_registration_id, '')::BIGINT
     AND results.event_id = NULLIF(registrations.runsignup_event_id, '')::BIGINT
    WHERE registrations.user_id = ${userId}
    ORDER BY COALESCE(registrations.event_start_time, races.start_date, '') DESC, races.name ASC
  `;

  return rows as unknown as Array<{
    id: number;
    runsignup_race_id: string;
    name: string;
    start_date: string | null;
    url: string | null;
    location_city: string | null;
    location_state: string | null;
    synced_at: string;
    runsignup_registration_id: string | null;
    runsignup_event_id: string | null;
    event_name: string | null;
    event_start_time: string | null;
    status: string | null;
    bib: string | null;
    chip_time: string | null;
    pace: string | null;
    place: string | null;
    result_set_name: string | null;
  }>;
}

export async function getLatestSyncRun(userId: number) {
  const rows = await sql`
    SELECT created_at, summary_json
    FROM sync_runs
    WHERE user_id = ${userId} AND type = 'registered-races'
    ORDER BY id DESC
    LIMIT 1
  `;

  const row = rows[0] as { created_at: string; summary_json: unknown } | undefined;

  if (!row) {
    return null;
  }

  return {
    createdAt: row.created_at,
    summary: row.summary_json ?? null,
  };
}

function extractRegisteredRaceCandidates(payload: unknown) {
  const seen = new Set<string>();
  const candidates: NormalizedRegisteredRace[] = [];

  walkPayload(payload, (value) => {
    const candidate = normalizeCandidate(value);

    if (!candidate) {
      return;
    }

    const key = [
      candidate.runsignupRaceId,
      candidate.registrationId ?? "none",
      candidate.eventId ?? "none",
    ].join(":");

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    candidates.push(candidate);
  });

  return candidates;
}

function walkPayload(value: unknown, visit: (value: unknown) => void) {
  visit(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      walkPayload(item, visit);
    }
    return;
  }

  if (value && typeof value === "object") {
    for (const child of Object.values(value)) {
      walkPayload(child, visit);
    }
  }
}

function normalizeCandidate(value: unknown): NormalizedRegisteredRace | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const obj = value as Record<string, unknown>;

  if (
    (typeof obj.registration_id === "string" || typeof obj.registration_id === "number") &&
    (typeof obj.race_id === "string" || typeof obj.race_id === "number")
  ) {
    const raceId = pickString(obj.race_id);

    if (!raceId) {
      return null;
    }

    return {
      runsignupRaceId: raceId,
      name: `RunSignup Race ${raceId}`,
      url: raceId ? `https://runsignup.com/Race/${raceId}` : null,
      city: null,
      state: null,
      registrationId: pickString(obj.registration_id),
      eventId: pickString(obj.event_id),
      eventName: pickString(obj.event_name) ?? pickString(obj.event_id, "Event pending"),
      status: pickString(obj.status) ?? "registered",
      bib: pickString(obj.bib, obj.bib_num),
      rawPayload: value,
    };
  }

  const raceObject = asRecord(obj.race) ?? obj;
  const registrationObject = asRecord(obj.registration) ?? obj;
  const eventObject = asRecord(obj.event) ?? asRecord(registrationObject.event);

  const raceId = pickString(
    raceObject.race_id,
    raceObject.id,
    obj.race_id,
    registrationObject.race_id,
  );
  const raceName = pickString(
    raceObject.name,
    raceObject.race_name,
    obj.race_name,
    obj.name,
  );

  if (!raceId || !raceName) {
    return null;
  }

  return {
    runsignupRaceId: raceId,
    name: raceName,
    url: pickString(raceObject.url, raceObject.race_url, obj.url, obj.race_url),
    city: pickString(
      raceObject.city,
      raceObject.location_city,
      asRecord(raceObject.address)?.city,
    ),
    state: pickString(
      raceObject.state,
      raceObject.location_state,
      asRecord(raceObject.address)?.state,
    ),
    registrationId: pickString(
      registrationObject.registration_id,
      obj.registration_id,
    ),
    eventId: pickString(
      eventObject?.event_id,
      eventObject?.id,
      registrationObject.event_id,
      obj.event_id,
    ),
    eventName: pickString(
      eventObject?.name,
      registrationObject.event_name,
      obj.event_name,
    ),
    status: pickString(
      registrationObject.registration_status,
      registrationObject.status,
      obj.status,
    ),
    bib: pickString(registrationObject.bib_num, registrationObject.bib, obj.bib),
    rawPayload: value,
  };
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return null;
}
