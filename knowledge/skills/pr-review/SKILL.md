---
name: pr-review
description: Review PR comments from GitHub. Fetches inline review comments and issue comments, classifies by review.md prefix semantics (blocking vs non-blocking), and summarizes actionable items. Use when the user asks to check PR feedback, see reviewer comments, or address PR review.
allowed-tools: Bash(gh *), Read, Grep, Glob, Agent
argument-hint: "<pr-number> [--repo owner/repo]"
---

# Review PR Comments

## Context

- Branch: !`git branch --show-current`
- Remote: !`gh repo view --json nameWithOwner -q .nameWithOwner`

## Review conventions

Read `.github/review.md` before classifying comments. It defines blocking vs non-blocking
prefixes and the expected comment format.

## Task

Given PR number `$ARGUMENTS` (required), fetch and triage all reviewer comments.

### 1. Fetch comments

Run these two `gh api` calls to get both comment types:

```bash
# Inline review comments (attached to specific lines)
gh api repos/{owner}/{repo}/pulls/{pr}/comments --paginate

# Issue-level comments (general discussion)
gh api repos/{owner}/{repo}/issues/{pr}/comments --paginate
```

If `--repo` is provided in arguments, use that. Otherwise infer from the git remote.

Filter out bot comments (author login ending in `[bot]` or `bot`).

### 2. Parse and classify

For each human comment, extract:

- **Author**: `.user.login`
- **Type**: `review` (inline) or `discussion` (issue-level)
- **File + line**: `.path` and `.line` (review comments only)
- **Body**: `.body`
- **Prefix**: match the first word against `.github/review.md` prefix semantics
- **Blocking**: true if prefix is `blocking:`, `must-fix:`, `bug:`, `security:`, or `tests:`
- **Created**: `.created_at`

### 3. Summarize

Output a table grouped by blocking status:

```
## Blocking (must resolve before merge)

| # | Author | File:Line | Comment |
|---|--------|-----------|---------|
| 1 | anny   | main.tf:159 | concern about subnet tag collision across envs |

## Non-blocking (address or acknowledge)

| # | Author | File:Line | Comment |
|---|--------|-----------|---------|
| 1 | anny   | hooks.py:37 | (tagged Windsor re: except clause syntax) |
```

For comments without a prefix, classify as non-blocking per review.md default.

### 4. Suggest next steps

For each blocking comment, suggest the minimal fix. If the comment is a question,
draft a reply. If it requires a code change, identify the file and describe what to change.

## Worktree isolation

If you need to check out the PR branch to verify a comment (e.g., reproduce a bug or read
context around a diff), use worktree isolation per @worktree-first.md. Do not switch branches
in the main checkout.

## Anti-patterns

- Do not fetch the full PR diff. The comments already reference specific files and lines.
- Do not reply to or resolve comments automatically. Surface the information; let the user decide.
- Do not ignore bot comments silently. Filter them but mention the count (e.g., "2 bot comments filtered").
