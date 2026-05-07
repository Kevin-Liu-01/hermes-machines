---
name: stripe
description: Query and manage Stripe resources (customers, payments, subscriptions). Reads from apps/website/.env. Write operations blocked on live keys.
allowed-tools: Bash(node --experimental-strip-types *)
argument-hint: "<verb> <resource> [id] [--key value ...]"
---

## Script

```bash
node --experimental-strip-types ${CLAUDE_SKILL_DIR}/scripts/stripe.ts <verb> <resource> [id] [flags]
```

## Verbs

| Verb | HTTP | Requires ID | Write? |
|------|------|------------|--------|
| get | GET | yes | no |
| list | GET | no | no |
| search | GET | no | no |
| create | POST | no | yes |
| update | POST | yes | yes |
| delete | DELETE | yes | yes |

## Resources

customers, payment_methods, subscriptions, charges, invoices,
payment_intents, checkout_sessions, refunds, events, products,
prices, credit_grants, balance_transactions

## Flags

- `--customer cus_xxx` filter by customer
- `--type card` filter payment methods by type
- `--status active` filter by status
- `--limit 10` max results
- `--query "email:'foo@bar.com'"` for search verb
- `--format json|table` output format (default: table)
- Any `--key value` pair maps to Stripe API parameters

## Rules

1. **Write operations require test-mode keys.** The script checks `sk_test_*` prefix. Live key writes throw.
2. **Never delete production resources** unless the user explicitly confirms.
3. Default output is table. Use `--format json` for structured output.

## Examples

```bash
# List payment methods for a customer
stripe list payment_methods --customer cus_abc --type card

# Get a specific checkout session
stripe get checkout_session cs_abc

# List recent events
stripe list events --type checkout.session.completed --limit 5

# Search customers by email
stripe search customers --query "email:'win@dedaluslabs.ai'"

# Refund a payment (test mode only)
stripe create refund --payment_intent pi_abc --amount 2000

# List active subscriptions
stripe list subscriptions --customer cus_abc --status active
```

$ARGUMENTS
