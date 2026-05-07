---
name: agent-activity-log
description: Bootstrap and maintain a persistent agent memory file (memory.md) in any project. Use when setting up a new project for agent-assisted development, when the user says "add memory", "activity log", "agent memory", "track changes", "memory.md", "set up agent logging", or when starting work on any project that doesn't already have a memory.md. Also triggers on "what did I do last session" or "what's the history of this project."
---

# Agent Activity Log

Persistent agent memory for any project. Initializes a `memory.md` file and enforces
the read-before-act, write-after-change discipline that makes multi-session agent work
compound instead of reset.

See `wiki/concepts/agent-activity-log.md` for the full conceptual framework.

## When to Use

- Setting up a new project for AI-assisted development
- Starting a session in a project that already has `memory.md`
- User asks "what did we do last time" or "what's the project history"
- User says "add agent memory", "set up logging", or "track changes"
- Any project where agents will work across multiple sessions

## Bootstrap Protocol

When initializing `memory.md` in a new project:

### 1. Check if memory.md already exists

```bash
ls memory.md 2>/dev/null || echo "No memory.md found"
```

If it exists, read it and summarize recent activity to the user. Do not overwrite.

### 2. Create memory.md

```markdown
# Agent Activity Log

> Persistent memory for AI agents working on this project. Agents must read this
> file at session start and append after every meaningful change.

## Convention

- **Read first.** Before making changes, read this file to understand project history.
- **Append after changes.** Log decisions, state transitions, and open threads.
- **Never delete.** This file is append-only.
- **Skip noise.** Don't log formatting fixes, import reordering, or trivial typos.

---

```

### 3. Add the read/write constraint to project rules

Append to the project's `.cursorrules`, `AGENTS.md`, or `.cursor/rules/` (whichever
the project uses for agent configuration):

```markdown
## Agent Memory

This project maintains a persistent agent activity log at `memory.md`.

**On every session start:** read `memory.md` to understand what has been done,
what decisions were made, and what open threads exist.

**After every meaningful change:** append an entry to `memory.md` with the format:

    ## [YYYY-MM-DD HH:MM] action-type | Title

    **Changed:** files touched
    **Why:** rationale
    **Decision:** what was chosen and why (if applicable)
    **Open:** unfinished items or follow-ups (if any)

Log decisions, state transitions, bug fixes, and new features. Skip formatting
fixes, import reordering, and trivial typos.
```

### 4. Confirm to the user

Tell the user what was created and where the constraints were added. The agent
memory is now active for all future sessions.

## Session Protocol (ongoing use)

Every time you start a session in a project with `memory.md`:

### Read Phase

1. Read `memory.md` in full (or tail the last 50 entries if it's very long)
2. Identify the most recent changes, open threads, and any active decisions
3. Briefly tell the user: "Last session you worked on X. Open threads: Y, Z."

### Write Phase

After every meaningful change during the session, append an entry. Use the
structured format:

```markdown
## [2026-04-27 14:30] feature | Add user authentication

**Changed:** `src/auth/`, `src/middleware/auth.ts`, `prisma/schema.prisma`
**Why:** User requested login flow with OAuth providers
**Decision:** Chose NextAuth over Clerk — simpler setup, no vendor lock-in,
  project doesn't need Clerk's org management features
**Open:** Need to add rate limiting to login endpoint
```

### Action Types

Use these prefixes to categorize entries:

| Type | When |
|------|------|
| `feature` | New functionality added |
| `fix` | Bug fixed (include root cause) |
| `refactor` | Structure changed without behavior change |
| `decision` | Architectural or design choice made |
| `config` | Configuration, environment, or tooling change |
| `debug` | Investigation session (even if no fix yet) |
| `open` | Thread identified but not addressed |

### What NOT to Log

- Formatting, linting, import reordering
- Reading files without making changes
- Trivial typo fixes
- Routine dependency updates (unless breaking)
- Intermediate save points during a single change

## Adapting to JSON Format

If the project prefers machine-parseable logs, use `memory.json` instead:

```json
{
  "entries": [
    {
      "timestamp": "2026-04-27T14:30:00Z",
      "type": "feature",
      "title": "Add user authentication",
      "changed": ["src/auth/", "src/middleware/auth.ts"],
      "why": "User requested login flow with OAuth providers",
      "decision": "Chose NextAuth over Clerk — simpler, no vendor lock-in",
      "open": ["Rate limiting on login endpoint"]
    }
  ]
}
```

Same read/write discipline applies. Markdown is the default; JSON is for projects
with downstream tooling that parses the log.

## Related Skills

- `wiki/concepts/agent-activity-log.md` — the conceptual framework
- `wiki/concepts/brain-agent-loop.md` — the read-write cycle this pattern implements
- `create-rule` — for adding the constraint to project rules
- `skill-creator` — if extending this pattern into a project-specific variant
