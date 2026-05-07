---
name: postmortem
description: Run a blameless postmortem for a production incident. Investigate with data, write a structured report, build verification queries, and track remediation. Use when something broke in production, money was lost, users were affected, or a security issue was exploited.
---

# Postmortem

Structured incident response. Investigate first, write second, verify third.

## When to use

- Production outage or degradation
- Financial loss (billing bugs, fraud, credit abuse)
- Security incident (unauthorized access, data leak, bot abuse)
- Silent failure discovered after the fact (broken integration, dead code path)
- Any event where the team needs a shared written record of what happened

## Philosophy

A postmortem is a forensic document, not a blame report. It answers:

1. **What happened?** (timeline, evidence, impact)
2. **Why did it happen?** (root causes, not symptoms)
3. **How do we know the fix works?** (verification queries, not vibes)
4. **How do we prevent recurrence?** (structural fixes, not patches)

Every claim must be backed by data. "We think X" is not acceptable.
"Query Y returned Z, which proves X" is acceptable.

## Workflow

### Phase 1: Investigate

Gather evidence before forming theories. Use every tool available.

**Database queries** (`/db` skill):
- Query production data to quantify impact (how many users, how much money, what time range)
- Cross-reference tables to find patterns (which accounts, what behavior, what correlation)
- Always use `--readonly` and `--env prod` (only when the user confirms production)
- Save the queries in the postmortem so anyone can re-run them

**Git history** (`git log`, `git blame`):
- Build a commit timeline for the affected code paths
- Identify who changed what and when (for context, not blame)
- Find the commit that introduced the bug vs. commits that tried to fix it
- Use `git log --format="%h %ad %an %s" --date=short` for clean timelines

**External service dashboards** (Stripe, Clerk, Vercel, AWS):
- Use MCP tools when available (Stripe MCP, Supabase MCP, etc.)
- Use CLI tools (`gh`, `aws`, `stripe`) when MCP is not available
- Screenshot or copy dashboard data as evidence

**Code reading**:
- Trace the full code path from entry point to failure
- Read the actual production code, not what you think it does
- Check for race conditions, silent error swallowing, missing validation
- Verify claims against the code ("the threshold is 90" -- is it really?)

**Documentation and Slack threads**:
- Read integration docs to check if the implementation matches the spec
- Check Slack/chat history for context on why decisions were made
- Note discrepancies between what was communicated and what was shipped

### Phase 2: Write

Use the template below. Every section is mandatory. "N/A" is not acceptable
for Summary, Impact, Timeline, Root Causes, or Action Items.

### Phase 3: Verify

Write SQL queries (or equivalent checks) that prove each fix works. These
go in the Verification Plan section. Each query has explicit pass/fail
criteria. Run them at T+1h, T+6h, T+24h, T+72h after the fix deploys.

### Phase 4: Remediate

Track fixes with the action items table. Each item has an owner, a status,
and a priority. Close items as they ship. Update the postmortem when the
verification queries confirm the fix is working.

## Template

Write the postmortem as a Markdown file in the affected app directory
(e.g., `apps/website/POSTMORTEM-YYYY-MM-DD-short-description.md`).

```markdown
# Postmortem: [Short title describing the incident]

**Date**: YYYY-MM-DD
**Severity**: P0 (outage) | P1 (financial/security) | P2 (degradation) | P3 (minor)
**Authors**: [Who wrote this postmortem]
**Status**: Active | Monitoring | Resolved

## Summary

2-3 sentences. What happened, what was the impact, what was the root cause.
A reader should understand the incident from this paragraph alone.

## Impact

| Metric | Value |
| ------ | ----- |
| [relevant metric] | [measured value] |
| [relevant metric] | [measured value] |

Quantify everything. Revenue lost, users affected, duration, error rates.
Use database queries to get exact numbers, not estimates.

## Timeline

All dates are YYYY. Times are approximate.

**[Date]** -- [What happened]. Include commit hashes, config changes,
and who did what. Be specific enough that a reader can reconstruct
the sequence of events without asking anyone.

Organize into phases if the incident had distinct stages (e.g.,
"Integration", "First wave", "Mitigation attempt", "Resolution").

## Root causes

Number each root cause. For each one:
- State the cause in one sentence
- Explain the mechanism (how the code/config/process failed)
- Cite the evidence (query results, code snippets, logs)

Root causes are structural, not human. "Kevin made a mistake" is not
a root cause. "The webhook evaluation swallowed errors silently,
producing no observable signal that it was failing" is a root cause.

## What went well

Bullet list. Acknowledge what worked. Defense layers that held,
monitoring that caught things, people who responded quickly.

## What went wrong

Bullet list. Process failures, missing tests, ignored signals,
architectural gaps. Each item should suggest a preventable failure.

## Remediation

For each fix deployed, describe:
- What layer it addresses
- What the code change does (1-2 sentences)
- Which root cause it resolves

## Verification plan

For each fix, write a concrete query or check with explicit pass/fail
criteria. Specify the cadence (T+1h, T+6h, T+24h, T+72h).

Format:

### N. [What this verifies]

```sql
SELECT ... FROM ... WHERE ...
```

**Pass**: [What the result should look like if the fix works]
**Fail**: [What the result looks like if the fix is broken, and what to do]

## Remaining action items

| # | Action | Owner | Priority | Status |
|---|--------|-------|----------|--------|
| 1 | [specific action] | @handle | P0/P1/P2 | Done/Pending |

## Appendix: Commit timeline

| Date | Hash | Author | Description |
| ---- | ---- | ------ | ----------- |
| [date] | `[hash]` | [author] | [commit message] |

## Appendix: [Additional context]

Bot fingerprints, error samples, reproduction steps, architecture
diagrams, or any other evidence that supports the analysis.
```

## Investigation patterns

These are reusable debugging patterns. Pick the ones that apply.

### Financial abuse / credit farming

1. Count new accounts by day/week to find the inflection point
2. Cross-join accounts with credit grants to find who got credits
3. Cross-join credited accounts with usage events to find who burned them
4. Group by email domain to find disposable domain clusters
5. Group by client IP to find shared infrastructure
6. Check `radar_evaluations` (or equivalent scoring table) for coverage gaps
7. Compare Stripe revenue against credit grants to quantify the loss

### Broken integration (API calls not landing)

1. Check the DB audit table for the integration (e.g., `radar_evaluations`)
2. Group by `source` to see which code paths are producing records
3. Compare record count against the expected volume (e.g., signups/day)
4. Read the error-swallowing code path (try/catch that logs but doesn't throw)
5. Check if the function reads stale data (cache, webhook payload snapshot)
6. Verify credentials/API keys are configured in the deployment environment

### Race condition between webhooks

1. Identify which webhooks fire in parallel (Clerk fires user.created,
   organization.created, organizationMembership.created simultaneously)
2. Check if Handler A writes state that Handler B reads
3. Check if Handler B has retry/polling logic for Handler A's state
4. Verify the ordering assumptions in comments match reality

### Silent failure (code runs but produces no effect)

1. Check if errors are swallowed (try/catch returning early)
2. Check if the function reads from a stale source (cache, snapshot)
3. Check if the function's precondition silently fails (returns early on null)
4. Add a DB query that counts output records vs. input triggers
5. The ratio should be close to 1:1. Any gap is the bug.

## Rules

- Never modify production databases. Investigation is read-only.
- Default to `--env local` unless the user explicitly says "prod."
- Quantify every claim. "A lot of bots" is not acceptable. "1,888 bot
  accounts with zero Radar evaluations" is acceptable.
- Include the actual SQL queries in the postmortem so anyone can re-run them.
- The postmortem is a living document. Update it as fixes ship and
  verification queries confirm results.
- Blameless means blameless. Name what happened, not who is at fault.
  "The threshold was set to 90" not "Kevin set the threshold to 90."

## Task

The user has reported an incident or wants to investigate a production issue.

1. Ask what happened (or read the context they provide)
2. Investigate using the patterns above
3. Write the postmortem using the template
4. Add verification queries
5. Track action items
6. Update the postmortem as fixes are implemented

$ARGUMENTS
