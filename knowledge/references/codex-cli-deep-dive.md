# Codex CLI Deep Dive: Config, Profiles, Sandbox

Source: digitalapplied.com (May 2026, versions 0.128-0.130)
Saved: 2026-05-17

## Key Architecture

### Config-First Philosophy
- ~/.codex/config.toml is the source of truth
- Flat top-level keys + [profiles.NAME] + [mcp_servers.NAME]
- Any top-level key overrideable per-profile
- No extends/chain -- profiles inherit from top-level defaults

### Named Profiles (the leverage)
- Activate via --profile NAME or CODEX_PROFILE env
- Design per-environment, not per-person
- Recommended layout: dev / ci / prod / agent

| Profile | Sandbox | Approval | Auth |
|---------|---------|----------|------|
| dev | workspace-write | never | OAuth |
| ci | workspace-write | untrusted | API key |
| prod | read-only | untrusted | API key |
| agent | workspace-write (narrowed) | untrusted | API key |

### Three Sandbox Modes
- read-only: observe/report agents, no filesystem writes
- workspace-write: writes scoped to workspace, network off by default
- danger-full-access: unrestricted, ephemeral containers ONLY

### MCP Integration
- [mcp_servers.NAME] tables, same protocol as Claude Code
- STDIO: command/args/env. HTTP: url + bearer_token_env_var
- Shared across profiles by default
- Same MCP server runs under both Codex and Claude Code

### vs Claude Code (5-axis)
1. Config model: Codex wins (declarative TOML vs flat JSON + CLAUDE.md)
2. Sandbox: Tie (mode-based vs permission-based)
3. MCP: Tie (protocol is portable)
4. Headless auth: Slight edge Codex (OAuth + API key)
5. Editor integration: Claude Code wins (VS Code extension)

### Workflow Archetypes
1. Test-generation pipeline (ci, workspace-write, API key)
2. Codemod batch run (agent, danger-full-access, ephemeral)
3. Incident-triage agent (prod, read-only, API key)
4. Interactive dev session (dev, workspace-write, OAuth)
