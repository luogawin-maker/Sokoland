# HarvestWire — Frontend

A high-performance, SEO-optimized frontend for a global agribusiness & food tech publication, built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Framer Motion.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build && npm run start   # production build
```

## Design tokens

| Token | Hex | Use |
|---|---|---|
| `forest-900` | `#0F2E1E` | Primary brand, headers, hero overlays |
| `cream` | `#FAF9F6` | Page background |
| `ink` | `#1A1D1B` | Body text |
| `sage` | `#4A6B57` | Secondary text, meta labels |
| `gold` | `#C89B3C` | Accent — market data, CTAs |

Fonts: **Fraunces** (display/serif, editorial headlines), **Inter** (body/UI), **IBM Plex Mono** (market data, eyebrows, timestamps) — loaded via `next/font/google` with `display: swap`.

## Signature element

The **market ticker** (`components/MarketTicker.tsx`) is a persistent strip above the header showing live-style commodity prices in monospace type. It's the visual thesis of the whole site: an agribusiness publication that treats markets as the connective tissue between farming, technology, and investment. It's a pure-CSS marquee (pauses on hover, respects `prefers-reduced-motion`), so it costs nothing on the main thread.

## Architecture

- **`app/page.tsx`** — Homepage. Hero grid (lead story + "Trending in AgTech" sidebar) followed by four categorized, infinite-scrolling sector feeds. Set to `revalidate = 60` (ISR).
- **`app/article/[slug]/page.tsx`** — Article template with `generateStaticParams` (SSG at build, ISR after), reading progress bar, author bio, related stories, and inline newsletter block.
- **`app/resources/page.tsx`** — Resource Center: commodity price table + filterable white papers / policy briefings / market reports.
- **`app/api/articles/route.ts`** — Backs the infinite-scroll feed (`CategoryFeed.tsx`), paginated by sector.
- **`lib/data.ts`** — Mock content layer standing in for a headless CMS/API. Swap these functions for real fetch calls (e.g. to Contentful, Sanity, or a custom API) without touching any component — every page already awaits these functions server-side.

## Performance & Core Web Vitals

- **LCP**: Hero and article hero images use `next/image` with `priority` and explicit `sizes`; fonts use `display: swap`.
- **CLS**: All images render inside `aspect-*` containers with `fill`, so layout never shifts on load. No client-fetched above-the-fold content.
- **FID/INP**: Only genuinely interactive pieces (`MobileNav`, `CategoryFeed`, `ReadingProgress`, `NewsletterInline`, `ResourceFilters`) are Client Components — everything else renders on the server with zero hydration cost.
- **ISR**: Homepage, article pages, and the Resource Center all revalidate every 60 seconds, so a CDN can serve cached HTML while content stays fresh.

## Accessibility

Skip link, visible focus rings (`focus-ring` utility), semantic landmarks, `aria-label`/`aria-expanded` on the mobile nav, and a `prefers-reduced-motion` override in `globals.css` that disables the ticker marquee and other animation for users who ask for it.

## Swapping in real content

Replace the functions in `lib/data.ts` with calls to your CMS or API (keep the same return shapes and `types/index.ts` interfaces) and every page, the sitemap, and the infinite-scroll API route pick up real data automatically.
