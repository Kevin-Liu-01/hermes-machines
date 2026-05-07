---
name: counterfactual
description: Compare the current implementation against the minimal correct algorithm. Use when debugging regressions, reviewing complex fixes, or when the user asks what should happen versus what is happening now.
---

# Counterfactual

Use this to avoid patching symptoms. The output must separate the
**minimal correct algorithm** from the **current algorithm**, then name
the smallest intervention that moves current toward correct.

## Output shape

Use exactly these sections:

1. **Goal:** one sentence stating the invariant we need.
2. **Minimal algorithm:** pseudocode or numbered steps for the ideal
   implementation. No library constraints yet.
3. **Current algorithm:** what the code actually does today, including
   ownership, blocking points, and cleanup boundaries.
4. **Gap:** the first point where current diverges from minimal.
5. **Smallest fix:** one intervention. Preserve working invariants.
6. **Falsifier:** the test or measurement that proves the fix wrong.

## Rules

- Do not start with a proposed patch. Start with the invariant.
- Do not compare against a strawman. Read the code and name exact
  functions, fields, and blocking calls.
- Preserve constraints that are already correct. If a prior commit fixed
  a deadlock, do not revert it to fix a leak.
- Prefer ownership/cancellation changes over retries, sleeps, or cleanup
  after the fact.
- A good fix reduces the gap; a great fix removes an entire class of
  impossible states.

## Checklist

- Where is ownership supposed to live?
- What wakes every blocking syscall?
- Who joins or intentionally detaches each thread?
- Which fd owner closes each fd?
- What happens if the happy-path event never occurs?
- What is the failure mode under load?

## Example

Goal: Dropping a per-machine vhost-user server must not block the
registry actor and must not leak fds when no VM ever connects.

Minimal algorithm: bind listener; spawn accept loop cancellable by a
shutdown token; Drop fires token, wakes listener, signals workers, joins
threads with a bound, and closes all owned fds.

Current algorithm: `start()` moves `VhostUserDaemon` into an accept
thread and calls `daemon.start(&mut listener)`. Drop removes the socket
path, then tries to take the daemon from `Arc<Mutex<Option<_>>>`. If the
thread is blocked in `accept()`, the option is `None`, so cleanup is
skipped.

Gap: unlinking a Unix socket path does not wake a blocked `accept()`,
so the daemon owner never returns to Drop.

Smallest fix: keep Drop nonblocking, but spawn a bounded reaper that
self-connects to wake `accept()`, waits for daemon handoff, signals
workers, and joins the protocol thread off the actor thread.

Falsifier: create and drop N servers without clients, then assert the
fd delta over a control arm stays below the regression threshold. If fd
count grows linearly with N, the fix is wrong.
