---
name: stage-refactor-checklist
description: Comprehensive checklist for refactoring a schema_compiler stage folder. Use EVERY TIME you refactor a compiler stage (resolve, unify, codegen, etc.). Read this before writing any code.
---

# Stage Refactor Checklist

Systematic checklist for refactoring a schema_compiler stage folder. Derived
from the frontend/ reference implementation and the feedback that shaped it.

## Prerequisites (do these BEFORE writing any code)

1. Read `style/style.md` and the column-aligned-fields skill.
2. Read EVERY file in the target folder to map the full topology.
3. Grep the entire repo for all imports from this stage to understand consumers.
4. Identify: what is this stage called, who are the actors, which verbs do they get?
5. Ask: is the current class a thin wrapper over module-level functions? If yes, the
   class needs to absorb all logic (see "Class cohesion" below).

## Architecture Principles

### Contract changes between stages are fine

Don't preserve old interfaces for backward compatibility. If the right design
requires a new method signature, a renamed function, or a restructured IR type,
make the change and update every consumer. The only constraint is that you can
answer: what is this stage called, who are the actors, which verbs do they get?

### Class cohesion

The stage class is the cohesive unit. It is NOT a thin wrapper that delegates
to module-level functions. ALL logic belongs inside the class as methods.

- If the class has 2-3 methods and 8 free functions do the real work, the class
  is a facade. Move the functions in.
- **Prefer public methods.** If a method is part of the stage's interface (i.e.,
  you'd want to call it in a test or from another stage), it's public. Only use
  `_` prefix for true implementation internals that callers never need.
- Pure methods that don't use `self` get `@staticmethod`. This signals purity
  while keeping them colocated.
- Standalone pure utilities (like `_to_snake_case`) may stay module-level if
  genuinely independent of the class.
- No module-level convenience functions or `_default_instance` patterns. Callers
  instantiate the class directly.
- Use `# --- Label ---` section headers inside the class to group related methods
  (e.g., `# --- Entry point ---`, `# --- Resolution ---`, `# --- Helpers ---`).

### Nouns vs verbs (file split)

Each stage folder has exactly two files (plus `__init__.py`):

- `types.py`: the nouns. Dataclasses, type aliases, enums. These are the IR types
  that cross stage boundaries. Zero or minimal cross-package imports (TYPE_CHECKING
  imports for upstream types are fine).
- `<stage>.py`: the verbs. The stage class with all its methods, plus any
  module-level cached loaders. Inline tests live here too.

Two files is the default. Don't split further unless a single file exceeds 500
production lines AND has a natural seam. Don't over-modularize for symmetry.

### No backward compatibility

This is a breaking refactor. There are no shims, no re-exports, no "so existing
import paths keep working" comments. Fix every consumer properly.

- `__init__.py` is a bare docstring. No imports. No `__all__`.
- No `__all__` in any implementation file. Public API is communicated by naming
  convention (public names vs `_`-prefixed privates).
- If an import path changes, grep the repo and update every hit.

### Pre-build indexes, don't scan

If a method does O(n) linear scans through a data structure on every call, build
an index at construction time. The `__init__` method is the right place. No dict
mutation hacks (like injecting synthetic keys into copies of config dicts).

### Use precise compiler terminology

Stage names must be the exact term a compiler textbook or LLVM would use for
the pass. Vague names like "normalize" fail the clarity test. The stage that
maps surface names to semantic IDs is "name resolution," so the folder is
`resolve/`, the class is `Resolver`, and the method is `resolve()`. If you
can't name the stage with a single precise term, you haven't understood it.

### Don't over-couple packages

If `functools.cache` does what you need, use it. Don't pull in a cross-package
dependency (e.g., `AsyncTTLCache` from `dedalus_redis`) for something the stdlib
handles. Simple needs get simple solutions.

## Checklist

### 1. Separate nouns from verbs

- [ ] Create `types.py` for dataclasses, type aliases, enums.
- [ ] Move all data-carrying classes out of the main module.
- [ ] Use `# fmt: off` / `# fmt: on` + column-aligned comments on dataclass fields
      (see column-aligned-fields skill).
- [ ] No `__all__` anywhere. Public types use public names; privates use `_`.

### 2. Narrow types

- [ ] Remove every `from typing import Any` in the stage.
- [ ] Replace `dict[str, Any]` with a typed structure (dataclass, TypedDict) or
      the proper JSON types from `core.types.json` (`JSONValue`, `JSONObject`).
- [ ] Replace `list[Any]` with a concrete element type.
- [ ] Replace `Any` return types with the actual return type.
- [ ] Replace anonymous tuples with frozen dataclasses or named types.
- [ ] `object` is not a valid replacement for `Any`. It is `Any` in disguise.
      For heterogeneous JSON data, use `JSONValue`/`JSONObject` from
      `core.types.json`: proper recursive RFC 8259 types already in the codebase.

### 3. Consolidate logic into the stage class

- [ ] The class owns ALL the logic, not just entry points.
- [ ] Module-level functions that operate on stage data move into the class.
- [ ] Pure methods that don't use `self` get `@staticmethod`.
- [ ] Prefer public methods. Only `_`-prefix true internals callers never need.
- [ ] Use `# --- Label ---` section headers to organize methods.
- [ ] No module-level convenience wrappers. No `_default_instance`. No re-exports.

### 4. Use `functools.cache` for expensive loads

- [ ] Replace any `ClassVar[dict]` caches with `@functools.cache` on a
      module-level loader function.
- [ ] The loader function lives in the same module as the class.
- [ ] `from pathlib import Path` stays runtime if used as a `@functools.cache`
      argument type (suppress TC003 with `# noqa: TC003`).
- [ ] Don't import cross-package dependencies for simple memoization.

### 5. Fix `__init__.py`

- [ ] Bare docstring only. No imports. No re-exports. No `__all__`.

### 6. Fix ALL downstream imports

- [ ] `rg 'from schema_compiler\.<stage>' apps/api/`: find every consumer.
- [ ] Types import from `<stage>.types`.
- [ ] Class imports from `<stage>.<module>`.
- [ ] Verify zero imports from the package-level `__init__.py`.
- [ ] Update test files too (test_golden, test_resolver, test_edge_cases, etc.).
- [ ] If a function was renamed (e.g., `load_aliases_config` → `load_aliases`),
      update every call site. Don't leave aliases.

### 7. Docstrings and style

- [ ] All docstrings: Google style with `Args:` / `Returns:` / `Raises:` sections.
- [ ] Newline before closing `"""`.
- [ ] Proper grammar: full sentences with periods. No dashes in descriptions.
- [ ] Imperative mood: "Fetch", not "Fetches".
- [ ] Args/Returns describe what, not how. Don't restate the type signature.
- [ ] Loop variables: full singular form. `for field in fields`, not `for f in`.
      Applies to comprehensions too: `{field.name: field for field in fields}`.
- [ ] Section headers: `# --- Label ---` (single line, no `# ===` blocks).
- [ ] Save return value to a variable before returning:
      `result = compute(...); return result` (debuggability per STYLE.md).
- [ ] No chaining construction + method: `Foo(x).bar()` hides the instance.
      Split: `foo = Foo(x)` then `result = foo.bar()`.

### 8. Inline tests

- [ ] `# --- Tests ---` section at bottom of the main module.
- [ ] `from inline_tests import test  # noqa: E402` after the section header.
- [ ] `@test` decorator on each test function.
- [ ] Local imports inside test functions with `# noqa: PLC0415`.
- [ ] Read `tests/unit/compiler/test_<stage>.py` and classify every test:
      - **Pure unit test** (synthetic data, no file I/O) → inline into source module.
      - **Integration test** (loads real specs/config from disk) → stays in `tests/`.
- [ ] Delete the pure unit tests from the external test file after inlining.
- [ ] If every test in the external file was inlined, delete the file entirely.
- [ ] Remaining external tests import from the correct submodule.
- [ ] Tests verify behavioral contracts, not implementation details. Don't test
      Python builtins (e.g., "dict contains what I put in it"). Don't test
      unverifiable claims (e.g., "O(1) lookup") without a proper benchmark.

### 9. Lint and format

- [ ] `uv run ruff format <files>`
- [ ] `uv run ruff check <files> --fix`
- [ ] Address new errors. Suppress false positives with inline `# noqa: XXXX`.
- [ ] Remove any `__all__` from implementation files.

### 10. Verify

- [ ] `uv run pytest <stage_module> --inline-tests -v` (inline tests pass).
- [ ] `uv run pytest tests/unit/compiler/ -v` (external tests pass).
- [ ] No new `Any` imports anywhere in the stage.
- [ ] Each file <= 500 production lines (excluding tests).
- [ ] Each function <= 70 lines.

## Common Mistakes (from the frontend refactor)

1. **Thin wrapper class**: "Parser has 3 methods, 8 free functions do the real
   work." Fix: absorb everything into the class.
2. **Re-exports for backward compat**: "So existing import paths keep working."
   Fix: this is a breaking change. Update all consumers.
3. **`__init__.py` with imports**: even `from .parser import Parser` is wrong.
   Bare docstring only.
4. **`__all__` anywhere**: we don't use `import *`, so `__all__` is dead weight.
   Remove it.
5. **Dict mutation instead of clean return types**: injecting `_canonical_key` into
   a copied dict. Fix: return a tuple or a small dataclass.
6. **O(n) scans per field**: iterating all config entries to find one match.
   Fix: pre-build a reverse index at construction.
7. **Forgetting `# noqa: TC003`**: when `Path` is used as a runtime argument to a
   `@functools.cache` function, ruff thinks it should be TYPE_CHECKING-only.
8. **Not running ruff**: always `uv run ruff format` + `uv run ruff check --fix`
   before declaring done.
9. **Chaining `Foo(x).bar()`**: hides intermediate state. Split construction from
   method call into two lines for debuggability.
10. **Tests that don't verify behavior**: "index_gives_o1_lookup" just tests that
    Python dicts work. Tests must verify YOUR code's behavioral contracts.
11. **Short loop/comprehension variables**: `{f.name: f for f in fields}` is wrong.
    Use `{field.name: field for field in fields}`.
12. **Private methods that should be public**: if a method is part of the stage's
    logical interface (testable, callable), drop the `_` prefix.

## Target Directory Structure

Classic three-phase compiler partition: frontend → unify → backend.

```
schema_compiler/
  __init__.py              # bare docstring
  compiler.py              # SchemaCompiler orchestrator
  compiler_workers.py      # parallel execution

  config/                  # cross-cutting data + Pydantic validation (done)
    models.py              # FieldDefinition, ProviderMapping, loaders
    fields.yml, providers.yml, dedalus.yml, type_extensions.yml

  frontend/                # PARSE + RESOLVE (lexical + semantic analysis)
    parser.py              # Actor: Parser (done)
    resolver.py            # Actor: Resolver (move from resolve/)
    types.py               # RawFieldSpec, FieldIR, VariantMeta, UnionInfo, etc.

  unify/                   # UNIFY + CLASSIFY (cross-provider analysis passes)
    unifier.py             # Actor: Unifier
    classifier.py          # Actor: Classifier
    types.py               # UnifiedField, ClassifiedField, FieldKind

  backend/                 # CODE GENERATION
    context.py             # TypeGenContext (shared generation state)
    helpers.py             # codegen utilities
    constants.py           # constants + annotations (fold annotations.py)

    lower/                 # Type lowering: OpenAPI schema IR → Python type annotations
      convert.py           # main type dispatcher (was codegen/types.py)
      discriminators.py    # discriminated union lowering
      unions.py            # variant type lowering
      schema.py            # schema analysis (+ utils/schema_utils.py consolidated)

    emit/                  # Code emission: assemble + serialize Python source
      emitter.py           # Actor: Emitter (was codegen/emit.py)
      models.py            # unified + individual model gen (merge model_gen + pydantic_gen)
      fields.py            # field definitions + extensions (merge fields + extensions)
      providers.py         # full-fidelity provider types (was provider_gen.py)
      artifacts.py         # alias map + field metadata (merge alias_gen + meta_gen)

  utils/                   # leaf data structures (zero schema_compiler imports)
    dsu.py                 # Disjoint Set Union
    scc.py                 # Strongly Connected Components
```

Key consolidations in backend (14 files → 12):
- `schema_utils.py` absorbed into `backend/lower/schema.py`
- `model_gen.py` + `pydantic_gen.py` → `backend/emit/models.py`
- `alias_gen.py` + `meta_gen.py` → `backend/emit/artifacts.py`
- `fields.py` + `extensions.py` → `backend/emit/fields.py`
- `constants.py` + `annotations.py` → `backend/constants.py`

## Recommended Refactor Order

1. **frontend/**: fold resolve/ into frontend/, make methods public (next).
2. **unify/**: absorb module-level funcs, extract types.py.
3. **backend/**: rename codegen/, consolidate files, split emit.py.
4. **utils/**: delete schema_utils.py after consolidation.
5. **compiler.py / compiler_workers.py**: update orchestrator last.
6. **Mass import fixup**: one final pass to fix all import paths.
