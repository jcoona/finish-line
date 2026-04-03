import { sql } from "@/lib/db";
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
  const registrations = (await sql`
    SELECT
      registrations.id AS registration_row_id,
      registrations.race_id AS race_row_id,
      registrations.runsignup_event_id,
      registrations.runsignup_registration_id,
      races.runsignup_race_id
    FROM registrations
    INNER JOIN races ON races.id = registrations.race_id
    WHERE registrations.user_id = ${userId}
    ORDER BY registrations.id ASC
  `) as RegistrationRow[];

  const seenRaceIds = new Set<string>();
  const raceCache = new Map<string, unknown>();
  let racesUpdated = 0;
  let eventsNamed = 0;
  let resultsMatched = 0;
  let nameFallbackMatches = 0;
  let athleteIdentity: { firstName: string; lastName: string } | null = null;

  for (const registration of registrations) {
    let raceDetails = raceCache.get(registration.runsignup_race_id);

    if (!raceDetails) {
      raceDetails = await fetchRaceDetails(registration.runsignup_race_id);
      raceCache.set(registration.runsignup_race_id, raceDetails);
    }

    const raceObject = asRecord(asRecord(raceDetails)?.race);

    if (raceObject && !seenRaceIds.has(registration.runsignup_race_id)) {
      await sql`
        UPDATE races
        SET
          name           = ${pickString(raceObject.name) ?? `RunSignup Race ${registration.runsignup_race_id}`},
          start_date     = ${pickString(raceObject.next_date, raceObject.last_date)},
          url            = ${pickString(raceObject.url)},
          location_city  = ${pickString(asRecord(raceObject.address)?.city)},
          location_state = ${pickString(asRecord(raceObject.address)?.state)},
          raw_payload    = ${sql.json(JSON.parse(JSON.stringify(raceDetails)))},
          synced_at      = now()
        WHERE id = ${registration.race_row_id}
      `;
      seenRaceIds.add(registration.runsignup_race_id);
      racesUpdated += 1;
    }

    const eventObject = findEvent(raceObject, registration.runsignup_event_id);

    if (eventObject) {
      await sql`
        UPDATE registrations
        SET
          event_name       = ${pickString(eventObject.name) ?? pickString(registration.runsignup_event_id)},
          event_start_time = ${pickString(eventObject.start_time)},
          event_distance   = ${pickString(eventObject.distance)},
          raw_payload      = ${sql.json(JSON.parse(JSON.stringify(eventObject)))},
          synced_at        = now()
        WHERE id = ${registration.registration_row_id}
      `;
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
      await sql`
        INSERT INTO results (
          user_id, race_id, registration_id, event_id, result_id, result_set_id, result_set_name,
          place, gender_place, division_place, chip_time, gun_time, pace, raw_payload, synced_at
        ) VALUES (
          ${userId},
          ${registration.race_row_id},
          ${parseInteger(registration.runsignup_registration_id)},
          ${parseInteger(registration.runsignup_event_id)},
          ${parseInteger(matchedResult.result.result_id)},
          ${parseInteger(matchedResult.resultSet.individual_result_set_id)},
          ${pickString(matchedResult.resultSet.individual_result_set_name)},
          ${pickString(matchedResult.result.place)},
          ${pickString(matchedResult.result.gender_place)},
          ${pickString(matchedResult.result.division_place)},
          ${pickString(matchedResult.result.chip_time, matchedResult.result.clock_time)},
          ${pickString(matchedResult.result.gun_time, matchedResult.result.clock_time)},
          ${pickString(matchedResult.result.pace)},
          ${sql.json(JSON.parse(JSON.stringify(matchedResult.result)))},
          now()
        )
        ON CONFLICT (user_id, registration_id, event_id) DO UPDATE SET
          result_id       = EXCLUDED.result_id,
          result_set_id   = EXCLUDED.result_set_id,
          result_set_name = EXCLUDED.result_set_name,
          place           = EXCLUDED.place,
          gender_place    = EXCLUDED.gender_place,
          division_place  = EXCLUDED.division_place,
          chip_time       = EXCLUDED.chip_time,
          gun_time        = EXCLUDED.gun_time,
          pace            = EXCLUDED.pace,
          raw_payload     = EXCLUDED.raw_payload,
          synced_at       = EXCLUDED.synced_at
      `;
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

    await sql`
      INSERT INTO results (
        user_id, race_id, registration_id, event_id, result_id, result_set_id, result_set_name,
        place, gender_place, division_place, chip_time, gun_time, pace, raw_payload, synced_at
      ) VALUES (
        ${userId},
        ${registration.race_row_id},
        ${parseInteger(registration.runsignup_registration_id)},
        ${parseInteger(registration.runsignup_event_id)},
        ${parseInteger(fallbackMatch.result.result_id)},
        ${parseInteger(fallbackMatch.resultSet.individual_result_set_id)},
        ${pickString(fallbackMatch.resultSet.individual_result_set_name)},
        ${pickString(fallbackMatch.result.place)},
        ${pickString(fallbackMatch.result.gender_place)},
        ${pickString(fallbackMatch.result.division_place)},
        ${pickString(fallbackMatch.result.chip_time, fallbackMatch.result.clock_time)},
        ${pickString(fallbackMatch.result.gun_time, fallbackMatch.result.clock_time)},
        ${pickString(fallbackMatch.result.pace)},
        ${sql.json(JSON.parse(JSON.stringify(fallbackMatch.result)))},
        now()
      )
      ON CONFLICT (user_id, registration_id, event_id) DO UPDATE SET
        result_id       = EXCLUDED.result_id,
        result_set_id   = EXCLUDED.result_set_id,
        result_set_name = EXCLUDED.result_set_name,
        place           = EXCLUDED.place,
        gender_place    = EXCLUDED.gender_place,
        division_place  = EXCLUDED.division_place,
        chip_time       = EXCLUDED.chip_time,
        gun_time        = EXCLUDED.gun_time,
        pace            = EXCLUDED.pace,
        raw_payload     = EXCLUDED.raw_payload,
        synced_at       = EXCLUDED.synced_at
    `;
    resultsMatched += 1;
    nameFallbackMatches += 1;
  }

  await sql`
    INSERT INTO sync_runs (user_id, type, status, summary_json, created_at)
    VALUES (
      ${userId},
      'enrich-races',
      'success',
      ${sql.json({ racesUpdated, eventsNamed, resultsMatched, nameFallbackMatches })},
      now()
    )
  `;

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
