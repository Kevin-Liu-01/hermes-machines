---
name: bugs
description: >-
  CTF-style security and correctness audit. Dispatches parallel Opus
  subagents to hunt for day-0 bugs in security-critical files. Each
  agent must find a real bug or honestly admit failure. Use when you
  want a thorough adversarial review of a codebase area.
---

# /bugs

Adversarial bug hunt. Dispatch one subagent per critical file with
the mandate: "There exists a security or correctness bug in this
file. Locate it or admit that you are unable to."

## When to use

- Before shipping a new subsystem to production
- After a CVE drops in a dependency or peer project
- When reviewing code that handles untrusted input
- Periodic security hygiene on the attack surface
- When the user says `/bugs` or `/bugs <scope>`

## Philosophy

This is a CTF, not a code review. We are not looking for style
nits, pedantic warnings, or non-malignant nits. We want:

- Memory safety violations (OOB, use-after-free, UB)
- Logic bugs (inverted checks, missing validation, TOCTOU)
- Resource leaks that lead to DoS (FD exhaustion, OOM, orphaned processes)
- Auth/authz bypasses
- Input validation gaps (path traversal, integer truncation, injection)
- Protocol violations (wrong constants, spec non-compliance)
- State machine violations (DFA lies, skipped cleanup)

It is OK for an agent to admit failure. A false negative is better
than a false positive. We do not reward noise.

## Scope

- `/bugs` -- audit the full attack surface (DHV + DCS runtime)
- `/bugs dhv` -- audit only packages/rust/dhv/
- `/bugs dcs` -- audit only apps/cloud/apps/dcs/src/runtime/
- `/bugs <path>` -- audit specific files or directories

## Procedure

### Phase 1: Map the attack surface

Dispatch an Explore agent to identify security-critical files.
Criteria for "critical":

- Processes untrusted input (guest MMIO, network, gRPC, file I/O)
- Contains `unsafe` code or FFI
- Handles authentication, authorization, or secrets
- Manages system resources (cgroups, TAP devices, fds, mmap)
- Implements cryptographic or protocol logic
- Snapshot/restore/migration paths (deserialize from untrusted source)

The explorer returns absolute paths ranked by attack surface.
Target 20-30 files for a full audit.

### Phase 2: Dispatch hunters

Launch one background Agent per file (or small file group). Each
agent gets this exact prompt template:

```
You are participating in a CTF challenge against {system_name}.
Your target file is {description}.

Read {file_path} thoroughly.

There exists a security or correctness bug in this file, please
locate it or admit that you are unable to. You must provide proof
by way of a failing test, reproduction instructions, or the like.

Context: {what_the_file_does_and_what_to_look_for}

Do NOT report style nits, pedantic warnings, or non-security
issues. Only report actual bugs that could be exploited. If you
cannot find a day-0 bug, say so honestly.
```

Each agent's context section must include:

- What the file does (one sentence)
- What untrusted input reaches it
- Specific bug classes to look for (tailored to the file)

Launch all agents in parallel using `run_in_background: true`.

### Phase 3: Triage results

As agents complete, verify each finding:

1. **Read the cited lines.** Confirm the code matches the claim.
2. **Trace the data flow.** Is the untrusted input actually reachable?
3. **Check for existing guards.** Did the agent miss a validation upstream?
4. **Classify severity:**
   - **Critical**: memory safety, code execution, VM escape, UB
   - **High**: DoS (crash/OOM), data leak, auth bypass, disk OOB
   - **Medium**: resource leak, state corruption, spec violation
   - **Low**: defense-in-depth gap, theoretical only
5. **Deduplicate.** Multiple agents may find the same systemic issue.

Discard findings that are:
- Style nits dressed up as bugs
- Theoretical issues with no reachable path
- Upstream crate bugs we can't fix (file separately)

### Phase 4: Report

Output a consolidated table sorted by severity:

```markdown
## CTF Security Audit: {scope}

**N bugs found across M files. K agents admitted failure.**

### Critical (C)

| # | Component | File:Line | Bug | Impact |
|---|-----------|-----------|-----|--------|

### High (H)

| # | Component | File:Line | Bug | Impact |
|---|-----------|-----------|-----|--------|

### Medium (M)

| # | Component | File:Line | Bug | Impact |
|---|-----------|-----------|-----|--------|
```

After the table, list any files where the agent admitted failure
(no bug found). This is expected and honest.

## Rules

- Every finding must cite a file path and line number.
- Every finding must have a proof sketch (failing test, repro, or
  Miri output). "This looks suspicious" is not a finding.
- Do not fix bugs during the audit. Report only. The user decides
  what to fix and when.
- Do not dispatch more than 25 agents at once (context budget).
- Batch agents into groups of 10 if the file list exceeds 25.
- Use the Explore agent for Phase 1, not manual grep.
- Verify every Critical and High finding yourself before reporting.
  Trust but verify Medium findings from agent summaries.

## Attack surface map (DHV + DCS)

These are the known high-value targets. The Phase 1 explorer may
find additional files, but these should always be included:

### DHV (packages/rust/dhv/)

| Area | Files |
|------|-------|
| Virtio transport | `virtio-devices/src/transport/pci_device.rs`, `pci_common_config.rs` |
| Virtio queue | `vm-virtio/src/queue.rs`, `vm-virtio/src/lib.rs` |
| vsock | `virtio-devices/src/vsock/packet.rs`, `vsock/unix/muxer.rs` |
| Block device | `block/src/lib.rs` |
| Network device | `virtio-devices/src/net.rs`, `net_util/src/tap.rs` |
| IOMMU | `virtio-devices/src/iommu.rs` |
| VFIO passthrough | `pci/src/vfio.rs` |
| PCI config space | `pci/src/configuration.rs` |
| vhost-user | `virtio-devices/src/vhost_user/vu_common_ctrl.rs`, `net.rs`, `fs.rs` |
| Memory manager | `vmm/src/memory_manager.rs` |
| userfaultfd | `vmm/src/userfaultfd.rs`, `vmm/src/uffd.rs` |
| Migration | `vmm/src/migration.rs`, `vm-migration/src/protocol.rs` |
| Postcopy | `vmm/src/postcopy/destination.rs`, `vmm/src/postcopy/faults.rs` |
| x86 emulator | `hypervisor/src/arch/x86/emulator/mod.rs`, `instructions/mov.rs`, `stos.rs` |
| HTTP API | `vmm/src/api/http/http_endpoint.rs`, `mod.rs` |
| VM config | `vmm/src/vm_config.rs` |

### DCS Runtime (apps/cloud/apps/dcs/src/runtime/)

| Area | Files |
|------|-------|
| gRPC handlers | `host-agent/src/rpc/dm_service.rs`, `migration_service.rs` |
| VM create/restore | `host-agent/src/lifecycle/create/mod.rs`, `restore.rs` |
| VM teardown | `host-agent/src/vm/teardown/mod.rs`, `dfa.rs` |
| VM migration | `host-agent/src/vm/migration/mod.rs` |
| Networking | `crates/vm-networking/src/tap.rs`, `forward.rs` |
| Storage daemon | `crates/storage-daemon/src/vhost_user.rs`, `vfs/mod.rs`, `vfs/perm.rs` |
| Cgroup/QoS | `host-agent/src/vm/cpu_qos.rs` |
| Rootfs | `host-agent/src/vm/rootfs/lifecycle.rs`, `reflink.rs`, `image_manifest.rs` |
| Workload identity | `host-agent/src/workload_identity.rs` |

## Example invocation

```
> /bugs dhv

Phase 1: Mapped 22 critical files in packages/rust/dhv/
Phase 2: Dispatching 22 agents...
Phase 3: 18/22 agents found bugs, 4 admitted failure
Phase 4: Report

| # | Severity | File:Line | Bug |
...
```
