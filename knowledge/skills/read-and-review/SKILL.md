---
name: read-and-review
description: Read external reference material (RFDs, papers, blog posts, docs), extract actionable rules, then dispatch subagents to audit the codebase against those rules and fix violations. Use when the user shares a technical reference and wants it applied to the codebase.
---

# Read and Review

## When to use

The user shares an external reference (RFD, paper, blog post, library
docs, postmortem) and wants its lessons applied to the codebase. The
reference contains principles that may reveal latent bugs, missing
documentation, or anti-patterns in existing code.

## Workflow

### 1. Read and extract rules

Read the reference thoroughly. Extract a numbered list of concrete,
testable rules. Each rule should be:

- Falsifiable: you can check whether code violates it
- Scoped: applies to a specific pattern, not "write good code"
- Actionable: a violation has a known fix

Example from Oxide RFD 397:

1. Never hold `tokio::sync::Mutex` across `.await`
2. Document cancellation-safety contracts on async functions
3. `tokio::time::timeout` does not cancel the server, only the client
4. `try_join!` cancels remaining futures when any one fails

### 2. Dispatch audit subagents

Send parallel subagents to search the codebase for violations:

- **Code reviewer subagent**: review recently changed files against
  the extracted rules. Report findings with severity levels.
- **Explorer subagent**: search the broader codebase for the specific
  patterns the rules warn about (e.g., `tokio::sync::Mutex`,
  `tokio::select!`, `try_join!`). Report each occurrence with
  file path, line numbers, and whether it's safe or a violation.

### 3. Triage findings

Classify each finding:

- **Must fix**: violates the rule and can cause data corruption, state
  desync, or silent failure
- **Should fix**: violates the rule but impact is bounded (e.g., test
  flakiness, misleading error variant)
- **Document**: the code is correct but the reason it's safe is not
  obvious; add a comment explaining why
- **Not applicable**: the pattern is present but the rule doesn't apply
  (e.g., `timeout` around a stateless probe is fine)

### 4. Fix violations

Fix must-fix and should-fix items. For each fix:

- Make the minimal change that resolves the violation
- Add or update documentation explaining the safety argument
- Run tests to confirm no regressions

### 5. Update skills

If the reference contains principles that should guide future code:

- Update the relevant skill file (e.g., `rust-neckbeard/SKILL.md`)
  with the new rules
- Include the reference as a citation
- Write the rules as concrete dos and don'ts, not abstract philosophy

## Anti-patterns

- Reading the reference and summarizing it without auditing the codebase
- Auditing without fixing ("here are 12 issues" with no code changes)
- Fixing without updating skills (the same class of bug will recur)
- Over-scoping the audit to the entire monorepo when the reference
  applies to a specific subsystem

## Example references that trigger this skill

- Oxide RFD 397 (async cancellation safety)
- Oxide RFD 609 (futurelock in select branches)
- Dedalus Hypervisor migration docs (protocol correctness)
- Jepsen reports (distributed systems invariants)
- CVE advisories (security patterns)
- Library changelogs with breaking changes
