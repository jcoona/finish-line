---
name: start-finish-line
description: Start the Finish Line Next.js application in local development. Use when a user asks to start, launch, boot, or run Finish Line locally, or when an assistant needs the repo-specific steps to bring up the app and verify the local URL.
---

# Start Finish Line

Start the app from the Finish Line repository root.

## Workflow

1. Confirm you are in the Finish Line repository root by checking for `package.json` and `README.md`.
2. Assume local dependencies are already installed unless the command fails with a missing-package error.
3. Start the development server with `npm run dev` from the repository root.
4. Keep the process alive in a persistent terminal session and poll once for readiness.
5. Confirm the app is available at `http://localhost:3000`.

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
