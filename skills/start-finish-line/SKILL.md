---
name: start-finish-line
description: Start the Finish Line Next.js application in local development. Use when a user asks to start, launch, boot, or run Finish Line locally, or when an assistant needs the repo-specific steps to bring up the app and verify the local URL.
---

# Start Finish Line

Start the app from the Finish Line repository root. The startup command depends on which mode is needed (see below).

## Choosing the right mode

The project has two npm scripts:
- `npm run dev` — standard dev mode, requires real OAuth and database setup
- `npm run dev:demo` — demo mode with `DEMO_MODE=true`, uses dummy data, no OAuth or DB required

**Use `dev:demo` (demo mode) when:**
- Doing UI verification, a browser preview, or a demo walkthrough
- The user mentions demo mode or dummy data

**Use `dev` (standard mode) when:**
- The user wants to test in their own browser
- The user mentions logging in, real data, or their own account
- OAuth or actual database behavior needs to be tested

## How to start the server

Run the appropriate npm script from the repository root:

```
npm run dev
# or
npm run dev:demo
```

**If running inside Claude Code**, you can use the `preview_start` MCP tool instead, which reads `.claude/launch.json` to determine the startup command. Check that `launch.json` is set to the correct mode before calling `preview_start` — update it locally if not (the file is gitignored).

Confirm the app is available at `http://localhost:3000`.

## Checks

- Prefer reading `package.json` to confirm the intended startup command instead of guessing.
- Expect the app to load environment values from `.env.local` when that file exists.
- If `.env.local` is missing, check `.env.example` for the required variables before concluding startup is blocked.
- If running inside a git worktree (i.e. the working directory is under `.claude/worktrees/`), warn the user that `.env.local` is gitignored and will not be present in the worktree — they will need to manually copy or symlink it from the main repo root.
- Treat a Next.js readiness banner such as `Ready` plus the local URL as successful startup.
- If port `3000` is already in use, inspect whether Finish Line is already running before starting a second copy.

## Output

- Report the local URL.
- Mention whether the server started cleanly or surfaced an error.
- If startup fails, summarize the blocking error and the next most likely fix.
