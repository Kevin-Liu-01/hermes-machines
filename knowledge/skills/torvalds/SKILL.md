---
name: torvalds
description: Design engineering principles for removing special cases. Use when designing new systems, extracting shared packages, refactoring conditional logic, deciding whether to add a flag or change the interface, or when the user invokes "good taste" or asks for a cleaner algorithm.
---

# Good Taste

## The linked list example

Linus Torvalds showed two ways to remove a node from a singly linked list.

**Without taste** (the standard textbook approach):

```c
void remove(list *head, list *target) {
    list *prev = NULL;
    list *cur = head;
    while (cur != target) {
        prev = cur;
        cur = cur->next;
    }
    if (prev)
        prev->next = cur->next;
    else
        head = cur->next;
}
```

The `if (prev)` branch exists because the head node has no predecessor.
Removing the first element is a special case: instead of patching the
previous node's `next` pointer, you must patch the head pointer itself.
Every reader of this function has to understand that the head is
different from every other node, and that this branch handles it.

**With taste**:

```c
void remove(list *head, list *target) {
    list **pp = &head;
    while (*pp != target)
        pp = &(*pp)->next;
    *pp = target->next;
}
```

The indirect pointer `pp` always points to the `next` field that refers
to the current node. For the head, `pp` points to `head` itself. For
every other node, `pp` points to `prev->next`. The assignment `*pp =
target->next` patches whichever pointer was referring to the target,
whether that was `head` or some node's `next` field.

The special case disappeared. Not because we handled it elsewhere, but
because we chose a representation where head and non-head are the same.
The branch was never necessary. It was an artifact of the data
structure choice (`prev` pointer), not of the problem.

**Why the first version is bad code:**

1. The branch doubles the mental load. A reviewer must verify both
   paths are correct and that the condition is right.
2. The branch is easy to get wrong. Off-by-one in the `prev == NULL`
   check, or forgetting to update `head`, are common linked-list bugs.
3. The branch doesn't scale. If you add a tail pointer, you need
   another special case. The indirect-pointer version handles it
   with zero additional code.

## The principle

Before adding a conditional, flag, mode, or special case, ask:

> Can I change the representation so the special case doesn't exist?

If yes, change the representation. If no, document why the special
case is irreducible.

## Techniques

### 1. Change the data to remove the branch

The linked list example uses an indirect pointer. The general
pattern: if two cases differ only in which variable you update,
introduce a level of indirection that unifies them.

**Database example**: a query builder has separate paths for "first
condition" (no `AND` prefix) vs "subsequent conditions" (needs `AND`).
Fix: always emit `WHERE 1=1` as a sentinel, then every condition is
`AND ...`. The sentinel eliminates the first-condition special case.

**Config example**: a function has separate code paths for "default
config" vs "user-provided config". Fix: make the default config a
real config value, not a nil/absent sentinel. Load defaults first,
overlay user config. One code path.

### 2. Change the algorithm to remove the branch

If an algorithm has a special exit condition for one mode, ask
whether a single algorithm handles all modes.

**Convergence example**: a migration loop exits differently for
"converging" (dirty set shrinking) vs "diverging" (dirty set
growing) workloads. Fix: one priority-ordered convergence check that
handles both. The diverging case is just another criterion in the
same list, not a separate code path.

**Retry example**: a function retries on transient errors but fails
immediately on permanent errors. Instead of `if is_transient(err)
{ retry } else { fail }`, use a retry policy that maps each error
to a delay: transient errors get backoff delays, permanent errors
get delay zero (which means no retry). One loop, no branch.

### 3. Change the scope to remove the branch

If a caller has to choose between two versions of a function, ask
whether one version handles both cases.

**Filtering example**: a function takes a `skip_empty` flag that
changes which items it processes. Fix: make the function always
filter empty items. If every item is non-empty, the filter is a
no-op. No flag needed; callers don't choose.

**Optimization example**: a function takes a `use_fast_path` flag.
Fix: make the function always use the fast path when applicable
and fall back to the slow path otherwise. The caller doesn't decide;
the function inspects its own data.

### 4. Make illegal states unrepresentable

If a runtime check guards against an invalid state, ask whether the
type system can prevent that state from existing.

**Enum over boolean**: `fn connect(tls: bool, verify: bool)` has
4 states, but `tls=false, verify=true` is nonsensical. Fix:
`enum Security { None, Tls, MutualTls }` — 3 states, all valid.

**Newtype over primitive**: `fn transfer(from: u64, to: u64)` can
be called with arguments swapped. Fix: `AccountId(u64)` newtype
prevents `transfer(to, from)` at compile time.

**Builder over option soup**: a struct with 5 optional fields where
only certain combinations are valid. Fix: a builder that enforces
the valid combinations at each step. Invalid states are unreachable.

## When special cases are real

Not every branch is eliminable. The test: can you write a data
structure, type, or algorithm that handles both cases uniformly?
If no, the branch reflects a genuine domain distinction.

Examples of irreducible special cases:
- First iteration of a loop (no prior state to compare against)
- Root of a tree (no parent to notify)
- Network partition handling (fundamentally different from local errors)
- Platform-specific code (`#[cfg(target_os = "linux")]`)

These are named, documented, and tested. They're explicit `match`
arms, not hidden `if` branches buried in helper functions.

## The heuristic

Count the `if` statements in your function. Each one is a branch the
next reader must understand. If you can reduce the count by changing
the representation, do it. If every branch is irreducible, the
function is as simple as it can be.

Good taste is not cleverness. It is the discipline to find the
representation where the special cases disappear.
