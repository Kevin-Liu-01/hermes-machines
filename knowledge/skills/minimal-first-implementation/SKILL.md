---
name: minimal-first-implementation
description: Build the smallest correct version first. Name every case, implement only what has a real consumer, return typed errors for the rest. Use when designing new systems, extracting shared packages, or deciding how much to build before shipping.
---

# Minimal-First Implementation

## The Rule

Build the smallest thing that is correct, tested, and fail-closed. Do not
build the smallest thing that compiles.

## What This Means

### 1. Name every case up front

The decision logic should be exhaustive from day one. If there are three
resize strategies, define all three variants now. The decision tree should
be complete even when execution is partial.

This is not speculative design. It is documenting the problem space so
the code tells the truth about what it handles and what it does not.

### 2. Implement only the cases that have a real consumer today

A named variant with no execution path returns a typed error:

```rust
match action {
    ResizeAction::Hotplug => hotplug(spec),
    ResizeAction::LiveMigration => Err(ResizeError::NotImplemented),
    ResizeAction::ColdMigration => Err(ResizeError::NotImplemented),
}
```

That is not incomplete. That is the correct first version. The variant
exists so the compiler and tests can prove the decision logic is
exhaustive. The execution exists only when someone needs it.

### 3. Unimplemented cases fail loudly, not silently

Never return `Ok(())` for a path you have not built. Never log a warning
and continue. Return a typed error that the caller can match on. This is
the intersection with fail-closed case matching: if a resize request
routes to `LiveMigration` and that path is not wired, the user gets a
clear rejection, not a silent no-op.

### 4. No framework ahead of a second consumer

Do not add:
- state machine engines
- workflow orchestrators
- plugin interfaces
- generic trait hierarchies
- configuration DSLs

until there is a real second consumer that would benefit. The first
consumer should use concrete types, free functions, and direct calls.
If a pattern emerges after the second consumer, extract it then.

### 5. Shared packages only after the core stabilizes

A shared package (`packages/go/...`) is justified only when:
- the core mechanics are stable and tested
- there are at least two real consumers (or one consumer plus an obvious
  adjacent second consumer)
- the exported API does not encode one app's domain nouns

If only one app uses it, keep it local. Extract when the boundary proves
itself, not when you hope it will.

### 6. Tests cover the decision logic exhaustively

Even when execution is partial, the decision logic should be fully
tested. Table-driven tests with one row per named case prove that:
- every case is reachable under the expected conditions
- no two cases overlap
- invalid inputs are rejected, not silently routed

This is how you ship a partial implementation without shipping partial
correctness.

## Why This Works

The alternative is building the full system up front, which means:
- more code to review before anything ships
- speculative interfaces that freeze the wrong boundary
- tests that cover imagined scenarios instead of real ones
- technical debt from abstractions that do not match reality

Minimal-first avoids all of that by making the first version honest about
what it does and what it does not do. The decision tree is complete. The
execution is partial. The errors are explicit. The tests are real.

## Reference Examples

- `resize_strategy.go`: three named strategies (hotplug, live migration,
  cold migration), exhaustive resolver, tested with table-driven cases.
- `workspace-schema/resize.rs`: three named `ResizeAction` variants with
  serde round-trip tests. No execution logic in the schema crate.
- `packages/go/capacity`: started as a pure planning kernel. Only
  extracted to a shared package after the API stabilized and compaction
  became a second consumer.
- `packages/go/compaction`: started as a feasibility kernel. Kept the
  packing heuristic simple (scalar best-fit-decreasing) because vector
  demand is not a real need yet.

## Anti-Patterns

- building a migration orchestrator before proving the CH primitives work
- adding a `packages/go/resize` module before the controlplane resize
  path has a real second consumer
- implementing `ColdMigration` execution before any primary path has
  failed in production
- adding a CRD for migration intent before the simplest annotation-based
  approach has been tried
- writing a compaction controller for sleeping workspaces when the
  codebase already releases `AssignedHost` on sleep convergence
