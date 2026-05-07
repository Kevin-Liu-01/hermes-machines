---
name: og-metadata-audit
description: >-
  Audit and fix OpenGraph and Twitter card metadata in Next.js App Router
  projects. Cross-reference metadata exports across pages, identify missing
  fields, DRY violations, broken middleware, and incorrect canonicals. Use
  when Twitter cards aren't rendering, OG images are broken, metadata is
  inconsistent across pages, or when the user says "audit OG", "fix
  opengraph", "twitter cards broken", "metadata audit", "OG not working",
  or "social preview broken".
---

# OG Metadata Audit

## Audit Steps

### 1. Inventory all metadata exports

Find every file exporting `metadata` or `generateMetadata`:

```
grep -r "export const metadata" --include="*.tsx" --include="*.ts"
grep -r "export async function generateMetadata" --include="*.tsx" --include="*.ts"
```

For each, record: file path, fields present, fields missing.

### 2. Check root layout

The root `app/layout.tsx` metadata must include:

| Field | Required | Notes |
|-------|----------|-------|
| `metadataBase` | Yes | Absolute URL. Resolves all relative image paths. |
| `title.default` + `title.template` | Yes | Template applies to child pages. |
| `description` | Yes | |
| `openGraph` | Yes | With `images`, `siteName`, `locale`, `type`, `url`. |
| `twitter` | Yes | With `card`, `site`, `creator`, `title`, `description`, `images`. |
| `robots` | Yes | Include `googleBot.max-image-preview: "large"` for full-size social cards. |
| `alternates.canonical` | Yes | Root canonical URL. |
| `category` | Optional | e.g. `"technology"`. |

### 3. Check child pages

Every public page needs its own `alternates.canonical` pointing to its path,
not inheriting the root `/`. Pages that only set `title` and `description`
silently inherit the root canonical, which is wrong for SEO.

### 4. Check middleware

Next.js middleware must be in a file named `middleware.ts` (or `.js`) at the
project root, exporting a function named `middleware` (or a default export).

Common failure: file named `proxy.ts` or function named `proxy` — Next.js
silently ignores both.

If the project intercepts social bots (Twitterbot, facebookexternalhit, etc.)
in middleware, verify:

- The file is `middleware.ts`
- The export is `middleware` or `default`
- The matcher doesn't exclude the routes bots need
- Bot HTML includes all required meta tags (see checklist below)

### 5. Check OG image route

If using `next/og` ImageResponse:

- Route returns `Content-Type: image/png`
- Image is 1200x630
- `Cache-Control` headers are set
- The footer/branding matches the current domain

If using static images:

- File exists at the referenced path
- Dimensions are 1200x630
- `type` field matches actual format (`image/png` vs `image/jpeg`)

### 6. Check `metadataBase` resolution

`metadataBase` must resolve to the production domain. Common pattern:

```typescript
// Fragile — breaks if env var is unset on Vercel
metadataBase: buildSiteUrl()

// Robust — always correct
metadataBase: new URL("https://yourdomain.com")
```

If using env vars, verify `NEXT_PUBLIC_SITE_URL` is set in Vercel project
settings. Fallback chains like `VERCEL_PROJECT_PRODUCTION_URL` →
`VERCEL_URL` resolve to `*.vercel.app`, which causes Twitter to cache
images against the wrong origin.

## Required Meta Tags (Checklist)

### OpenGraph

- `og:title`
- `og:description`
- `og:url` (absolute, canonical)
- `og:image` (absolute URL, 1200x630)
- `og:image:width` + `og:image:height`
- `og:image:type` (`image/png` or `image/jpeg`)
- `og:image:alt`
- `og:type` (`website` or `article`)
- `og:site_name`
- `og:locale`

### Twitter

- `twitter:card` (`summary_large_image`)
- `twitter:site` (handle with `@`)
- `twitter:creator` (handle with `@`)
- `twitter:title`
- `twitter:description`
- `twitter:image` (absolute URL)
- `twitter:image:alt`

The namespace is still `twitter:`, not `x:`. The crawler has not changed.

## DRY Pattern: `buildPageMetadata`

When 3+ pages repeat the same openGraph/twitter block, extract a helper:

```typescript
type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: readonly string[];
  absoluteTitle?: boolean;
};

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const canonical = buildSiteUrl(input.path).toString();
  const ogTitle = input.absoluteTitle
    ? input.title
    : `${input.title} · ${SITE_NAME}`;

  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical },
    ...(input.keywords ? { keywords: [...input.keywords] } : {}),
    openGraph: {
      title: ogTitle,
      description: input.description,
      url: canonical,
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      images: buildDefaultOpenGraphImages(),
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_SITE_HANDLE,
      creator: TWITTER_CREATOR_HANDLE,
      title: ogTitle,
      description: input.description,
      images: buildDefaultTwitterImages(),
    },
  };
}
```

Pages collapse from 20 lines to 4:

```typescript
export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: "How we handle your data.",
  path: "/privacy",
});
```

For dynamic pages (`generateMetadata`), build a parallel helper that accepts
the fetched entity and constructs the full metadata with `type: "article"`,
entity-specific OG images, and conditional `robots`.

## Common Failures

| Symptom | Cause |
|---------|-------|
| Twitter shows no card | Middleware file not named `middleware.ts`, or export not named `middleware` |
| Twitter shows small thumbnail | Missing `twitter:card: summary_large_image` or missing `robots` `max-image-preview: large` |
| OG image shows on some pages but not others | Child pages missing explicit `twitter.images` (Next.js doesn't deeply merge twitter metadata from parent) |
| Wrong image on social share | `metadataBase` resolving to `*.vercel.app` instead of custom domain |
| Google shows root URL as canonical for all pages | Child pages not setting their own `alternates.canonical` |
| Bot sees React loading shell | `htmlLimitedBots` not configured in `next.config.ts` |

## `htmlLimitedBots`

Separate from middleware. Tells Next.js to serve lightweight HTML (no client
JS) to listed bots. Covers SEO/AI crawlers the middleware doesn't intercept:

```typescript
const nextConfig: NextConfig = {
  htmlLimitedBots: /Googlebot|Bingbot|GPTBot|ClaudeBot|PerplexityBot|.../,
};
```

The middleware handles social bots (Twitterbot, Facebook, etc.) with custom
HTML. `htmlLimitedBots` handles everything else. They complement each other.

## Social Bot Middleware Pattern

```typescript
// middleware.ts — must be this filename
export async function middleware(req: NextRequest, event: NextFetchEvent) {
  if (isSocialBot(req) && shouldServeBotHtml(req.nextUrl.pathname)) {
    return buildBotResponse(req);
  }
  return clerkHandler(req, event);
}
```

The bot response is a minimal HTML document containing only `<meta>` tags.
No React, no JS, no layout — just the tags crawlers need. This is more
reliable than hoping the full app renders correctly for bots.
