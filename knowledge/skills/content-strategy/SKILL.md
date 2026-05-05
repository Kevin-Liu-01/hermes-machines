---
name: content-strategy
description: "Self-promotion and content strategy for X and LinkedIn. Use when planning content calendars, deciding what to post, or rewriting drafts for better engagement."
version: 1.0.0
author: Kevin Liu
license: MIT
metadata:
  hermes:
    tags: [content, x, linkedin, social-media, positioning]
    related_skills: [kevin-voice, frontend-design-taste]
---

# Content Strategy

## Positioning arc

Kevin posts as "founding engineer at Dedalus, building agent infrastructure". Every post should reinforce one of three angles:

1. **Builder** — technical depth: shipping microVM sandboxes, MCP-aware SDKs, design system tokens.
2. **Taste** — design engineering: anti-slop UI, Reticle/Sigil system, post-shadcn patterns.
3. **Operator** — running an early-stage co: hiring signal, customer delivery, infra-as-product.

## Weekly rhythm

| Day | Surface | Type |
|-----|---------|------|
| Mon | X | Build update or technical insight |
| Tue | LinkedIn | Long-form: design system, infra deep dive |
| Wed | X | Reply / quote-tweet to industry discussion |
| Thu | X | Tip: a non-obvious pattern from the week |
| Fri | LinkedIn | Recap or recruiting-friendly accomplishment |

## Quality gates

A post ships only if:

- It teaches something specific the reader didn't know yesterday.
- The proof is traceable: a repo, a screenshot, a metric, a file.
- It doesn't recycle a take you've already posted in the last 30 days.
- It respects the audience: no humble-brag, no "what a journey", no AI clichés.

## Post anatomy (X)

```
[Concrete claim or surprising fact in first line]
[Mechanism — how/why in 1-3 sentences]
[Proof — link, screenshot, or numeric outcome]
[Optional: invitation to engage if relevant]
```

Cap at 270 chars when possible. Threads only when the second post genuinely extends the first; never break a single idea across two tweets.

## Post anatomy (LinkedIn)

```
[Hook — concrete claim, opens differently from "After X years of building"]
[3-5 paragraphs, each ≤4 lines, with line breaks every 2 sentences]
[Bullet list of takeaways — max 5 bullets]
[Soft CTA — what you're working on next, link to the repo, an open question]
```

LinkedIn rewards specificity. "Last week I shipped X. It took 3 days. Here's why most teams skip it." beats "Excited to share..." every time.

## Topics already covered (don't repeat)

- Agent ethos / surgeon-not-painter
- Empirical verification methodology
- Reticle design system launch (2026-04-30 LinkedIn)
- microVM sandboxes for Dedalus machines
- Anti-slop frontend rules

## Topics to cover next

- Skills as durable agent memory (this repo!)
- Hermes + Dedalus as a complete agent stack
- Cron-driven autonomous workflows
- The "persistent agent" thesis: idle most of the time, wake to work
- Token-first design systems vs component-first systems

## Hard "no" list

- "Bullish on X" / "long X" / VC-coded language unless deeply relevant.
- Engagement bait ("what's your favorite Y?", polls without insight).
- Quote-tweeting your own posts.
- Crypto/web3 unless directly tied to a Dedalus customer.
