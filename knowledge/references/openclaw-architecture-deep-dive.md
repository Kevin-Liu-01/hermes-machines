# OpenClaw Architecture Deep Dive

Source: Gist by @royosherove (Feb 2026, Opus 4.6)
Saved: 2026-05-17

## Key Architecture Differences from Hermes

### Gateway = Central Nervous System
- Single long-lived Node.js daemon, WebSocket-first (port 18789)
- Typed wire protocol: req/res/event frames with idempotency keys
- Channel bridges: WhatsApp, Telegram, Discord, Slack, Signal, iMessage, WebChat
- Device pairing + trust model (local auto-approve, remote challenge-sign)

### Memory: 4-Layer Stack (vs Hermes 3-tier)
1. Session context (current conversation in context window)
2. Daily logs (memory/YYYY-MM-DD.md, append-only, auto + manual)
3. Long-term memory (MEMORY.md, curated, manual)
4. Semantic vector search (SQLite + embeddings, BM25 + vector hybrid)
- Pre-compaction memory flush: silent turn writes durable notes before compaction

### Identity Files (vs Hermes SOUL.md only)
- AGENTS.md (operating instructions)
- SOUL.md (persona/tone)
- IDENTITY.md (agent name/vibe)
- USER.md (user profile)
- TOOLS.md (local tool notes)
- HEARTBEAT.md (periodic task checklist)

### Skills: 3-tier Priority
- Workspace skills (highest) → Managed skills → Bundled skills (lowest)
- Lazy loading: only metadata in prompt, model reads SKILL.md on demand
- Gating: requires.bins, requires.env, requires.config, os restrictions

### Session Management
- Session keys: main / per-peer / per-channel-peer scoping
- JSONL transcripts at ~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl
- Daily reset (4AM), idle reset, manual reset
- Compaction (summarize + persist) vs pruning (trim tool results, in-memory)

### Sub-Agents
- sessions_spawn/sessions_send for parallel background work
- Isolated sessions, restricted tools, no nesting
- Announce pattern: results posted back to requester
- Dedicated concurrency lane (max 8)
- Cheaper models for sub-agents

### Heartbeat (unique to OpenClaw)
- Every 30m, Gateway fires a heartbeat turn
- HEARTBEAT.md = periodic checklist
- HEARTBEAT_OK = suppressed (nothing urgent)
- Anything else = alert delivered to chat

### Sandbox Modes
- off / non-main / all
- Scope: session / agent / shared
- Workspace access: none / ro / rw
- Escape: tools.elevated for authorized senders

### Hooks + Plugins
- Hooks: event-driven scripts (command:new, agent:bootstrap, gateway:startup)
- Plugins: in-process TypeScript extensions with full lifecycle access
- Can register tools, CLI commands, RPC methods, HTTP handlers

### Command Queue
- Lane-aware FIFO: global (max 4) → session (strict serial) → sub-agent (8) → cron
- Queue modes: collect (default) / steer / followup / steer-backlog
