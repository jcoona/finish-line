/**
 * Demo dashboard data used when DEMO_MODE=true (e.g. Claude Preview).
 * OAuth and the local SQLite database are not available in that environment,
 * so we return realistic-looking fixture data instead.
 */

export const DEMO_USER_NAME = "Alex";

const DEMO_BASE_DATA = {
  prs: [
    {
      distanceBucket: "5K",
      raceName: "Hoboken 5K Classic",
      eventName: "5K Run",
      eventStartTime: "2024-04-13T09:00:00",
      time: "22:14",
      pace: "7:09/mi",
      place: "42",
    },
    {
      distanceBucket: "10K",
      raceName: "Jersey City 10K",
      eventName: "10K",
      eventStartTime: "2023-09-30T08:00:00",
      time: "46:52",
      pace: "7:33/mi",
      place: "88",
    },
    {
      distanceBucket: "Half Marathon",
      raceName: "NYC Half",
      eventName: "Half Marathon",
      eventStartTime: "2024-03-17T07:30:00",
      time: "1:44:38",
      pace: "8:01/mi",
      place: "3241",
    },
    {
      distanceBucket: "Marathon",
      raceName: "Philadelphia Marathon",
      eventName: "Marathon",
      eventStartTime: "2023-11-19T07:00:00",
      time: "3:52:07",
      pace: "8:52/mi",
      place: "1847",
    },
  ],

  recentResults: [
    {
      runsignup_race_id: "demo-1",
      race_name: "Hoboken 5K Classic",
      event_name: "5K Run",
      event_start_time: "2025-04-12T09:00:00",
      chip_time: "22:41",
      gun_time: "22:55",
      pace: "7:18/mi",
      place: "57",
      result_set_name: null,
    },
    {
      runsignup_race_id: "demo-2",
      race_name: "Resolution Run 5K",
      event_name: "5K",
      event_start_time: "2025-01-01T10:00:00",
      chip_time: "23:08",
      gun_time: "23:21",
      pace: "7:27/mi",
      place: "31",
      result_set_name: null,
    },
    {
      runsignup_race_id: "demo-3",
      race_name: "Turkey Trot 5-Miler",
      event_name: "5 Mile",
      event_start_time: "2024-11-28T09:00:00",
      chip_time: "38:22",
      gun_time: "38:45",
      pace: "7:40/mi",
      place: "104",
      result_set_name: null,
    },
    {
      runsignup_race_id: "demo-4",
      race_name: "Jersey City 10K",
      event_name: "10K",
      event_start_time: "2024-09-28T08:00:00",
      chip_time: "47:11",
      gun_time: "47:30",
      pace: "7:36/mi",
      place: "76",
      result_set_name: null,
    },
    {
      runsignup_race_id: "demo-5",
      race_name: "NYC Half",
      event_name: "Half Marathon",
      event_start_time: "2024-03-17T07:30:00",
      chip_time: "1:44:38",
      gun_time: "1:46:12",
      pace: "8:01/mi",
      place: "3241",
      result_set_name: null,
    },
  ],

  upcomingRaces: [
    {
      runsignup_race_id: "demo-u1",
      race_name: "Hoboken 5K Classic",
      event_name: "5K Run",
      event_start_time: "2026-04-11T09:00:00",
      location_city: "Hoboken",
      location_state: "NJ",
    },
    {
      runsignup_race_id: "demo-u2",
      race_name: "Jersey City 10K",
      event_name: "10K",
      event_start_time: "2026-09-27T08:00:00",
      location_city: "Jersey City",
      location_state: "NJ",
    },
    {
      runsignup_race_id: "demo-u3",
      race_name: "Philadelphia Marathon",
      event_name: "Marathon",
      event_start_time: "2026-11-22T07:00:00",
      location_city: "Philadelphia",
      location_state: "PA",
    },
  ],

  nextUpcomingRace: {
    runsignup_race_id: "demo-u1",
    race_name: "Hoboken 5K Classic",
    event_name: "5K Run",
    event_start_time: "2026-04-11T09:00:00",
    location_city: "Hoboken",
    location_state: "NJ",
  },

  raceOptions: [
    { runsignupRaceId: "demo-1", label: "Hoboken 5K Classic", attempts: 3 },
    { runsignupRaceId: "demo-2", label: "Jersey City 10K", attempts: 2 },
    { runsignupRaceId: "demo-3", label: "NYC Half", attempts: 2 },
    { runsignupRaceId: "demo-4", label: "Philadelphia Marathon", attempts: 2 },
  ],

  selectedRaceId: "demo-1",

  selectedRaceHistory: [
    {
      runsignup_race_id: "demo-1",
      race_name: "Hoboken 5K Classic",
      event_name: "5K Run",
      event_start_time: "2023-04-15T09:00:00",
      chip_time: "24:02",
      gun_time: "24:15",
      pace: "7:45/mi",
      place: "93",
      result_set_name: null,
    },
    {
      runsignup_race_id: "demo-1",
      race_name: "Hoboken 5K Classic",
      event_name: "5K Run",
      event_start_time: "2024-04-13T09:00:00",
      chip_time: "22:14",
      gun_time: "22:28",
      pace: "7:09/mi",
      place: "42",
      result_set_name: null,
    },
    {
      runsignup_race_id: "demo-1",
      race_name: "Hoboken 5K Classic",
      event_name: "5K Run",
      event_start_time: "2025-04-12T09:00:00",
      chip_time: "22:41",
      gun_time: "22:55",
      pace: "7:18/mi",
      place: "57",
      result_set_name: null,
    },
  ],

  selectedRaceLabel: "Hoboken 5K Classic",
};

export function getDemoDashboardData() {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Demo: show a race that started this morning so we can showcase the section.
  // chip_time is null so it sits in the "Results will come soon!" state.
  const todaysRace = {
    runsignup_race_id: "demo-today",
    race_name: "Hoboken Spring 5K",
    event_name: "5K Run",
    event_start_time: `${today}T08:00:00`,
    location_city: "Hoboken",
    location_state: "NJ",
    chip_time: null,
    gun_time: null,
    pace: null,
    place: null,
  };

  return { ...DEMO_BASE_DATA, todaysRace };
}

// Keep the static export for any consumers that don't need todaysRace
export const DEMO_DASHBOARD_DATA = { ...DEMO_BASE_DATA, todaysRace: null };
