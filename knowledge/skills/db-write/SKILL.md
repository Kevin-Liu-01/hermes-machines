---
name: db-write
description: Run mutating SQL (INSERT, UPDATE, DELETE, DDL) against Supabase databases. Requires explicit user invocation. Use for migrations, seed data, schema changes, or data fixes.
allowed-tools: Bash(node --experimental-strip-types *)
argument-hint: "[--env local|dev|preview] [--db core|admin] <sql>"
disable-model-invocation: true
---

## Context

- Databases: !`cat packages/python/cli/databases.yml`
- Local Supabase status: !`pnpm db status 2>&1 | head -10`

## Query script

The query tool lives at `${CLAUDE_SKILL_DIR}/../db/scripts/query.ts`. Run it with:

```bash
node --experimental-strip-types ${CLAUDE_SKILL_DIR}/../db/scripts/query.ts [flags] "<sql>"
```

Flags:
- `--env local|dev|preview|prod` (default: local)
- `--db core|admin` (default: core)
- `--format table|json|csv` (default: table)

Note: do NOT pass `--readonly`. This skill is for mutations.

## Credentials

Same as `/db`. See that skill for credential resolution order and SSM instructions.

## Schema reference

Generated Supabase types with full table schemas, enums, and function signatures:
- **Core DB**: `packages/typescript/databases/core/database.types.ts`
- **Admin DB**: `packages/typescript/databases/admin/database.types.ts`

Read the relevant file when you need column names, types, enums, or relationships.

## Rules

1. **NEVER target prod.** Refuse all prod mutations. Production changes go through migrations
   deployed via the pipeline (dev -> preview -> prod). See AGENTS.md "Production is Sacred."
2. **Confirm before executing** on any remote environment (dev, preview). Show the SQL and
   target environment, then ask the user to confirm.
3. Default to `--env local` unless the user specifies otherwise.
4. For DDL (CREATE, ALTER, DROP), prefer `pnpm db diff --execute` for tracked migrations.
   Only use raw DDL for local experimentation.
5. Show the SQL you intend to run before running it.

## Task

Run the user's mutation. Always show the SQL and target before executing. For remote envs,
require explicit confirmation.

$ARGUMENTS
