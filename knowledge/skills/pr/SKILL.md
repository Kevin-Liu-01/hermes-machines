---
name: pr
description: Create a pull request using the Dedalus PR template. Injects git state, commit history, and diff stats automatically.
allowed-tools: Bash(git *), Bash(gh *), Bash(awk *), Bash(sort *), Read
argument-hint: "[base-branch] [--branch <source-branch>]"
---

## Context (auto-detected from HEAD)

- Current branch: !`git branch --show-current`
- Remote status: !`git status -sb | head -1`

## PR Template

Read `.github/PULL_REQUEST_TEMPLATE.md` and fill every section. The template is mandatory.
Do not free-form the PR body.

## Rules

- PR title: `type(scope): description` (conventional commit format, under 70 chars)
- Target branch: first positional arg from `$ARGUMENTS` if provided, otherwise `dev`
- Source branch: if `--branch <name>` is in `$ARGUMENTS`, use that branch for diff/log
  commands instead of HEAD. This is needed when the PR branch lives in a different worktree
  or the main repo checkout.
- Push with `-u` if needed
- Use `gh pr create` with `--body "$(cat <<'EOF' ... EOF)"` for correct formatting
- LOC check: if diff exceeds 200 changed lines (excluding generated files), warn the user
  and suggest splitting into stacked PRs

## Reviewer Resolution

Before filling the Reviewers section, resolve ownership from CODEOWNERS and git history.

### Step 1: CODEOWNERS lookup

Run this to find owners for every changed file:

```bash
git diff --name-only upstream/dev..<source-branch> | while read -r file; do
  owner=""
  while IFS= read -r line; do
    line="${line%%#*}"                      # strip comments
    [ -z "$(echo "$line" | tr -d '[:space:]')" ] && continue
    pattern=$(echo "$line" | awk '{print $1}')
    owners=$(echo "$line" | awk '{$1=""; print $0}' | xargs)
    # convert CODEOWNERS glob to regex: /foo/ matches foo/anything, *.rs matches *.rs
    case "$file" in
      ${pattern#/}*) owner="$owners" ;;
    esac
  done < .github/CODEOWNERS
  echo "$owner"
done | tr ' ' '\n' | grep '^@' | sort | uniq -c | sort -rn
```

The top results are the CODEOWNERS-designated reviewers.

### Step 2: blame-based context reviewers

Run this to find who recently touched the changed files (excluding the PR author):

```bash
author=$(git config user.name)
git diff --name-only upstream/dev..<source-branch> | head -20 | while read -r file; do
  [ -f "$file" ] && git log --format='%aN' --since='3 months' -- "$file"
done | sort | uniq -c | sort -rn | grep -v "$author" | head -5
```

### Step 3: fill reviewers

Map names to GitHub handles using AGENTS.md:

| Name             | Handle          |
|------------------|-----------------|
| Windsor Nguyen   | @windsornguyen  |
| Anny Zhou        | @annyzhou       |
| Tsion Kergo      | @tsiongk        |
| Kevin Liu        | @Kevin-Liu-01   |
| Aryan Mahajan    | @aryanma        |
| Shengming Liang  | @AgentWings     |
| Catherine Di     | @cathydi        |
| Misty            | @super-misty    |

- **Domain reviewer**: highest-ranked CODEOWNERS match (excluding the PR author).
- **Readability reviewer**: highest-ranked blame-based contributor who is NOT the domain reviewer
  and NOT the PR author. If no one qualifies, pick a second CODEOWNERS match.
- Always tag two distinct people. Never tag the PR author as a reviewer.
- If both slots would be the same person, pick the next-ranked candidate for readability.

## Task

1. Determine the source branch: use `--branch` value if provided, otherwise current HEAD
2. Gather context by running:
   - `git log --oneline upstream/dev..<source-branch>` (commits for this PR)
   - `git diff --stat upstream/dev..<source-branch>` (diff stats)
   - `git diff --name-only upstream/dev..<source-branch>` (changed files)
3. Resolve reviewers per the Reviewer Resolution steps above
4. Push the branch if needed
5. Read the PR template
6. Create the PR with every template section filled, including resolved reviewers
7. Return the PR URL
