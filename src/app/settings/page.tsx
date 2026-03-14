import { cookies } from "next/headers";
import Link from "next/link";

import styles from "../page.module.css";
import { SESSION_COOKIE, getSession } from "@/lib/session";
import { getLatestSyncRun } from "@/lib/sync";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const session = getSession(sessionId);
  const tokens = session?.tokens ?? null;
  const latestSync = getLatestSyncRun(1);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Finish Line</p>
          <h1>Connection and sync</h1>
          <p className={styles.lede}>
            Connect your RunSignup account and refresh your latest race history and
            results whenever you want.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primary} href="/">
              Back to dashboard
            </Link>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>RunSignup connection</h2>
              <p>
                Manage your RunSignup connection and keep Finish Line linked to your
                latest account data.
              </p>
            </div>
            <div className={styles.actions}>
              <a className={styles.primary} href="/api/auth/runsignup/start">
                Connect RunSignup
              </a>
            </div>
          </div>
          <dl className={styles.meta}>
            <div>
              <dt>Status</dt>
              <dd>{session ? "Connected" : "Not connected"}</dd>
            </div>
            <div>
              <dt>Scope</dt>
              <dd>{tokens?.scope ?? "Not available yet"}</dd>
            </div>
            <div>
              <dt>Token expiry</dt>
              <dd>
                {tokens ? new Date(tokens.expires_at).toLocaleString() : "No token yet"}
              </dd>
            </div>
            <div>
              <dt>Last sync</dt>
              <dd>
                {latestSync ? new Date(latestSync.createdAt).toLocaleString() : "Not synced yet"}
              </dd>
            </div>
          </dl>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Sync actions</h2>
              <p>
                Refresh your registrations, race details, and official results.
              </p>
            </div>
            <div className={styles.actions}>
              <form action="/api/sync/registered-races" method="post">
                <button className={styles.primary} type="submit">
                  Refresh race data
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
