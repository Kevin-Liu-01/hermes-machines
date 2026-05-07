---
name: font-switcher-dev-tool
description: Build a floating font selector dev tool for any Next.js app. Copies font files, generates @font-face CSS, creates a FontProvider context with localStorage persistence, and builds a floating selector UI. Use when evaluating candidate typefaces across an app, adding font preview capability, or when the user says "font switcher", "try fonts", "compare fonts", or "add a font selector."
---

# Font Switcher Dev Tool

## When to Use

- User wants to preview/compare multiple fonts across an app
- User drops a folder of font files and wants them wired up
- User says "font switcher", "font selector", "try these fonts", "toggle fonts"
- User wants to evaluate typefaces before committing to one

## Architecture

The font switcher works by overriding a single CSS custom property on `<html>`:

```
--font-active → picked up by --font-sans → applied to body
```

No re-renders. No class swapping. One CSS variable update per font change.

**File structure:**

```
public/fonts/<family-slug>/   ← font files (Regular + Bold minimum)
src/app/fonts.css             ← @font-face declarations
src/lib/fonts.ts              ← font metadata constants + helpers
src/contexts/FontContext.tsx   ← provider with localStorage persistence
src/components/FontSelector.tsx ← floating UI (bottom-right, grouped, random)
```

## Step 1: Copy Font Files

Organize by family in `public/fonts/`. Use kebab-case directory names.

```bash
mkdir -p public/fonts/<family-slug>
cp "/path/to/FontName-Regular.otf" public/fonts/<family-slug>/
cp "/path/to/FontName-Bold.otf"    public/fonts/<family-slug>/
```

Include at minimum Regular (400) and Bold (700) weights. For variable fonts,
one file covers all weights.

## Step 2: Download Google Fonts (if needed)

Google Fonts only returns woff2 with a modern user agent:

```bash
# Get the CSS with woff2 URLs
curl -sL "https://fonts.googleapis.com/css2?family=FONT+NAME:wght@100..900&display=swap" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Find the Latin subset src URL, then download it
curl -L -o public/fonts/<slug>/FontName-Variable-Latin.woff2 "https://fonts.gstatic.com/s/..."
```

Verify the downloaded file is >1KB (tiny files = redirect, not a font).

## Step 3: Generate @font-face CSS

Create `src/app/fonts.css`:

```css
@font-face {
  font-family: "Font Name";
  src: url("/fonts/<slug>/FontName-Regular.otf") format("opentype");
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "Font Name";
  src: url("/fonts/<slug>/FontName-Bold.otf") format("opentype");
  font-weight: 700;
  font-display: swap;
}
```

Format map: `.otf` → `opentype`, `.ttf` → `truetype`, `.woff2` → `woff2`.
For variable fonts: `font-weight: 100 900;` in a single declaration.

## Step 4: Font Metadata Constants

Create `src/lib/fonts.ts`:

```typescript
export type FontCategory = "system" | "primary" | "collection";

export type FontEntry = {
  slug: string;
  label: string;
  cssFamily: string;
  category: FontCategory;
  mono?: boolean;
};

export const FONT_FAMILIES: FontEntry[] = [
  { slug: "default", label: "Default", cssFamily: "var(--font-geist-sans)", category: "system" },
  // Add entries here...
];

export const DEFAULT_FONT_SLUG = "default";

export const CATEGORY_LABELS: Record<FontCategory, string> = {
  system: "System",
  primary: "Primary",
  collection: "Collection",
};

export function getFontBySlug(slug: string): FontEntry | undefined {
  return FONT_FAMILIES.find((f) => f.slug === slug);
}

export function getRandomFont(): FontEntry {
  return FONT_FAMILIES[Math.floor(Math.random() * FONT_FAMILIES.length)];
}

export function buildFontStack(entry: FontEntry): string {
  const fallback = entry.mono ? "ui-monospace, monospace" : "ui-sans-serif, system-ui, sans-serif";
  return `${entry.cssFamily}, ${fallback}`;
}
```

## Step 5: FontProvider Context

Create `src/contexts/FontContext.tsx`:

Key behaviors:
- Read stored slug from `localStorage` on mount
- Apply font by setting `--font-active` CSS property on `document.documentElement`
- Expose `current`, `setFont(slug)`, and `randomize()` via context
- Wrap children, no re-render on font change (CSS-only update)

## Step 6: FontSelector Component

Create `src/components/FontSelector.tsx`:

Key behaviors:
- Fixed position bottom-right (`fixed bottom-4 right-4 z-50`)
- Hidden on mobile (`hidden lg:block`)
- Fixed-width button (`w-48`) to prevent layout shift
- Dropdown grouped by category with section headers
- Each option renders its label in its own typeface (`style={{ fontFamily }}`)
- Active font has a checkmark
- Random button at top of panel
- Click-outside and Escape to dismiss

## Step 7: Wire Into Layout

```tsx
import "./fonts.css";
// In layout.tsx, wrap body content:
<FontProvider>
  {/* existing layout */}
  <FontSelector />
</FontProvider>
```

Update `globals.css`:
```css
--font-sans: var(--font-active, var(--font-geist-sans)), ui-sans-serif, system-ui, sans-serif;
```

## Step 8: Cutover (When Font Is Chosen)

When the user picks a winner:

1. Register via `next/font/local` with all weights + `preload: true`
2. Add the CSS variable to `<html>` className
3. Update `--font-sans` / `--font-display` / `--font-headline` in globals.css
4. Demote old default to `preload: false`
5. Remove FontProvider + FontSelector from layout (keep files for future use)

## Module Resolution Gotcha

If the project already has `lib/fonts.ts`, do NOT create `lib/fonts/index.ts` —
TypeScript resolves the bare file over the directory. Merge your exports into the
existing file instead.
