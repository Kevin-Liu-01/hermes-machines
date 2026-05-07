---
name: column-aligned-fields
description: Enforce column-aligned inline comments on dataclass and enum fields. Use when writing or reviewing Python dataclasses, enums, TypedDicts, or any structured type with inline field comments.
---

# Column-Aligned Field Comments

When a dataclass, enum, or similar structured type has inline comments on its fields, align
all comments to the same column and wrap the block with `# fmt: off` / `# fmt: on` so the
formatter preserves the alignment.

## Rules

1. The comment column starts **two spaces** after the longest value expression in the group.
2. Every inline comment is a complete sentence ending with a period.
3. Fields without comments leave the comment column empty (no filler).
4. `# fmt: off` goes on the line immediately before the decorator or class statement.
5. `# fmt: on` goes on the line immediately after the last field.

## Example

```python
# fmt: off
@dataclass
class RawFieldSpec:
    """A single field extracted from a provider's OpenAPI schema."""

    provider:              str                                   # Provider id, e.g. "openai".
    name:                  str                                   # Upstream field name as-is.
    type_str:              str                                   # JSON Schema type string.
    required:              bool                                  # True when in the required array.
    description:           str | None                  = None
    constraints:           JSONObject                  = dataclass_field(default_factory=dict)
    union:                 UnionInfo | None            = None    # Discriminated union info.
    items:                 ArrayItemsInfo | None       = None    # Array item type info.
    additional_properties: JSONObject | bool | None    = None    # additionalProperties schema.
    variant_metadata:      list[VariantMeta] | None   = None     # Titled union variant metadata.
# fmt: on
```

```python
# fmt: off
class TransferCode(IntEnum):
    """Transfer type codes for billing.transfers.code column."""

    USAGE = 1                  # Standard usage charge.
    BALANCE_DEPOSIT = 100      # Stripe payment or balance top-up.
    CREDIT_ADJUSTMENT = 101    # Manual credit adjustment.
    CREDIT_GRANT = 102         # Promotional or signup credits.
    API_USAGE = 200            # LLM API token usage.
    MCP_BUYER_CHARGE = 400     # Buyer charge for MCP tool call.
    MCP_SELLER_HOLD = 410      # Seller pending hold (7-day window).
    MCP_SELLER_CLAWBACK = 411  # Reverse posted hold on refund.
# fmt: on
```

## When NOT to Use

- Classes with fewer than 3 fields (alignment adds no value).
- Fields whose comments would all be trivially obvious from the name.
- Non-structured code (regular variables, function locals).
