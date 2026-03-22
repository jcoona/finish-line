---
name: start-finish-line
description: Start the Finish Line Next.js application in local development. Use when a user asks to start, launch, boot, or run Finish Line locally, or when an assistant needs the repo-specific steps to bring up the app and verify the local URL.
---

# Start Finish Line

Start the app from the Finish Line repository root using the `preview_start` MCP tool, which reads `.claude/launch.json` to determine the startup command.

## Choosing the right mode

The project has two npm scripts:
- `npm run dev` — standard dev mode, requires real OAuth and database setup
- `npm run dev:demo` — demo mode with `DEMO_MODE=true`, uses dummy data, no OAuth or DB required

**Use `dev:demo` (demo mode) when:**
- The user wants Claude Preview / Claude's built-in browser
- The user mentions demo mode, dummy data, or preview
- You are verifying UI changes in Claude's preview pane
- No real auth or database is needed

**Use `dev` (standard mode) when:**
- The user wants to test in their own browser (Chrome, Safari, etc.)
- The user mentions logging in, real data, or their own account
- OAuth or actual database behavior needs to be tested

## launch.json

The active configuration is controlled by `.claude/launch.json`. This file is gitignored so each person can set their own preference without affecting others. The default committed state uses `dev`; a named `"finish-line (demo)"` configuration using `dev:demo` is also included as a reference.

If the current `launch.json` uses the wrong mode for what the user wants, update it locally before calling `preview_start`:

- For demo/preview: set `"runtimeArgs": ["run", "dev:demo"]` in the first configuration
- For standard dev: set `"runtimeArgs": ["run", "dev"]` in the first configuration

## Workflow

1. Determine which mode is needed based on what the user wants (see above).
2. Check `.claude/launch.json` and update it locally if the mode is wrong.
3. Use `preview_start` to launch the dev server.
4. Confirm the app is available at `http://localhost:3000`.

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
