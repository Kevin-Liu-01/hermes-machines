---
name: agent-reach
description: "Internet access for AI agents — read and search Twitter/X, Reddit, YouTube, GitHub, LinkedIn, RSS, and web pages. Zero API fees, CLI-based, fully local. Use when the user asks to research a topic across the internet, fetch live social media posts, get YouTube transcripts, search Reddit threads, read web pages, monitor RSS feeds, or when the user says \"search Twitter\", \"what are people saying about\", \"research this topic\", \"get the latest on\", \"read this tweet\", \"YouTube transcript\", \"Reddit discussion\", or \"check GitHub repos for\". Based on Panniantong/Agent-Reach (16K+ GitHub stars)."
---

# Agent Reach — Internet Access for Agents

Give AI agents the ability to read the entire internet. One CLI install, zero API fees.
Based on [Agent Reach](https://github.com/Panniantong/Agent-Reach) (16K+ GitHub stars).

## Prerequisites

```bash
# Check if installed
agent-reach doctor

# Install if needed
pipx install https://github.com/Panniantong/agent-reach/archive/main.zip
agent-reach install --env=auto
```

## Platform Quick Reference

### Zero-Config (works immediately)

```bash
# Read any web page (primary)
curl -s "https://r.jina.ai/URL"

# Read any web page (fallback — local, no API dependency)
npx defuddle parse URL --markdown

# YouTube — get video metadata + subtitles
yt-dlp --dump-json "https://youtube.com/watch?v=xxx"
yt-dlp --write-sub --skip-download "URL"

# GitHub — repos, issues, PRs
gh repo view owner/repo
gh search repos "LLM framework" --sort stars
gh issue list -R owner/repo

# Reddit — search and read
rdt search "query"
rdt read POST_ID

# RSS — parse any feed
python3 -c "import feedparser; f=feedparser.parse('URL'); print([e.title for e in f.entries[:10]])"

# Exa semantic search (via MCP)
mcporter call 'exa.web_search_exa(query: "topic", num_results: 10)'
```

### Cookie-Required (configure first)

```bash
# Twitter/X — search, read, timeline
twitter search "query" -n 10
twitter tweet URL
twitter timeline -n 20

# Configure Twitter cookies (one-time):
# User exports cookies from Cookie-Editor Chrome extension
agent-reach configure twitter-cookies "COOKIE_STRING"
```

## Multi-Platform Research Pattern

When asked to research a topic, combine platforms:

1. `twitter search "topic" -n 10` — real-time discussion and sentiment
2. `yt-dlp --dump-json URL` — deep-dive video transcripts
3. `gh search repos "topic" --sort stars` — implementations and tools
4. `rdt search "topic"` — community discussions and troubleshooting
5. `mcporter call 'exa.web_search_exa(query: "topic")'` — semantic web search
6. `curl -s "https://r.jina.ai/URL"` — read specific articles (fallback: `npx defuddle parse URL --markdown`)

Synthesize across all sources for a comprehensive answer.

## Web Page Fallback Chain

If Jina Reader fails (rate limit, timeout, error), use defuddle:

```bash
npx defuddle parse URL --markdown     # Markdown content
npx defuddle parse URL --json         # Metadata + content (title, author, published, schema.org)
```

Defuddle runs locally with no API dependency. Output is Obsidian-native Markdown.

## Health Check

```bash
agent-reach doctor    # Shows status of all channels (✅/❌/⚠️)
agent-reach watch     # Quick health + update check
```

## Security Notes

- Credentials stored locally only at `~/.agent-reach/config.yaml` (permission 600)
- Use dedicated/secondary accounts for cookie-based platforms
- All upstream tools are open source and auditable
- `--safe` mode previews without installing; `--dry-run` shows operations
