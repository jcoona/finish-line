import { db } from "@/lib/db";
import { fetchEventResults, fetchRaceDetails } from "@/lib/runsignup";

type RegistrationRow = {
  registration_row_id: number;
  race_row_id: number;
  runsignup_race_id: string;
  runsignup_event_id: string | null;
  runsignup_registration_id: string | null;
};

type EnrichmentSummary = {
  racesUpdated: number;
  eventsNamed: number;
  resultsMatched: number;
  nameFallbackMatches: number;
};

export async function enrichUserRaces(userId: number): Promise<EnrichmentSummary> {
  const registrations = db
    .prepare(
      `
        SELECT
          registrations.id AS registration_row_id,
          registrations.race_id AS race_row_id,
          registrations.runsignup_event_id,
          registrations.runsignup_registration_id,
          races.runsignup_race_id
        FROM registrations
        INNER JOIN races ON races.id = registrations.race_id
        WHERE registrations.user_id = ?
        ORDER BY registrations.id ASC
      `,
    )
    .all(userId) as RegistrationRow[];

  const seenRaceIds = new Set<string>();
  const raceCache = new Map<string, unknown>();
  let racesUpdated = 0;
  let eventsNamed = 0;
  let resultsMatched = 0;
  let nameFallbackMatches = 0;
  let athleteIdentity: { firstName: string; lastName: string } | null = null;

  const updateRace = db.prepare(
    `
      UPDATE races
      SET name = ?, start_date = ?, url = ?, location_city = ?, location_state = ?, raw_payload = ?, synced_at = ?
      WHERE id = ?
    `,
  );

  const updateRegistrationEvent = db.prepare(
    `
      UPDATE registrations
      SET event_name = ?, event_start_time = ?, raw_payload = ?, synced_at = ?
      WHERE id = ?
    `,
  );

  const upsertResult = db.prepare(
    `
      INSERT INTO results (
        user_id, race_id, registration_id, event_id, result_id, result_set_id, result_set_name,
        place, gender_place, division_place, chip_time, gun_time, pace, raw_payload, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, registration_id, event_id) DO UPDATE SET
        result_id = excluded.result_id,
        result_set_id = excluded.result_set_id,
        result_set_name = excluded.result_set_name,
        place = excluded.place,
        gender_place = excluded.gender_place,
        division_place = excluded.division_place,
        chip_time = excluded.chip_time,
        gun_time = excluded.gun_time,
        pace = excluded.pace,
        raw_payload = excluded.raw_payload,
        synced_at = excluded.synced_at
    `,
  );

  for (const registration of registrations) {
    let raceDetails = raceCache.get(registration.runsignup_race_id);

    if (!raceDetails) {
      raceDetails = await fetchRaceDetails(registration.runsignup_race_id);
      raceCache.set(registration.runsignup_race_id, raceDetails);
    }

    const raceObject = asRecord(asRecord(raceDetails)?.race);

    if (raceObject && !seenRaceIds.has(registration.runsignup_race_id)) {
      updateRace.run(
        pickString(raceObject.name) ?? `RunSignup Race ${registration.runsignup_race_id}`,
        pickString(raceObject.next_date, raceObject.last_date),
        pickString(raceObject.url),
        pickString(asRecord(raceObject.address)?.city),
        pickString(asRecord(raceObject.address)?.state),
        JSON.stringify(raceDetails),
        new Date().toISOString(),
        registration.race_row_id,
      );
      seenRaceIds.add(registration.runsignup_race_id);
      racesUpdated += 1;
    }

    const eventObject = findEvent(raceObject, registration.runsignup_event_id);

    if (eventObject) {
      updateRegistrationEvent.run(
        pickString(eventObject.name) ?? pickString(registration.runsignup_event_id),
        pickString(eventObject.start_time),
        JSON.stringify(eventObject),
        new Date().toISOString(),
        registration.registration_row_id,
      );
      eventsNamed += 1;
    }

    if (!registration.runsignup_event_id || !registration.runsignup_registration_id) {
      continue;
    }

    const resultsPayload = await fetchEventResults(
      registration.runsignup_race_id,
      registration.runsignup_event_id,
      { registration_id: registration.runsignup_registration_id },
    );
    const matchedResult = findResultForRegistration(
      resultsPayload,
      registration.runsignup_registration_id,
    );

    if (matchedResult) {
      upsertResult.run(
        userId,
        registration.race_row_id,
        parseInteger(registration.runsignup_registration_id),
        parseInteger(registration.runsignup_event_id),
        parseInteger(matchedResult.result.result_id),
        parseInteger(matchedResult.resultSet.individual_result_set_id),
        pickString(matchedResult.resultSet.individual_result_set_name),
        pickString(matchedResult.result.place),
        pickString(matchedResult.result.gender_place),
        pickString(matchedResult.result.division_place),
        pickString(matchedResult.result.chip_time, matchedResult.result.clock_time),
        pickString(matchedResult.result.gun_time, matchedResult.result.clock_time),
        pickString(matchedResult.result.pace),
        JSON.stringify(matchedResult.result),
        new Date().toISOString(),
      );
      resultsMatched += 1;
      athleteIdentity = inferIdentityFromResult(matchedResult.result) ?? athleteIdentity;
      continue;
    }

    if (!athleteIdentity) {
      continue;
    }

    const fallbackPayload = await fetchEventResults(
      registration.runsignup_race_id,
      registration.runsignup_event_id,
      {
        first_name: athleteIdentity.firstName,
        last_name: athleteIdentity.lastName,
      },
    );
    const fallbackMatch = findUniqueResultByName(
      fallbackPayload,
      athleteIdentity.firstName,
      athleteIdentity.lastName,
    );

    if (!fallbackMatch) {
      continue;
    }

    upsertResult.run(
      userId,
      registration.race_row_id,
      parseInteger(registration.runsignup_registration_id),
      parseInteger(registration.runsignup_event_id),
      parseInteger(fallbackMatch.result.result_id),
      parseInteger(fallbackMatch.resultSet.individual_result_set_id),
      pickString(fallbackMatch.resultSet.individual_result_set_name),
      pickString(fallbackMatch.result.place),
      pickString(fallbackMatch.result.gender_place),
      pickString(fallbackMatch.result.division_place),
      pickString(fallbackMatch.result.chip_time, fallbackMatch.result.clock_time),
      pickString(fallbackMatch.result.gun_time, fallbackMatch.result.clock_time),
      pickString(fallbackMatch.result.pace),
      JSON.stringify(fallbackMatch.result),
      new Date().toISOString(),
    );
    resultsMatched += 1;
    nameFallbackMatches += 1;
  }

  db.prepare(
    `
      INSERT INTO sync_runs (user_id, type, status, summary_json, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
  ).run(
    userId,
    "enrich-races",
    "success",
    JSON.stringify({ racesUpdated, eventsNamed, resultsMatched, nameFallbackMatches }),
    new Date().toISOString(),
  );

  return { racesUpdated, eventsNamed, resultsMatched, nameFallbackMatches };
}

function findEvent(raceObject: Record<string, unknown> | null, eventId: string | null) {
  const events = Array.isArray(raceObject?.events) ? raceObject.events : [];

  return (
    events.find((event) => {
      const eventObject = asRecord(event);

      return pickString(eventObject?.event_id) === eventId;
    }) ?? null
  );
}

function findResultForRegistration(payload: unknown, registrationId: string) {
  const uniqueFilteredResult = findSingleResult(payload);

  if (uniqueFilteredResult) {
    return uniqueFilteredResult;
  }

  const resultSets = Array.isArray(asRecord(payload)?.individual_results_sets)
    ? (asRecord(payload)?.individual_results_sets as unknown[])
    : [];

  for (const resultSetValue of resultSets) {
    const resultSet = asRecord(resultSetValue);
    const results = Array.isArray(resultSet?.results) ? resultSet.results : [];

    for (const resultValue of results) {
      const result = asRecord(resultValue);

      if (resultSet && result && pickString(result.registration_id) === registrationId) {
        return { resultSet, result };
      }
    }
  }

  return null;
}

function findSingleResult(payload: unknown) {
  const matches: Array<{
    resultSet: Record<string, unknown>;
    result: Record<string, unknown>;
  }> = [];
  const resultSets = Array.isArray(asRecord(payload)?.individual_results_sets)
    ? (asRecord(payload)?.individual_results_sets as unknown[])
    : [];

  for (const resultSetValue of resultSets) {
    const resultSet = asRecord(resultSetValue);
    const results = Array.isArray(resultSet?.results) ? resultSet.results : [];

    for (const resultValue of results) {
      const result = asRecord(resultValue);

      if (resultSet && result) {
        matches.push({ resultSet, result });
      }
    }
  }

  return matches.length === 1 ? matches[0] : null;
}

function findUniqueResultByName(payload: unknown, firstName: string, lastName: string) {
  const matches: Array<{
    resultSet: Record<string, unknown>;
    result: Record<string, unknown>;
  }> = [];
  const resultSets = Array.isArray(asRecord(payload)?.individual_results_sets)
    ? (asRecord(payload)?.individual_results_sets as unknown[])
    : [];

  for (const resultSetValue of resultSets) {
    const resultSet = asRecord(resultSetValue);
    const results = Array.isArray(resultSet?.results) ? resultSet.results : [];

    for (const resultValue of results) {
      const result = asRecord(resultValue);

      if (
        resultSet &&
        result &&
        pickString(result.first_name)?.toLowerCase() === firstName.toLowerCase() &&
        pickString(result.last_name)?.toLowerCase() === lastName.toLowerCase()
      ) {
        matches.push({ resultSet, result });
      }
    }
  }

  return matches.length === 1 ? matches[0] : null;
}

function inferIdentityFromResult(result: Record<string, unknown>) {
  const firstName = pickString(result.first_name);
  const lastName = pickString(result.last_name);

  if (!firstName || !lastName) {
    return null;
  }

  return { firstName, lastName };
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

function parseInteger(value: unknown) {
  const parsed = Number.parseInt(pickString(value) ?? "", 10);

  return Number.isFinite(parsed) ? parsed : null;
}
