import Link from "next/link";

import styles from "./page.module.css";
import { RaceHistorySelector } from "./race-history-selector";
import { getMissingEnvVars } from "@/lib/runsignup";
import { getDashboardData } from "@/lib/analytics";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatMaybeJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const missingEnvVars = getMissingEnvVars();
  const connected = params.connected === "1";
  const synced = params.synced === "1";
  const oauthError =
    typeof params.oauth_error === "string" ? params.oauth_error : null;
  const syncError =
    typeof params.sync_error === "string" ? params.sync_error : null;
  const selectedRaceId = typeof params.race === "string" ? params.race : undefined;
  const syncCounts =
    synced &&
    typeof params.races === "string" &&
    typeof params.registrations === "string" &&
    typeof params.racesUpdated === "string" &&
    typeof params.eventsNamed === "string" &&
    typeof params.resultsMatched === "string"
      ? {
          races: params.races,
          registrations: params.registrations,
          racesUpdated: params.racesUpdated,
          eventsNamed: params.eventsNamed,
          resultsMatched: params.resultsMatched,
          nameFallbackMatches:
            typeof params.nameFallbackMatches === "string" ? params.nameFallbackMatches : "0",
        }
      : null;

  const dashboard = getDashboardData(1, selectedRaceId);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Finish Line</p>
          <h1>Your race history, organized in one place</h1>
          <p className={styles.lede}>
            PRs, recent finishes, upcoming races, and your history at favorite events,
            all pulled together from RunSignup.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.secondary} href="/settings">
              Manage connection and sync
            </Link>
          </div>
        </section>

        {missingEnvVars.length > 0 ? (
          <section className={styles.alert}>
            <h2>Setup needed</h2>
            <p>
              Add the missing environment variables in `.env.local` before testing
              the RunSignup connection.
            </p>
            <pre>{formatMaybeJson(missingEnvVars)}</pre>
          </section>
        ) : null}

        {connected ? (
          <section className={styles.success}>
            <strong>OAuth callback completed.</strong>
            <span> RunSignup tokens were stored in the local encrypted session store.</span>
          </section>
        ) : null}

        {syncCounts ? (
          <section className={styles.success}>
            <strong>Sync completed.</strong>
            <span>
              {" "}
              Saved {syncCounts.races} races, {syncCounts.registrations} registrations,
              updated {syncCounts.racesUpdated} races, named {syncCounts.eventsNamed} events,
              and matched {syncCounts.resultsMatched} results ({syncCounts.nameFallbackMatches}{" "}
              via name fallback).
            </span>
          </section>
        ) : null}

        {oauthError ? (
          <section className={styles.alert}>
            <h2>OAuth error</h2>
            <pre>{oauthError}</pre>
          </section>
        ) : null}

        {syncError ? (
          <section className={styles.alert}>
            <h2>Sync error</h2>
            <pre>{syncError}</pre>
          </section>
        ) : null}

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>PRs</h2>
              <p>Your best efforts by distance bucket so far.</p>
            </div>
          </div>
          {dashboard.prs.length > 0 ? (
            <div className={styles.summaryList}>
              {dashboard.prs.map((pr) => (
                <article className={styles.summaryItem} key={`${pr.distanceBucket}-${pr.time}`}>
                  <strong>{pr.distanceBucket}</strong>
                  <span>{pr.time}</span>
                  <small>
                    {pr.eventName ?? pr.raceName}
                    {pr.eventStartTime ? ` • ${new Date(pr.eventStartTime).toLocaleDateString()}` : ""}
                  </small>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>No PRs yet. Match more results first.</div>
          )}
        </section>

        <div className={styles.dashboardColumns}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Upcoming races</h2>
                <p>Your next scheduled starts, with the closest one highlighted first.</p>
              </div>
            </div>
            {dashboard.nextUpcomingRace ? (
              <article className={styles.highlightCard}>
                <p className={styles.highlightLabel}>Up next</p>
                <h3>{dashboard.nextUpcomingRace.event_name ?? dashboard.nextUpcomingRace.race_name}</h3>
                <span>
                  {dashboard.nextUpcomingRace.event_start_time
                    ? new Date(dashboard.nextUpcomingRace.event_start_time).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Date pending"}
                </span>
                <small>
                  {[
                    dashboard.nextUpcomingRace.location_city,
                    dashboard.nextUpcomingRace.location_state,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Location pending"}
                </small>
              </article>
            ) : (
              <div className={styles.emptyState}>No upcoming races are in the local data yet.</div>
            )}

            {dashboard.upcomingRaces.length > 1 ? (
              <div className={styles.summaryList}>
                {dashboard.upcomingRaces.slice(1).map((race) => (
                  <article
                    className={styles.summaryItem}
                    key={`${race.runsignup_race_id}-${race.event_start_time ?? race.event_name}`}
                  >
                    <strong>{race.event_name ?? race.race_name}</strong>
                    <small>
                      {race.event_start_time
                        ? new Date(race.event_start_time).toLocaleDateString()
                        : "Date pending"}
                    </small>
                    <small>
                      {[
                        race.location_city,
                        race.location_state,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Location pending"}
                    </small>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Recent finishes</h2>
                <p>Showing races from this year and last year.</p>
              </div>
            </div>
            {dashboard.recentResults.length > 0 ? (
              <div className={styles.summaryList}>
                {dashboard.recentResults.map((result) => (
                  <article
                    className={styles.summaryItem}
                    key={`${result.runsignup_race_id}-${result.event_start_time ?? result.chip_time}`}
                  >
                    <strong>{result.event_name ?? result.race_name}</strong>
                    <span>{result.chip_time ?? result.gun_time}</span>
                    <small>
                      {result.event_start_time
                        ? new Date(result.event_start_time).toLocaleDateString()
                        : "Date pending"}
                      {result.place ? ` • Place ${result.place}` : ""}
                      {result.pace ? ` • Pace ${result.pace}` : ""}
                    </small>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                No finishes from this year or last year are available yet.
              </div>
            )}
          </section>
        </div>

        <section className={styles.panel} id="race-history">
          <div className={styles.panelHeader}>
            <div>
              <h2>Race history</h2>
              <p>Select a race to see your matched results in chronological order.</p>
            </div>
          </div>
          {dashboard.raceOptions.length > 0 ? (
            <>
              <RaceHistorySelector
                key={dashboard.selectedRaceId ?? dashboard.raceOptions[0]?.runsignupRaceId ?? "race-history"}
                options={dashboard.raceOptions}
                sectionId="race-history"
                selectedRaceId={dashboard.selectedRaceId ?? undefined}
              />

              {dashboard.selectedRaceHistory.length > 0 ? (
                <div className={styles.summaryList}>
                  {dashboard.selectedRaceHistory.map((result) => (
                    <article
                      className={styles.summaryItem}
                      key={`${result.runsignup_race_id}-${result.event_start_time ?? result.chip_time}`}
                    >
                      <strong>{result.event_name ?? dashboard.selectedRaceLabel ?? result.race_name}</strong>
                      <span>{result.chip_time ?? result.gun_time}</span>
                      <small>
                        {result.event_start_time
                          ? new Date(result.event_start_time).toLocaleDateString()
                          : "Date pending"}
                        {result.place ? ` • Place ${result.place}` : ""}
                        {result.pace ? ` • Pace ${result.pace}` : ""}
                      </small>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>No matched history is available for this race yet.</div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              Race history will appear once more matched results are available.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
