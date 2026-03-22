Start the Finish Line Next.js app in local development using the `preview_start` tool.

## How to start the app

Use the `preview_start` MCP tool to launch the dev server. The app's `.claude/launch.json` controls which npm script runs.

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

The active configuration is controlled by `.claude/launch.json`. This file is gitignored so each person can set their own preference without affecting others.

If the current `launch.json` uses the wrong mode for what the user wants, update it locally before calling `preview_start`:

- For demo/preview: set `"runtimeArgs": ["run", "dev:demo"]` in the first configuration
- For standard dev: set `"runtimeArgs": ["run", "dev"]` in the first configuration

The default committed state uses `dev`. The `finish-line (demo)` configuration is available as a named option.

After starting, verify the app loaded correctly using `preview_snapshot` or `preview_screenshot`.
