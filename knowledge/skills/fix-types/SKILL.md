---
name: fix-types
description: Audit code for loose types that allow semantically invalid values to compile. Introduces newtypes, checked casts, enums over booleans, and documents wire/DB discriminant contracts. Use when writing structs with bare primitives, reviewing database or protocol code, or when a function takes 2+ parameters of the same type.
---

# Fix Types

Make invalid states unrepresentable. All possible types and states
should be defined upfront ahead of time. Every bare primitive that
carries domain meaning is a bug waiting for a call site to swap two
arguments of the same type. The compiler/type-checker is free;
runtime debugging is not!

## 1. Newtypes / branded types over bare primitives

If a value means different things in different parameters of the same
function, wrap each in a distinct type.

**Rust:**

```rust
struct AccountId(u64);
struct Cents(u64);
fn transfer(from: AccountId, to: AccountId, amount: Cents);
```

**TypeScript:**

```typescript
type AccountId = string & { readonly __brand: "AccountId" };
type Cents = number & { readonly __brand: "Cents" };
function transfer(from: AccountId, to: AccountId, amount: Cents): void;
```

**Python:**

```python
from typing import NewType
AccountId = NewType("AccountId", int)
Cents = NewType("Cents", int)
def transfer(from_: AccountId, to: AccountId, amount: Cents) -> None: ...
```

**Go:**

```go
type AccountId uint64
type Cents uint64
func Transfer(from, to AccountId, amount Cents) error
```

Apply when a bare primitive appears in 3+ function signatures with
different semantics. Common candidates: identifiers, indices, offsets,
sizes, timestamps, currency amounts, ports, sequence numbers.

## 2. Checked casts at trust boundaries

When converting between signed/unsigned or narrowing width, validate
at the boundary where untrusted data enters. Silent truncation or
wraparound is a corruption vector.

```rust
// Bad: silent wraparound on corrupt input.
let id = row.get::<_, i64>(0)? as u64;

// Good: fails loud on negative.
let id = u64::try_from(raw).map_err(|_| Error::Corrupt(raw))?;
```

```python
# Bad: silently wraps on overflow.
port = int(raw_value) & 0xFFFF

# Good: explicit bounds check.
port = int(raw_value)
if not (0 <= port <= 65535):
    raise ValueError(f"port out of range: {port}")
```

```go
// Bad: silent truncation.
port := uint16(rawPort)

// Good: bounds check.
if rawPort < 0 || rawPort > math.MaxUint16 {
    return fmt.Errorf("port out of range: %d", rawPort)
}
```

The same principle applies to any narrowing conversion: `i64` to `i32`,
`float64` to `float32`, `string` to fixed-length field.

## 3. Enums / union types over booleans

A function with two boolean parameters is a trap. Replace with named
alternatives that document intent at the call site.

```rust
enum Tls { On, Off }
enum CertVerify { Strict, Skip }
fn connect(host: &str, tls: Tls, verify: CertVerify);
```

```typescript
type Tls = "on" | "off";
type CertVerify = "strict" | "skip";
function connect(host: string, tls: Tls, verify: CertVerify): void;
```

```python
class Tls(enum.Enum):
    ON = "on"
    OFF = "off"

class CertVerify(enum.Enum):
    STRICT = "strict"
    SKIP = "skip"

def connect(host: str, tls: Tls, verify: CertVerify) -> None: ...
```

## 4. Discriminants and wire values are part of the contract

If an enum's numeric values or string tags are stored in a database or
sent over the wire, document that changing them is a breaking migration.
This applies equally to Rust `#[repr(u8)]`, TypeScript string unions,
Python `IntEnum`, and Go `iota` constants.

## Checklist

1. List every function that takes 2+ parameters of the same primitive type.
2. For each: can the caller swap arguments and still compile? If yes,
   introduce a newtype or branded type.
3. Audit every narrowing or sign-changing cast on non-constant values.
   Replace with checked conversion or add a justification comment.
4. Check boolean parameters. If a function takes 2+ bools, replace with
   enums or union types.
