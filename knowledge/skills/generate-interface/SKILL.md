---
name: generate-interface
description: Define or refactor subsystem interfaces into small, explicit contracts with clear ownership, narrow scope, stable semantics, and README-first documentation. Use when designing a new API, collapsing ad hoc module boundaries into a few coherent interfaces, hardening internal contracts, or rewriting subsystem docs so engineers can understand the system by reading README.md files, docstrings, and code only.
---

# Generate Interface

Design interfaces the way durable systems do:

- one contract per real responsibility
- one authority per state field or operation
- explicit transports, not accidental ones
- README-first subsystem manuals
- docstrings that explain what part of the interface a module implements
- code that follows the contract instead of inventing side channels

The target is an interface that feels old in the best way:

- obvious
- narrow
- composable
- boring
- hard to misunderstand

Think Unix and Linux, not app-framework churn.

This skill is for **interface hardening**, not generic architecture prose.

## Core rule

Reduce a subsystem until a reader can answer these questions quickly:

1. What are the primary interfaces?
2. Who calls each one?
3. Who owns each write path?
4. What is authoritative?
5. What is compatibility-only or debug-only?
6. What is explicitly out of scope?

If the answer requires reading five modules and guessing, the interface is not done.

If the behavior of the subsystem is mostly encoded in ad hoc helper functions
and not in a small set of named interfaces, the design is not done.

## Output shape

Prefer this hierarchy:

1. subsystem `README.md`
2. local module docstrings
3. code

Do **not** create a new top-level taxonomy document unless the user explicitly wants one.

The default move is to consolidate interface definitions into the correct subsystem `README.md` files.

The user should be able to understand the subsystem by reading:

1. `README.md`
2. module docstrings
3. code

and nothing else.

## When to use

Use this skill when the user asks for things like:

- “make the interfaces solid”
- “reduce this architecture to a few APIs”
- “clean up the controlplane/runtime boundary”
- “document the subsystem so it reads cleanly”
- “collapse ad hoc functions into real interfaces”
- “make the README and docstrings the source of truth”
- “make this feel like a real subsystem manual”
- “make the API surface obvious”

Typical triggers:

- new system design
- existing subsystem cleanup
- RPC / REST / CRD ownership confusion
- duplicated transports for the same operation
- stale compatibility layers that no one can explain

## Design principles

### 1. Interfaces describe authority

Every interface must say:

- what it owns
- what it does not own
- what state it may write
- what state it may only observe

If two interfaces claim authority over the same operation or field, pick one. The other is either:

- compatibility
- debug-only
- wrong

Ambiguous authority is not a documentation problem. It is an interface bug.

### 2. Contract first, transport second

Do not confuse:

- REST
- ConnectRPC
- WebSocket
- SSH
- VSOCK

with the interface itself.

Multiple transports can implement one interface. One transport can also expose multiple interfaces. Name the interface by responsibility, not by wire format.

Do not let implementation detail harden into architecture accidentally.

### 3. README-first documentation

A good subsystem `README.md` should let a new engineer answer:

- what this subsystem is
- which primary interface it implements
- which neighboring subsystem it talks to
- what is authoritative
- what remains compatibility-only

Do not dump global architecture into every README. Give each README one job.

The README is the manual for the subsystem. It should define the contract,
boundaries, ownership, and compatibility story, not just list folders.

### 4. Linux-docs style

Aim for:

- short scope section
- constraints before abstractions
- glossary for local terms
- clear ownership statements
- small tables when useful
- diagrams only when they explain one mechanism cleanly

Avoid:

- product-marketing voice
- “vision” paragraphs
- giant rainbow architecture diagrams
- documents that re-explain the whole system when they should define one boundary

Prefer text that reads like a subsystem maintainer wrote it for the next
maintainer, not like a platform team wrote it for a launch review.

### 5. Narrow, durable interfaces

Good interface names survive implementation changes:

- `Public Access API`
- `Host Runtime API`
- `Guest Runtime API`

Bad interface names mirror folder layout or current wiring accidents:

- “the Huma layer”
- “the CRD stuff”
- “the Axum endpoints”
- “the protobuf side”

Good interface names should survive a rewrite of transports, frameworks,
directories, and helper packages.

### 6. Compose interfaces, do not compose helper soup

The right way to combine complexity is:

- interface A calls interface B
- interface B calls interface C

The wrong way is:

- function A imports helper B
- helper B reaches into state C
- callback D mutates field E
- the behavior only exists in call graph archaeology

If the system currently composes through ad hoc functions, collapse those
behaviors behind a smaller number of named interfaces.

### 7. The interface must do exactly what it says

Do not tolerate:

- names that promise more than the API guarantees
- “best effort” semantics hidden behind imperative verbs
- side effects that are not obvious from the contract
- status fields owned by a different writer than the docs say

Every interface description should be executable as a mental model.

## Workflow

### Step 1: Inventory actual surfaces

Find the real surfaces:

- public HTTP / WebSocket / SSH routes
- RPC services
- guest protocols
- CRDs and status/spec ownership
- debug endpoints
- compatibility endpoints

Write them down as concrete resources and operations, not abstractions yet.

Also inventory:

- direct function-call boundaries that should probably be promoted into explicit contracts
- duplicated endpoints that claim to do the same thing
- “temporary” surfaces that have outlived their dignity

### Step 2: Group by coherent responsibility

Partition surfaces into a small number of interfaces.

A good interface groups operations that:

- share authority
- share lifecycle semantics
- share the same caller class
- belong in the same subsystem manual

Do not force “three” if four is cleaner. Do not keep seven if three is cleaner.

The number of interfaces is not the goal. Coherent cuts are the goal.

### Step 3: Classify each surface

For every endpoint / service / CRD path, classify it as one of:

- `authoritative`
- `compatibility`
- `debug-only`
- `operational`

Definitions:

- `authoritative`: the canonical contract for doing real work
- `compatibility`: temporary old surface during migration
- `debug-only`: operator introspection, not product core
- `operational`: health, metrics, openapi, readiness, etc.

If a surface does not fit one of those categories cleanly, the design is not
settled yet.

### Step 4: Define ownership

For each resource or state subtree, define:

- spec writer
- status writer
- local-runtime owner
- projection owner

Prefer small tables.

Example:

```markdown
| Area | Writer | Meaning |
| --- | --- | --- |
| `spec` | controlplane API | desired lifecycle and resource intent |
| `status.runtime` | host-agent | observed runtime facts from the compute host |
| `status.summary` | controlplane controller | public lifecycle projection |
```

### Step 5: Put the contract into the right README

Default locations:

- repo/service root README: index of subsystem interfaces
- subsystem README: the actual contract manual
- protocol README: wire contract only, if a protocol crate/package exists
- package/module docstrings: local declaration of which contract is implemented

Also update local package docs and type comments so they agree with the README.

### Step 6: Remove or demote strays

After the contract is written:

- delete standalone taxonomy docs if they duplicate subsystem READMEs
- remove dead references
- relabel compatibility routes as compatibility
- relabel debug routes as debug-only

If code and docs disagree, code wins for current truth, then docs are corrected.

If the code reveals the interface is wrong, fix the interface, not just the prose.

## Required sections for a subsystem interface README

Use this template.

```markdown
# <Subsystem>

One sentence describing what this subsystem does.

## Scope

What this subsystem owns.
What it does not own.

## Interface boundary

- primary interface(s)
- neighboring systems
- authoritative contract
- compatibility/debug/operational split

## Ownership

Small tables for spec/status/runtime/projection ownership if applicable.

## Surface

Routes, services, resources, or protocol entry points.

## Semantics

What each major operation guarantees.
What it refuses.
What is synchronous, asynchronous, or eventually consistent.

## Compatibility and debug

What is transitional, what is debug-only, and what should eventually be deleted.

## References

Links to the neighboring subsystem README, proto, or type definitions.
```

Optional sections when useful:

- `Glossary`
- `Constraints`
- `State model`
- `Versioning`
- `Non-goals`

## Docstring pattern

Top-level module docs should say which interface the module implements.

Examples:

```rust
//! ConnectRPC service implementations for the host-agent.
//!
//! This module is the authoritative Host Runtime API: the controlplane-to-host
//! contract for lifecycle, health, migration, release, and artifact operations.
```

```go
// Workspace is the durable declarative envelope around the Host Runtime API.
// Spec carries controlplane intent; status combines controller-authored
// projection with host-agent-authored runtime fact.
```

## Cutover rules

When refactoring an existing system:

1. Do not introduce a new abstraction layer unless it removes a real one.
2. New features land only on the authoritative interface.
3. Compatibility surfaces must be labeled as such.
4. Debug surfaces must not be described as architecture.
5. Prefer deletion over shims.
6. Prefer moving behavior behind a real interface over adding one more helper.

## Anti-patterns

### Bad: one interface document plus stale subsystem READMEs

The subsystem README must stand on its own. Do not make readers hop through a taxonomy doc to understand the boundary.

### Bad: folder-shaped interfaces

Do not define interfaces by current file organization.

### Bad: transport-shaped interfaces

Do not define “the WebSocket API” or “the protobuf API” unless transport is actually the product boundary.

### Bad: mixed authority

If one README says controlplane owns preview status and another says host-agent owns it, the interface is broken.

### Bad: architecture spill

Do not turn every README into a full system architecture essay. Put enough context to understand the boundary, then stop.

### Bad: interface inflation

Do not create five tiny interfaces where one coherent subsystem contract would do.

### Bad: helper accretion

Do not preserve ad hoc helper layers just because they already exist. If they
encode part of the real contract, pull that behavior upward into the interface.

## Completion checklist

- [ ] Primary interfaces are explicitly named
- [ ] Every interface has a clear authority statement
- [ ] Every significant surface is classified authoritative / compatibility / debug-only / operational
- [ ] Ownership tables exist where state is split
- [ ] Subsystem READMEs contain the contract, not a separate taxonomy doc
- [ ] Module docstrings and type comments agree with the README
- [ ] Obsolete references are removed
- [ ] Behavior is composed through interfaces instead of helper-call archaeology
- [ ] Interface names and semantics would still make sense after a transport or framework rewrite
