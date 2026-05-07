---
name: invariant-first-testing
description: Write tests that describe system invariants, not specific bugs. Tests should read like design documentation, not a changelog of failures. Use when writing new tests, reviewing test suites, or refactoring reactive bug-fix tests into invariant-style tests.
---

# Invariant-First Testing

## The Problem

When something breaks in production, the natural instinct is:

1. Reproduce the bug
2. Write a test that fails without the fix
3. Apply the fix, test goes green
4. Ship it

The test that comes out of this process describes **the specific failure mode**, not **the system property that was violated**. Six months later, the test reads like a line item in a bug tracker, not like a design document. The test suite accumulates narrow, implementation-coupled tests that tell you *what broke once* but not *what should always be true*.

## The Fix

Before writing any test, ask: **"What system property was violated?"** Write the test for the property, not the bug.

### Naming

The test name is a contract. It should be readable as a sentence that describes a property of the system that must always hold.

```
BAD:  test_setenv_rejection_continues_session
      (describes the mechanism of a specific bug fix)

GOOD: invariant_session_survives_guest_env_rejection
      (describes a property of the SSH gateway)

BAD:  run_once_continues_after_per_workspace_status_patch_failure
      (describes a specific failure mode: 409 on status patch)

GOOD: invariant_single_workspace_failure_does_not_block_node_reconciliation
      (describes a property of the reconciler)

BAD:  test_list_excludes_image_version_from_response
      (describes a specific field being hidden)

GOOD: invariant_internal_fields_are_not_exposed_in_public_api
      (describes a property of the API surface)
```

### Naming Conventions

- `invariant_*`: A property that must always hold. The system is broken if this test fails. This is the default prefix for most tests.
- `design_*`: An intentional policy decision that could reasonably go either way. Documents that we chose X over Y deliberately.
- No prefix needed for trivial unit tests on pure functions (serialization round-trips, math helpers).

### Test Body

The test body should exercise the **general case**, not the **specific trigger** that led to the bug. If the bug was "409 Conflict on status patch aborts the reconciler," the test should verify that the reconciler survives *any* per-workspace error, not just 409s.

```
BAD:  Send a 409 Conflict response, assert the loop continues.
      (Tests one specific HTTP status code. What about 500? What about timeout?)

GOOD: Send any error response for workspace A, assert workspace B still gets reconciled.
      (Tests the isolation property. The specific error doesn't matter.)
```

If the specific error type matters for the test's value, use the general invariant name but document the concrete scenario in a comment inside the test body. The name stays stable; the implementation detail is interior.

### Fakes Should Model Reality

When fixing a bug exposes that a test fake was unrealistic, fix the fake's default behavior instead of adding a second fake type. The test suite's fakes should behave like a simplified version of the real system, not like a mock that returns `Ok(())` for everything.

```
BAD:  Create `SelectiveEnvDownstreamSession` that rejects non-LANG vars,
      use it only in the bug-fix test.

GOOD: Make the default `FakeDownstreamSession.Setenv` reject non-LANG vars
      (matching real sshd behavior). All existing tests now exercise the
      realistic behavior naturally.
```

## Litmus Tests

Before committing a test, ask:

1. **Could this test name appear in an architecture doc?** If not, it's too specific.
2. **Would this test have caught the bug if it existed before the bug was introduced?** If it only catches the exact reproduction scenario, it's too narrow.
3. **If I refactor the internals but preserve the external behavior, does this test still pass?** If not, it's testing implementation, not behavior.
4. **Does this test name contain an HTTP status code, error message, or internal function name?** If yes, the name is coupled to implementation details. Elevate to the invariant.

## Applying to Existing Tests

When you encounter a reactive test (Category B) during a code review or refactor:

1. Identify the system property it's actually testing
2. Rename it to `invariant_*` with a property-level name
3. If the test body is too narrow (tests only one trigger), broaden it or add a comment noting the concrete scenario is representative of a broader invariant
4. Don't delete the test -- the coverage is valuable. Just elevate the name.

## Examples from This Codebase

### Rust host-agent (strong invariant convention)

```
invariant_teardown_steps_have_deterministic_order
invariant_reserve_creating_wraps_when_preferred_range_is_used
invariant_recovery_fails_closed_on_invalid_manifest
invariant_single_workspace_failure_does_not_block_node_reconciliation
design_unrecognized_state_returns_error_not_panic
```

### Go controlplane (needs improvement)

```
// Current (reactive):
TestPatchWorkspaceReplayIgnoresEmptyMutationBucket
TestCreateWorkspaceStoreSuccessFailureClearsInFlightRecord

// Better (invariant):
TestIdempotency_invariant_replay_returns_cached_response
TestIdempotency_invariant_inflight_record_is_cleaned_on_failure
```
