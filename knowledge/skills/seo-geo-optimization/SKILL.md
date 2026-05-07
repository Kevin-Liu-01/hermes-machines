---
name: seo-geo-optimization
description: Optimize websites for AI search engines (ChatGPT, Perplexity, Gemini, Copilot, Claude) and traditional search. Covers GEO methods, schema markup, entity engineering, and platform-specific strategies. Use when optimizing for AI citations, implementing schema, running GEO audits, or when the user says "GEO", "AI search", "optimize for ChatGPT", "schema markup", "AI citability", "generative engine optimization", or "optimize for Perplexity." Based on resciencelab/opc-skills.
---

# SEO/GEO Optimization

GEO = Generative Engine Optimization. AI search engines don't rank pages — they **cite sources**. Being cited is the new "ranking #1."

Read `wiki/tools/seo-geo.md` for the full playbook if available.

## The 9 Princeton GEO Methods

Ranked by measured visibility boost:

| Method | Boost | How to Apply |
|---|---|---|
| **Cite Sources** | +40% | Add authoritative citations and references |
| **Statistics Addition** | +37% | Include specific numbers and data points |
| **Quotation Addition** | +30% | Add expert quotes with attribution |
| **Authoritative Tone** | +25% | Use confident, expert language |
| **Easy-to-understand** | +20% | Simplify complex concepts |
| **Technical Terms** | +18% | Include domain-specific terminology |
| **Unique Words** | +15% | Increase vocabulary diversity |
| **Fluency Optimization** | +15-30% | Improve readability and flow |
| ~~Keyword Stuffing~~ | **-10%** | **AVOID — hurts visibility** |

**Best combination:** Fluency + Statistics = maximum boost.

## Workflow

### Step 1: Audit Current State

```bash
# Check meta tags and schema
curl -sL "https://example.com" | rg -i "<title>|<meta name=\"description\"|<meta property=\"og:|application/ld\+json" | head -20

# Check AI bot access
curl -s "https://example.com/robots.txt"

# Check sitemap
curl -s "https://example.com/sitemap.xml" | head -50
```

**Verify AI bot access in robots.txt:**
- Googlebot, Bingbot (required)
- GPTBot, ChatGPT-User (OpenAI/ChatGPT)
- ClaudeBot, anthropic-ai (Claude)
- PerplexityBot (Perplexity)

Blocking Google-Extended is not the same as blocking Googlebot. If the goal is AI visibility, blanket AI-bot blocking is self-sabotage.

### Step 2: Entity Engineering

**The 5 Required Rules** (from Kevin's playbook):

1. **Keyword placement** — primary keyword in at least 4 of 6: URL slug, title tag, meta/social title, H1, at least one H2, body copy intro
2. **Entity placement** — primary entity + supporting entities in title, H1, intro, core sections, schema
3. **Entity gap analysis** — extract entities from top competitors, add missing relevant entities. Do not add irrelevant brands.
4. **JSON-LD schema** — place in page `<head>`, not only through client-side injection
5. **Schema entity reinforcement** — mirror on-page entities inside schema fields (`name`, `description`, `about`, `sameAs`, `knowsAbout`, `mentions`, `author`, `publisher`)

### Step 3: Schema Markup

**Baseline graph:** Organization/Person + WebSite + page-specific type + BreadcrumbList.

Use `sameAs` to disambiguate across Wikipedia, Wikidata, LinkedIn, YouTube, GitHub, Crunchbase. Prefer one `@graph` block with `@id` references. Use absolute URLs and ISO dates.

**FAQPage Schema** (+40% AI visibility):

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is [topic]?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "According to [source], [answer with statistics]."
    }
  }]
}
```

**Meta Tags Template:**

```html
<title>{Primary Keyword} - {Brand} | {Secondary Keyword}</title>
<meta name="description" content="{Compelling description with keyword, 150-160 chars}">

<!-- Open Graph -->
<meta property="og:title" content="{Title}">
<meta property="og:description" content="{Description}">
<meta property="og:url" content="{Canonical URL}">
<meta property="og:image" content="{Absolute image URL 1200x630}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta property="og:image:alt" content="{Image alt text}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{Brand}">
<meta property="og:locale" content="en_US">

<!-- Twitter Cards (namespace is still twitter:, not x:) -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@{handle}">
<meta name="twitter:creator" content="@{handle}">
<meta name="twitter:title" content="{Title}">
<meta name="twitter:description" content="{Description}">
<meta name="twitter:image" content="{Absolute image URL}">
<meta name="twitter:image:alt" content="{Image alt text}">
```

**Robots directive for large social cards:**

```html
<meta name="robots" content="max-image-preview:large">
```

Or in Next.js metadata:

```typescript
robots: {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
},
```

### Step 4: AI Citability Engineering

Models cite passages that are direct, self-contained, fact-rich, structurally legible, and make sense outside context.

**5-part citability model:**
1. **Answer block quality** — question-based H2, direct answer in first 1-2 sentences, named entities, precise claims
2. **Self-containment** — names subject explicitly, no dangling pronouns, at least one concrete fact
3. **Structural readability** — one H1, clean H2-H3 nesting, short paragraphs, lists for steps, tables for comparisons
4. **Statistical density** — percentages, dollar values, dated claims, named studies, benchmarks
5. **Uniqueness** — original data, case studies, experiments, screenshots

Target: 134-167 word answer blocks.

### Step 5: Content Structure

- Use "answer-first" format (direct answer at top of each section)
- Clear H1 > H2 > H3 hierarchy
- Bullet points and numbered lists
- Tables for comparison data
- Short paragraphs (2-3 sentences max)
- Question-led H2s for AI Overview extraction

### Step 6: llms.txt

Machine-readable summary at domain root:
- What the site is, what sections matter, canonical pages, core facts
- 10-30 most important pages with clear descriptions
- Aligned with real site structure

Not a replacement for good structure, schema, or crawlability.

## Platform-Specific Strategies

### ChatGPT
- **Branded domain authority** — cited 11% more than third-party
- **Content freshness** — update within 30 days (3.2x more citations)
- **Backlinks** — >350K referring domains = 8.4 avg citations
- Bing index matters; entity consistency across site/schema/profiles

### Perplexity
- Allow PerplexityBot in robots.txt
- Use FAQ Schema (higher citation rate)
- Host PDF documents (prioritized for citation)
- Community validation, Reddit footprint, sourced quotable content

### Google AI Overview
- Optimize for E-E-A-T
- Structured data (Schema markup), topical authority (content clusters + internal linking)
- Authoritative citations (+132% visibility)
- Question-led H2s, direct answer after heading, tables, FAQ, visible `dateModified`

### Microsoft Copilot / Bing
- Bing indexing required for citation
- Microsoft ecosystem signals (LinkedIn, GitHub mentions help)
- Page speed < 2 seconds, clear entity definitions

### Claude
- Brave Search indexing (Claude uses Brave, not Google)
- High factual density (data-rich content preferred)
- Clear structural clarity (easy to extract)

## Competitive Comparison Capture

Capture branded commercial-intent queries directly:
- Publish exact-match `vs`, `review`, and `alternatives` pages
- Per competitor: one standalone review page + one comparison page
- Structure: question-led H2s, quotable verdict sentences, side-by-side tables, FAQ blocks
- **Firsthand testing required** — sign up, use products, take notes and screenshots

## GEO Scorecard

| Category | Weight |
|---|---|
| AI citability and extractability | 25% |
| Brand authority and off-site signals | 20% |
| Content quality and E-E-A-T | 20% |
| Technical foundations | 15% |
| Structured data | 10% |
| Platform optimization | 10% |

Bands: 90-100 elite, 75-89 strong, 60-74 mixed, 40-59 weak, 0-39 critical.

## Validation

```bash
# Schema validation
open "https://search.google.com/test/rich-results?url=https://example.com"
open "https://validator.schema.org/?url=https://example.com"

# Indexing check
open "https://www.google.com/search?q=site:example.com"
open "https://www.bing.com/search?q=site:example.com"
```

## Next.js OG Implementation

### `buildPageMetadata` pattern

When 3+ pages repeat the same openGraph/twitter block, extract a helper that
returns `{ openGraph, twitter, alternates }` from a single input. Every
public page should call this instead of hand-writing the block. See the
`og-metadata-audit` skill for the full pattern.

### Social bot middleware

For maximum reliability, intercept social bots in `middleware.ts` and return
a minimal HTML document with just meta tags. This avoids bots hitting React
loading shells, Clerk auth walls, or heavy JS bundles.

The middleware file **must** be named `middleware.ts` and the export **must**
be named `middleware` or `default`. Next.js silently ignores `proxy.ts` or
other names.

### `htmlLimitedBots`

Complement the middleware with `htmlLimitedBots` in `next.config.ts` to serve
lightweight HTML to SEO/AI crawlers the middleware doesn't catch:

```typescript
htmlLimitedBots: /Googlebot|Bingbot|GPTBot|ClaudeBot|PerplexityBot|.../,
```

### Canonical inheritance trap

In Next.js App Router, if a child page doesn't export its own
`alternates.canonical`, it inherits the parent layout's — usually `/`. Every
public page needs its own canonical URL. `buildPageMetadata` fixes this by
including `alternates: { canonical }` in every call.

### `metadataBase`

Must resolve to the production domain. If using env vars, verify
`NEXT_PUBLIC_SITE_URL` is set in Vercel. Fallback chains
(`VERCEL_PROJECT_PRODUCTION_URL` → `VERCEL_URL`) resolve to `*.vercel.app`,
causing Twitter to cache images against the wrong origin.

## Related Skills

- `seo-audit` — comprehensive technical SEO auditing
- `og-metadata-audit` — OpenGraph/Twitter card audit and DRY patterns
- `content-strategy` — content planning and publishing rhythm
- `social-draft` — platform-optimized content drafting
