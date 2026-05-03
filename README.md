# ATTA Logical — Site

Portfolio site for Boelie van Camp (software developer, musician, visual artist).
Built in Next.js (App Router). Deployed on Vercel.

---

## Running locally

```bash
npm run dev
```

Requires `.env.local` with:
```
GROQ_API_KEY=...   # free key at https://console.groq.com/keys
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — hero, chip search, extended work/contact sections |
| `/catalogue` | Full project index with bottom info bar |
| `/subscriptions` | Service tiers / pricing cards |

---

## What's been built

### AI Chip Search System
The search bar on the homepage resolves typed queries into floating "chips" that navigate to parts of the site.

**Two-tier resolution:**
1. **Instant keyword resolver** (`src/lib/chipResolver.ts`) — exact-match only against CKORE and Laugical keyword lists. Returns immediately, no API call.
2. **AI fallback** (`src/app/api/resolve-chip/route.ts`) — any query that misses the keyword list gets sent to Groq (`llama-3.1-8b-instant`). The AI freely invents a short label but routes to one of four fixed destinations:
   - `section:work` — work experience / CV section on homepage
   - `section:contact` — contact section on homepage
   - `href:/subscriptions#plans` — subscriptions pricing cards
   - `href:/catalogue` — full project catalogue

**Label voice:** terse, technical, editorial — concept nodes not menu items. Examples: "Build Index", "Rate Card", "Open Channel", "Stack". The AI is instructed never to use "ATTA Logical" in a label; queries about the brand itself produce "Logical".

**Route normalization:** AI output is lowercased and whitespace-stripped before matching against the valid routes list, so minor model drift (spaces, casing) doesn't silently produce null.

**Chip display limits:**
- Desktop: max 3 chips on screen. A 4th entry evicts the oldest.
- Mobile: max 1 chip.
- Implemented via `isMobileRef` inside `pushChip` — ref stays in sync with the `isMobile` state via `useEffect`.

**Chip orbital positioning:** each chip floats at a point on an ellipse orbit around the search glass. CKORE/Laugical have fixed angular phases (`CHIP_PHASES`). AI-generated chips use a deterministic hash (`labelPhase(label)`) so the same label always lands at the same position.

**Edge cases handled:**
- Bad words → `isBadWord` guard fires first, chip resolution is skipped, "seriously?" messages appear
- Repeated bad words (≥9) → `showYoureDone` state
- Duplicate label → chip is not re-added if already active
- After 6s with search open → auto-nudges "logical" to seed the first chip

---

### Page Transition System
Blur + fade on every route change. Targets a `#page-blur-layer` wrapper div (not `<body>`) to avoid CSS filter creating a stacking context that breaks `position: fixed` children.

**Architecture:**
- `src/app/layout.tsx` wraps `{children}` in `<div id="page-blur-layer">`
- `src/app/PageTransition.tsx` — listens to `routeChangeStart` / `routeChangeComplete`, applies `filter: blur(12px); opacity: 0` on exit and clears it on entry
- `src/hooks/useTransitionRouter.ts` — programmatic navigation: dispatches `page:leaving` event, triggers the blur-out on the layer, then calls `router.push` after 420ms

**Custom event `page:leaving`:** dispatched by both `PageTransition` and `useTransitionRouter` before blur starts. Used by components that need to react to an imminent navigation (e.g. the catalogue bar).

---

### Catalogue Info Bar
Bottom bar on `/catalogue` with links, names, and info. Animates independently of the page blur.

- **Entry:** spring animation (`stiffness: 28, damping: 9, mass: 1.4, delay: 0.28`) — slides up from off-screen with a bouncy feel
- **Exit:** triggered by `page:leaving` event — `leaving` state set, bar slides down (`duration: 0.38, ease: [0.4, 0, 1, 1]`)
- **Portalled to `document.body`** via `createPortal` — the bar lives outside `#page-blur-layer` so the page's opacity fade doesn't hide it during exit
- `mounted` state prevents SSR portal errors

---

### Homepage Extended Sections
The homepage has a collapsed "hero-only" state and an extended state that reveals the Work and Contact sections below.

- `showExtended` state controls height/overflow of the main container
- `scrollToWork` / `scrollToContact` flags trigger smooth scroll to the relevant section after expansion
- Work section uses `layoutId` for project card shared-element transitions to the catalogue page
- Text-engine (TE) parallax effects on the extended sections — disabled on mobile to prevent layout issues

---

### `useIsMobile`
`src/hooks/useIsMobile.ts` — uses `useLayoutEffect` (not `useEffect`) so the value is set before first paint and no layout shift occurs on initial render.

---

### Subscriptions Page
`/subscriptions` — pricing tiers. The `#plans` anchor is on the `<section className="sub-plate-wrap">` element. Navigating to `/subscriptions#plans` (e.g. from an AI chip) scrolls directly to the cards via `requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView(...))`.

---

## Key files

| File | Purpose |
|---|---|
| `src/app/page.tsx` | Homepage — chip system, hero, extended sections |
| `src/app/catalogue/page.tsx` | Project index + animated info bar |
| `src/app/subscriptions/page.tsx` | Service tiers / pricing |
| `src/app/layout.tsx` | Root layout — `#page-blur-layer`, providers |
| `src/app/PageTransition.tsx` | Route change blur/fade handler |
| `src/app/api/resolve-chip/route.ts` | Groq AI chip resolver API route |
| `src/lib/chipResolver.ts` | Instant keyword resolver (CKORE, Laugical) |
| `src/hooks/useTransitionRouter.ts` | Programmatic navigation with blur trigger |
| `src/hooks/useIsMobile.ts` | SSR-safe viewport breakpoint hook |

---

## Planned / in progress

- **Language toggle (NL/EN)** — toggle exists in UI, some strings are translated, but the full toggle flow needs fixing
- **AI chip label quality** — ongoing tuning; current system prompt pushes for terse/technical labels but real-world output still needs monitoring
- **Further page/section work** — TBD based on content updates
