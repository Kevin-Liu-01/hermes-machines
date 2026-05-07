---
name: rust-neckbeard
description: Dedalus Rust correctness and style rules. Use when writing, reviewing, or refactoring any Rust code in the host-agent, enclave, or packages/rust workspaces. Covers return-value naming, error design, must_use, visibility, RAII, fail-closed, and all hard limits from style.md and rust.mdx.
---

# Rust Neckbeard Style

Canonical reference: `style/style.md` and `docs/src/style/rust.mdx`.
Enclave crates (`apps/cloud/apps/enclave/`) are decent (not perfect) examples.

## File Header

Every source file opens with the copyright line, then a blank line, then
module docs:

```rust
// Copyright (c) 2026 Dedalus Labs, Inc. All rights reserved.

//! Module purpose in one sentence.
```

The copyright line uses `//` (not `//!`) because it is not Rustdoc output.

### Algorithmic Preamble

For files that implement a non-trivial algorithm or protocol, add a numbered
step summary inside the module doc. The reader should be able to reconstruct
the high-level flow without reading function bodies.

Not every file needs this -- only files whose control flow would confuse a
reader six months from now. Wire types and thin delegation layers skip it.

## Hard Limits

- Functions: **70 lines**
- Files: **500 lines** (excluding `#[cfg(test)]` module)
- Nesting: **3 levels**
- Arguments: **5** (excluding `&self`/`&mut self`)
- PRs: **200 changed LOC**

If a function exceeds 70 lines, extract helpers. If a function exceeds 5 args,
bundle related params into a config/context struct.

## Implicit Last Expression Is Idiomatic

Rust's implicit last expression is the language's idiom for return values.
Clippy's default `let_and_return` lint warns against `let x = expr; x`.
Do not fight the linter.

```rust
// GOOD: idiomatic Rust
fn socket_path(&self, id: &WorkspaceId) -> PathBuf {
    self.socket_dir().join(format!("{id}.sock"))
}

// BAD: triggers clippy::let_and_return
fn socket_path(&self, id: &WorkspaceId) -> PathBuf {
    let path = self.socket_dir().join(format!("{id}.sock"));
    path
}
```

When a return expression is genuinely complex (multi-line match, long chain
with `?`), a named binding improves readability. Use judgment, not a blanket
rule. If the binding name is just `result`, you're not adding clarity.

## `#[must_use]` on Pure Functions

Annotate every public or `pub(crate)` function whose return value would be a
bug to ignore. This includes:

- constructors (`new`, `with_*`, `from_*`)
- path builders (`socket_path`, `template_dir`)
- pure computations (`hex_digest`, `burst_vcpus`, `build_memory_arg`)
- predicates that aren't `&self` methods on the type they query

The compiler warns if callers discard the value. This catches
`validator.with_max_age(60);` when the caller meant
`let v = validator.with_max_age(60);`.

## Error Design

### `thiserror` for Libraries, `anyhow` for Binaries

Library crates (`crates/`, `packages/rust/`) use `thiserror`. Binary crates
(`main.rs`) may use `anyhow` at the top of the stack.

### No String Buckets

A `String` inside an error variant means the error type hasn't been designed.
If you can't `match` on it, you can't handle it.

```rust
// BAD
#[error("something failed: {0}")]
SomethingFailed(String),

// GOOD: typed source
#[error("DHV HTTP request failed: {0}")]
Hyper(#[source] hyper::Error),

// GOOD: structured diagnostic data
#[error("proof expired: iat={iat}, now={now}, skew={skew}")]
Expired { iat: i64, now: i64, skew: i64 },
```

### Variant Names Match Semantics

If a variant is used for both serialization and deserialization, name it `Serde`,
not `Deserialize`. If a variant wraps command failures, don't reuse it for
data-parsing failures. One variant = one failure mode.

### No Dead Code Variants

Don't `#[allow(dead_code)]` on error variants "for future use." Every variant
inflates every exhaustive `match` in `status_code()`, `error_code()`,
`retryable()`, etc. YAGNI. Re-add when needed.

## Visibility

Default to private. Use `pub(crate)` for internal cross-module needs.
Use `pub` only for the crate's public API.

```rust
pub struct User { ... }                  // Public API
struct InternalCache { ... }             // Private (default)
pub(crate) fn internal_helper() { ... }  // Crate-visible
pub(super) fn parent_helper() { ... }    // Parent module only
```

## Group Related Constants in a `mod`

Bare `const` at module scope is fine for one-offs. Two or more related
constants belong in a named `mod` block with `pub(super)` visibility.
The module name documents the relationship and keeps the parent scope
scannable.

```rust
// GOOD: grouped, named, scannable
mod timeout {
    pub(super) const REACHABLE_SECS: u64 = 2;
    pub(super) const SPECIALIZE_SECS: u64 = 30;
}

mod paths {
    pub(super) const INIT_SENTINEL: &str = "/var/lib/dcs/launch-initialized";
    pub(super) const WORKSPACE_HOME: &str = "/home/workspace";
}

// BAD: raw constants at module scope with no grouping
const REACHABLE_TIMEOUT_SECS: u64 = 2;
const SPECIALIZE_TIMEOUT_SECS: u64 = 30;
```

## Comments Explain Policy, Not Syntax

Comments are for: invariants, ordering constraints, safety arguments,
retry/idempotency justification, trade-offs the reader wouldn't otherwise know.

Do not narrate obvious assignments, restate field names as field docs, or
use formulaic `# NAME / # CONTRACT / # SCHEMA` headers. One concise sentence
that says *why* the thing exists beats three sections that restate *what* it is.

```rust
// BAD: restates the field name
/// The workspace ID.
pub workspace_id: WorkspaceId,

// BAD: formulaic boilerplate
//! # NAME
//! `rootfs` - XFS-backed machine root filesystem lifecycle.
//! # CONTRACT
//! ...

// GOOD: says why the crate/module exists in one breath
//! XFS reflink-backed machine rootfs lifecycle. Each machine gets a
//! disposable raw clone from an immutable base image; all operations
//! are replay-safe so retries from the reconciler are harmless.
```

## Call Sites Read Like English

When a method composes with its receiver, the expression should read as a
declarative sentence. The caller states intent; the type handles its own
case-matching internally.

```rust
// Good: reads as "take or generate an identity for this VM index"
let host_identity = app.identity_pool().take_or_generate(vm_index)?;

// Bad: caller knows the pool's internal failure mode and handles it
let host_identity = match app.identity_pool().take(vm_index) {
    Some(identity) => identity,
    None => {
        tracing::warn!(vm_index, "identity pool miss");
        generate_host_identity()?
    }
};
```

The rule: if two or more call sites repeat the same `match`/`unwrap_or`/`map_or`
pattern for the same type, that branch belongs on the type as a method. The call
site becomes a sentence; the branch disappears from the caller's scope.

More examples:

- `state.fence_token_or_zero(id)` not `state.get(id).map_or(0, |r| r.token)`
- `assigned_host_is_set(host)` not `!host.trim().is_empty()` at 4 call sites
- `tail_lines(&content, 200)` not the same 5-line slice-and-join at 2 call sites

## Fail Closed

If the system cannot prove a required invariant, reject the request or refuse
readiness. Silent degradation to a weaker mode hides broken infrastructure.

- startup: crash early if host capabilities are missing
- requests: return a typed error, don't route to an unsupported path
- `debug_assert!` on preconditions that should be validated upstream

Conditional logic is case-matching, not fallback. Every branch is an expected,
named case. No branch is a degraded or "best effort" path.

## RAII for System Resources

TAP devices, rootfs clones, sockets, child processes, temp files: wrap in a
type whose `Drop` cleans up. Never rely on callers to remember cleanup.

If cleanup can fail, log in `Drop` and move on. Panicking in `Drop` during
stack unwinding aborts the process.

Ordering matters: delete the resource before removing its protection rules.
A TAP device without its anti-spoof rule is a security hole.

## Naming

| Element | Convention | Example |
|---------|------------|---------|
| Types, traits | PascalCase | `ClockReading`, `TimeProvider` |
| Functions | snake_case | `now_interval`, `commit_wait` |
| Constants | SCREAMING_SNAKE | `MAX_CONNECTIONS` |
| Lifetimes | Short lowercase | `'a`, `'b` |

- effectful verbs: `fetch_connection`, `mount_workspace_home`
- predicates read as questions: `is_ready`, `needs_gc`, `has_mount`,
  `does_manifest_match`, `are_artifacts_ready`. Not state declarations:
  ~~`snapshot_current`~~, ~~`artifacts_ready`~~, ~~`bundle_intact`~~.
- nouns for state/wire types: `DispatchOutcome`, `WorkspaceIntent`
- units in names: `timeout_ms`, `storage_gib`, `latency_us_p99`
- no `get_` prefix on getters (idiomatic Rust)
- `as_*` (borrowed, cheap), `to_*` (owned, allocates), `into_*` (consumes),
  `from_*` (constructor). The prefix is a contract.

## Reader-First Organization

- Public entrypoints first, helpers by call flow
- Top-level orchestrators read like verb chains: `load -> prepare -> start -> publish`
- If folding function bodies makes the file incomprehensible, restructure

## Function Shape: Simple, Descriptive, Single-Concern

Each function does one thing. The name describes what, not how.

**Split compound functions like you split compound assertions.** A function
that checks a condition and then acts on it should be two functions: a
predicate and an action. The caller composes them.

```rust
// BAD: decision and action locked together, unopenable box
pub(crate) async fn bake_if_stale(config: &Config) -> Result<bool> {
    if !artifacts_ready(config) { return Ok(false); }
    if is_fresh(config).await? { return Ok(false); }
    bake(config).await?;
    Ok(true)
}

// GOOD: caller composes predicates + action explicitly
if !bake::are_artifacts_ready(&config) {
    info!("bake skipped");
    return Ok(());
}
if bake::is_fresh(&config).await? {
    info!("snapshot already baked");
    return Ok(());
}
bake::bake(&config).await?;
```

**Orchestrator functions** should read like a recipe: a sequence of named
steps that a reader can skim without expanding any bodies.

**Avoid compound names** like `download_verify_decompress_install`. If a
function name needs "and" or "while" or "ensuring," split it.

**Simple leaf functions** (one `if`, one syscall, one parse) should be
obvious at a glance. Don't wrap trivial expressions in functions just to
name them; `let` bindings handle that.

**Complex multi-step operations** with ordering constraints belong in a
dedicated function whose doc comment explains the ordering. The caller
should not have to understand internal sequencing.

## Let Bindings Give the Reader Room to Breathe

Long chains compress multiple ideas into one expression. A `let` binding names
the intermediate result and creates a visual pause. Use named locals whenever the
expression produces a value the next few lines operate on. The reader should be
able to skim the left margin and understand the block.

```rust
// GOOD: named intermediate, match reads as "check the ack"
let ack = BufReader::new(&mut stream)
    .lines()
    .next_line()
    .await?;

match ack {
    Some(line) if line.starts_with("OK") => Ok(stream),
    _ => Err(io::Error::new(io::ErrorKind::ConnectionRefused, "rejected")),
}

// BAD: reader must parse the chain to understand the match input
match BufReader::new(&mut stream).lines().next_line().await {
    Ok(Some(line)) if line.starts_with("OK") => Ok(stream),
    _ => Err(io::Error::new(io::ErrorKind::ConnectionRefused, "rejected")),
}
```

## Concrete Over Generic

Start with free functions and inherent methods. Add a trait only when there is
a real second implementation today. Concrete code is shorter, easier to
autocomplete, and debuggable.

## No `unwrap` in Production

Clippy warns on `unwrap_used`, `expect_used`, `panic`. Allowed only in:

- Tests (`#[cfg(test)]`)
- Compile-time provable (`NonZeroUsize::new(100).unwrap()`)
- Startup configuration (fail fast)
- Poisoned mutex (state is already corrupt)

Never on runtime data, config files, or external input.

Treat every `unwrap` or `expect` in production Rust as a design review moment.
Stop and prove one of these is true before keeping it:

- the value is compile-time guaranteed
- the type system already enforces the invariant
- the process is still in startup and should crash fast
- the state is already irrecoverably corrupt

If you cannot prove one of those, the `unwrap` is wrong. Replace it with a
typed error or an explicit case match. Be especially suspicious of:

- `unwrap_or(false)` or similar defaults that hide infrastructure failure
- `unwrap()` after FFI, filesystem, network, or subprocess boundaries
- `expect()` used as a substitute for real error design

## Lint Suppressions Are Surgical

```rust
// GOOD: justification inline
#[allow(clippy::cast_possible_wrap)] // Unix timestamp won't overflow i64 for 292B years
fn current_timestamp() -> i64 { ... }

// BAD: bare suppression
#[allow(clippy::too_many_arguments)]
```

A bare `#[allow(clippy::...)]` with no justification will be flagged in review.

## Unsafe Is Compartmentalized

Isolate unsafe in dedicated FFI modules. Safe wrappers encapsulate all dangerous
ops. Every `unsafe` block has a `// SAFETY:` comment that cites the specific
guarantee: which fd is valid, which function is async-signal-safe per POSIX,
which invariant the caller upholds. Generic "this is safe" is not a safety
argument.

```rust
// lib.rs
#![deny(unsafe_code)]
pub(crate) mod ffi;      // all unsafe isolated here

// ffi.rs
#![allow(unsafe_code)]   // FFI wrapper layer
```

## Prefer Ecosystem Crates Over Hand-Rolling

Before writing syscall wrappers, check whether `nix`, `rustix`, `vsock`,
`rtnetlink`, or a dedicated crate already provides the abstraction. Examples:

- `nix::pty::openpty` replaces the 4-step `posix_openpt`/`grantpt`/`unlockpt`/`ptsname_r` dance
- `vsock::VsockListener` replaces hand-rolled `socket2` AF_VSOCK setup
- `Stdio::from(OwnedFd)` on `Command::stdin`/`stdout`/`stderr` replaces manual `dup2`/`close` in `pre_exec`
- `rtnetlink` replaces raw netlink socket manipulation

The fewer raw `libc::` calls, the less `unsafe` surface. Use raw syscalls only
when no safe wrapper exists (e.g. `ioctl(TIOCSCTTY)`, `ioctl(TIOCSWINSZ)`).

## Platform Gating at Module Scope

When a module is inherently platform-specific (PTY allocation, VSOCK listener,
etc.), gate the `mod` declaration rather than every item inside:

```rust
// GOOD: one gate, zero stubs
#[cfg(target_os = "linux")]
mod pty;
#[cfg(target_os = "linux")]
mod terminal;

// BAD: every struct, fn, impl gets its own #[cfg] + non-Linux stub
#[cfg(target_os = "linux")]
pub(crate) fn spawn_shell(...) { ... }
#[cfg(not(target_os = "linux"))]
pub(crate) fn spawn_shell(...) { Err(Unsupported) }
```

This eliminates boilerplate stubs and makes the platform boundary explicit at
the file level.

## Module Docs Cross-Reference and Cite Standards

Every module doc has three layers (skip layers that don't apply):

1. **What** -- one sentence saying what the module does.
2. **Where it fits** -- intra-doc links (`[`crate::lifecycle`]`,
   `[`super::teardown`]`) showing who calls this module and what it
   depends on. This gives the reader a "you are here" marker.
3. **External references** -- manpage citations when wrapping POSIX or
   Linux APIs.

```rust
//! Workspace sleep: shutdown VM, retain persistent state for future wake.
//!
//! Delegates VM shutdown to [`crate::vm::teardown`]. A future
//! [`super::wake`] restores the VM from its snapshot.
```

```rust
//! Guest SSH readiness probe via TCP connect.
//!
//! Called after [`super::guest_runtime`] specialization to confirm the
//! guest `sshd(8)` is accepting connections before the workspace is
//! marked running.
```

Common manpage citations: `openpty(3)`, `mount(2)`, `rtnetlink(7)`,
`vsock(7)`, `sshd(8)`, `kmsg(4)`, `termios(3)`, `ioctl_tty(2)`.

## Deduplicate Error Mapping

When 4+ call sites in one function use the same `.map_err(...)` closure,
extract a local helper:

```rust
// GOOD: one helper, N call sites
fn rtnetlink_err(e: impl std::fmt::Display) -> io::Error {
    io::Error::new(io::ErrorKind::Other, e.to_string())
}

handle.link().get().execute().await.map_err(rtnetlink_err)?;
handle.address().add(...).execute().await.map_err(rtnetlink_err)?;

// BAD: copy-paste closure
handle.link().get().execute().await
    .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
handle.address().add(...).execute().await
    .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;
```

## Async Rust

Async code has three classes of bug that the compiler cannot catch:
blocking, cancellation, and futurelock. These rules prevent all three.

References: Oxide RFDs [397](https://rfd.shared.oxide.computer/rfd/0397)
(cancellation), [400](https://rfd.shared.oxide.computer/rfd/0400)
(cancel safety patterns), [609](https://rfd.shared.oxide.computer/rfd/0609)
(futurelock). Tokio [bridging guide](https://tokio.rs/tokio/topics/bridging).

### Blocking

Async code must never spend more than ~100us without reaching an
`.await`. Violations stall the entire runtime under load.

- **Sync I/O**: `tokio::task::spawn_blocking` for filesystem, SQLite,
  or any syscall that may block. `tokio::fs` for file operations.
- **CPU-bound work**: `rayon` or `std::thread::spawn`, not
  `spawn_blocking` (its pool is shared with I/O bridging).
- **Long-lived blocking loops**: `std::thread::spawn`, not
  `spawn_blocking` (the blocking pool has a cap; infinite tasks
  exhaust it).

### Mutexes

- **`std::sync::Mutex` is the default.** Faster than tokio's mutex for
  short critical sections. Only use `tokio::sync::Mutex` when the guard
  must be held across `.await` (and question whether the design allows
  restructuring to avoid that).
- **Never hold any `MutexGuard` across `.await`.** If the future is
  cancelled, the lock is released with invariants broken. Scope locks
  in blocks that drop before any `.await`.
- **Same rule for RAII pool handles.** `DashMap::Ref`, DB connection
  handles, semaphore permits: drop as soon as the I/O is done.

### `select!`

`tokio::select!` is the most dangerous construct in async Rust. Every
branch is cancelled when another wins. A branch that holds a resource
and is never polled again causes futurelock.

- **Only use cancellation-safe futures in `select!` branches.** Tokio
  docs mark which are safe. When in doubt, `tokio::spawn` the work and
  select on the `JoinHandle`.
- **Never `select!` on `&mut future` if it might hold a shared resource.**
  The future stays alive but unpolled. Any lock, channel position, or
  connection it holds is trapped forever. Use owned futures so losing
  branches are dropped.
- **`select!` loop bodies must be fast.** Spawn handlers into their
  own tasks. A handler that does a network call inline starves every
  other branch (heartbeats, shutdown signals).
- **`Sender::send()` in `select!` loses the value on cancellation.**
  Use `reserve()` + synchronous `send()`, or `try_send()`.
- **Resume pinned futures across iterations, don't recreate them.**
  Pin outside the loop, select on `&mut pinned`. This preserves
  progress and queue position.
- **Drop zombie futures before awaiting anything else.** If a future
  survives past `select!` (created before, selected on via `&mut`),
  explicitly `drop(future)` before any subsequent `.await`. The future
  may hold locks even though `select!` is done with it.
- **Consider `JoinSet` or `join_all` instead of `select!`.** Teams
  that banned `select!` and used cooperative cancellation instead
  report fewer bugs. `select!` is three footguns in a trenchcoat:
  cancel-safety, futurelock, fairness loss.

### `FuturesUnordered` / `FuturesOrdered`

Same futurelock risk as `select!`, different shape. While the task is
awaiting something in the loop body, the remaining futures in the set
are not polled.

- **Never `.await` in a `futs.next().await` loop body.** Push follow-up
  work back into the set, or `tokio::spawn` it.
- **Prefer `join_all` or `JoinSet` when completion order is irrelevant.**
  `join_all` polls all futures on every wake. It cannot futurelock.
- **"Just make the channel bigger" is not a fix.** The capacity would
  need to exceed every possible un-polled future count, which is
  unknowable and changes as code evolves.

### Cancellation safety

Every `.await` is an implicit cancellation point. The compiler provides
zero help.

- **Document cancellation contracts.** If a function is not cancel-safe,
  say so: `/// # Cancellation safety\n/// **Not cancel-safe.**`
- **Don't name cancel-unsafe methods `next()` or `recv()`.** These
  pattern-match against cancel-safe tokio APIs.
- **`timeout()` drops the client future but the server keeps running.**
  For side-effectful operations, poll for completion instead.
- **`try_join!` cancels remaining futures on first error.** For
  independent side-effectful work, use `tokio::join!` + manual `?`.
- **`JoinHandle::abort()` is not normal control flow.** Prefer
  `CancellationToken` or `oneshot` for cooperative cancellation.
- **`SinkExt::send` is cancel-unsafe.** Same as `Sender::send`: it
  owns the value, cancellation loses it. Use `poll_ready` + `start_send`
  + `poll_flush` for cancel-safe sink writes.
- **Runtime shutdown cancels all tasks in arbitrary order.** Including
  `#[tokio::main]` returning, panics causing unwind. A task spawned
  without a `JoinHandle` is not immortal; runtime shutdown kills it.
- **Every public async method needs a `# Cancellation safety` doc
  section.** Three categories: cancel-safe, mostly cancel-safe
  (fairness loss only), not cancel-safe (state consequence described).
  This is mandatory for methods named `next`, `recv`, `send`, `reserve`.
- **Treat cancel safety with the same gravity as memory safety.** The
  compiler cannot check it. The failure mode is silent corruption. The
  blast radius is unbounded. Audit it like you audit `unsafe`.

### Bridging sync and async

When synchronous code needs to call async functions (actors with `!Send`
state, FFI bridges, CLI tools), there are two ways to bridge. One works.
The other causes deadlocks, panics, or connection pool corruption.

**`Runtime::block_on`** drives the full task queue: your future AND all
background tasks (hyper connection pool maintenance, timer ticks, spawned
tasks). Connection reuse works correctly.

**`Handle::block_on`** only polls the given future. Background tasks
(pool cleanup, TLS shutdown, idle reaping) never run. Pooled connections
accumulate stale TLS state and the next request hangs on a dead socket.

```rust
// GOOD: dedicated Runtime for sync-to-async bridge
struct ActorState {
    io_rt: tokio::runtime::Runtime,
}
let io_rt = tokio::runtime::Builder::new_current_thread()
    .enable_all()
    .build()
    .expect("io runtime");

// In the synchronous handler:
let result = state.io_rt.block_on(http_client.get(url).send());

// BAD: Handle::block_on orphans pooled connections
let result = rt_handle.block_on(http_client.get(url).send());
```

Rules:
- **Own a `Runtime`, not just a `Handle`.** The `Runtime` must outlive
  all work. Dropping it shuts down spawned tasks.
- **Never call `block_on` from inside an async task.** It panics
  ("cannot start a runtime from within a runtime"). Use `.await`.
- **`block_in_place` on a worker starves the runtime under load.**
  Use `spawn_blocking` + `blocking_recv` for actors that need to
  bridge. See `packages/rust/actor` `spawn_blocking`.
- **`spawn_blocking` is for finite work.** Permanent threads use
  `std::thread::spawn`.

### HTTP connection pools (hyper / AWS SDK)

hyper's pool relies on background tasks to detect dead connections.
If those tasks don't run (wrong `block_on`, missing timer, dropped
runtime), connections go stale and requests hang.

- **Set `pool_idle_timeout` shorter than the server's keep-alive.**
  S3 closes at ~20s, many LBs at 60s. hyper defaults to 90s.
- **Both `pool_timer` AND `pool_idle_timeout` must be set.** Without
  `pool_timer`, idle cleanup never runs (hyper-util bug, fixed in
  reqwest 0.12.8, but raw hyper-util still requires it).
- **Consume response bodies before sleeping.** An unconsumed body
  keeps the connection checked out. Idle timeout doesn't apply.
- **Every outgoing request needs an `operation_timeout`.** Network
  partitions and SDK bugs can hang `.send()` forever. The timeout
  is your last line of defense.
- **Never set `pool_idle_timeout(ZERO)` without `pool_max_idle_per_host(0)`.** Zero timeout without zero max idle causes the pool's idle
  checker to spin-loop and burn CPU.

### Channels

- **Default to bounded channels.** Unbounded channels are an OOM bug.
  Size the buffer for expected burst, not throughput.
- **Bounded `send().await` is a lock.** If paused in `select!`, other
  senders on the same task deadlock. Use `try_send()` to externalize
  backpressure.

### Tasks

- **Every `tokio::spawn` needs a cancellation strategy.** Dropping the
  `JoinHandle` does NOT cancel the task. Hold the handle, or use
  `CancellationToken` / `AbortHandle`.
- **`block_on` is for waiting, not for running server loops.** Spawn
  the real work into the pool. `block_on` pins the future to the
  calling thread; it cannot be work-stolen.
- **Forgetting `.await` silently discards the future.** Use
  `#[deny(unused_must_use)]` in every crate. An async call without
  `.await` is always a bug.

### Debuggability

Channel-based message passing (the actor pattern) decouples cause from
effect. When context A sends a message to actor B, A's stack trace is
gone by the time B processes it.

- **Carry `tracing::Span` across channel boundaries.** Include a `span`
  field in command enums. Enter it in the actor handler so logs attribute
  to the original caller.
- **Every outgoing network request needs a timeout.** Without one, a
  single slow dependency cascades: blocks a task, fills a channel,
  starves callers, exhausts the task pool.

### Golden files

- `packages/rust/actor/src/lib.rs` -- `spawn_blocking` actor pattern
- `apps/cloud/apps/dcs/src/runtime/crates/storage-daemon/src/registry.rs`
  -- dedicated `Runtime` for sync-to-async bridge with `!Send` state

## Guest Clock Synchronization

Snapshot-restored VMs wake with `CLOCK_REALTIME` frozen at snapshot time.
Without correction, any time-sensitive operation in the guest (SSH cert
validation, TLS, log timestamps) sees stale time.

The fix: the host reads `realoj::TimeProvider::now_interval()` and sends
`latest` (conservative upper bound on true time) to the guest in the
`Specialize` payload. The guest calls `nix::time::clock_settime` as the
first specialization step, before SSH trust, network, or storage setup.

Rules:

- **Use `latest`, not `earliest`.** `earliest` can be behind true time
  and recreate the skew. `latest` guarantees the guest is at or ahead.
- **Set the clock before any cert/TLS validation.** The `Specialize`
  handler must call `clock_settime` as its very first operation.
- **Do not use `SystemTime::now()` on the host.** It bypasses realoj.
  Use `app.now_interval()?.latest` which goes through ClockBound on
  Nitro or `AssumedBound` in dev.
- **Do not use raw `libc::clock_settime`.** Use `nix::time::clock_settime`
  (safe wrapper). The guest-runtime denies `unsafe_code`.
- **Do not use cert backdating as a substitute.** Backdating hides the
  root cause (stale guest clock) instead of fixing it. With realoj
  injection, `ValidAfter = 0` is correct.
- **Log `clock_settime` failures.** `EPERM` means the guest lacks
  `CAP_SYS_TIME`. This is a rootfs build bug, not a runtime retry.

## Testing

- Tests are inline (`#[cfg(test)] mod tests`) in the same file
- Name by invariant: `invariant_expired_proof_rejected`, not `test_validate`
- `design_` prefix for intentional policy decisions
- `matches!` for error variant assertions: `assert!(matches!(result, Err(E::Foo(_))))`
- Section headers: `// --- category ---`
- Test helpers at `pub(crate)` in `#[cfg(test)]` blocks, not in production code

## Before Committing

```bash
cargo fmt --check
cargo clippy -- -D warnings
cargo test
```

If you changed doc comments on `utoipa`-annotated types, verify the
contract test passes:

```bash
cargo test -p host-agent openapi
```
