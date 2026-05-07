---
name: style-guide
description: Dedalus style guide quick reference. Key rules for writing code that lasts. Use when writing or reviewing Python code.
disable-model-invocation: true
---

# Dedalus Style Guide: Quick Reference

## Hard Limits

- Functions: **70 lines max**
- Files: **500 lines max** (excluding inline tests)
- Nesting: **3 levels max**
- Arguments: **5 max** (excluding self/cls)
- PRs: **200 changed LOC max**

## I/O Convention

```python
# I/O function: io: Io as first parameter
async def fetch_user(io: Io, user_id: str) -> User | None: ...

# Pure function: no io parameter
def compute_discount(user: User, cart: Cart) -> Decimal: ...
```

## Types

- No `Any`. Period. If you reach for `Any`, you have not modeled the domain.
- No `object` as a type annotation. It is `Any` in disguise.
- For heterogeneous JSON, use `JSONValue`, `JSONObject`, `JSONPrimitive`, or
  `JSONArray` from `core.types.json`. These are proper recursive RFC 8259 types.
  There is no excuse for `dict[str, object]` or `dict[str, Any]`.
- No `**kwargs: Any` without justification.
- Use typed structures (dataclass, TypedDict, Pydantic) instead of dicts.
- Pydantic at boundaries, plain types internally.
- Replace anonymous tuples with frozen dataclasses or named types.

## Functions

- **Early returns** instead of nesting
- **One thing per function**: if you need "and", split it
- **Named parameters** at call sites: `fetch_user(io=io, user_id=uid)`
- **Return value in own variable** for debuggability: `result = ...; return result`
- **No chaining construction + method**: `Foo(x).bar()` hides the instance.
  Split into `foo = Foo(x)` then `result = foo.bar()`.
- Split compound assertions: `assert a; assert b` not `assert a and b`

## Error Handling

- **Specific exceptions** with domain context: `ChargeError(org_id, reason)`
- **Never** catch bare `Exception` without `# noqa: BLE001`
- **Never** swallow with `pass`
- **Namespace pattern**: `BillingError.ChargeError`
- **Result types** for domain logic, try/except at boundaries

## No Fallbacks

```python
# Bad: silent, undebuggable
model = request.model or config.default_model or "gpt-4"

# Good: explicit precedence with early returns
def get_model(request, config):
    if request.model:
        return request.model
    if config.default_model:
        return config.default_model
    raise ValueError("model is required")
```

## Naming

- No abbreviations: `get_user_by_id` not `get_usr`
- Units last: `timeout_ms`, `latency_ms_p99`
- Terse locals for mechanical: `res`, `ret`, `cfg`, `ctx`
- Descriptive for domain: `user`, `balance`, `org_id`
- Loop variables: full singular form. `for field in fields`, not `for f in fields`.
  Applies in comprehensions too: `{field.name: field for field in fields}`.

## Docstrings (Google style)

```python
async def fetch_user(io: Io, user_id: str) -> User | None:
    """Fetch user from database by ID.

    The returned User is a snapshot; mutations won't persist.

    Args:
        io: I/O capability handle.
        user_id: The unique identifier for the user.

    Returns:
        The User object if found, None otherwise.

    """
```

- Imperative mood: "Fetch", not "Fetches"
- Args section if function takes parameters
- Returns section always (even for None)
- Blank line before closing `"""`
- Full sentences with periods. No dashes or sentence fragments.

## Comments

- Explain WHY, not WHAT
- Delete narration: `user = get_user(id)  # Get the user` → delete the comment
- Document trade-offs and policy choices
- Section headers: single-line `# --- Label ---` (no multi-line box separators)
- Column-align inline field comments with `# fmt: off` / `# fmt: on`
  (see column-aligned-fields skill for detailed rules)

## Module Organization

- `__init__.py`: bare docstring only. No imports, no re-exports, no `__all__`.
- No `__all__` in implementation files either. Public API is communicated by
  naming convention (public vs `_`-prefixed). We never use `import *`.
- One class per stage file. Class absorbs all logic (not a thin wrapper).
- Prefer public methods. Only `_`-prefix true internals callers never need.
- Types (dataclasses, aliases) in `types.py`. Logic in the main module.
- No backward-compat shims, convenience wrappers, or `_default_instance` patterns.
- Use `functools.cache` for expensive I/O loads, not manual `ClassVar[dict]`
  caches. Don't import cross-package deps for simple stdlib needs.

## Constants

- Use Enum or frozen dataclass, not raw dicts/lists
- Numeric literals > 999 need underscores: `100_000` not `100000`
- Powers of 2 are exempt: `4096` is fine

## Testing (Inline)

```python
# --- Tests ---

from inline_tests import test  # noqa: E402


@test
async def rejects_empty_id():
    import pytest  # noqa: PLC0415

    with pytest.raises(ValueError):
        await fetch_user("")
```

- Colocated with implementation
- Local imports with `# noqa: PLC0415`
- One test = one scenario
- Unit tests (synthetic data) inline, integration tests (real files) in `tests/`
- Tests verify behavioral contracts, not implementation details or Python builtins
- Run: `uv run pytest path/to/file.py --inline-tests -v`

## Before Committing

- `uv run ruff format <files>`
- `uv run ruff check <files> --fix`
- Each file <= 500 production lines
- Each function <= 70 lines
- No `Any` without justification
- No `__all__` in any implementation file
