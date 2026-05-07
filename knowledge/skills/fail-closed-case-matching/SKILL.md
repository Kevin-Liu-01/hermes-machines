---
name: fail-closed-case-matching
description: Dedalus philosophy on conditional logic, error paths, and why we never write fallbacks. Use when writing or reviewing any branching logic that selects between strategies, modes, or error-recovery paths.
---

# Fail Closed, Case Match, Never Fall Back

## The Rule

Every branch in conditional logic must be an explicit, named case. There are
no fallbacks. There are no degraded modes. If the system cannot prove which
case applies, it rejects the request.

## Why

A fallback is a silent lie. It tells the caller "everything is fine" when the
system actually failed to satisfy the original intent. That hides broken
infrastructure, creates invisible state drift, and makes debugging harder
because the failure never surfaces.

A case match is an explicit contract. Each branch has a name, a reason, and a
test. If a new situation arises that does not match any case, the code fails
loudly instead of silently routing to a weaker path.

## What This Means In Practice

### Do: name every branch

```go
if fitsHotplug && fitsHost {
    return Hotplug
}
return LiveMigration
```

### Do not: use `else` as a catch-all degraded path

```go
// BAD: silent fallback
if canHotplug {
    hotplug()
} else {
    sleepAndRestart() // "just in case"
}
```

The second branch is not a case match. It is a bucket for "everything else,"
which means any new failure mode silently routes to `sleepAndRestart` without
anyone noticing.

### Do: treat the safe path as its own named case, not a fallback

`ColdMigration` (sleep, reconfigure, wake) is not a degraded fallback. It
is the path the system takes when a primary path encounters an error
mid-execution. Everything is pre-allocated before the swap, so the
interruption is bounded and deterministic.

It has its own tests, its own invariants, and its own reason code. It is not
"what happens when we give up."

### Do: return typed errors instead of routing to a weaker mode

```rust
// GOOD: fail closed
match action {
    ResizeAction::Hotplug => hotplug(spec),
    ResizeAction::LiveMigration => Err(ResizeError::NotImplemented),
    ResizeAction::ColdMigration => Err(ResizeError::NotImplemented),
}

// BAD: silent fallback
if let Err(_) = hotplug(spec) {
    cold_migrate(spec) // hides the hotplug failure
}
```

### Do: test every case independently

Each named branch should have its own test that proves:
- the branch is reachable under the expected conditions
- the branch produces the expected outcome
- no other branch fires for those conditions

Table-driven tests with one row per case are the natural fit.

## Where This Applies

- resize strategy selection (hotplug vs live migration vs cold migration)
- compaction candidacy (warm-capacity guard, packing feasibility, blocker detection)
- workspace lifecycle actions (create, wake, sleep, destroy)
- error classification (retriable vs terminal vs invalid)
- any `switch`, `match`, or multi-branch `if` that selects a mode or strategy

## Where This Does NOT Apply

- pure data transforms where a default is semantically correct
  (e.g., `max(0, value)` is not a fallback; it is a clamp)
- configuration normalization where a missing field has a well-defined default
  (e.g., `if gridStep <= 0 { return DefaultGridStep }`)

The distinction: a default is "the caller did not specify, and the correct
answer is known." A fallback is "the system failed, and we are pretending it
did not."

## Canonical References

- `style/style.md`: "Fail closed. Silent fallback to a weaker mode is usually
  a lie that hides broken infrastructure."
- `rust-neckbeard/SKILL.md`: "In no circumstances should we write fallbacks.
  Conditional logic should be viewed as case matching, as opposed to
  fallbacks."
- `resize_strategy.go`: reference implementation of exhaustive case matching
  for a multi-path decision.
