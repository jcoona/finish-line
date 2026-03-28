import { cookies } from "next/headers";
import Link from "next/link";

import styles from "./page.module.css";
import { DismissibleSyncBanner } from "./dismissible-sync-banner";
import { RaceHistorySelector } from "./race-history-selector";
import { getMissingEnvVars } from "@/lib/runsignup";
import { getDashboardData } from "@/lib/analytics";
import { SESSION_COOKIE, getSession } from "@/lib/session";
import { getUser } from "@/lib/db";
import { DEMO_DASHBOARD_DATA, DEMO_USER_NAME } from "@/lib/demo-data";

const IS_DEMO = process.env.DEMO_MODE === "true";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatMaybeJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

const ENV_VAR_HINTS: Record<string, string> = {
  DATABASE_URL: "PostgreSQL connection string",
  RUNSIGNUP_CLIENT_ID: "RunSignup OAuth client ID — register at runsignup.com/developers",
  RUNSIGNUP_CLIENT_SECRET_B64: "RunSignup OAuth client secret (base64-encoded)",
  RUNSIGNUP_REDIRECT_URI: "URL RunSignup redirects back to after login (must match your registered app)",
  FINISH_LINE_ENCRYPTION_KEY: "Random secret key used to encrypt OAuth tokens stored in cookies",
};

function formatMissingEnvVars(vars: string[]) {
  return vars.map((v) => `# ${ENV_VAR_HINTS[v] ?? v}\n${v}=`).join("\n\n");
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;

  if (IS_DEMO) {
    const dashboard = DEMO_DASHBOARD_DATA;
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <section className={styles.hero}>
            <p className={styles.kicker}>Finish Line</p>
            <h1>{DEMO_USER_NAME}&apos;s Race History</h1>
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

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>PRs</h2>
                <p>Your best efforts by distance bucket so far.</p>
              </div>
            </div>
            <div className={styles.summaryList}>
              {dashboard.prs.map((pr) => (
                <article className={styles.summaryItem} key={pr.distanceBucket}>
                  <strong>{pr.distanceBucket}</strong>
                  <span>{pr.time}</span>
                  <small>
                    {pr.eventName ?? pr.raceName}
                    {pr.eventStartTime ? ` • ${new Date(pr.eventStartTime).toLocaleDateString()}` : ""}
                  </small>
                </article>
              ))}
            </div>
          </section>

          <div className={styles.dashboardColumns}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2>Upcoming races</h2>
                  <p>Your next scheduled starts, with the closest one highlighted first.</p>
                </div>
              </div>
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
                  {[dashboard.nextUpcomingRace.location_city, dashboard.nextUpcomingRace.location_state]
                    .filter(Boolean)
                    .join(", ")}
                </small>
              </article>
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
                        {[race.location_city, race.location_state].filter(Boolean).join(", ")}
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
            </section>
          </div>

          <section className={styles.panel} id="race-history">
            <div className={styles.panelHeader}>
              <div>
                <h2>Race history</h2>
                <p>Select a race to see your matched results in chronological order.</p>
              </div>
            </div>
            <RaceHistorySelector
              key={dashboard.selectedRaceId ?? "race-history"}
              options={dashboard.raceOptions}
              sectionId="race-history"
              selectedRaceId={dashboard.selectedRaceId ?? undefined}
            />
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
          </section>
        </main>
      </div>
    );
  }

  const missingEnvVars = getMissingEnvVars();
  if (missingEnvVars.length > 0) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <section className={styles.hero}>
            <p className={styles.kicker}>Finish Line</p>
            <h1>Your Race History, Organized In One Place</h1>
            <p className={styles.lede}>
              PRs, recent finishes, upcoming races, and your history at favorite events,
              all pulled together from RunSignup.
            </p>
          </section>
          <section className={styles.alert}>
            <h2>Setup needed</h2>
            <p>
              Add the missing environment variables in <code>.env.local</code> before testing
              the RunSignup connection.
            </p>
            <pre>{formatMissingEnvVars(missingEnvVars)}</pre>
          </section>
        </main>
      </div>
    );
  }

  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get(SESSION_COOKIE)?.value);
  const user = session ? await getUser(session.userId) : null;
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

  const dashboard = await getDashboardData(session?.userId ?? 0, selectedRaceId);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Finish Line</p>
          <h1>{user ? `${user.display_name.split(" ")[0]}'s Race History` : "Your Race History, Organized In One Place"}</h1>
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

        {connected ? (
          <section className={styles.success}>
            <strong>OAuth callback completed.</strong>
            <span> RunSignup tokens were stored in the local encrypted session store.</span>
          </section>
        ) : null}

        {syncCounts ? <DismissibleSyncBanner /> : null}

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
