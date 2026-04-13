import { sql } from "@/lib/db";

type MatchedResultRow = {
  runsignup_race_id: string;
  race_name: string;
  event_name: string | null;
  event_start_time: string | null;
  event_distance: string | null;
  chip_time: string | null;
  gun_time: string | null;
  pace: string | null;
  place: string | null;
  result_set_name: string | null;
};

type UpcomingRaceRow = {
  runsignup_race_id: string;
  race_name: string;
  event_name: string | null;
  event_start_time: string | null;
  location_city: string | null;
  location_state: string | null;
};

type TodaysRaceRow = {
  runsignup_race_id: string;
  race_name: string;
  event_name: string | null;
  event_start_time: string | null;
  location_city: string | null;
  location_state: string | null;
  chip_time: string | null;
  gun_time: string | null;
  pace: string | null;
  place: string | null;
};

export type TodaysRace = TodaysRaceRow;

export async function getDashboardData(userId: number, selectedRaceId?: string) {
  const matchedRows = (await sql`
    SELECT
      races.runsignup_race_id,
      races.name AS race_name,
      registrations.event_name,
      registrations.event_start_time,
      registrations.event_distance,
      results.chip_time,
      results.gun_time,
      results.pace,
      results.place,
      results.result_set_name
    FROM results
    INNER JOIN races ON races.id = results.race_id
    INNER JOIN registrations
      ON registrations.race_id = races.id
     AND NULLIF(registrations.runsignup_registration_id, '')::BIGINT = results.registration_id
     AND NULLIF(registrations.runsignup_event_id, '')::BIGINT = results.event_id
    WHERE results.user_id = ${userId}
    ORDER BY COALESCE(registrations.event_start_time, '') DESC
  `) as MatchedResultRow[];

  const normalizedResults = matchedRows
    .map((row) => {
      const seconds = parseTimeToSeconds(row.chip_time ?? row.gun_time);
      const distanceBucket =
        row.event_distance
          ? normalizeDistanceBucket(row.event_distance)
          : inferDistanceBucket(row.event_name ?? row.race_name);
      const eventTimestamp = parseEventTimestamp(row.event_start_time);

      return {
        ...row,
        seconds,
        distanceBucket,
        eventTimestamp,
      };
    })
    .filter((row) => row.seconds !== null)
    .sort((a, b) => b.eventTimestamp - a.eventTimestamp);

  const now = Date.now();
  const currentYear = new Date().getFullYear();
  const todaysRace = await getTodaysRace(userId);
  const recentResults = normalizedResults
    .filter((row) => {
      const year = row.event_start_time ? new Date(row.event_start_time).getFullYear() : 0;
      if (year !== currentYear && year !== currentYear - 1) return false;
      // Exclude today's race — it has its own dedicated section until tomorrow
      if (
        todaysRace &&
        row.runsignup_race_id === todaysRace.runsignup_race_id &&
        row.event_start_time === todaysRace.event_start_time
      ) {
        return false;
      }
      return true;
    })
    .slice(0, 5);

  const prs = computePrs(normalizedResults);
  const upcomingRaces = await getUpcomingRaces(userId, now);
  const nextUpcomingRace = upcomingRaces[0] ?? null;
  const raceOptions = buildRaceOptions(normalizedResults);
  const effectiveSelectedRaceId = selectedRaceId ?? raceOptions[0]?.runsignupRaceId ?? null;
  const selectedRaceHistory = effectiveSelectedRaceId
    ? normalizedResults
        .filter((row) => row.runsignup_race_id === effectiveSelectedRaceId)
        .sort((a, b) => b.eventTimestamp - a.eventTimestamp)
    : [];
  const selectedRaceOption =
    raceOptions.find((option) => option.runsignupRaceId === effectiveSelectedRaceId) ?? null;

  return {
    prs,
    recentResults,
    todaysRace,
    upcomingRaces: upcomingRaces.slice(0, 4),
    nextUpcomingRace,
    raceOptions,
    selectedRaceId: effectiveSelectedRaceId,
    selectedRaceHistory,
    selectedRaceLabel: selectedRaceOption?.label ?? null,
  };
}

async function getTodaysRace(userId: number): Promise<TodaysRace | null> {
  const rows = (await sql`
    SELECT
      races.runsignup_race_id,
      races.name AS race_name,
      registrations.event_name,
      registrations.event_start_time,
      races.location_city,
      races.location_state,
      results.chip_time,
      results.gun_time,
      results.pace,
      results.place
    FROM registrations
    INNER JOIN races ON races.id = registrations.race_id
    LEFT JOIN results
      ON results.race_id = races.id
      AND results.user_id = ${userId}
      AND NULLIF(registrations.runsignup_registration_id, '')::BIGINT = results.registration_id
      AND NULLIF(registrations.runsignup_event_id, '')::BIGINT = results.event_id
    WHERE registrations.user_id = ${userId}
      AND registrations.event_start_time IS NOT NULL
      AND TO_TIMESTAMP(registrations.event_start_time, 'FMMM/FMDD/YYYY HH24:MI')::date = CURRENT_DATE
    LIMIT 1
  `) as TodaysRaceRow[];

  return rows[0] ?? null;
}

async function getUpcomingRaces(userId: number, now: number) {
  const rows = (await sql`
    SELECT
      races.runsignup_race_id,
      races.name AS race_name,
      registrations.event_name,
      registrations.event_start_time,
      races.location_city,
      races.location_state
    FROM registrations
    INNER JOIN races ON races.id = registrations.race_id
    WHERE registrations.user_id = ${userId}
      AND registrations.event_start_time IS NOT NULL
    ORDER BY registrations.event_start_time ASC
  `) as UpcomingRaceRow[];

  return rows
    .map((row) => ({
      ...row,
      eventTimestamp: parseEventTimestamp(row.event_start_time),
    }))
    .filter((row) => row.eventTimestamp > now)
    .sort((a, b) => a.eventTimestamp - b.eventTimestamp);
}

function buildRaceOptions(
  rows: Array<
    MatchedResultRow & {
      seconds: number | null;
      distanceBucket: string | null;
      eventTimestamp: number;
    }
  >,
) {
  const grouped = new Map<string, { label: string; attempts: number }>();

  for (const row of rows) {
    const existing = grouped.get(row.runsignup_race_id);
    grouped.set(row.runsignup_race_id, {
      label: row.race_name,
      attempts: (existing?.attempts ?? 0) + 1,
    });
  }

  return [...grouped.entries()]
    .map(([runsignupRaceId, value]) => ({
      runsignupRaceId,
      label: value.label,
      attempts: value.attempts,
    }))
    .filter((option) => option.attempts >= 2)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function computePrs(
  rows: Array<
    MatchedResultRow & {
      seconds: number | null;
      distanceBucket: string | null;
      eventTimestamp: number;
    }
  >,
) {
  type NormalizedResult = MatchedResultRow & {
    seconds: number;
    distanceBucket: string | null;
    eventTimestamp: number;
  };
  const bestByDistance = new Map<string, NormalizedResult>();

  for (const row of rows) {
    if (!row.distanceBucket || row.seconds === null) {
      continue;
    }

    const existing = bestByDistance.get(row.distanceBucket);
    const normalizedRow: NormalizedResult = {
      ...row,
      seconds: row.seconds,
    };

    if (!existing || normalizedRow.seconds < existing.seconds) {
      bestByDistance.set(row.distanceBucket, normalizedRow);
    }
  }

  return [...bestByDistance.entries()]
    .map(([distanceBucket, row]) => ({
      distanceBucket,
      raceName: row.race_name,
      eventName: row.event_name,
      eventStartTime: row.event_start_time,
      time: row.chip_time ?? row.gun_time ?? "",
      pace: row.pace,
      place: row.place,
    }))
    .sort((a, b) => a.distanceBucket.localeCompare(b.distanceBucket));
}

function normalizeDistanceBucket(distance: string) {
  const normalized = distance.trim().toLowerCase();

  if (normalized === "5k") return "5K";
  if (normalized === "10k") return "10K";
  if (normalized === "half marathon" || normalized === "half") return "Half Marathon";
  if (normalized === "marathon") return "Marathon";
  if (normalized === "5 miles" || normalized === "5 mile" || normalized === "5-mile") return "5 Mile";

  // Return the raw value as-is for unknown distances (e.g. "10 Miles", "15K")
  return distance.trim();
}

function inferDistanceBucket(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes("5k")) return "5K";
  if (normalized.includes("10k")) return "10K";
  if (normalized.includes("half")) return "Half Marathon";
  if (normalized.includes("marathon")) return "Marathon";
  if (normalized.includes("5 miler") || normalized.includes("5-mile")) return "5 Mile";
  if (normalized.includes("loop")) return "Trail / Custom";
  return null;
}

function parseEventTimestamp(value: string | null) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function parseTimeToSeconds(value: string | null) {
  if (!value) {
    return null;
  }

  const parts = value.split(":").map((part) => Number.parseFloat(part));

  if (parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (parts.length === 2) {
    return Math.round(parts[0] * 60 + parts[1]);
  }

  if (parts.length === 3) {
    return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
  }

  return null;
}
