---
name: deepsec
description: >-
  Run vercel-labs/deepsec — an agent-powered vulnerability scanner — against
  any local codebase. Use when Kevin says "deepsec", "security scan", "scan
  this repo for vulns", "find security bugs in <repo>", "audit <project> for
  vulnerabilities", "production security review", or before shipping a new
  service. Performs a regex pre-scan, dispatches Opus 4.7 / GPT 5.5 at max
  reasoning to investigate each candidate, revalidates to cut false positives,
  and exports actionable findings. Cost-aware: always run a `--limit 50`
  calibration before a full scan.
---

# deepsec — Agent-Powered Vulnerability Scanner

Run [vercel-labs/deepsec](https://github.com/vercel-labs/deepsec) — Vercel's
open-source security harness — against any local codebase Kevin asks to audit.
deepsec installs into a `.deepsec/` directory inside the target repo (checked
into the same git repo so config and matchers travel with the code) and uses
coding agents to investigate security-sensitive files at maximum thinking.

## When this fires

- Kevin says "deepsec", "security scan <repo>", "scan <repo> for vulns",
  "find security bugs in <project>", "audit X for vulnerabilities", or
  "run a security review on <path>"
- Before shipping a new service or backend to production
- After a CVE drops in a peer/customer codebase
- Customer / open-source repo due diligence (Kevin reviewing partner repos
  the way Vercel did with dub.co and Unkey)
- Periodic deep audit on Sigil UI, Dedalus monorepo, or any repo Kevin owns

## Cost discipline (read this before running anything)

deepsec uses Opus 4.7 / GPT 5.5 at **max reasoning**. Full scans cost real
money:

| Files | Approx cost | Approx wall time |
|-------|-------------|------------------|
| 100 | $25–60 | 5–15 min |
| 500 | $130–300 | 25–60 min |
| 2,000 | $500–1,200 | 1.5–4 hr |

**Iron rule: never run a full `process` without explicit confirmation from Kevin
of the expected dollar amount.** Always start with `--limit 50` to calibrate.
For repos > 1,000 files, propose Vercel Sandbox fanout or Codex/GPT 5.5 as a
cheaper backend before suggesting a default Opus run.

## Prerequisites

- Node.js 22+ (`node -v`)
- `pnpm` available (deepsec scaffold uses pnpm; npm/yarn work but pnpm is
  the documented path)
- One of:
  - Logged-in `claude` CLI subscription (default — non-sandbox runs reuse it)
  - Logged-in `codex` CLI subscription
  - `AI_GATEWAY_API_KEY=vck_...` (Vercel AI Gateway — covers both Claude and
    Codex with one token)
  - Or explicit `ANTHROPIC_AUTH_TOKEN` / `OPENAI_API_KEY`

If sandbox fanout is needed: a Vercel account with OIDC tokens or access tokens.

## The pipeline

```
init → INFO.md → scan → process → triage → revalidate → export
       (project-aware    (regex,    (AI,       (P0/P1/P2)  (re-check  (markdown
       context for the   no AI,     expensive,             code +     or JSON)
       prompts)          ~15s)      iterative)             git
                                                           history)
```

## Procedure

### Phase 1 — Init the scaffold

From inside the target repo's root (NOT from `.deepsec/`):

```bash
npx deepsec init
cd .deepsec
pnpm install
```

This creates `.deepsec/` with:

- `package.json` — pinned deepsec install
- `deepsec.config.ts` — one `projects[]` entry pointing at `..`
- `data/<id>/INFO.md` — the per-project context document (placeholders)
- `data/<id>/SETUP.md` — agent prompt for filling INFO.md
- `AGENTS.md`, `.env.local`, `.gitignore`

Open `.env.local` and fill in `AI_GATEWAY_API_KEY` (or rely on logged-in
`claude` / `codex`). Kevin's typical setup: rely on his existing Claude
subscription unless this is a CI run.

### Phase 2 — Fill `INFO.md` (project-aware context)

INFO.md is **injected into every scan batch's prompt**. Vague INFO.md →
vague findings. Quality of this file is the highest-leverage tunable.

In the **parent repo** (NOT inside `.deepsec/`):

1. Read `.deepsec/node_modules/deepsec/SKILL.md` (deepsec's bundled skill)
   to internalize the format the tool expects.
2. Open `.deepsec/data/<id>/SETUP.md` for project-specific instructions.
3. Skim:
   - The repo `README.md`
   - Any `AGENTS.md` / `CLAUDE.md` / `.cursorrules`
   - 5–10 representative source files (entry points, auth, data layer,
     middleware)
4. Replace each section of `.deepsec/data/<id>/INFO.md`.

**Writing rules for INFO.md:**

- Target **50–100 lines total**. Verbose context dilutes signal.
- 3–5 examples per section, not exhaustive enumeration.
- Name primitives (auth helpers, middleware functions, ORM patterns) but
  no line numbers.
- Skip generic CWE categories — built-in matchers cover those.
- Cover only what's project-specific (custom auth, custom rate limiter,
  in-house ORM patterns).

### Phase 3 — Scan (regex, no AI, ~15s)

```bash
pnpm deepsec scan
```

Runs ~110 regex matchers across the codebase. Output goes to
`data/<id>/files/` as one `FileRecord` JSON per scanned source file.
Then:

```bash
pnpm deepsec status
```

Shows files scanned, files pending AI investigation, count of candidate
sites. **Report this to Kevin before proceeding to process.**

### Phase 4 — Calibrate before full process

Always start with a limit:

```bash
pnpm deepsec process --limit 50 --concurrency 5
```

Defaults: Claude Opus, 5 files per batch, 5 batches in parallel. With
`--limit 50` you'll see real cost per file on this codebase. Multiply
out, **show Kevin the projected total cost**, get explicit approval
before lifting the limit.

For a cheaper backend:

```bash
pnpm deepsec process --agent codex --model gpt-5.5 --limit 50
```

### Phase 5 — Full process (only after Kevin approves cost)

```bash
pnpm deepsec process --concurrency 5
```

Idempotent — interrupt and re-run, deepsec picks up where it stopped.

### Phase 6 — Triage and revalidate (cheap quality boost)

```bash
pnpm deepsec triage --severity HIGH      # ~1¢/finding, P0/P1/P2 labels
pnpm deepsec revalidate --min-severity HIGH  # cuts FP rate by 50%+
```

Both optional but worth running on the HIGH/CRITICAL set before showing
findings to Kevin or anyone else.

### Phase 7 — Enrich with git ownership (optional)

```bash
pnpm deepsec enrich
```

Adds git committer info to each finding. With a custom plugin, can add
ownership/team data.

### Phase 8 — Export findings

```bash
pnpm deepsec export --format md-dir --out ./findings
pnpm deepsec export --format json --out findings.json
pnpm deepsec metrics                    # cross-project counts
```

`md-dir` → one markdown file per finding under
`./findings/{CRITICAL,HIGH,MEDIUM,LOW}/`. Each file is structured to be
pasted directly into a Linear/GitHub issue or fed to a coding agent for
remediation.

## Vercel Sandbox fanout (large codebases)

For monorepos > 1,000 files where local scanning would take days:

```bash
pnpm deepsec sandbox process \
  --project-id my-app \
  --sandboxes 10 \
  --concurrency 4
```

Tarballs the working tree (excludes `.git`), uploads to Vercel Sandbox
microVMs, runs in parallel. API keys stay outside the sandbox so they
can't be exfiltrated. Vercel runs scans on their own monorepos at 1,000+
concurrent sandboxes.

Requires `AI_GATEWAY_API_KEY` and a Vercel account. See
[docs/vercel-setup.md](https://github.com/vercel-labs/deepsec/blob/main/docs/vercel-setup.md).

## Custom matchers (compounding the signal)

After a first scan, ask the agent to write project-specific matchers:

> Inspect previous deepsec runs against `./my-app`. Are there custom matchers
> we should add to find more candidates for vulnerabilities? Look at the
> auth model, data layer, and team conventions.

Each new matcher widens the regex pre-scan's coverage without adding AI
cost. This is how Vercel built their internal "every authentication path"
scanner.

See [docs/writing-matchers.md](https://github.com/vercel-labs/deepsec/blob/main/docs/writing-matchers.md).

## Triaging the output for Kevin

deepsec has a 10–20% false positive rate (per Vercel; revalidate cuts it).
When presenting findings to Kevin:

1. Lead with **CRITICAL** and **HIGH** (after revalidate).
2. For each: cite file:line, the bug class (auth bypass / SSRI / SQLi /
   etc.), the data flow (where untrusted input enters → where it's used),
   and a suggested fix.
3. **Verify each Critical/High yourself** — read the cited lines, trace
   the flow, confirm the path is reachable. deepsec is a hunter, not an
   oracle.
4. Group MEDIUM findings by class to avoid noise.
5. Discard LOW findings that are pure defense-in-depth with no reachable
   attacker path.

## Iron rules

- **Never run `process` without `--limit` on first invocation.** Always
  calibrate.
- **Never run a full process without Kevin's explicit cost approval.**
  Show projected dollar amount, await approval.
- **Verify every CRITICAL and HIGH yourself** before presenting to Kevin.
- **Don't fix bugs during the audit.** Report only. Kevin decides what to
  fix and when.
- **Treat deepsec like a coding agent with full shell access.** If running
  on untrusted vendored code, prefer sandbox mode.
- **`.deepsec/` is checked into git** (config, matchers). Generated output
  in `data/<id>/files/`, `data/<id>/runs/` is gitignored.

## Codifying back into the wiki

After a scan that surfaces new patterns:

1. If the matcher set was extended, document the new matcher in
   `wiki/tools/deepsec.md` under "Custom matchers used".
2. If a postmortem-worthy bug was found, draft a page in
   `wiki/postmortems/`.
3. If a new security pattern was learned, add to the appropriate concept
   page (e.g., `wiki/concepts/auth-condition-edge-cases.md`).
4. Append the scan to `wiki/log.md`:
   `## [YYYY-MM-DD] security-scan | <repo> — N findings (C: x, H: y, M: z)`

## Reference

- [README](https://github.com/vercel-labs/deepsec)
- [getting-started](https://github.com/vercel-labs/deepsec/blob/main/docs/getting-started.md)
- [models](https://github.com/vercel-labs/deepsec/blob/main/docs/models.md)
- [writing-matchers](https://github.com/vercel-labs/deepsec/blob/main/docs/writing-matchers.md)
- [plugins](https://github.com/vercel-labs/deepsec/blob/main/docs/plugins.md)
- [vercel-setup](https://github.com/vercel-labs/deepsec/blob/main/docs/vercel-setup.md)
- [architecture](https://github.com/vercel-labs/deepsec/blob/main/docs/architecture.md)
- [data-layout](https://github.com/vercel-labs/deepsec/blob/main/docs/data-layout.md)
- [faq](https://github.com/vercel-labs/deepsec/blob/main/docs/faq.md)

## Related skills

- [[bugs]] — adversarial CTF-style audit using subagents (complementary:
  use bugs for surgical attack-surface review, deepsec for comprehensive
  scan)
- [[skill-auditor]] — vet skills before installation
- [[security-best-practices]] — language/framework-specific review
- [[security-threat-model]] — repository-grounded threat modeling
