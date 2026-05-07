---
name: update-docs
description: >-
  Update documentation after code changes. Covers source-level docs (module
  docs, docstrings, inline comments) and docs-site pages. Use after any code
  change to keep documentation in sync with reality.
---

# Update Docs

Keep documentation in sync with code. Run this after code changes to find
and fix stale, missing, or unclear documentation.

## Scope

Documentation lives in two places:

1. **Source-level**: module docs, docstrings, inline comments, README files
   adjacent to the code.
2. **Docs site**: `docs/src/` (Mintlify). Architecture pages, product
   pages, internal references.

Both layers must agree with each other and with the code.

## Phase 1: Identify what changed

Run `git diff` (or `git diff HEAD` if staged) to see the code changes.
For each changed file, note:

- new modules, functions, types, or public APIs
- renamed, moved, or deleted symbols
- changed behavior, contracts, or invariants
- new dependencies or integration points

## Phase 2: Update source-level docs

Apply the `/comment` skill principles to every changed file.

### Module docs must answer three questions

A reader opening the file cold must know within 30 seconds:

1. **What** does this module do?
2. **Why** does it exist? (What problem does it solve? Why is it separate
   from the neighboring module?)
3. **Where** does it fit? (Who calls it? What does it depend on?)

If the code change alters any of these answers, update the module doc.

### Least experienced reader rule

- spell out every acronym on first use (TLV, VSOCK, PTY, CRD, NFS, etc.)
- include concrete examples for non-obvious formats, protocols, or
  transformations
- explain domain concepts inline, not by reference to external knowledge
- labeled diagrams for wire formats, byte layouts, state machines

### What to check per changed file

- [ ] Module doc: still accurate? Answers what/why/where?
- [ ] Public function/type docs: still match behavior? Justify existence
  of non-obvious wrappers?
- [ ] Inline comments: pass the deletion test? (Would removing the comment
  lose information the code alone cannot convey?)
- [ ] Byte-layout maps: present for any binary packing code?
- [ ] Acronyms: expanded on first use in this file?
- [ ] Cross-references: intra-doc links (`[`crate::module`]`, manpage
  citations) still point to correct targets?
- [ ] README in the module directory: still accurate?

### What NOT to add

- comments that restate what the code says
- comments narrating control flow ("now we check if...")
- section headers that label the next function call
- doc comments on fields where the name + type are sufficient

## Phase 3: Update docs site

Check whether the code change affects any page in `docs/src/`.

### Decision tree

1. **New subsystem or service**: add a page under the appropriate group
   in `docs/src/docs.json`. Follow the structure of existing peers.
2. **Changed architecture or contracts**: update the relevant architecture
   page (e.g., `dcs/architecture/runtime.mdx` for runtime changes).
3. **Changed public API surface**: update the product page and any
   getting-started or pricing pages that reference the API.
4. **Internal-only change** (refactor, extract helper, rename private
   symbol): usually no docs-site change needed. Only update if the
   architecture page describes the internal structure at a level that
   would now be wrong.

### Docs site principles

The docs site explains **what the system does and why**. Source comments
explain **how the code works**. Do not put implementation details (wire
formats, trait bounds, helper functions) on the docs site. Do not put
architectural context (system diagrams, ownership tables, product
contracts) only in source comments.

**Least experienced reader applies here too.** A new engineer reading the
docs site should understand the system without opening the code. Spell out
jargon. Define terms inline. Use diagrams when they clarify a mechanism.

### Docs site checklist

- [ ] Nav config (`docs/src/docs.json`): new pages added? Deleted pages
  removed? Group structure still makes sense?
- [ ] Architecture pages: still accurate after the code change?
- [ ] Cross-references between pages: no broken links to deleted or
  renamed pages?
- [ ] Product pages: descriptions match current behavior?
- [ ] Diagrams: still reflect the actual data flow / component structure?

## Phase 4: Verify consistency

Check that the three layers (code, source docs, site docs) agree:

- if the code says X, the module doc should say X
- if the module doc says X, the architecture page should not say Y
- if a page references a CRD, function, or file path, verify it exists

### Common drift patterns

- architecture page describes a deleted component
- module doc references a renamed function or type
- getting-started page shows an API call with old parameter names
- README lists source paths that moved in a refactor
- diagram shows a component that was merged into another

## What to skip

- generated code (OpenAPI specs, protobuf output): these have their own
  update pipelines
- test files: tests are self-documenting through assertion names
- changelog or release notes: separate process
- docs for unchanged code: do not speculatively improve docs outside the
  scope of the code change

## Anti-patterns

- **Docs-only PR with no code change.** If the docs drifted, the code
  change that caused the drift should have updated the docs. Fix forward,
  but note the gap.
- **Copying the full implementation into prose.** The docs site is not a
  line-by-line translation of the code. It explains the system at the
  level a human needs to make decisions.
- **Architecture diagrams in source comments.** System-level diagrams
  belong on the docs site where they render. Source comments get
  file-local diagrams only (byte layouts, small state machines).
- **Updating docs site but not source docs.** Both layers must be
  updated. A new reader might enter through either path.
