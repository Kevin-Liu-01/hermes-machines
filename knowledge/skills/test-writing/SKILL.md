---
name: test-writing
description: >-
  Write test output, harnesses, and assertions in the terse Unix
  tradition. Covers Rust #[test], Go testing.T, Python pytest, typed
  CLI harnesses, and CI integration. Use when writing new tests, test
  harnesses, CI profiles, or reviewing test output verbosity.
allowed-tools: Read, Grep, Glob, StrReplace, Write, Shell
---

# Test Writing

## Output philosophy

Tests communicate two things: what passed and what failed. Everything
else is noise. Model output on `prove`, `go test`, and Plan 9's
`/bin/test` -- not JUnit XML rendered as prose.

### The `ok` / `FAIL` convention

Every assertion or logical group prints exactly one line:

```
  ok  mkdir
  ok  rename
  ok  link (nlink=2)
FAIL  symlink (expected target 'foo', got 'bar')
```

Rules:

- `ok` is lowercase, left-aligned to 6 chars (`  ok  `).
- `FAIL` is uppercase, left-aligned to 6 chars (`FAIL  `).
- `skip` for precondition-gated tests (`skip  fuse (no /dev/fuse)`).
- After the tag: a terse noun phrase, not a sentence.
- Parenthetical detail only when the assertion carries a value
  (`nlink=2`, `pid 4821`).
- Summary line at the end: `  7/7 posix sanity ok` or
  `  6/7 posix sanity FAIL`.

### Rust `#[test]`

Rust test output is managed by `cargo test` (or `nextest`). The
convention is in the *test name*, not in `println!`:

```rust
#[test]
fn invariant_rename_over_non_empty_dir_returns_enotempty() {
    // ...
    assert_eq!(err, Error::DirectoryNotEmpty);
}
```

Custom assertion helpers should panic with terse messages:

```rust
fn assert_nlink(store: &MetadataStore, ino: Ino, expected: u32) {
    let attr = store.get_inode(ino).unwrap().unwrap();
    assert_eq!(attr.nlink, expected, "ino {ino:?} nlink");
}
```

### Go `testing.T`

```go
func TestInvariant_ReconcilerSurvivesPerWorkspaceError(t *testing.T) {
    // ...
    if got != want {
        t.Fatalf("workspace B status: got %v, want %v", got, want)
    }
}
```

Use `t.Fatalf` (not `t.Errorf` + `t.FailNow`). One call, one line.

### Python `pytest`

Let `pytest` handle reporting. Assertions use bare `assert`:

```python
def test_invariant_chunk_key_is_deterministic():
    a = chunk_key("ws-1", b"hello")
    b = chunk_key("ws-1", b"hello")
    assert a == b
```

For parametrized output, use `pytest.mark.parametrize` -- it
generates one `ok` line per case automatically.

## CI integration

Add durable DCS test profiles to the typed runners:

- `dcs-check` for local controlplane, KVM, FUSE, KWOK, and chaos
- `dcs-smoke` for live public API smoke and CLI dogfood
- `dcs-gauntlet` for scenario, load, and disruption drills

Do not add checked-in shell test files or shell dispatchers. Shell in
workflows is acceptable only as command glue around the typed binaries.

### Workflow files

Mirror `host-agent-rust.yml` structure. Match the runner to the
workload (CI skill rules):

| Need              | Runner                         |
|-------------------|--------------------------------|
| Unit tests        | `blacksmith-4vcpu-ubuntu-2404` |
| FUSE mount        | `blacksmith-4vcpu-ubuntu-2404` |
| `/dev/kvm`        | self-hosted KVM EC2            |
| Orchestration     | `ubuntu-24.04`                 |

Gate behind a repo variable (`vars.ENABLE_*`) until the profile is
stable. Add the job to `ci-required` needs in `ci.yml`.

## What not to do

- Don't print "Running test X..." before and "Test X passed!" after.
  That's two lines where zero or one suffices.
- Don't use emoji in test output.
- Don't wrap `set -x` around the test body. Trace output drowns
  the signal.
- Don't use `echo "SUCCESS"` or `echo "ALL TESTS PASSED"` in
  all-caps. The summary line (`7/7 ok`) is sufficient.
- Don't log intermediate values unless the test fails.
