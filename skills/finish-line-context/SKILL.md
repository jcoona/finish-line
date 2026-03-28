---
name: finish-line-context
description: Load full context about the Finish Line application — its purpose, architecture, database schema, data flow, and conventions. Use this skill at the start of any session working on the Finish Line repository, or whenever you need to understand how the app works before making changes.
---

You are now loaded with full context about the Finish Line application. Use this as your working knowledge for any task in this repository.

---

## What Finish Line Is

Finish Line is a **personal RunSignup companion web app** for a single authenticated runner. It connects to the runner's RunSignup account via OAuth, syncs their race registrations and results into a private PostgreSQL database, and presents a unified dashboard showing:

- **PRs by distance** — best chip times and paces for 5K, 10K, Half Marathon, Marathon
- **Upcoming races** — future registrations, with the next race highlighted
- **Recent finishes** — results from the current and prior year
- **Race history** — lap-by-lap comparison for races entered multiple times

The app supports one active authenticated user at a time — whoever has connected their RunSignup account. There is no concurrent multi-user support; all data is scoped to the currently authenticated runner.

---

## Tech Stack

| Layer     | Technology                                                          |
|-----------|---------------------------------------------------------------------|
| Framework | Next.js (App Router, server components)                             |
| Language  | TypeScript                                                          |
| Database  | PostgreSQL via `postgres` npm client (no ORM)                       |
| Schema    | Hand-written SQL in `sql/schema.sql`                                |
| Auth      | RunSignup OAuth 2.0 with PKCE; tokens encrypted AES-256-GCM at rest |
| CSS       | CSS Modules (`*.module.css`)                                        |
| Analytics | Vercel Analytics + SpeedInsights                                    |
| Hosting   | Vercel                                                              |

---

## Key Environment Variables

| Variable                      | Purpose                                                   |
|-------------------------------|-----------------------------------------------------------|
| `DATABASE_URL`                | PostgreSQL connection string                              |
| `RUNSIGNUP_CLIENT_ID`         | OAuth app client ID                                       |
| `RUNSIGNUP_CLIENT_SECRET_B64` | OAuth client secret (base64, as provided by RunSignup)    |
| `RUNSIGNUP_REDIRECT_URI`      | OAuth callback URL                                        |
| `FINISH_LINE_ENCRYPTION_KEY`  | AES-256 key (32-byte base64) for encrypting stored tokens |
| `DEMO_MODE`                   | Set `"true"` to bypass DB and serve fixture data          |

**Demo mode** (`DEMO_MODE=true`) renders the full UI with static fixture data and no database. Always use `npm run dev:demo` when verifying UI changes in the browser preview — it avoids needing a real DB or RunSignup connection.

---

## Database Schema (`sql/schema.sql`)

Six tables, all with cascade-delete from `users`:

| Table            | Purpose                                                                 |
|------------------|-------------------------------------------------------------------------|
| `users`          | One row per runner; linked to RunSignup via `provider_user_id`          |
| `oauth_sessions` | AES-256-GCM encrypted RunSignup tokens per user                         |
| `races`          | RunSignup race metadata (name, date, location, URL)                     |
| `registrations`  | User's registrations — links a user to a race/event                     |
| `results`        | Official race results matched to registrations (place, chip_time, pace) |
| `sync_runs`      | Audit log of sync operations with status + summary JSON                 |

Key design decisions:
- No ORM — raw SQL with `postgres` tagged template literals
- `raw_payload JSONB` stored on races, registrations, and results for debugging
- `synced_at` timestamps track when each record was last fetched from RunSignup
- Unique constraints prevent duplicate records on upsert

---

## App Directory Structure (`src/app/`)

```
src/
├── app/
│   ├── page.tsx                     # Main dashboard (server component)
│   ├── page.module.css              # Dashboard styles
│   ├── layout.tsx                   # Root layout (fonts, analytics)
│   ├── icon.tsx                     # Dynamic favicon (running shirt emoji)
│   ├── dismissible-sync-banner.tsx  # Sync status banner (client component)
│   ├── race-history-selector.tsx    # Repeat-race dropdown (client component)
│   └── settings/
│       └── page.tsx                 # Settings page (connect/disconnect/sync)
├── api/
│   ├── auth/runsignup/start/        # OAuth initiation
│   ├── auth/runsignup/callback/     # OAuth token exchange + initial sync
│   ├── auth/logout/                 # Clear session + all user data
│   ├── runsignup/registered-races/  # Proxy: fetch races from RunSignup API
│   ├── sync/registered-races/       # Full sync: registrations → enrich
│   └── sync/enrich-races/           # Enrichment only: metadata + results
└── lib/
    ├── db.ts                        # PostgreSQL client (lazy init, demo-safe)
    ├── analytics.ts                 # getDashboardData() — all dashboard queries
    ├── enrichment.ts                # enrichUserRaces() — race detail + result matching
    ├── runsignup.ts                 # RunSignup API client (fetch wrappers)
    ├── session.ts                   # Session cookie read/validate
    ├── crypto.ts                    # AES-256-GCM encrypt/decrypt for tokens
    └── demo/fixtures.ts             # Static fixture data for DEMO_MODE
```

---

## Data Flow

### OAuth / First Login
1. User clicks "Connect RunSignup" → `GET /api/auth/runsignup/start`
2. Server generates PKCE state + code verifier, stores in httpOnly cookies, redirects to RunSignup
3. RunSignup redirects to `GET /api/auth/runsignup/callback`
4. Server exchanges code for tokens, creates/updates `users` row, encrypts tokens into `oauth_sessions`
5. Session ID cookie set; initial sync triggered automatically

### Full Sync (`POST /api/sync/registered-races`)
1. Validate session, refresh token if expired
2. Fetch all registered races from RunSignup API
3. Upsert `races` + `registrations` (transactional)
4. Call enrichment flow

### Enrichment (`POST /api/sync/enrich-races`)
1. For each registration: fetch full race details → update race metadata + event name
2. Fetch official results by registration ID
3. If no match: fall back to first/last name matching
4. Upsert matched results into `results` table
5. Cache race details within the run to avoid duplicate API calls

### Dashboard Render (`getDashboardData` in `lib/analytics.ts`)
- Raw SQL with JOINs across results → registrations → races
- Computes PRs: group by distance bucket, keep best chip_time
- Upcoming: filter registrations where event_start_time > now
- Race history: group results by race, filter to races with 2+ entries
- Optional filter by `selectedRaceId` query param

---

## RunSignup API Endpoints Used

| Endpoint                                       | Purpose                              |
|------------------------------------------------|--------------------------------------|
| `POST /rest/v2/auth/auth-code-redemption.json` | Exchange auth code for tokens        |
| `POST /rest/v2/auth/refresh-token.json`        | Refresh expired access token         |
| `GET /rest/user?format=json`                   | Fetch current user profile           |
| `GET /rest/user/registered-races?format=json`  | All races the user is registered for |
| `GET /rest/race/{raceId}?format=json`          | Full race details (events, metadata) |
| `GET /rest/race/{raceId}/results/get-results`  | Official results for a race          |

The RunSignup client lives in `src/app/lib/runsignup.ts`.

---

## Important Conventions

- **No ORM** — all DB access is raw SQL via tagged template literals (`` sql`...` ``)
- **Server components by default** — only mark `"use client"` when interactivity requires it (currently: sync banner, race history selector)
- **Demo mode** — `lib/db.ts` returns a no-op proxy if `DATABASE_URL` is absent; `page.tsx` checks `IS_DEMO` and renders fixture data. Use `npm run dev:demo` for UI work.
- **Token security** — OAuth tokens are never stored plaintext; always encrypted/decrypted via `lib/crypto.ts`
- **Cascade deletes** — disconnecting a user wipes all their races, registrations, results, and sessions
- **Distance inference** — PRs are bucketed by parsing event/race names for known distance keywords (5K, 10K, half, marathon, etc.) in `lib/analytics.ts`
