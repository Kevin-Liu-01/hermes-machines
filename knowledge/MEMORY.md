# Memory

## Environment

- I run inside a Dedalus Machine. Persistent state lives at `/home/machine`. Root filesystem resets on wake; never put real work there.
- LLM provider is `openai`-compatible at `https://api.dedaluslabs.ai/v1`, routed by Dedalus to 200+ underlying models. The `DEDALUS_API_KEY` is the only credential needed for inference.
- API server is exposed on port `8642` and reachable from the public internet via a Dedalus preview URL. The bearer token is in `~/.hermes/.env` as `API_SERVER_KEY`.
- Web dashboard runs on port `9119` if `hermes web` was started.

## Conventions Kevin follows (apply to my own outputs)

- ASCII over Unicode lookalikes (`->` not `→`, `>=` not `≥`).
- No emoji in code, comments, docs, commits.
- Conventional Commits (`type(scope): description`); never use "and" in a commit message.
- 70-line functions, 500-line files, 200-LOC PRs.
- `git switch` over `git checkout`. `--force-with-lease` over `--force`.
- Production DBs/infra are sacred. No `DROP INDEX`, `ALTER TABLE`, manual SSM edits, dashboard SQL.

## Tools available

`terminal`, `read_file`, `write_file`, `patch`, `search`, `web_search`, `web_extract`, `browser_*` (Playwright), `vision_analyze`, `image_generate` (FAL), `tts`, `skills_list`/`skill_view`, `memory`, `session_search`, `cronjob`, `delegate_task`, `execute_code` (Python sandbox).

Plus four MCP tools from `mcp_servers.cursor` (the cursor-bridge to the Cursor TypeScript SDK):

- `cursor_agent` — spawn a Cursor coding agent against a working directory. Full file/terminal access, full codebase semantic search, the same agent that runs in the Cursor IDE. Use when the user asks for real code work.
- `cursor_resume` — continue a previous Cursor agent conversation by ID.
- `cursor_list_skills` — list local Hermes skills available for injection into Cursor prompts.
- `cursor_models` — list Cursor models the API key can use.

## Loaded skills

Curated from `kevin-wiki`. Each lives at `~/.hermes/skills/<name>/SKILL.md`:

- `agent-ethos` — minimal-fix philosophy
- `empirical-verification` — scientific method for code
- `production-safety` — never patch prod
- `git-workflow` — switch/restore, worktrees, commits
- `kevin-voice` — write about Kevin in his own voice
- `content-strategy` — what to post and when
- `frontend-design-taste` — anti-slop UI rules
- `reticle-design-system` — Reticle/Sigil tokens and components
- `automation-cron` — schedule recurring agent tasks
- `security-audit` — adversarial code review
- `computer-use` — browser automation patterns
- `plan-mode-review` — structured review checklist
- `taste-output` — never truncate or stub generated code
- `dedalus-machines` — how this VM is wired
- `cursor-coding` — when and how to delegate code work to a Cursor agent via the `cursor_agent` MCP tool

## Cron automations

Pre-seeded; check `hermes cron list`. Includes daily wiki digest, weekly skill audit, hourly health check.
