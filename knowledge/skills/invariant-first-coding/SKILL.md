---
name: invariant-first-coding
description: Reason from proven invariants before coding. Use when reviewing fallback logic, narrowing types, handling conversions, deciding whether an error path is real or impossible, removing overdefensive code, or when the user questions whether code is being too theatrical, too hedged, or not fail-closed enough.
---

# Invariant-First Coding

Write code that matches the real system.

If a system invariant already proves a condition, encode that invariant
directly. Do not add fallback branches, saturation logic, or “safe-looking”
defaults just to appear careful.

This skill is about **coding and review discipline**, not architecture or
testing in isolation.

## The rule

Before writing or approving a branch, ask:

1. What is the real invariant?
2. Is this case actually reachable?
3. If it is reachable, is it normal runtime behavior or an invariant violation?
4. What is the honest way to encode that distinction?

If the branch exists only because a conversion is typed as fallible, or because
the author felt nervous, that branch is probably theater.

## What counts as theater

Common examples:

- `try_from(...).unwrap_or(MAX)` when the value is already tightly bounded
- `unwrap_or(false)` after I/O or parsing where failure should be surfaced
- catch-all fallback paths that silently degrade behavior
- “best effort” logic where the interface promised stronger semantics
- extra conditionals added to avoid stating the real invariant

The problem is not style. The problem is lying about the system.

## Classify the situation first

Every suspicious branch is one of three things:

### 1. Real runtime case

The case can happen during correct operation.

Examples:

- network timeout
- user-supplied malformed input
- resource contention
- stale optimistic concurrency token

Handle it as part of the interface contract.

### 2. Invariant violation

The case should be impossible if the surrounding system is correct.

Examples:

- host-local slot count exceeds the hard per-host slot limit
- a supposedly exhaustive enum mapping hits “unknown”
- a pointer is absent after earlier validation guaranteed presence

Do not paper over this with fallback behavior. Assert it, crash fast, or return
an explicit internal error, depending on the layer.

### 3. Type-system artifact

The language forces a fallible conversion or optional path, but the domain has
already ruled failure out.

Examples:

- `u32::try_from(count)` where `count <= 253` by invariant
- optional field after an earlier validation gate guaranteed presence

Prefer code that states the invariant plainly instead of pretending the
conversion is meaningfully uncertain.

## Preferred responses

### Prefer narrower types

If the value is naturally bounded, choose a type that encodes the bound.

Bad:

```rust
let slots = u32::try_from(count).unwrap_or(u32::MAX);
```

Better:

```rust
let slots = u32::try_from(count)
    .expect("per-host slot count must fit in u32");
```

Best, if practical:

```rust
struct HostSlotCount(u16);
```

The goal is to make invalid states unrepresentable or at least explicit.

### Prefer assertions for impossible states

If a condition is impossible by invariant, say so.

Bad:

```rust
let count = u32::try_from(value).unwrap_or(u32::MAX);
```

Good:

```rust
let count = u32::try_from(value)
    .expect("workspace count must fit in u32");
```

Use:

- `debug_assert!` when the check is only for programmer sanity in development
- `assert!` / `expect` when startup or internal corruption should abort
- typed internal errors when a long-running service must fail closed without panicking

### Prefer typed errors for real runtime failures

If the case can happen normally, model it.

Bad:

```rust
let enabled = env::var("FEATURE").ok().unwrap_or("false".into()) == "true";
```

Good:

```rust
let raw = env::var("FEATURE").map_err(ConfigError::MissingFeatureFlag)?;
let enabled = parse_feature_flag(&raw)?;
```

### Prefer deleting dead fallbacks

If an old branch no longer represents a real mode, delete it.

Bad:

```go
if canUsePrimary() {
    return primary()
}
return fallback()
```

Good:

```go
if !canUsePrimary() {
    return ErrPrimaryUnavailable
}
return primary()
```

Or, if the primary is the only supported mode:

```go
return primary()
```

## Layer-specific guidance

### API boundary

At an API boundary:

- reject malformed user input explicitly
- return typed errors for normal runtime failures
- do not leak internal implementation details
- do not silently coerce impossible state into a fake success

### Internal service or daemon

Inside a daemon or service:

- treat invariant violations as bugs or internal corruption
- avoid fallback paths that keep the process limping with bad state
- preserve one obvious authority for each fact

### Startup and configuration

During startup:

- crash fast on impossible or unsupported configuration
- avoid “continue with defaults” unless the defaults are part of the contract

Startup is one of the few legitimate places for hard assertions.

## Questions to ask during review

Use this checklist when you see defensive-looking code:

- What invariant bounds this value?
- Is this conversion truly fallible in the domain, or only in the type system?
- If this branch fires, what larger assumption is already broken?
- Would saturating, defaulting, or retrying hide that breakage?
- Is this a real compatibility path, or a stale branch that should be deleted?
- Does this code fail closed, or does it quietly degrade?

## Language-specific hints

### Rust

- Prefer `TryFrom` + explicit assertion when the invariant proves the bound.
- Be suspicious of `unwrap_or`, `unwrap_or_default`, and saturating math used to
  mask impossible states.
- Prefer a helper with a strong name if the invariant is non-obvious.

Example:

```rust
fn u32_from_host_slot_count(value: usize) -> u32 {
    u32::try_from(value).expect("per-host slot count must fit in u32")
}
```

### Go

- Prefer explicit `panic`-free internal error returns for impossible service
  states if the process must stay alive.
- Do not use zero values as fake recovery when the contract requires presence.
- Avoid boolean helper pyramids that silently route to fallback behavior.

### General

- If the code says “best effort,” ask whether the interface actually promised
  best effort.
- If the code says “fallback,” ask whether the system is pretending failure did
  not happen.

## Anti-patterns

### Bad: defensive theater

Code that exists only to make the author feel prudent:

- saturation without a real overflow story
- defaults without a real defaulting contract
- fallback branches for impossible cases
- broad `catch` / `match _` behavior that erases failure modes

### Bad: hidden degradation

If the interface promises strong semantics, do not quietly weaken them in the
implementation.

### Bad: uncertain comments

Comments like:

- “should never happen”
- “just in case”
- “be safe”

without stating the actual invariant are a red flag.

State the invariant, or redesign the code.

## Completion checklist

- [ ] The real invariant is named
- [ ] Impossible states are treated as impossible
- [ ] Normal runtime failures are modeled explicitly
- [ ] No silent saturation or defaulting hides invariant violations
- [ ] The code’s behavior matches the interface contract
- [ ] The branch structure reflects real system cases, not author anxiety
