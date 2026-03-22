# Finish Line

Finish Line is a personal RunSignup companion for runners.

It connects to a runner's RunSignup account with OAuth, syncs registered races and public results, stores that data locally, and turns it into a simple dashboard with:

- PRs by distance
- recent finishes
- upcoming races
- race-by-race history for repeat events

## How It Works

Finish Line uses RunSignup OAuth to access the logged-in user's account data. After connecting, the app:

1. fetches the user's registered races
2. saves registrations locally
3. enriches those registrations with race and event metadata
4. attempts to match official public results for each saved registration
5. builds dashboard views from the PostgreSQL database

The app is currently designed for local use and development. Synced data is stored in a PostgreSQL database and is not committed to git.

No synced runner data is shared with external services beyond the direct calls Finish Line makes to RunSignup in order to authenticate and fetch account data.

## Tech Stack

- Next.js
- React
- TypeScript
- `postgres` (PostgreSQL client)
- RunSignup OAuth + REST APIs

## Requirements

Before running the app, you need:

- Node.js
- npm
- a PostgreSQL database (local or hosted, e.g. [Neon](https://neon.tech))
- a RunSignup account
- a RunSignup OAuth client with a registered callback URL

## Database Setup

Finish Line requires a PostgreSQL database. The schema is in `sql/schema.sql`.

### Local PostgreSQL

1. Create a database:

```bash
createdb finish-line
```

2. Apply the schema:

```bash
psql finish-line < sql/schema.sql
```

3. Set `DATABASE_URL` in `.env.local`:

```
DATABASE_URL=postgres://user:password@localhost:5432/finish-line
```

### Hosted PostgreSQL (e.g. Neon)

1. Create a project and database in your provider's dashboard.
2. Copy the connection string (Node.js format).
3. Apply the schema using your provider's SQL console or `psql`.
4. Set `DATABASE_URL` in `.env.local` to the copied connection string.

## RunSignup OAuth Setup

Create a RunSignup OAuth app and register this callback URL for local development:

`http://localhost:3000/api/auth/runsignup/callback`

Helpful links:

- [Create or manage RunSignup OAuth apps](https://runsignup.com/Profile/OAuth2/ListClients)
- [RunSignup OAuth2 Developer Guide](https://runsignup.com/Profile/OAuth2/DeveloperGuide)

You will need:

- `RUNSIGNUP_CLIENT_ID`
- `RUNSIGNUP_CLIENT_SECRET_B64`

Notes:

- The client secret provided by the RunSignup OAuth app is already in the format Finish Line expects.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Fill in `.env.local` with:

- `DATABASE_URL` — PostgreSQL connection string
- `RUNSIGNUP_CLIENT_ID`
- `RUNSIGNUP_CLIENT_SECRET_B64`
- `RUNSIGNUP_REDIRECT_URI`
- `FINISH_LINE_ENCRYPTION_KEY`

Example local values:

```
DATABASE_URL=postgres://user:password@localhost:5432/finish-line
RUNSIGNUP_REDIRECT_URI=http://localhost:3000/api/auth/runsignup/callback
```

`FINISH_LINE_ENCRYPTION_KEY` should be a strong random secret used to encrypt stored OAuth tokens. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

4. Set up the database schema (see [Database Setup](#database-setup) above).

5. Start the app:

```bash
npm run dev
```

6. Open:

[http://localhost:3000](http://localhost:3000)

## Using The App

1. Open the dashboard.
2. Go to Settings.
3. Connect your RunSignup account.
4. Run `Refresh race data`.
5. Return to the dashboard to view synced race insights.

## Local Data

Finish Line stores all app state in a PostgreSQL database configured via `DATABASE_URL`. The database contains:

- local user records
- encrypted OAuth sessions
- synced races
- registrations
- matched results
- sync run history

The full schema is in `sql/schema.sql`.

## Built With Codex

Finish Line was built collaboratively with OpenAI Codex using a vibe-coding workflow.

The app was shaped through iterative prompting, live OAuth validation, local testing, and UI refinement directly in the project workspace.
