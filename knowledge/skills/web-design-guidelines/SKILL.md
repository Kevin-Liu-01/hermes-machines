---
name: web-design-guidelines
description: Audit UI code against Vercel's Web Interface Guidelines for design and accessibility compliance. Use when reviewing UI code, checking accessibility, auditing components, or when the user says "check design", "UI review", "accessibility audit", "web guidelines", or "interface compliance." Based on vercel-labs/agent-skills (234K weekly installs).
---

# Web Interface Guidelines

Review files for compliance with Vercel's Web Interface Guidelines.

## How It Works

1. Fetch the latest guidelines from the source URL
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the fetched guidelines
4. Output findings in terse `file:line` format

## Guidelines Source

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use WebFetch to retrieve the latest rules. The fetched content contains all rules and output format instructions.

## Usage

When a user provides a file or pattern argument:

1. Fetch guidelines from the source URL above
2. Read the specified files
3. Apply all rules from the fetched guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.

## When to Apply

- After writing or editing React/TSX components
- During UI code review
- When checking accessibility compliance
- When auditing design system implementation
- Before submitting PRs that touch UI code

## Related Skills

- `vercel-react-best-practices` — Performance optimization rules
- `frontend-design` — Distinctive frontend aesthetics
- `seo-audit` — SEO compliance checking
