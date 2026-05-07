---
name: vercel-react-best-practices
description: React and Next.js performance optimization with 69 prioritized rules across 8 categories. Use when writing React components, implementing data fetching, reviewing code for performance, refactoring React/Next.js code, optimizing bundle size, or when the user says "React performance", "optimize React", "Next.js best practices", "bundle size", or "waterfall." Based on vercel-labs/agent-skills (291K weekly installs).
---

# Vercel React Best Practices

Performance optimization guide for React and Next.js, maintained by Vercel. 69 rules across 8 categories, prioritized by impact.

## When to Apply

- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size or load times

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|---|---|---|---|
| 1 | Eliminating Waterfalls | CRITICAL | async- |
| 2 | Bundle Size Optimization | CRITICAL | bundle- |
| 3 | Server-Side Performance | HIGH | server- |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | client- |
| 5 | Re-render Optimization | MEDIUM | rerender- |
| 6 | Rendering Performance | MEDIUM | rendering- |
| 7 | JavaScript Performance | LOW-MEDIUM | js- |
| 8 | Advanced Patterns | LOW | advanced- |

## 1. Eliminating Waterfalls (CRITICAL)

- `async-cheap-condition-before-await` — Check cheap sync conditions before awaiting flags or remote values
- `async-defer-await` — Move await into branches where actually used
- `async-parallel` — Use Promise.all() for independent operations
- `async-dependencies` — Use better-all for partial dependencies
- `async-api-routes` — Start promises early, await late in API routes
- `async-suspense-boundaries` — Use Suspense to stream content

## 2. Bundle Size Optimization (CRITICAL)

- `bundle-barrel-imports` — Import directly, avoid barrel files
- `bundle-dynamic-imports` — Use next/dynamic for heavy components
- `bundle-defer-third-party` — Load analytics/logging after hydration
- `bundle-conditional` — Load modules only when feature is activated
- `bundle-preload` — Preload on hover/focus for perceived speed

## 3. Server-Side Performance (HIGH)

- `server-auth-actions` — Authenticate server actions like API routes
- `server-cache-react` — Use React.cache() for per-request deduplication
- `server-cache-lru` — Use LRU cache for cross-request caching
- `server-dedup-props` — Avoid duplicate serialization in RSC props
- `server-hoist-static-io` — Hoist static I/O (fonts, logos) to module level
- `server-no-shared-module-state` — Avoid module-level mutable request state in RSC/SSR
- `server-serialization` — Minimize data passed to client components
- `server-parallel-fetching` — Restructure components to parallelize fetches
- `server-parallel-nested-fetching` — Chain nested fetches per item in Promise.all
- `server-after-nonblocking` — Use after() for non-blocking operations

## 4. Client-Side Data Fetching (MEDIUM-HIGH)

- `client-swr-dedup` — Use SWR for automatic request deduplication
- `client-event-listeners` — Deduplicate global event listeners
- `client-passive-event-listeners` — Use passive listeners for scroll
- `client-localstorage-schema` — Version and minimize localStorage data

## 5. Re-render Optimization (MEDIUM)

- `rerender-defer-reads` — Don't subscribe to state only used in callbacks
- `rerender-memo` — Extract expensive work into memoized components
- `rerender-memo-with-default-value` — Hoist default non-primitive props
- `rerender-dependencies` — Use primitive dependencies in effects
- `rerender-derived-state` — Subscribe to derived booleans, not raw values
- `rerender-derived-state-no-effect` — Derive state during render, not effects
- `rerender-functional-setstate` — Use functional setState for stable callbacks
- `rerender-lazy-state-init` — Pass function to useState for expensive values
- `rerender-simple-expression-in-memo` — Avoid memo for simple primitives
- `rerender-split-combined-hooks` — Split hooks with independent dependencies
- `rerender-move-effect-to-event` — Put interaction logic in event handlers
- `rerender-transitions` — Use startTransition for non-urgent updates
- `rerender-use-deferred-value` — Defer expensive renders to keep input responsive
- `rerender-use-ref-transient-values` — Use refs for transient frequent values
- `rerender-no-inline-components` — Don't define components inside components

## 6. Rendering Performance (MEDIUM)

- `rendering-animate-svg-wrapper` — Animate div wrapper, not SVG element
- `rendering-content-visibility` — Use content-visibility for long lists
- `rendering-hoist-jsx` — Extract static JSX outside components
- `rendering-svg-precision` — Reduce SVG coordinate precision
- `rendering-hydration-no-flicker` — Use inline script for client-only data
- `rendering-activity` — Use Activity component for show/hide
- `rendering-conditional-render` — Use ternary, not && for conditionals
- `rendering-usetransition-loading` — Prefer useTransition for loading state
- `rendering-resource-hints` — Use React DOM resource hints for preloading

## 7. JavaScript Performance (LOW-MEDIUM)

- `js-batch-dom-css` — Group CSS changes via classes or cssText
- `js-index-maps` — Build Map for repeated lookups
- `js-cache-property-access` — Cache object properties in loops
- `js-combine-iterations` — Combine filter/map into one loop
- `js-length-check-first` — Check array length before expensive comparison
- `js-early-exit` — Return early from functions
- `js-hoist-regexp` — Hoist RegExp creation outside loops
- `js-set-map-lookups` — Use Set/Map for O(1) lookups
- `js-flatmap-filter` — Use flatMap to map and filter in one pass
- `js-request-idle-callback` — Defer non-critical work to browser idle time

## 8. Advanced Patterns (LOW)

- `advanced-effect-event-deps` — Don't put useEffectEvent results in effect deps
- `advanced-event-handler-refs` — Store event handlers in refs
- `advanced-init-once` — Initialize app once per app load
- `advanced-use-latest` — useLatest for stable callback refs

## Related Skills

- `web-design-guidelines` — Vercel Web Interface Guidelines compliance
- `frontend-design` — Distinctive frontend aesthetics (Anthropic)
- `seo-geo-optimization` — AI search optimization for pages
