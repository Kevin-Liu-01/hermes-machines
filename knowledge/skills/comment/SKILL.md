---
name: comment
description: >-
  Write doc comments, module docs, and inline comments that follow
  Dedalus conventions per language. Loads the canonical style guides
  from the monorepo. Covers Rust, Python, Go, and TypeScript.
allowed-tools: Read, Grep, Glob, StrReplace
---

# Comment Style

One principle across all languages: comments state what IS. They never
narrate what is happening, restate what the code says, or editorialize.

The deletion test: if the comment disappears, does the reader lose
information they could not get from reading the code? If no, delete it.

## Style guides to load

Read the relevant guide before making comment/doc decisions. These are
the canonical sources; do not rely on memory of their contents.

| Language | Guide path |
|----------|-----------|
| Root (all languages) | [style/style.md](style/style.md) |
| Python | [docs/src/style/python.mdx](docs/src/style/python.mdx) — see `## Documentation` section |
| TypeScript | [style/typescript.md](style/typescript.md) |
| Rust | [docs/src/style/rust.mdx](docs/src/style/rust.mdx) |
| Go (guide) | [docs/src/style/go/guide.mdx](docs/src/style/go/guide.mdx) |
| Go (decisions) | [docs/src/style/go/decisions.mdx](docs/src/style/go/decisions.mdx) — see documentation section |

Read `style/style.md` always. Then read the language-specific guide for
the file you are editing.

---

## Cardinal rule: write for the least experienced reader

Code and comments should be immediately understandable by both a novice
and an expert. A reader should never have to leave the file to figure out
what the file does or why it exists.

This is the bar: if someone opens this file cold, with no prior context
about the project, can they answer these questions within 30 seconds?

1. What does this module do?
2. Why does it exist?
3. Where does it fit in the system?

If the answer requires reading five other files, the module doc has failed.

### Short sentences, plain words

MOST IMPORTANT RULE: write like a sixth grader. One idea per sentence. No subordinate
clauses when two sentences will do.

```text
Bad:  "The guest kernel sends FUSE requests over virtio-fs, a virtio
      device that carries FUSE operations over shared memory instead
      of a network socket, and fuse-backend-rs deserializes them and
      calls our FileSystem trait impl."

Good: "The guest kernel sends FUSE requests over virtio-fs. virtio-fs
      uses shared memory, not network packets. fuse-backend-rs
      deserializes the requests. We answer them."
```

If a sentence has "which", "that", "because", "since", or "while" in
the middle, try splitting it in two. If it reads better as one sentence,
keep it. But default to short.

Do not use labels like "Why it exists:" or "Where it fits:" as lead-ins.
State the fact directly. The reader does not need a label to know they
are reading a reason.

```text
Bad:  "Why it exists: the guest VM needs a filesystem that survives
      snapshot/restore."

Good: "The guest VM needs a filesystem that survives snapshot/restore."
```

Do not hedge. Do not say "basically", "essentially", "in order to",
"it should be noted that". Say the thing.

### Spell out jargon and acronyms

Every acronym gets expanded on first use. Every domain term gets a
plain-English explanation inline. Do not assume the reader knows what
TLV, PTY, VSOCK, ACPI, GED, or any other abbreviation means.

```rust
// Bad: assumes the reader knows what TLV and VSOCK are.
//! TLV framing for VSOCK binary channels.

// Good: spells it out, explains what it means.
//! VSOCK (virtual socket) is a byte stream with no built-in message
//! boundaries. To send discrete messages, we prefix every message
//! with a 5-byte header. This is called TLV (Type-Length-Value)
//! framing.
```

```python
# Bad: assumes "DFA" is obvious.
# DFA for workspace lifecycle transitions.

# Good
# Deterministic finite automaton (state machine with no ambiguity
# about which transition fires) for workspace lifecycle.
```

This applies to comments, docstrings, and module docs. It does NOT
apply to well-known language keywords or standard library types.

### Concrete examples anchor understanding

When describing a format, protocol, algorithm, or non-obvious data flow,
include a concrete example with real values. Abstract descriptions tell
the reader what to think. Examples let the reader verify their understanding.

```rust
// Bad: abstract description only.
//! Each frame has a type byte and a length-prefixed payload.

// Good: abstract description + concrete example.
//! Each frame has a type byte and a length-prefixed payload.
//!
//! Example: a stdout frame carrying "hello" (5 bytes):
//!
//! ```text
//! [0x01] [0x00, 0x00, 0x00, 0x05] [0x68, 0x65, 0x6C, 0x6C, 0x6F]
//!   ^              ^                            ^
//!   type=stdout    length=5                     "hello" in ASCII
//! ```
```

```python
# Bad
# Normalizes provider response to common format.

# Good
# Normalizes provider response to common format.
# OpenAI returns {"choices": [{"message": {"content": "..."}}]}.
# Anthropic returns {"content": [{"text": "..."}]}.
# Both become {"text": "...", "provider": "..."}.
```

This is especially important for:

- wire formats and binary protocols
- serialization layouts
- state machine transitions
- non-obvious data transformations
- config structures with many interacting fields

### Module docs answer "what and why" before "how"

A module doc that dives straight into mechanics (encoding details, API
signatures, wire format) without first saying what the module is for and
why it exists is backwards. Lead with purpose, then mechanics.

```rust
// Bad: leads with mechanics.
//! Async encode/decode using AsyncReadExt/AsyncWriteExt instead of
//! std::io. Gated behind the `tokio` Cargo feature. Both frame types
//! share the same 5-byte TLV wire format.

// Good: leads with purpose.
//! Async encode/decode for the two VSOCK (virtual socket) binary
//! channels.
//!
//! VSOCK is a byte stream with no built-in message boundaries (like
//! TCP). To send discrete messages over it, we prefix every message
//! with a 5-byte header that tells the receiver what kind of message
//! it is and how many bytes to read next.
```

---

## Rules that apply across all languages

These rules supplement the style guides above. They are not duplicated
from those files; they cover comment-specific patterns the guides do
not spell out.

### File / module level docs

Summary line: noun phrase or declarative sentence. Not a teaser, not a
list header, not narration.

```text
Good: "Typed wire contract for the DCS host-to-guest VSOCK protocol."
Good: "Double-ledger accounting system."
Good: "Package server assembles the DCS control-plane HTTP API."
Bad:  "Three ports, three protocols:"
Bad:  "This module handles the lifecycle of workspace VMs."
Bad:  "Welcome to the storage subsystem!"
```

What belongs: what this module owns, scope boundary, contract details,
links to deeper docs, concrete examples of the format or protocol.

What does not belong: narration of layout ("This file re-exports..."),
motivational prose ("The magic happens here..."), restating what the
public items already say.

### Diagrams earn their keep

When a module implements a format, protocol, or state machine, a small
ASCII or text diagram in the module doc is worth more than a paragraph.
But the diagram must be labeled so a reader who has never seen the
format can parse it.

```rust
// Bad: diagram without labels.
//! ```text
//! [1][4][N]
//! ```

// Good: labeled, with byte ranges and field names.
//! ```text
//! byte 0        1..5                    5..5+len
//! ┌──────┬────────────────────┬─────────────────────┐
//! │ type │ length (4 bytes)   │ payload (len bytes)  │
//! └──────┴────────────────────┴─────────────────────┘
//! ```
```

### Type / function / class docs

Summary line is declarative, shown in doc indexes (`cargo doc`,
`godoc`, `help()`, IDE hover). Do not start with "This struct/class/
function...".

Document fields/params only when the name + type are insufficient.
Skip tautological docs (`/// The workspace ID.` on `workspace_id`).

When a function exists for a non-obvious reason (e.g., zero-copy path,
avoiding an allocation, bypass for a specific caller), the doc comment
should say why. A reader who sees a trivial wrapper will delete it
unless the doc justifies its existence.

```rust
// Bad: restates the obvious.
/// Write a stdout frame directly from a borrowed slice.

// Good: justifies the function's existence.
/// Write a stdout frame from a borrowed slice, avoiding the
/// `Vec` allocation that `Stdout(data.to_vec()).encode(w)` would
/// require.
```

### Inline comments

Apply the deletion test. Good uses:

- non-obvious invariants or constraints
- why a particular approach was chosen over the obvious one
- references to external specs, RFCs, or bug/ticket numbers
- safety comments on `unsafe` blocks (Rust: mandatory)
- byte-layout maps for binary packing code (what each index range is)
- `TODO(DEV-1234)` with a ticket number

Bad uses:

- restating what the code does
- narrating control flow ("now we check if...")
- section headers that restate the next function call
- repeating information already in the module-level doc

### Byte-layout comments for binary code

When code packs or unpacks bytes into a buffer by index, annotate the
layout once above the block. Each field gets its index range and meaning.

```rust
// Exit is fixed-size: header + payload in one 10-byte buffer.
//   [0]     type tag
//   [1..5]  payload length = 5
//   [5..9]  exit code (i32, big-endian)
//   [9]     timed_out flag (0 or 1)
let mut buf = [0u8; 10];
buf[0] = EXEC_FRAME_EXIT;
buf[1..5].copy_from_slice(&5_u32.to_be_bytes());
buf[5..9].copy_from_slice(&code.to_be_bytes());
buf[9] = u8::from(*timed_out);
```

Without this, the reader has to mentally map each index range to
figure out what the buffer contains.

### Section headers (`// --- Label ---`)

Acceptable as navigation landmarks in files over ~300 lines.
Not acceptable when they narrate the next 3 lines.

```rust
// Good: structural landmark in a 500-line file
// --- Frame encoding ---

// Bad: narrates the next function call
// --- Acquire permit ---
let permit = semaphore.acquire().await;
```

### Bullet formatting

When a doc comment uses bullet lists:

- items that continue the lead-in sentence start lowercase
- items that are standalone sentences start uppercase and end with a
  period
- do not mix the two styles in the same list

```rust
//! The header contains three fields:
//!
//! - type (1 byte): which kind of frame this is
//! - length (4 bytes): how many payload bytes follow
//! - payload (variable): the actual data

//! Design constraints:
//!
//! - Each workspace gets exactly one VSOCK connection.
//! - The guest-agent must respond within 2 seconds.
//! - Resize frames are host-to-guest only.
```

---

## Language-specific supplements

These cover patterns that the style guides define but are easy to miss.

### Rust

- `//!` module docs: use `#` headings, markdown tables, intra-doc
  links (`[`TypeName`]`, `crate::module`). Tables render correctly
  in `cargo doc`.
- `///` vs `//` on fields: use `///` for public fields that should
  appear in `cargo doc`; use `//` for private implementation notes.
- Safety comments: mandatory on every `unsafe` block. State the
  invariant that makes the unsafety sound, not what the code does.
- Clippy allow comments: every `#[allow(clippy::...)]` must have an
  inline justification explaining why the suppression is correct.

### Python

- Module docstrings: first line is noun/verb phrase with period.
  No "This module provides..." preamble.
- Function docstrings: Google style. Imperative mood summary. Args,
  Returns, Raises sections. Skip sections that add nothing.
- Class docstrings: summary + `Attributes:` for dataclasses.
- Field comments: column-align with `# fmt: off` / `# fmt: on`.
- Section headers: `# --- Label ---` format (one line).

### Go

- Package docs live in `doc.go`. Summary starts with "Package name".
- Exported symbol docs start with the symbol name (godoc convention).
- Full sentences, capital letter, period.

### TypeScript

- File-level JSDoc: `@description`, `@example`, `@since` as needed.
- One-line `/** ... */` for simple exports.
- `@param` / `@returns` (not `@return`) when types alone are unclear.
- Console warnings: `[FileName::functionName::L42]` label.

---

## Applying this skill

1. Identify the language.
2. Read `style/style.md` + the language-specific guide from the table.
3. Read the file. Understand what it owns.
4. Check file/module-level doc: does it answer what, why, and where?
   Can a cold reader understand it in 30 seconds? Are acronyms spelled
   out? Are there concrete examples where they'd help?
5. Check public symbol docs: summary lines declarative? Field docs
   earning their keep? Wrapper functions justified?
6. Check inline comments: deletion test. Byte-layout maps present for
   binary code?
7. Fix violations. Do not add comments that fail these rules.
8. Do NOT touch generated code, test assertions, or copyright headers.
