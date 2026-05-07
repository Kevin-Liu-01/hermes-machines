---
name: lerp
description: >-
  Audit prose (comments, docs, READMEs, commit messages, PR descriptions)
  for jargon, unexplained acronyms, and assumed context. Rewrites for
  the least experienced reader. Use after writing docs, READMEs, or any
  prose that will be read by someone who did not write the code.
allowed-tools: Read, Grep, Glob, Edit
---

# LERP: Least Experienced Reader Principle

Write for the person who just joined the team, opened this file cold,
and has never seen the codebase before. If they cannot understand what
you wrote without asking someone, the prose has failed.

This is not about dumbing things down. It is about making sure every
sentence carries the context it needs to stand on its own.

## The test

Read every sentence. For each one, ask: "If I had never worked on
this project, would I know what this means?" If the answer is no,
rewrite it until the answer is yes.

## Rules

### 1. Spell it out, then abbreviate

Every acronym and abbreviation gets spelled out on first use, with the
short form in parentheses. After that, the short form is fine.

```text
Bad:  "VFS dispatches FUSE ops to the metadata store."

Good: "The Virtual Filesystem Switch (VFS) receives FUSE (Filesystem
      in Userspace) requests from the guest kernel. The VFS turns
      them into SQLite queries."
```

Domain terms that are not acronyms still need a plain-English
explanation on first use. Not in a glossary at the bottom. Inline,
right where the term appears.

```text
Bad:  "The inode table maps paths to attributes."

Good: "The inode table (the index that maps every file path to its
      metadata like permissions, size, and timestamps) is stored in
      SQLite."
```

After the first occurrence, use the term or acronym freely. The reader
has been introduced.

### 2. No orphan references

When you say "this split" or "this pattern" or "this approach," the
reader must be able to point to exactly what you mean without reading
a different file. If the antecedent is not in the same paragraph,
restate it.

```text
Bad:  "This split is what makes hard links work."

Good: "Separating names from attributes into two tables is what makes
      hard links work. Without it, two names pointing to the same
      file would each carry their own copy of the attributes, and
      those copies could drift out of sync."
```

The bad version says a thing is important but never says what breaks
without it. The good version explains the consequence.

### 3. State the "otherwise what"

When you say something is important, necessary, or correct, finish
the thought. What happens if we did not do this? What breaks? What
gets worse? The reader needs the consequence to understand the weight
of the statement.

```text
Bad:  "Autocheckpoint is disabled because we manage checkpoints
      ourselves."

Good: "Autocheckpoint is disabled. If it were enabled, SQLite would
      silently checkpoint past frames that have not been replicated
      to S3 yet. A crash after that would lose data permanently."
```

### 4. Concrete over abstract

Replace abstract nouns with what they actually mean in this system.
"File regions" means nothing to someone who does not already know the
chunk model. "Pieces of a file stored in S3" does.

```text
Bad:  "Maps file regions to S3 keys."
Good: "Tracks which S3 keys hold each piece of a file."

Bad:  "Metadata operations complete at microsecond latency."
Good: "Looking up a file, listing a directory, or renaming a file
      takes microseconds because it is a local SQLite query, not a
      network call to S3."
```

### 5. Short sentences, plain words

One idea per sentence. If a sentence has a semicolon, a "which" clause,
or a parenthetical longer than five words, try splitting it into two
sentences. If it reads better as one, keep it. But default to short.

Do not hedge. Do not say "basically", "essentially", "in order to",
"it should be noted that", "as previously mentioned." Say the thing.

### 6. Connected prose, not staccato facts

Short sentences are good. Disconnected sentence fragments are not. Each
sentence should build on the previous one. The reader should feel a
thread of reasoning, not a bulleted list pretending to be a paragraph.

```text
Bad:  "Rename is one atomic SQL UPDATE. Truncate deletes chunk refs
      beyond the new size boundary in a single transaction."

Good: "Rename moves a file by updating its directory entry in a single
      SQL statement, so the file is never visible in both the old and
      new location at the same time. Truncating a file works similarly:
      one transaction deletes the pieces beyond the new size and
      updates the stored file length together."
```

The bad version states two isolated facts. The good version connects
them: both operations are atomic, and here is what atomic means for
each one.

## Applying this skill

1. Read the target file (README, doc comment, module doc, PR body).
2. For every sentence, apply rules 1-6 above.
3. Rewrite violations in place. Do not add "LERP:" labels or meta
   commentary. Just write clearer prose.
4. Do not change code, test assertions, or technical accuracy. This
   skill only touches prose.
5. Do not add information that is not already present or clearly
   implied. If a sentence is unclear because context is genuinely
   missing, flag it as a question rather than inventing an answer.

## Scope

- READMEs
- Module-level doc comments (`//!`, `///`, docstrings)
- Inline comments that explain design decisions
- PR descriptions and commit messages
- Architecture docs and specs

Does not apply to:
- Code (variable names, function signatures)
- Log messages (those have a different audience: operators)
- Error messages (those have two audiences: users and operators)
