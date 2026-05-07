---
name: recent-code-bugfix
description: Find and fix a bug introduced by the current author within the last week in the current working directory. Use when a user wants a proactive bugfix from their recent changes, when the prompt is empty, or when asked to triage/fix issues caused by their recent commits. Root cause must map directly to the author's own changes.
---

# Recent Code Bugfix

## Overview

Find a bug introduced by the current author in the last week, implement a fix, and verify it when possible. Operate in the current working directory, assume the code is local, and ensure the root cause is tied directly to the author's own edits.

## Workflow

### 1) Establish the recent-change scope

Use Git to identify the author and changed files from the last week.

- Determine the author from `git config user.name` / `user.email`. If unavailable, use the current user's name from the environment or ask once.
- Use `git log --since=1.week --author=<author>` to list recent commits and files. Focus on files touched by those commits.
- If the user's prompt is empty, proceed directly with this default scope.

### 2) Find a concrete failure tied to recent changes

Prioritize defects that are directly attributable to the author's edits.

- Check for linter errors in recently changed files using the ReadLints tool
- Look for recent failures (tests, lint, runtime errors) if logs or CI outputs are available locally
- If no failures are provided, run the smallest relevant verification (single test, file-level lint, or targeted repro) that touches the edited files
- Look for common bug patterns in the diffs: undefined references, missing imports, type mismatches, broken function signatures, off-by-one errors, race conditions
- Confirm the root cause is directly connected to the author's changes, not unrelated legacy issues. If only unrelated failures are found, stop and report that no qualifying bug was detected.

### 3) Implement the fix

Make a minimal fix that aligns with project conventions.

- Update only the files needed to resolve the issue
- Avoid adding extra defensive checks or unrelated refactors
- Keep changes consistent with local style and tests
- Follow existing project patterns (check `.cursor/rules/` for project conventions)

### 4) Verify

Attempt verification when possible.

- Prefer the smallest validation step (targeted test, focused lint, or direct repro command)
- Re-run ReadLints on the fixed files to confirm linter errors are resolved
- If verification cannot be run, state what would be run and why it wasn't executed

### 5) Report

Summarize:

- **Root cause**: What the bug was and which commit/file introduced it
- **Fix**: What was changed and why
- **Verification**: What validation was performed
- Make it explicit how the root cause ties to the author's recent changes
