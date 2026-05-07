---
name: promote
description: Create a changelog-style promotion PR from dev to preview.
allowed-tools: Bash(node --experimental-strip-types *)
argument-hint: "[--from dev] [--to preview] [--dry-run]"
---

## Context (auto-detected)

- Commits to promote: !`git log --oneline upstream/preview..upstream/dev 2>/dev/null || echo "(run git fetch upstream first)"`

## Script

`${CLAUDE_SKILL_DIR}/scripts/promote.ts` handles everything: fetch, changelog generation, and PR creation.
It opens the PR from a generated `promote/<from>-to-<to>` branch so preview lockfile sync can
commit generated lockfiles without pushing directly to `dev`.

Flags:
- `--from <branch>` source branch (default: `dev`)
- `--to <branch>` target branch (default: `preview`)
- `--remote <name>` git remote (default: `upstream`)
- `--promote-branch <branch>` generated PR branch override
- `--dry-run` print the PR body to stdout without creating the PR

> **Note**: This skill is ONLY for `dev` -> `preview`. Promoting `preview` -> `main` is handled by a fast-forward push (`pnpm ship prod`) after `release-please` runs on `preview`.

## Task

Run the script. Pass through any flags from `$ARGUMENTS`.

```bash
node --experimental-strip-types ${CLAUDE_SKILL_DIR}/scripts/promote.ts $ARGUMENTS
```

If the script exits non-zero, report the error to the user and stop.
Otherwise, print the PR URL it outputs.
