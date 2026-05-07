---
name: project-briefing
description: Generate an executive briefing of the last 24 hours of commits for the current project or a specified directory. Use when the user asks for a project update, daily briefing, commit summary, "what changed today," or wants to stay up-to-date with recent work.
---

# Project Briefing

## Overview

Produce a rich Markdown executive briefing of the last 24 hours of commits touching the current working directory (or a specified directory). Group changes by workstream, not by individual commit.

## Workflow

### 1) Fetch latest from remote

```bash
git fetch origin
```

Determine the default branch (`origin/main` or `origin/master`).

### 2) Gather commits

```bash
git log --since="24 hours ago" --format='%H %an <%ae> %s' origin/<default-branch>
```

For each commit, also get the stat and body:

```bash
git show --stat --format='%an%n%s%n%b' <hash>
```

Only include commits that touch files within the current working directory (or specified directory scope).

### 3) Enrich with PR data

Use `gh` to fetch PR information when available:

```bash
gh pr list --state merged --search "merged:>=$(date -v-24H +%Y-%m-%d)" --json number,title,body,url,author,reviews,comments
```

Include PR links inline as `[#123](url)` without a "PRs:" label. Pull in review comments if they add useful context.

### 4) Group by workstream

Analyze the commits and PRs to identify logical workstreams (e.g., "Rendering Engine Refactor," "New Tower Implementation," "UI Polish"). Group related changes together even if they span multiple commits or PRs.

### 5) Format the briefing

Use this structure:

```markdown
Here's the last 24h brief for <directory>:

*Narrative walkthrough with owners; grouped by workstream.*

---

# <Workstream Title>

<Short narrative explaining the changes in plain language.>

- **Author Name** did X, Y, Z [#PR](url)
- **Author Name** followed up with A, B [#PR](url)

---

# <Next Workstream Title>

...
```

**Formatting rules:**

- H1 for workstream sections
- Italics for the subtitle
- Horizontal rules between sections
- Bold author names in bullet points
- PR links inline
- No commit hashes
- No "Key commits" section
- No per-commit bullet lists (group by workstream narrative)
- Bullets and bolding for readability

**Content rules:**

- Only include changes within the scoped directory
- Only include the last 24 hours
- Write narratives in plain language explaining *what changed and why*
