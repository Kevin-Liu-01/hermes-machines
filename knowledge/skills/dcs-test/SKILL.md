---
name: dcs-test
description: Run DCS test profiles against controlplane (Go), host-agent (Rust), storage-daemon, or live clusters. Use when testing DCS changes locally or triggering CI test suites.
allowed-tools: Bash(*)
argument-hint: "[profile] [--scope controlplane|host-agent|storage-daemon|all]"
---

## Context

- Test hub: `apps/cloud/apps/dcs/src/tests/README.md`
- Local profile runner: `apps/cloud/apps/dcs/src/tests/cmd/dcs-check/`
- Live API smoke runner: `apps/cloud/apps/dcs/src/tests/cmd/dcs-smoke/`
- Scenario/load runner: `apps/cloud/apps/dcs/src/tests/cmd/dcs-gauntlet/`
- Remote Linux/KVM runner: `pnpm dcs testbox`

## Profiles

Run the cheapest command that proves the changed invariant:

```bash
dcs-check unit [--scope controlplane|host-agent|storage-daemon|all]
dcs-check integration [--scope controlplane|host-agent|storage-daemon|all]
dcs-check kwok
dcs-check chaos
dcs-check chaos-compaction
dcs-check kvm
dcs-check fuse [--suite all|sanity|pjdfstest|git|npm|rust-compile|c-compile|go-compile|data-integrity|concurrent|fsstress|xfstests|xfstest-general]
dcs-check full
```

Live API verification:

```bash
DEDALUS_API_KEY=... dcs-smoke --env=dev
DEDALUS_API_KEY=... dcs-smoke --base https://dev.dcs.dedaluslabs.ai --iterations 2
```

Load and scenario drills:

```bash
DEDALUS_API_KEY=... dcs-gauntlet scale --base https://dev.dcs.dedaluslabs.ai --count 20
DEDALUS_API_KEY=... dcs-gauntlet ramp --base https://dev.dcs.dedaluslabs.ai --count 20
DEDALUS_API_KEY=... dcs-gauntlet compaction-drain --base https://dev.dcs.dedaluslabs.ai
```

## Dispatching

When the user invokes `/dcs-test` without arguments, run:

```bash
go run ./apps/cloud/apps/dcs/src/tests/cmd/dcs-check unit
```

When a profile is specified, run exactly that profile through `dcs-check`,
`dcs-smoke`, or `dcs-gauntlet`. Prefer `go run ./apps/cloud/apps/dcs/src/tests/cmd/<tool>`
inside the repo unless the binary is already installed.

## Remote Linux/KVM

For profiles that need Linux, `/dev/kvm`, or `/dev/fuse`, use the
typed testbox CLI:

```bash
pnpm dcs testbox run "cargo build --release -p dm-host-agent -p dm-storage-daemon -p dm-bake -p dm-guest-agent"
pnpm dcs testbox run "sudo ./target/release/dm-check --iters 2"
pnpm dcs testbox run "go run ./apps/cloud/apps/dcs/src/tests/cmd/dcs-check kvm"
```

## Nightly CI Workflows

These run automatically but can be triggered manually via `gh workflow run`:

| Workflow | Profiles |
|---|---|
| `dcs-nightly-stress.yml` | `dcs-check full` |
| `dcs-nightly-dcs-smoke.yml` | `dcs-smoke` + CLI smoke |
| `dcs-nightly-scale-drill.yml` | `scale`, `ramp`, `compaction-drain`, `compaction-chaos` |
| `dcs-nightly-adversarial-storage.yml` | `adversarial-storage` |

## After Running

Report the test results. If a profile fails, check the reports directory at
`apps/cloud/apps/dcs/src/tests/reports/` for JUnit XML and failure artifacts.
