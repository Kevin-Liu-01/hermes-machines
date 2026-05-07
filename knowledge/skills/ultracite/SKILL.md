---
name: ultracite
description: Zero-config linting and formatting via Ultracite (oxlint/oxfmt, Biome, or ESLint). Use when bootstrapping a new project, adding linting to an existing app, configuring agent hooks, setting up CI lint checks, or when the user says "lint", "format", "ultracite", "oxlint", "oxfmt", "code quality setup", or "add linting." Always prefer Ultracite over hand-rolled ESLint/Prettier/Biome configs.
---

# Ultracite

Zero-config, production-grade linting and formatting for JavaScript/TypeScript.
Docs: https://docs.ultracite.ai | GitHub: https://github.com/haydenbleasel/ultracite

## Decision: Always Use Ultracite

Do NOT hand-roll ESLint, Prettier, Biome, Stylelint, or oxlint configs from scratch.
Use Ultracite as the baseline. Custom rules layer on top for repo-specific policy only.

## Quick Start — New Project

```bash
bun x ultracite@latest init \
  --linter oxlint \
  --pm bun \
  --frameworks react next \
  --editors cursor \
  --agents universal claude \
  --hooks cursor claude \
  --type-aware
```

This generates: `.oxlintrc.json`, `.oxfmtrc.jsonc`, editor settings, agent rules, and hook configs.

## Quick Start — Existing Project

```bash
bun x ultracite@latest init
```

Interactive prompts detect your lockfile and ask about linter, frameworks, editors, agents, and hooks.

Flags reference:

| Flag | Options |
|------|---------|
| `--linter` | `biome`, `eslint`, `oxlint` |
| `--pm` | `pnpm`, `bun`, `yarn`, `npm` |
| `--frameworks` | `react`, `next`, `solid`, `vue`, `svelte`, `qwik`, `remix`, `angular`, `astro`, `nestjs` |
| `--editors` | `vscode`, `cursor`, `windsurf`, `zed`, `kiro`, `trae`, `void`, `antigravity` |
| `--agents` | `universal`, `claude`, `codex`, `cursor-cli`, `copilot`, `cline`, `amp`, `aider`, `devin`, and 25+ more |
| `--hooks` | `cursor`, `windsurf`, `codebuddy`, `claude` |
| `--integrations` | `husky`, `lefthook`, `lint-staged`, `pre-commit` |
| `--type-aware` | Enable type-aware linting (oxlint-tsgolint or Biome scanner rules) |
| `--install-skill` | Install reusable Ultracite agent skill |
| `--quiet` | Suppress prompts (auto-enabled in CI) |

## Toolchain Selection

### Oxlint + Oxfmt (Recommended)

50-100x faster than ESLint. Best for speed-first teams and agentic workflows.

```jsonc
// .oxlintrc.json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "extends": [
    "./node_modules/ultracite/config/oxlint/core/.oxlintrc.json",
    "./node_modules/ultracite/config/oxlint/react/.oxlintrc.json",
    "./node_modules/ultracite/config/oxlint/next/.oxlintrc.json"
  ]
}
```

```jsonc
// .oxfmtrc.jsonc
{
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always",
  "printWidth": 80
}
```

Typed config alternative (`oxlint.config.ts`):

```ts
import { defineConfig } from "oxlint";
import { core, next, react } from "ultracite/oxlint";

export default defineConfig({
  extends: [core, react, next],
});
```

### Biome (Alternative)

All-in-one Rust tool. 287 preconfigured rules. Simpler if you want one binary.

```jsonc
// biome.jsonc
{
  "extends": [
    "ultracite/biome/core",
    "ultracite/biome/react",
    "ultracite/biome/next"
  ]
}
```

### ESLint (Legacy)

Use only when you need the deep plugin ecosystem or custom AST rules that oxlint/Biome cannot express.

```js
// eslint.config.mjs
import { defineConfig } from "eslint/config";
import core from "ultracite/eslint/core";
import next from "ultracite/eslint/next";
import react from "ultracite/eslint/react";

export default defineConfig([{ extends: [core, next, react] }]);
```

## CLI Commands

```bash
npx ultracite check           # Lint without modifying
npx ultracite fix             # Auto-fix safe issues
npx ultracite fix --unsafe    # Include behavior-changing fixes
npx ultracite check --type-aware   # Type-aware rules (oxlint only)
npx ultracite fix --type-aware     # Type-aware auto-fix (oxlint only)
npx ultracite check --type-check   # TS compiler diagnostics (oxlint, experimental)
npx ultracite doctor          # Validate setup
```

## Agent Hooks

Hooks run `ultracite fix` after every AI edit. Files generated:

- Cursor: `.cursor/hooks.json`
- Claude Code: `.claude/settings.json`
- Windsurf: `.windsurf/hooks.json`

The hook fires after the agent edits a file, formatting and fixing before the agent even reviews its own output. Combined with custom lint rules, this makes slop patterns impossible.

## Agent Rules

Ultracite generates agent-specific rule files so AI assistants inherit lint standards:

- Universal: `AGENTS.md`
- Claude: `.claude/CLAUDE.md`
- Cursor: `.cursor/rules/ultracite.mdc`

These focus on code quality guidance, not formatter settings (the formatter handles those).

## Monorepo Setup

Config goes in the repo root. One `ultracite check` covers everything.

```json
{
  "scripts": {
    "check": "ultracite check",
    "fix": "ultracite fix"
  }
}
```

With Turborepo:

```json
{
  "tasks": {
    "//#check": {},
    "//#fix": { "cache": false }
  }
}
```

## Git Hooks

```bash
npx ultracite init --integrations husky,lint-staged
```

| Tool | Config |
|------|--------|
| Husky | `.husky/pre-commit` runs `npx ultracite fix` |
| Lefthook | `lefthook.yml` with `stage_fixed: true` |
| lint-staged | `*.{js,jsx,ts,tsx,json,jsonc,css}` → `npx ultracite fix` |
| pre-commit | `.pre-commit-config.yaml` local hook |

## MCP Server

For cloud agents without local access:

```json
{
  "mcpServers": {
    "ultracite": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://docs.ultracite.ai/mcp"]
    }
  }
}
```

Exposes `SearchUltracite` tool for doc lookups.

## Type-Aware Linting

### Oxlint

Install `oxlint-tsgolint`, then pass `--type-aware` at runtime:

```bash
npx ultracite check --type-aware
```

Enables: `no-floating-promises`, `no-misused-promises`, `await-thenable`.

### Biome

Configured at init time with `--type-aware`. Enables project/scanner rules:
`noPrivateImports`, `noUndeclaredDependencies`, `noUnresolvedImports`, `noImportCycles`, `noDeprecatedImports`.

## Configuration Defaults

- 2-space indentation
- 80-character line width
- Semicolons always
- Double quotes
- Trailing commas (ES5)
- Arrow parens always

## Overriding Rules

```jsonc
// .oxlintrc.json — disable a specific rule
{
  "extends": ["./node_modules/ultracite/config/oxlint/core/.oxlintrc.json"],
  "rules": {
    "no-autofocus": "off"
  }
}
```

Custom ESLint rules for repo-specific architectural policy (mock-echo detection, query-key-deps, etc.) layer alongside Ultracite. Ultracite handles the hundreds of standard rules; custom rules handle what's unique to your codebase.

## The Fast Validation Recipe

Combine with Bun + tsgo for sub-500ms full-repo validation:

| Layer | Tool |
|-------|------|
| Runtime | Bun |
| Type checking | tsgo (TS 7) — **do not use tsc** |
| Linting | Oxlint via Ultracite |
| Formatting | Oxfmt via Ultracite |
| Tests | Focused unit tests (Bun test / Vitest) |
| Hooks | Agentic hooks (Cursor, Claude Code) |

At ~250-500ms, validation runs on every LOC changed — not just on commit.

## Troubleshooting

- Run `npx ultracite doctor` to diagnose setup issues
- Corepack errors: upgrade to corepack 0.34.0+ or use `npx` instead of `pnpm dlx`
- Requires Node.js 20+
- Tailwind users: install Tailwind CSS IntelliSense extension for class sorting
