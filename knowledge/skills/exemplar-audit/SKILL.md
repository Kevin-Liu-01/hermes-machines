---
name: exemplar-audit
description: >-
  Compare implementation against canonical open-source references.
  Clone exemplars into /tmp, diff edge cases, error paths, and
  protocol invariants. Use when building a new subsystem, after a
  refactor, or when reviewing code that implements a known standard
  (POSIX, FUSE, WAL, S3, NFS, etc.).
allowed-tools: Read, Grep, Glob, Shell, WebSearch, StrReplace
---

# Exemplar Audit

Find what the best implementations do that we don't, then close the
gaps. This is the "measure twice" pass: compare our code against
battle-tested references before declaring it done.

## When to use

- After implementing a new subsystem (filesystem, protocol, cache)
- After a refactor that changed invariant-bearing code
- When reviewing code that implements a known standard
- When the user says `/exemplar-audit` or `/refine --pass 6`
- When you suspect edge cases are missing but don't know which ones

## Procedure

### 1. Identify exemplars

Check these sources in order:

1. **This monorepo first.** The best reference for "how we do X" is
   often another subsystem that already does X well. GitHub Actions
   workflows, Terraform modules, Rust crates, Go controllers -- scan
   for the most mature sibling before looking externally.
2. **Module docs and READMEs** in the subsystem being audited.
   Look for "References", "Inspired by", "See also", or citations
   to external projects.
3. **`storage.md`, `architecture.md`, or equivalent** design docs.
   These often name reference implementations.
4. **The internet.** Search for "canonical open-source implementation
   of {thing}". Prefer projects with >1000 stars, active maintenance,
   and a test suite.

Examples of good exemplars by domain:

| Domain | Internal exemplar | External exemplar |
|--------|-------------------|-------------------|
| GitHub Actions | `host-agent-rust.yml`, `host-agent-kvm.yml` | -- |
| Terraform | `apps/cloud/apps/dcs/tf/main.tf` | checkov rules |
| Rust CI crate | `host-agent` (same workspace) | -- |
| FUSE filesystem | -- | `fuser` SimpleFS, FUSE memfs |
| SQLite metadata | -- | JuiceFS `pkg/meta/sql.go` |
| WAL replication | -- | Litestream, libSQL bottomless |
| S3 chunk store | -- | JuiceFS `pkg/object/s3.go` |
| VFS layer | -- | Linux `fs/fuse/dir.c` |
| Content-addressed storage | -- | git `sha1-file.c`, Perkeep |

### 2. Clone or read

Clone into `/tmp` to avoid polluting the workspace:

```bash
git clone --depth 1 https://github.com/cberner/fuser /tmp/fuser
git clone --depth 1 https://github.com/juicedata/juicefs /tmp/juicefs
```

For smaller references, read online (GitHub raw, crates.io source).

### 3. Compare

For each exemplar, check:

- **Edge cases they handle that we don't.** Look at their test suite
  and error paths, not just the happy path. grep for `ENOTEMPTY`,
  `ENOSPC`, `EINVAL`, `rename`, `unlink`, etc.
- **Error paths they enforce that we skip.** Do they validate inputs
  we trust? Do they check return values we ignore?
- **Protocol invariants they check that we miss.** POSIX rename
  atomicity, nlink consistency, fsync durability, WAL checkpoint
  ordering.
- **Patterns they use that are better than ours.** Simpler error
  mapping, cleaner state machines, fewer allocations.

### 4. Report and fix

For each gap found:

1. State the invariant or edge case in one sentence.
2. Cite the exemplar file and line.
3. Check if we have a test for it. If not, write one (fail first).
4. Fix the code if needed.

Do not cargo-cult patterns we don't need. If the exemplar handles
NFS-specific locking and we don't serve NFS, skip it. Every adopted
pattern must have a real consumer in our system.

## What NOT to do

- Don't clone 50 repos and compare superficially. Pick 2-3 good ones.
- Don't adopt patterns because they're clever. Adopt because they
  prevent bugs we'd otherwise ship.
- Don't report "they do X and we don't" without checking if X is
  relevant to our use case.
- Don't spend more than 30 minutes per exemplar. If the comparison
  isn't yielding findings, move on.

## Output

Return a table:

| Gap | Exemplar | Our status | Fix |
|-----|----------|------------|-----|
| rename over non-empty dir | fuser SimpleFS L412 | missing | added test + check |
| WAL checkpoint past replicated | Litestream wal.go L890 | missing | added watermark guard |
| (none found) | JuiceFS chunk GC | clean | -- |
