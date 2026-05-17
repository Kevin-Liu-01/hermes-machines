# Claude Code Architecture (Deep Dive)

Source: waiterxiaoyy/Deep-Dive-Claude-Code (13 chapters, 960+ files)
Saved: 2026-05-17

## Core Architecture (from source analysis)

### Agent Loop (QueryEngine)
- QueryEngine class: one instance per session, stateful across turns
- AsyncGenerator return type for streaming + cancellation
- Core: build system prompt → API call (streaming) → tool execution → loop
- Stop conditions: stop_reason, maxTurns, maxBudget, abort signal

### Message Types (production vs teaching)
- UserMessage, AssistantMessage, SystemMessage
- AttachmentMessage, ProgressMessage, ToolUseSummaryMessage
- TombstoneMessage (placeholder for compacted messages)
- SystemLocalCommandMessage

### Tool System (50+ tools)
- Registration-based: register a handler, gain an ability
- Permission engine: every operation is checked (canUseTool injection)
- Shell security: 300KB+ of bashSecurity.ts + bashParser.ts

### Prompt Engineering
- System prompt is a dynamically assembled pipeline (not static)
- CLAUDE.md at project root for behavior docs
- Context-aware assembly per turn

### Context Management
- Auto-compact when window fills
- Reactive compact (feature-flagged)
- Context collapse (feature-flagged)
- Session memory persistence

### MCP Protocol
- First-class MCP support (same as Codex CLI)
- Unified tool-call standard
- Client + auth in services/mcp/

### Multi-Agent
- Agent/Team/Swarm patterns
- AgentTool for delegation
- Subagent spawning

### Hidden Features (feature flags)
- Buddy: pair programming mode
- Kairos: timing/scheduling
- Ultraplan: complex planning
- Undercover: stealth mode
- Daemon: background service mode
- UDS: Unix domain socket transport

### Production Patterns
- Session storage persistence
- Analytics pipeline
- Error classification + retry
- Token budget enforcement
- Profiling + observability

## Key Files
| File | Purpose |
|------|---------|
| QueryEngine.ts | Session manager, one per conversation |
| query.ts | Core agent loop (67KB production) |
| Tool.ts | Tool registration + execution |
| prompts.ts | Dynamic system prompt assembly |
| bashSecurity.ts | Shell command security |
| permissions.ts | Permission engine |
| compact.ts | Context window compression |
| mcp/client.ts | MCP protocol client |
| AgentTool.tsx | Multi-agent delegation |
