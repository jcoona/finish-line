Start the Finish Line Next.js app in local development using the `start-finish-line` skill.

When running in Claude Code, use the `preview_start` MCP tool to launch the server — it reads `.claude/launch.json` for the startup command. Check that `launch.json` is set to the correct mode first and update it locally if needed (the file is gitignored).

After starting, verify the app loaded correctly using `preview_snapshot` or `preview_screenshot`.
