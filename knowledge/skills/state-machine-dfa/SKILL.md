---
name: state-machine-dfa
description: Document state machines with mermaid diagrams and DFA transition files. Use when writing, reviewing, or adding state-driven logic to modules that have sequential phase transitions, lifecycle management, or protocol handshakes.
---

# State Machine DFA Documentation

## The Rule

Every module with sequential state transitions gets two artifacts:

1. **README.md** with a colored mermaid state diagram showing the happy path
   and every error edge.
2. **dfa.rs** (or `dfa.go`, `dfa.py`) with the states, inputs, and transition
   table as code. This file is the source of truth. The diagram visualizes it.

## Why

State machines have a specific failure mode: implicit transitions. Code that
calls `resume()` after `wait_ready()` is assuming a transition that the
underlying system does not guarantee. The socket being connectable does not
mean the VM is paused. The HTTP 200 does not mean the resource is ready.

A DFA file makes every transition explicit. If a transition is not in the
table, it does not exist. If a state is not observed before acting, the code
is wrong.

The pattern: each state is a function that reads the current input (an API
response, a socket probe, a file on disk), matches on it, and returns the
next state. No state is assumed. No transition is implicit. Invalid
transitions return an error, not a fallback.

## What Goes in the README

A mermaid `stateDiagram-v2` with:

- Named states as nodes
- Labeled transitions as edges (what triggers the transition)
- Error states in red (`classDef error`)
- Happy path in green or blue
- Every error edge drawn explicitly (no implicit "otherwise fail")

```markdown
## Restore State Machine

` ` `mermaid
stateDiagram-v2
    classDef happy fill:#2d6a4f,color:#fff
    classDef error fill:#d00000,color:#fff

    [*] --> TemplateLookup
    TemplateLookup --> Materialize : snapshot compatible
    Materialize --> Spawned : DHV process started
    Spawned --> SocketReady : socket accepts connection
    SocketReady --> Paused : info().state == Paused
    Paused --> Running : vm.resume ok
    Running --> Resized : hotplug ok (or no-op)
    Resized --> Specialized : guest specialize ok
    Specialized --> Published : fence token valid
    Published --> [*]

    TemplateLookup --> Error : snapshot missing/incompatible
    Materialize --> Error : artifact copy failed
    Spawned --> Error : socket timeout
    SocketReady --> Error : restore did not reach Paused
    Paused --> Error : resume rejected
    Running --> Error : hotplug rejected
    Resized --> Error : guest rejected
    Specialized --> Error : fence CAS failed

    class Published happy
    class Error error
` ` `
```

## What Goes in the DFA File

A Rust (or Go, Python) file that encodes:

1. **States** as an enum
2. **Inputs** as what the system observes (DHV API response, socket probe, etc.)
3. **Transitions** as match arms: `(current_state, input) -> next_state`
4. **Actions** as the side effect of each transition (what to call)

The DFA file does not execute the state machine. It defines the contract.
The orchestration function (`start_from_snapshot`, `start_restored_vm`)
calls the transitions in order. The DFA file is what you read to understand
the protocol. The orchestration function is what you read to understand the
implementation.

```rust
/// States of the snapshot restore DFA.
enum RestoreState {
    TemplateLookup,
    Materialize,
    Spawned,
    SocketReady,
    Paused,
    Running,
    Resized,
    Specialized,
    Published,
    Error,
}

/// Observations that drive transitions.
enum Observation {
    SnapshotCompatible,
    ArtifactsMaterialized,
    ProcessSpawned { pid: u32 },
    SocketConnectable,
    VmInfo { state: VmState },
    ResumeOk,
    ResizeOk,
    GuestSpecializeOk,
    FenceValid,
    Failure { stage: LaunchStage },
}
```

## When to Write a DFA

- The module has 3+ sequential phases that must execute in order.
- A phase transition depends on observing external state (process, socket,
  API response, file existence).
- The module has had a bug caused by an implicit or skipped transition.
- The module manages a lifecycle (create, run, sleep, destroy).

## When NOT to Write a DFA

- Simple request/response handlers with no intermediate states.
- Pure data transforms.
- CRUD with no lifecycle semantics.

## File Placement

```
module/
  README.md     # mermaid diagram + prose
  dfa.rs        # state enum + transition table
  mod.rs        # orchestration (calls transitions in order)
  process.rs    # helpers (spawn, abort, etc.)
```

## Reference

- `bake.rs:226-238`: correct pattern. `wait_ready` then `info()` then match
  on `Created` before calling `boot()`. Observe, then act.
- `restore.rs:318-329`: the bug this practice prevents. `wait_ready` then
  `resume()` without observing `Paused`. Missing the `SocketReady -> Paused`
  transition gate.
- `restore/dfa.rs`: reference DFA implementation. States as an enum,
  observations as an enum, `next_phase` as a const transition function,
  tests proving invalid transitions return `None`.
