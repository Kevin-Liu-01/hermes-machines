---
name: db
description: Run read-only SQL queries against Supabase databases (local or remote). Use when inspecting schema, debugging data, checking migrations, or answering questions about database state.
allowed-tools: Bash(node --experimental-strip-types *)
argument-hint: "[--env local|dev|preview] [--db core|admin] <sql>"
---

## Context

- Databases: !`cat packages/python/cli/databases.yml`
- Local Supabase status: !`pnpm db status 2>&1 | head -10`

## Query script

The query tool lives at `${CLAUDE_SKILL_DIR}/scripts/query.ts`. Run it with:

```bash
node --experimental-strip-types ${CLAUDE_SKILL_DIR}/scripts/query.ts [flags] "<sql>"
```

Flags:
- `--env local|dev|preview|prod` (default: local)
- `--db core|admin` (default: core)
- `--readonly` (enforced by this skill, always pass it)
- `--format table|json|csv` (default: table)

## Credentials

Remote connections resolve credentials in order: `SUPABASE_DB_PASSWORD` env var > `~/.pgpass`.

If neither is available, fetch from AWS SSM (requires active SSO session):

```bash
# Prod (admin profile, account 717408097146)
aws ssm get-parameter --name "/prod/SUPABASE_DB_PASSWORD" --with-decryption --query "Parameter.Value" --output text --profile admin

# Dev/preview passwords are not in SSM. Use ~/.pgpass or ask a teammate.
```

To populate `~/.pgpass` (one entry per environment):

```
# Format: hostname:port:database:username:password
db.<project_ref>.supabase.co:5432:postgres:postgres:<password>
```

See `packages/python/cli/databases.yml` for project refs per environment.

## Schema reference

Generated Supabase types with full table schemas, enums, and function signatures:
- **Core DB**: `packages/typescript/databases/core/database.types.ts`
- **Admin DB**: `packages/typescript/databases/admin/database.types.ts`

Read the relevant file when you need column names, types, enums, or relationships.
The `Database` type has schemas (public, billing, oauth, dcs) with `Tables`, `Enums`, and
`Functions` for each. Each table has `Row` (all columns typed), `Insert`, and `Update` variants.

## Rules

1. **Always pass `--readonly`.** This skill is read-only. For mutations, the user must invoke `/db-write`.
2. **Never target prod** unless the user explicitly says "prod" or "production."
3. Default to `--env local` unless the user specifies otherwise.
4. For schema exploration, start with `information_schema.tables` and `information_schema.columns`.
5. Format as `--format json` when the user wants structured output or when piping to analysis.
6. Format as `--format table` for human-readable display (default).
7. Quote identifiers that may conflict with SQL keywords.

## Task

Run the user's query with `--readonly` enforced. If the user provides a question instead of SQL,
translate it to the appropriate query. If ambiguous, list tables first.

$ARGUMENTS
