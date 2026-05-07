---
name: seo-audit
description: Comprehensive SEO auditing covering crawlability, indexation, speed, on-page optimization, and content quality. Use when auditing a website's SEO, reviewing technical SEO foundations, checking meta tags, analyzing page speed, or when the user says "SEO audit", "check SEO", "audit this site", "technical SEO", or "crawlability check." Based on coreyhaines31/marketingskills.
---

# SEO Audit

Systematic assessment across five priority areas. Deliver findings as prioritized action plans with impact levels and specific remediation steps.

## Audit Priority Order

1. **Crawlability & Indexation** — can search engines find and index it?
2. **Technical Foundations** — is the site fast and functional?
3. **On-Page Optimization** — is content optimized?
4. **Content Quality** — does it deserve to rank?
5. **Authority & Links** — does it have credibility?

## Initial Assessment

Before auditing, understand:
- Site type (SaaS, e-commerce, blog, etc.) and primary business goal for SEO
- Known issues, current organic traffic level, recent changes or migrations
- Scope: full site or specific pages, technical + on-page or one focus area

## Schema Markup Detection Limitation

`web_fetch` and `curl` cannot reliably detect structured data. Many CMS plugins inject JSON-LD via client-side JavaScript — it won't appear in static HTML.

To accurately check for schema:
1. Browser tool: `document.querySelectorAll('script[type="application/ld+json"]')`
2. Google Rich Results Test: https://search.google.com/test/rich-results
3. Screaming Frog export (renders JavaScript)

Never report "no schema found" based solely on `web_fetch` or `curl`.

## 1. Crawlability & Indexation

### Robots.txt
- Check for unintentional blocks, verify important pages allowed, check sitemap reference
- Verify AI bot access: Googlebot, Bingbot, GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot

### XML Sitemap
- Exists and accessible, submitted to Search Console
- Contains only canonical, indexable URLs, updated regularly

### Site Architecture
- Important pages within 3 clicks of homepage
- Logical hierarchy, descriptive internal linking, no orphan pages

### Indexation
- `site:domain.com` check, Search Console coverage report
- Check for noindex on important pages, wrong canonicals, redirect chains, soft 404s, duplicate content

### Canonicalization
- All pages have canonical tags, self-referencing canonicals on unique pages
- HTTP→HTTPS, www vs non-www, trailing slash consistency

## 2. Technical Foundations

### Core Web Vitals
- LCP < 2.5s, INP < 200ms, CLS < 0.1
- Check: TTFB, image optimization, JS execution, CSS delivery, caching, CDN, font loading

### Mobile
- Responsive design (not separate m. site), tap targets, viewport, no horizontal scroll
- Same content as desktop, mobile-first indexing readiness

### Security
- HTTPS everywhere, valid SSL, no mixed content, HTTP→HTTPS redirects, HSTS header

### URL Structure
- Readable, descriptive, keywords where natural, consistent, lowercase, hyphen-separated

## 2b. Social Preview / OG Cards

### Middleware (Next.js)
- Middleware file is named `middleware.ts` (not `proxy.ts` or other names)
- Export is named `middleware` or `default` (Next.js silently ignores other names)
- Social bots (Twitterbot, facebookexternalhit, etc.) are intercepted and get minimal HTML with meta tags
- `htmlLimitedBots` in `next.config.ts` covers SEO/AI crawlers the middleware doesn't catch

### OG Tag Completeness
For each public page, verify all present:
- `og:title`, `og:description`, `og:url` (absolute), `og:image` (absolute, 1200x630)
- `og:image:width`, `og:image:height`, `og:image:type`, `og:image:alt`
- `og:type` (`website` or `article`), `og:site_name`, `og:locale`
- `twitter:card` (`summary_large_image`), `twitter:site`, `twitter:creator`
- `twitter:title`, `twitter:description`, `twitter:image`, `twitter:image:alt`

The namespace is still `twitter:`, not `x:`. The crawler has not changed.

### Robots for Large Cards
- Root layout must include `robots.googleBot["max-image-preview"]: "large"`
- Without this, search engines may show thumbnail instead of large image

### Canonical Inheritance
- In Next.js App Router, child pages that don't set `alternates.canonical` inherit the root's (usually `/`)
- Every public page needs its own canonical — use `buildPageMetadata` to enforce this

### metadataBase
- Must resolve to the production domain, not `*.vercel.app`
- If using env vars, verify `NEXT_PUBLIC_SITE_URL` is set in Vercel project settings
- Relative image URLs in metadata resolve against `metadataBase`

### OG Image
- 1200x630 pixels, accessible (returns 200), has alt text
- `Content-Type` matches declared type (`image/png` vs `image/jpeg`)
- If using `next/og` ImageResponse, verify domain branding matches current domain

## 3. On-Page Optimization

### Title Tags
- Unique per page, primary keyword near beginning, 50-60 characters
- Compelling, click-worthy, no brand stuffing (SERPs include brand above title)
- Common issues: duplicates, truncated, too short, keyword-stuffed, missing

### Meta Descriptions
- Unique per page, 150-160 characters, includes primary keyword
- Clear value proposition, call to action
- Common issues: duplicates, auto-generated, wrong length

### Heading Structure
- One H1 per page containing primary keyword, logical H1→H2→H3 hierarchy
- Common issues: multiple H1s, skipped levels, headings for styling only

### Content
- Keyword in first 100 words, related keywords naturally used
- Sufficient depth for topic, answers search intent, better than competitors
- Flag thin content, tag/category pages with no value, near-duplicates

### Images
- Descriptive filenames, alt text on all images, compressed, WebP, lazy loading, responsive

### Internal Linking
- Important pages well-linked, descriptive anchor text, no broken links
- Flag orphan pages, over-optimized anchors, buried important pages

### Keyword Targeting
- Clear primary keyword per page, title/H1/URL aligned, satisfies search intent
- No keyword cannibalization, logical topical clusters site-wide

## 4. Content Quality (E-E-A-T)

**Experience**: First-hand experience, original insights/data, real examples and case studies
**Expertise**: Author credentials visible, accurate detailed info, properly sourced claims
**Authoritativeness**: Recognized in space, cited by others, industry credentials
**Trustworthiness**: Accurate info, transparent, contact info, privacy policy, HTTPS

### Content Depth
- Comprehensive topic coverage, answers follow-up questions
- Better than top-ranking competitors, updated and current

## 5. Site-Type Specific Issues

**SaaS**: Product pages lack depth, blog not integrated, missing comparison/alternative pages
**E-commerce**: Thin category pages, duplicate product descriptions, missing product schema, faceted nav duplicates
**Content/Blog**: Outdated content, keyword cannibalization, no topical clustering, poor internal linking
**Local Business**: Inconsistent NAP, missing local schema, no Google Business Profile optimization

## Output Format

### Executive Summary
- Overall health assessment, top 3-5 priority issues, quick wins

### Per Finding
- **Issue**: What's wrong
- **Impact**: High / Medium / Low
- **Evidence**: How you found it
- **Fix**: Specific recommendation
- **Priority**: 1-5

### Prioritized Action Plan
1. Critical fixes (blocking indexation/ranking)
2. High-impact improvements
3. Quick wins (easy, immediate benefit)
4. Long-term recommendations

## Quick Commands

```bash
# Check meta tags and schema
curl -sL "https://example.com" | rg -i "<title>|<meta name=\"description\"|<meta property=\"og:|application/ld\+json" | head -20

# Check robots.txt
curl -s "https://example.com/robots.txt"

# Check sitemap
curl -s "https://example.com/sitemap.xml" | head -50

# Validate schema (open in browser)
open "https://search.google.com/test/rich-results?url=https://example.com"
```

## Related Skills

- `seo-geo-optimization` — AI search engine optimization (GEO/AEO)
- `og-metadata-audit` — OpenGraph/Twitter card audit and DRY patterns
- `content-strategy` — content planning and publishing rhythm
- `social-draft` — platform-optimized content drafting
