---
name: perf
description: >-
  Discipline for performance investigations. Ramp up from cheap
  experiments to expensive ones. Profile before patching. Isolate
  hypotheses with standalone probes before touching production code.
  Numbers gate every decision. Use when the user says `/perf`, asks
  to speed up code, or asks why something is slow.
---

# /perf

Ramp up. Every investigation starts with the cheapest experiment that
can falsify your current theory and moves to more invasive ones only
when the cheap ones are exhausted or inconclusive. The bottleneck is
almost never where you first guess. Numbers gate every decision.

## Ladder (cheapest → most invasive)

1. **Baseline.** Measure the current wall time. Three runs, report
   the median. Without a baseline, every later number is meaningless.

2. **Read the code path.** Trace one op end-to-end. List every
   syscall, lock, DB statement, RPC. Do not theorise; read.

3. **Study the fast ops in the same codebase.** If op X is fast and
   op Y is slow, what technique does X use? Same database, same
   runtime, same I/O path — the gap between them is a technique you
   can borrow.

4. **Concurrency sweep.** Run at par=1, 4, 16, 64. The delta between
   par=1 and par=4 is per-op serial overhead. The plateau past par=N
   is the parallel floor. Together they decompose the wall time into
   two buckets and tell you which one to attack.

5. **Strace the process.** `strace -f -c -p $PID` for ~10 s during
   the workload. Gives a syscall histogram. Confirms whether the op
   is syscall-bound and which call dominates.

6. **Isolated probe.** Before touching production, write a minimal
   standalone program that reproduces the hypothesis using the same
   libraries and config. Under 150 LOC, under a minute to build and
   run. If the probe confirms the theory, the production refactor is
   worth writing. If it doesn't, your theory is wrong.

7. **perf / bpftrace.** Only if the lighter tools don't give signal.
   `perf record -g` for CPU attribution; `bpftrace` histograms for
   syscall latency tails.

## Rules

- **Falsifiable experiments only.** "I'll run the fix and see" is not
  a test. "The fix is wrong if wall time does not drop below 100 ms"
  is a test. State the failure criteria before running.

- **One change per rebench.** Every change → rebuild → rebench. Never
  stack two hypotheses between measurements.

- **Stop when the numbers flatten.** If batch=8 ≈ batch=256 in the
  probe, do not make batching adaptive. Pick a constant, ship.

- **Diff size proportional to win.** A 20 µs/op save is not worth a
  200-line refactor. A 200 µs/op save is. Match surgery to scale.

- **Respect precedent.** Before changing a pattern used in N call
  sites, read the existing design note. The original author may be
  defending an invariant you have not seen. If your change preserves
  it, say so explicitly; if it relaxes it, name the trade-off.

- **Ceiling vs floor.** For filesystems, ext4 is the floor, APFS is
  the ceiling, S3 Files is the competitor. Know which one you are
  comparing to and why.

- **Don't trust theory until the probe agrees.** A clean argument
  that says "this should be 4× faster" is worthless until an
  isolated probe measures 4× on the same libraries.

## Output template

When an investigation completes, report in the `/simple` shape:

```
Problem: [root cause from baseline + trace + probe].

Evidence: [numbers. baseline, probe, and any confirming traces].

Proposal: [one concrete change].

Mechanism: [why the change moves the number].

Test: [bench that confirms or falsifies the fix, with failure criteria].
```

If you have not reached Problem yet, you are still on the ladder.
Keep measuring.

## Common tooling

Baseline + concurrency sweep (bash, no deps):

```bash
DIR=/mnt/$fs/bench
for par in 1 4 16 64; do
  rm -rf "$DIR/par$par" && mkdir "$DIR/par$par"
  t=$(date +%s%3N)
  for w in $(seq 1 $par); do
    ( mkdir -p "$DIR/par$par/w$w" && cd "$DIR/par$par/w$w"
      for i in $(seq 1 $((1000/par))); do echo x > f$i; done ) &
  done
  wait
  echo "par=$par: $(($(date +%s%3N) - t))ms"
done
```

Strace the daemon during a workload:

```bash
PID=$(pgrep -f <daemon-name>)
sudo strace -f -c -p $PID -o /tmp/strace.out &
STRACE=$!
# ... run workload ...
sudo kill -INT $STRACE && wait $STRACE 2>/dev/null
cat /tmp/strace.out
```

Isolated probe shape: a standalone Cargo project in `/tmp/<name>/`
with the same pragmas, schema, or config as production. Three to
five regimes, each timed with `Instant::now()`, report median of
three runs plus min/max. Commit to `scripts/bench/<name>/` only if
the probe earns a spot in regular CI.

## Worked example: create-path investigation

Baseline: dedalus-fs 1K seq creates = 470 ms vs ext4 18 ms (26×).

Concurrency sweep: par=1 → 532 ms, par=4 → 311 ms, par=16 → 251 ms,
par=64 → 262 ms. Floor at ~260 ms. Serial penalty ~270 ms, parallel
floor ~260 ms: two distinct cost buckets.

Strace of daemon during 1K creates: 24 `pwrite64` per create (WAL
frame writes), 28 futex per create (mutex + tokio). Syscall-bound.

Hypothesis: per-op SQL transaction is the parallel floor (each op
writes its own WAL commit frame). Fast-op reference: `ls -la`
(9 ms for 1000 files) wins by doing one big SQL query — batching
is the borrowed technique.

Isolated probe (`/tmp/tx-probe/`): same WAL+NORMAL pragmas, same
schema, N=1000 creates under per-op-tx vs batch-of-8/32/64/128/256
vs one giant tx. Per-op = 99 ms. Any batched = 22–26 ms. One giant
tx = 22 ms. Ceiling: 4.5× speedup, flat past batch=8.

Proposal: wrap each coalescer batch drain in one SQL transaction;
per-op work uses `SAVEPOINT` for rollback isolation.

Stopped-because: parent-mtime coalescing probe added <5% further;
not worth the complexity.

## When NOT to use `/perf`

- User asks for a cleanup that is not perf-motivated.
- User asks for new functionality.
- The "slow" claim has no numbers attached yet — go measure first.
- The scope is a UI issue (layout, animation) — use
  `make-interfaces-feel-better`.
