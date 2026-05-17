# Akshay Pachaar -- Hermes Agent Deep Dive

Source: X thread / blog post by @akshay_pachaar (Nous Research)
Saved: 2026-05-17

## Summary

Comprehensive guide covering Hermes Agent architecture, the self-improving
learning loop, and how to go from 1 to 10 specialized agents.

## Key Architecture Points

### Identity: SOUL.md
- Slot #1 in system prompt, before everything else
- Hand-authored, static -- defines personality, tone, hard limits
- Falls back to built-in default if missing
- Everything (memory, skills, consolidation) happens through this lens

### Memory: Three Tiers
1. **Tier 1: Markdown files** -- MEMORY.md (2,200 chars max) + USER.md (1,375 chars max). Injected into system prompt as frozen snapshot at session start. Agent prunes at ~80% capacity.
2. **Tier 2: FTS5 session search** -- Every conversation stored in SQLite with full-text search. Unlimited capacity but requires active search + LLM summarization.
3. **Tier 3: External providers** -- 8 pluggable memory providers (only one active at a time). Auto-prefetches before each turn, syncs after responses.

### Self-Evolving Skills
- SKILL.md files with YAML frontmatter = procedural memory
- Progressive disclosure: Level 0 (names only ~3k tokens) → Level 1 (full content) → Level 2 (reference files)
- Triggers: 5+ tool calls, errors/dead-ends, user corrections, non-trivial workflows
- Tool: `skill_manage` with 6 actions: create, patch, edit, delete, write_file, remove_file

### The Curator (Garbage Collection)
- Runs on inactivity check: 7 days since last run + 2 hours idle
- Background fork with own prompt cache, never touches active conversation
- Phase 1 (deterministic): 30d unused → stale, 90d unused → archived
- Phase 2 (LLM): up to 8 iterations reviewing agent-created skills
- Never touches bundled/hub skills. Never auto-deletes (worst case: archive)
- Snapshot before every pass. Rollback is one command.
- Pin critical skills with `hermes curator pin <skill>`

### GEPA (Genetic-Pareto Prompt Evolution)
- Separate repo: NousResearch/hermes-agent-self-evolution
- ICLR 2026 Oral paper, MIT licensed
- Reads execution traces to understand WHY things failed
- Evolutionary search: generate candidates → LLM-as-judge scoring → constraint gates
- Constraints: 100% test pass, <15KB skills, caching compatibility, semantic stability
- Output: PR against Hermes repo, never direct commit
- Cost: ~$2-10 per optimization run, no GPU needed

### Skills Hub
- 687 skills across 18 categories
- 87 built-in, 79 optional, 16 from Anthropic, 505 from LobeHub
- Custom taps: `hermes skills tap add yourname/your-skills-repo`

### Profiles (Multi-Agent)
- Fully isolated instances: own config, memory, skills, sessions, SOUL.md
- `hermes profile create designer --clone`
- Each gets its own Telegram bot
- Examples: designer (image generation), programmer (Claude Code delegation), researcher (daily digest)

### Cron
- Built-in scheduler, gateway daemon ticks every 60s
- Plain English schedule descriptions
- Skill attachment: `--skill blogwatcher`
- Chain jobs: `context_from` flag for multi-stage automations
- Output delivered to messaging platform

### Claude Code Delegation
- Programmer profile delegates to Claude Code CLI
- Hermes orchestrates, Claude Code does file edits/commands/git
- Works with Claude Max subscription (no separate API key)
- Print mode (one-shot) and interactive mode (tmux)

## ~/.hermes/ Layout

```
~/.hermes/
├── config.yaml           # Main configuration
├── .env                  # API keys and secrets
├── SOUL.md               # Agent identity
├── memories/
│   ├── MEMORY.md         # Persistent agent facts
│   └── USER.md           # User model
├── skills/               # All skills
│   └── .hub/             # Skills Hub state
├── sessions/             # Per-platform session metadata
├── state.db              # SQLite with FTS5
├── cron/
│   ├── jobs.json         # Scheduled jobs
│   └── output/           # Cron run outputs
├── plugins/              # Custom plugins
├── hooks/                # Lifecycle hooks
├── skins/                # CLI themes
└── logs/                 # agent.log, gateway.log, errors.log
```
