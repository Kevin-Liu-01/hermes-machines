---
name: daily-bugfix-check
description: Check the current author's commits from the last 24 hours and proactively find and fix any bugs they introduced. Use when the user asks for a daily bugfix check, wants to review today's commits for issues, or asks to "check my recent code for bugs." Combines commit review with the recent-code-bugfix workflow.
---

# Daily Bugfix Check

## Overview

Proactively review the current author's commits from the last 24 hours, identify any bugs or issues introduced, and fix them. This is a combined workflow that scopes to the last day and applies the recent-code-bugfix pattern.

## Workflow

### 1) Identify recent commits

```bash
git config user.name
git log --since="24 hours ago" --author="<author>" --stat --format='%H %s'
```

Collect the list of files touched in the last 24 hours by the current author.

### 2) Analyze changes for potential issues

For each changed file:

- Run ReadLints to check for linter errors
- Read the recent diffs to look for:
  - Undefined variable or function references
  - Missing imports after refactoring
  - Type mismatches or broken interfaces
  - Functions called with wrong argument counts
  - Stale references to moved/renamed code
  - Copy-paste errors
  - Logic errors (wrong conditions, off-by-one, missing null checks where critical)

### 3) Triage findings

Categorize found issues:

- **Bugs**: Definite defects that will cause runtime errors or incorrect behavior
- **Warnings**: Potential issues that may cause problems in edge cases
- **Style**: Non-functional issues (skip these, not in scope)

Only proceed to fix **Bugs**. Report **Warnings** for the user's awareness.

### 4) Fix bugs

For each confirmed bug, apply the recent-code-bugfix workflow:

- Make minimal, targeted fixes
- Follow project conventions
- Verify with linter after each fix

### 5) Report

Summarize findings:

- Total commits reviewed and files analyzed
- Bugs found and fixed (with root cause tied to specific commits)
- Warnings identified (for user awareness)
- If no bugs found, say so clearly
