---
name: rtfm
description: >-
  Verify claims against primary sources before writing code or docs.
  Read the actual API, run the actual command, check the actual docs.
  Do not guess. Do not assume. Do not ship until verified.
---

# RTFM

When you think you know how an API, tool, or system works, you are
wrong until you have verified it against the source. This skill exists
because workarounds for nonexistent limitations are worse than the
problems they claim to solve.

## When to use

Every time you:

- claim a library, API, or tool lacks a feature
- claim something "can't be done" or "isn't supported"
- write a workaround, shim, or fallback
- choose one approach over another based on a tool's capabilities
- dismiss an option without trying it

## Procedure

### 1. Read the primary source

The actual code, API docs, or type signature. Not a summary. Not a
blog post. Not your memory.

| Claim type | Where to look |
|---|---|
| "crate X doesn't support Y" | `docs.rs/X`, GitHub source, `Cargo.toml` features |
| "API doesn't accept parameter Z" | OpenAPI spec, SDK type definition, `--help` |
| "kernel doesn't support mode M" | `kernel.org/doc/html/`, `Documentation/` tree |
| "service doesn't offer feature F" | official product docs, changelog, pricing page |
| "protocol doesn't allow operation O" | RFC, spec PDF, reference implementation |

### 2. Read the secondary source

Official examples, changelogs, migration guides.

- README examples in the upstream repo
- CHANGELOG entries for the version you are using
- Official SDK example repos
- Release notes and migration guides

### 3. Read the tertiary source

Community evidence that people are doing the thing you think is
impossible.

- GitHub issues and PRs mentioning the feature
- Stack Overflow answers with working code
- Reddit or HN threads with first-hand experience
- Conference talks or blog posts from maintainers

### 4. Run it

If the claim is about runtime behavior, write a minimal test. Five
lines. Compile it. Run it. See what happens. Do not theorize about
what the compiler, runtime, or service will do. Ask it.

### 5. Only then decide

After steps 1-4, you may say "X doesn't support Y." Not before.

If you skipped any step, go back. The five minutes you spend reading
docs saves the five hours you spend building and debugging a
workaround for a limitation that does not exist.

## The rule

If you have not read the docs, you have not earned the right to say
it cannot be done. Read first. Decide second. Code third.
