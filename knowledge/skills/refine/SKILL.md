---
name: refine
description: >-
  Compound quality pass over recently changed code. Orchestrates seven
  standalone skills in sequence: comment, lerp, style, fix-types,
  interface, test-invariants, exemplar-audit. Each pass is independently
  invokable. Use after any feature or refactor lands and before the
  final commit.
---

# Refine

Seven-pass quality gate. Each pass delegates to a standalone skill, so
you can run any pass independently (`/comment`, `/lerp`, `/fix-types`,
`/exemplar-audit`, etc.) or all seven in order (`/refine`).

## Principle: docs and by-the-book examples first

Before implementing anything, check official documentation and
real-world examples. Clone reference repos into `/tmp`, read upstream
READMEs, and verify the canonical approach before inventing your own.
This applies to every pass. The internet is smarter than guessing.

## Principle: test the invariant, not the implementation

Don't write tests that confirm the code you wrote works. Write tests
that probe the contract the code is supposed to uphold. "Rename works"
is an implementation test. "Rename never orphans children" is an
invariant test. The second one catches bugs before they exist.

## Scope

Operates on every file in the current working set (unstaged + staged +
recent commits). If the user names specific files, a package, or a
directory, scope to those.

- `/refine` -- all touched files, all 7 passes
- `/refine $0` -- scope to a file, crate, or directory
- `/refine --pass N` -- run only pass N (1-7)
- `/refine --skip N` -- skip pass N

## Passes

Each pass reads its own skill file for the full checklist, so updates
to individual skills propagate automatically.

### Pass 1: Comment

**Skill**: `.agents/skills/comment/SKILL.md`

| Check | Applies to |
|-------|-----------|
| License/copyright header present | all languages |
| File-level doc answers what / why / where in 30 seconds | all |
| Acronyms spelled out on first use | all |
| Inline comments pass the deletion test | all |
| No "This module/struct/class/function..." openers | all |
| Concrete examples for formats, protocols, state machines | all |

### Pass 2: LERP (Least Experienced Reader Principle)

**Skill**: `.agents/skills/lerp/SKILL.md`

| Check | Applies to |
|-------|-----------|
| Acronyms spelled out on first use, short form in parens, then abbreviate freely | all prose |
| Domain terms explained inline on first use | all prose |
| No orphan references ("this split", "this pattern") without context | all prose |
| Every "important" or "necessary" claim states the consequence | all prose |
| Abstract nouns replaced with concrete descriptions | all prose |
| Sentences connected into flowing reasoning, not staccato facts | all prose |
| A sixth grader could follow the argument without asking someone | all prose |

### Pass 3: Style

**Skill** (pick by language):

| Language   | Skill                                        |
|------------|----------------------------------------------|
| Rust       | `.agents/skills/rust-neckbeard/SKILL.md`     |
| Go         | `.agents/skills/go-style/SKILL.md`           |
| Python     | `docs/src/style/python.mdx`                  |
| TypeScript | `style/typescript.md`                        |
| Terraform  | `terraform fmt` + checkov                    |
| SQL        | schema in const string is fine               |
| Shell      | `.agents/skills/test-writing/SKILL.md`       |

What to check (language-specific limits come from the guide):

- file too long? Split by concern, not by size.
- function too long? Extract named helpers.
- nesting too deep? Early returns, guard clauses.
- related constants scattered? Group in a module/object/enum.
- repeated error mapping? Extract a helper.
- return value silently discardable? Add `#[must_use]` / equivalent.
- long expression chains? Name intermediates for breathing room.
- lint suppressions without justification? Add one or remove it.

### Pass 4: Fix types

**Skill**: `.agents/skills/fix-types/SKILL.md`

| Check | Example |
|-------|---------|
| 2+ params of same primitive, swappable | `fn transfer(from: u64, to: u64)` -> newtypes |
| Narrowing/sign-changing cast without justification | `as u64` -> `try_from` |
| 2+ boolean params | `tls: bool, verify: bool` -> enums |
| Enum discriminant in DB/wire without contract doc | Add "BREAKING change" note |
| Timestamps as bare integers without overflow doc | Document the overflow year |

### Pass 5: Interface

**Skill**: `.agents/skills/generate-interface/SKILL.md`

- Primary interfaces explicitly named?
- Ownership table present where state is split?
- Every surface classified: authoritative / compat / debug / operational?
- Module docstrings say which interface they implement?
- README agrees with code?
- No helper soup masquerading as architecture?

### Pass 6: Test invariants

**Skill**: `.agents/skills/invariant-first-testing/SKILL.md`

For each new or changed invariant:

1. State the invariant in one sentence.
2. Is there a test that falsifies it (fails without the fix, passes
   with it)? If not, write one.
3. Is there a test that accidentally covers 10 things? Narrow it.
4. Are there 5 near-duplicate tests for the same branch? Collapse.
5. Are the tests probing the contract or confirming the implementation?

### Pass 7: Exemplar audit

**Skill**: `.agents/skills/exemplar-audit/SKILL.md`

Find reference implementations, clone them, compare edge cases and
error paths against ours. Report gaps as bugs. Fix bugs. Do not
cargo-cult patterns we don't need.

## Rules

- Run passes in order. Each pass assumes the previous cleaned up.
- Do not skip passes. If a pass finds nothing, say "clean."
- Compile + test after every pass that modifies code.
- If a pass introduces a regression, fix it before the next pass.
- Report a one-line summary per pass at the end.
- Use subagents in parallel where passes are independent.

## When NOT to use

- On generated code, proto output, or vendored files.
- On files you haven't touched (pre-existing debt is separate).
- When the user says "ship it."
