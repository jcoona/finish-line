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
5. builds dashboard views from the local SQLite database

The app is currently designed for local use and development. Synced data is stored on disk in a local SQLite database and is not committed to git.

No synced runner data is shared with external services beyond the direct calls Finish Line makes to RunSignup in order to authenticate and fetch account data.

## Tech Stack

- Next.js
- React
- TypeScript
- `better-sqlite3`
- RunSignup OAuth + REST APIs

## Requirements

Before running the app, you need:

- Node.js
- npm
- a RunSignup account
- a RunSignup OAuth client with a registered callback URL

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

- `RUNSIGNUP_CLIENT_ID`
- `RUNSIGNUP_CLIENT_SECRET_B64`
- `RUNSIGNUP_REDIRECT_URI`
- `FINISH_LINE_ENCRYPTION_KEY`

Example local callback value:

`RUNSIGNUP_REDIRECT_URI=http://localhost:3000/api/auth/runsignup/callback`

`FINISH_LINE_ENCRYPTION_KEY` should be a strong random secret used to encrypt stored OAuth tokens.

4. Start the app:

```bash
npm run dev
```

5. Open:

[http://localhost:3000](http://localhost:3000)

## Using The App

1. Open the dashboard.
2. Go to Settings.
3. Connect your RunSignup account.
4. Run `Refresh race data`.
5. Return to the dashboard to view synced race insights.

## Local Data

Finish Line stores local app state in:

- `data/finish-line.db`

That database currently contains:

- local user records
- encrypted OAuth sessions
- synced races
- registrations
- matched results
- sync run history

## Built With Codex

Finish Line was built collaboratively with OpenAI Codex using a vibe-coding workflow.

The app was shaped through iterative prompting, live OAuth validation, local testing, and UI refinement directly in the project workspace.
