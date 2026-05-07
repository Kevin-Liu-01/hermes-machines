---
name: mintlify-mdx
description: "Mastering Mintlify's MDX pipeline — undocumented constraints, snippet sandbox rules, CSS override patterns, and npm bundling via yoink. Use when writing or debugging Mintlify snippets, customizing docs.json/styles.css, bundling npm packages into snippets, hitting cryptic MDX compile errors, or when the user says 'mintlify', 'snippet won't compile', 'MDX error', 'yoink', 'lint-snippets', 'docs.json', 'Mintlify CSS', 'function-body mode', 'baseUrl error', or 'findExport'. Reverse-engineered from Mintlify internals at Dedalus Labs."
---

# Mastering Mintlify

Mintlify is a Next.js App Router site that compiles MDX on the server, hydrates in the browser, and serves via Next. This skill covers the parts the docs don't — what the pipeline actually does, where the sandbox sharp edges are, and how to customize around them.

For content writing, read `writing/voice` and `writing/structure` in the docs repo. This skill is for engineers building custom components, integrations, or bundling npm packages.

## The Pipeline

```
.mdx file
  → remark parser (@mdx-js/mdx + acorn)
  → remarkMdxInjectSnippets         ← inlines /snippets/*.jsx ASTs
  → estree-util-to-js (findExport)  ← extracts one export at a time
  → next-mdx-remote-client/serialize (function-body mode)
  → Reflect.construct(SyncFunction, keys.concat(compiledSource))
  → component tree → SSR → hydrate
```

The critical detail: `findExport` extracts each `ExportNamedDeclaration` AST subtree **in isolation**. Sibling imports, sibling `const` declarations, sibling exports — all dropped from each export's scope.

## Hard Constraints (Memorize These)

### 1. Each named export is evaluated in isolation

Sibling declarations are invisible. This fails:

```jsx
// FAILS: "ReferenceError: __lib is not defined"
export const __lib = (() => { return { Terminal, useTerminal }; })();
export const Terminal = __lib.Terminal;        // __lib not in scope
export const useTerminal = __lib.useTerminal;  // nor here
```

Fix: one self-contained IIFE per export, even if it duplicates bytes.

```jsx
export const Terminal = (() => { /* full body */ return Terminal; })();
export const useTerminal = (() => { /* full body again */ return useTerminal; })();
```

### 2. `import` expressions are rejected

Function-body mode refuses ESM syntax needing module resolution: `import()`, `import.meta.url`, `export ... from`. Error:

> `Unexpected missing options.baseUrl needed to support "export … from", "import", or "import.meta.url" when generating "function-body"`

Fix: drop dynamic imports. Use plain `fetch()` instead of SDK imports.

### 3. Snippets cannot import other snippets

Mintlify inlines snippets by walking imports in the consuming `.mdx` file only — no recursive snippet-to-snippet resolution. If `a.jsx` imports from `b.jsx`, `b` will be undefined.

Fix: colocate dependent code in a single snippet file.

### 4. Only `react` / `react-dom` imports resolve

Any other npm specifier at module scope fails silently. To use third-party packages, bundle them via `scripts/yoink.ts`.

### 5. Non-exported module-level declarations get stripped

```jsx
const SHADOW = "...";  // ← disappears after processing
export const Drawer = () => <div style={{ boxShadow: SHADOW }} />;
// SHADOW is undefined at render
```

Fix: move constants inside the exported arrow, or export them too.

### 6. Arrow functions only at module scope

The `function` keyword is unsupported at snippet module scope. Arrow functions always work. Inside closures, both forms are fine.

### 7. Global `!important` font rules beat `docs.json`

`styles.css` sets `font-family: var(--font-sans) !important` on body/p/div/span/headings. Those out-specify the `fonts` block in `docs.json`. Components wanting a different font must re-declare with equal or higher specificity + `!important`.

## MDX Inline Acorn Restrictions

The MDX compiler's acorn subset for inline `export const` blocks in `.mdx` files is stricter than `.jsx` snippets. These fail in inline MDX:

- Nullish coalescing: `a ?? b` → use `a || b`
- Optional chaining with call: `fn?.()` → `if (fn) fn()`
- Array destructuring with rest: `[a, ...rest]` → `rest = arr.slice(1)`
- `.at(-1)` → `arr[arr.length - 1]`
- `import()` expressions
- `<word>` in strings parsed as JSX tags → use `[word]` or `{word}`

If acorn errors with "Could not parse expression," binary-search-comment from this list.

## CSS Override Principles

1. **Override Mintlify's Tailwind `rounded-*` globally** in `:root`, not per-component (the SHARP EDGES block).
2. **Use `!important` liberally.** Mintlify injects Tailwind utilities with inline styles that otherwise win.
3. **Scope counter-overrides by class specificity.** Beat `div { font-family: X !important }` with `.wterm, .wterm * { font-family: Y !important }`.
4. **Comment every override with its target.** Mark the Mintlify selector being fought.
5. **Brand palette as semantic tokens.** Never hardcode hex. Use `var(--color-amethyst)`, `var(--color-cloud)`, `var(--color-nyx)`.
6. **Tailwind arbitrary values don't JIT in Mintlify.** `grid-cols-[minmax(180px,max-content)_1fr]` silently breaks. Write plain CSS classes in `styles.css`.

## Snippet Lint Rules

Run `scripts/lint-snippets.ts` to catch sandbox violations before they hit runtime:

| Rule | Catches |
|---|---|
| `no-module-level-decl` | Non-exported `const`/`let`/`var`/`function`/`class` at module scope |
| `no-npm-imports` | Any `import` outside `react`, `react-dom`, `react/jsx-runtime` |
| `no-nested-imports` | Snippet importing from `/snippets/*.jsx` |
| `missing-hook-import` | `useState()` used without `import { useState } from "react"` |
| `no-exports` | File has no `export` at all |
| `dom-takeover` | `innerHTML = ""`, `replaceChildren()`, `outerHTML =` — flags libraries that hijack React-owned DOM |

```bash
node --experimental-strip-types apps/docs/scripts/lint-snippets.ts apps/docs/src/snippets
```

## Bundling npm Packages — yoink

For any package beyond `react`/`react-dom`, use yoink. It runs esbuild, strips non-export keywords, wraps each export in a self-contained IIFE.

```bash
node --experimental-strip-types apps/docs/scripts/yoink.ts <package> \
  --exports Foo,Bar --out src/snippets/foo.jsx
```

Constraints:
- Output must not contain `import()` — packages with dynamic imports will be rejected by Mintlify
- `react` and `react-dom` are externalized; other peer deps are bundled inline
- Anything over ~200KB is painful on first paint

## Patterns

### Client-only mount gate (DOM-takeover libraries)

Libraries calling `innerHTML = ""` or `replaceChildren()` on their React-owned host element need a client-only gate, or React 19's strict-mode double-mount collides with the DOM wipe.

```jsx
export const Wrap = (props) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="host-class" style={{ height: 300 }} />;
  return <div ref={containerRef} className="host-class" style={{ height: 300 }} />;
};
```

The `dom-takeover` lint rule warns when a yoinked snippet triggers this need.

### Fade-in hover underline

`text-decoration-line` is not animatable (discrete). `text-decoration-color` is. Pin the line to `underline`, start color transparent, transition color on hover:

```css
.dedalus-link {
  text-decoration-line: underline !important;
  text-decoration-color: transparent !important;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.25em;
  transition: text-decoration-color 200ms ease-out;
}
.dedalus-link:hover {
  text-decoration-color: var(--color-amethyst-deep) !important;
}
```

Generalization: any `discrete → continuous` property swap needs an animatable proxy (`display` → `opacity`, `visibility` → `opacity`, `text-decoration-line` → `text-decoration-color`).

### Authenticated SSE via fetch

`EventSource` doesn't support custom `Authorization` headers. Use `fetch()` with `Accept: text/event-stream` and manually read the body via `ReadableStream`. See `references/constraints.md` for the full implementation.

## Gotchas

| Gotcha | Cause | Workaround |
|---|---|---|
| "Invalid hook call" in `mint dev` stdout | Monorepo pins react@19.2.3, @mintlify/components pulls 19.2.4. CLI renderer loads both. | Ignore — browser rendering unaffected |
| Concurrent `mint dev` instances interfere | Both share `~/.mintlify/mint/apps/client/.next` cache | Run one at a time |
| `<id>` in JSX strings parsed as tag | MDX treats `<word>` as potential JSX everywhere | Use `[id]`, `{id}`, or escape |
| CORS failures on DCS shell | `dcs.dedaluslabs.ai` missing `Access-Control-Allow-Origin` | Fix at ingress (Terraform/ALB/CloudFront) |

## Deployment Layout

```
apps/docs/          → docs.dedaluslabs.ai        (external, public)
docs/               → docs-internal.dedaluslabs.ai (this site, internal)
```

Both run Mintlify's Sequoia theme. Config in each tree's `src/docs.json`. Custom CSS in `src/styles.css`. Snippets in `src/snippets/*.jsx`. Keep stylesheets in sync when touching brand-level CSS.

## Commands

```bash
# dev servers (run ONE at a time — shared .next cache)
pnpm dev docs              # apps/docs → port 3001
pnpm dev docs --internal   # docs/     → port 3002

# build
pnpm -C apps/docs build
pnpm -C docs build

# bundle npm package into snippet
cd apps/docs
node --experimental-strip-types scripts/yoink.ts <package> \
  --exports Foo,Bar --out src/snippets/foo.jsx

# lint all snippets
node --experimental-strip-types scripts/lint-snippets.ts src/snippets

# broken link + a11y checks
pnpm -C apps/docs lint
```

## When to Extend This Skill

When you hit a new Mintlify constraint, add it with:
1. The symptom (exact error text)
2. The cause (what Mintlify actually does)
3. The fix (minimal working pattern)
4. Primary-source reference (commit hash, file path, or Mintlify doc URL)

## Related Skills

- `vercel-react-best-practices` — React/Next.js performance patterns (Mintlify is Next.js under the hood)
- `frontend-design` — Distinctive frontend aesthetics for docs components
- `seo-audit` — Technical SEO for the docs sites
