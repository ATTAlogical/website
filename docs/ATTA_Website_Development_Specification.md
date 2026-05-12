# ATTA Website Development Specification
**Project Management Document**
*Version 2.5 — May 2026*

---

## 1. PROJECT OVERVIEW

### 1.1 Vision Statement
Create a temporal, living website ecosystem that embodies the ATTA brand philosophy: organic evolution within consistent architectural DNA. The site must prove technical competence while maintaining artistic integrity through innovative interaction design.

### 1.2 Core Principles
- **Biological Blueprint Concept**: All variants share fundamental DNA but express differently
- **Temporal Evolution**: Site changes gradually throughout 3-day cycles
- **Seamless Transitions**: Navigation maintains visual continuity
- **Progressive Disclosure**: Content surfaces organically through search-driven discovery
- **Sterile Precision**: Technical competence proven through flawless execution

---

## 2. BRAND ARCHITECTURE

### 2.1 Brand Hierarchy
```
ATTA (Parent Brand)
├── atta logical (Business/Technical)
├── ATTA Laugical (Artistic/Creative)
└── ATTA.CKORE (Music)
```

### 2.2 Brand Definitions

#### **atta logical**
- **Purpose**: Business presence, client acquisition, technical credibility
- **Aesthetic**: Sterile, surgical, minimalist with glass reflections
- **Audience**: Potential clients, business prospects, professional network
- **Tone**: Clean, professional, competent, restraint over expression

#### **ATTA Laugical**
- **Purpose**: Artistic expression, creative showcase, personal vision
- **Aesthetic**: Experimental, fluid, upbeat but sophisticated (not Frutiger Aero)
- **Audience**: Creative peers, art enthusiasts, like-minded individuals
- **Tone**: Expressive, innovative, unapologetic vision
- **Loading Philosophy**: First visit = full experience (up to 30s), progressive optimization for return visits

#### **ATTA.CKORE**
- **Purpose**: Music catalog, releases, creative audio work
- **Aesthetic**: TBD (shares DNA with other branches)
- **Audience**: Music listeners, industry contacts, collaborators
- **Tone**: TBD

---

## 3. TECHNICAL ARCHITECTURE

### 3.1 Technology Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Animation**: Motion (`motion/react`) — layout animations, scroll-linked effects, SVG draw-in
- **Styling**: Tailwind CSS + Custom CSS (`globals.css`) for advanced effects
- **Typography**: Playfair Display (Google Fonts) via `next/font/google`
- **Hosting**: Vercel
- **Database**: Neon Postgres (serverless) accessed via Prisma ORM. Schema in `prisma/schema.prisma`; client singleton in `src/lib/db.ts`.
- **Auth (admin)**: bcryptjs for password hashing + jose for HS256 JWT cookies. Single-user. See §3.10.
- **Payments**: Stripe Checkout (hosted). Server-authoritative pricing — never trusts the client. See §3.9.
- **Email**: Resend (transactional). Contact form + order confirmations.
- **AI**: Groq (`llama-3.1-8b-instant`) for chip resolution + open.spotify.com/oembed for music metadata.
- **Data**:
  - `src/data/projects.ts` — shared type + data file, no "use client", works in both Server and Client Components.
  - `src/data/log.ts` — seed data for `LogEntry` rows. After first `db:seed`, Neon is the source of truth.
  - `src/data/store.ts` — `STORE_PRODUCTS` and product types (still file-backed; admin pages for store land in Phase 5).

### 3.2 Temporal Evolution Engine

**Cycle**: 3 days (`HOURS24 = 3 * 24 * 60 * 60 * 1000`). Updated from original 24h design.

**Implementation**: Single `requestAnimationFrame` loop with frame throttle (SKIP=30 at normal speed, ~2fps effective). All TE DOM updates are direct `.style` mutations — zero React re-renders during animation.

```typescript
// src/hooks/useTemporalEvolution.ts
export const HOURS24 = 3 * 24 * 60 * 60 * 1000;
export const TE_SPEED = 1; // multiplier — set >1 for testing (e.g. 1440 = full cycle in ~60s)

export function teAngleNow(): number {
  return ((Date.now() * TE_SPEED) % HOURS24) / HOURS24 * 2 * Math.PI;
}

export function teValuesAt(angle: number): TemporalValues {
  return {
    angle,
    offsetX: Math.sin(angle) * 40,
    offsetY: Math.cos(angle) * 28,
    letterSpacing: Math.sin(angle) * 0.02 + 0.02,
    fontWeight: 400 + Math.sin(angle) * 40 + 40,
    scale: 1 + Math.sin(angle) * 0.06,
    reflectionIntensity: 0.5 + Math.sin(angle) * 0.2,
  };
}
```

**Elements animated** (all via direct DOM `.style`):
- Title container: `translate` + `scale`
- Title `<h1>`: `letterSpacing`, `fontWeight`
- Reflection div: `letterSpacing`, `fontWeight`
- Work section: `translate` (offset phase)
- Contact heading wrapper: `translate` (offset phase)
- Contact links: `translate` (offset phase)
- Bio block: `translate` (offset phase)
- Projects section: `translate` (offset phase)
- Chips: `translate` (orbit position, every frame)

**Performance decisions**:
- Removed `setInterval`-based state updates (was causing ~10 React re-renders/sec)
- Removed `backdrop-filter: blur()` from body and glass pane (GPU compositing cost)
- Removed `filter: blur()` from ambient blobs (replaced with pure radial-gradients)
- `useMemo` for initial TE values on mount; rAF handles all subsequent updates

### 3.3 Search-Driven Navigation

- **Entry**: Search bar appears after 9–12s (random) or on focus; 2.5s fade-in
- **Placeholder**: Typed out character-by-character (55ms/char), fades on focus
- **Language switching**: Typing "dutch"/"nl"/"nederlands" switches to NL; "english"/"en"/"engels" switches back
- **Chip system**: Keywords match to 4 categories (Laugical, CKORE, logic, Contact); matched chip orbits the glass pane on an ellipse driven by TE angle
- **"logic" chip**: Expands the page downward (Work Experience → Contact → Projects)
- **"Contact" chip**: After 3 clicks, auto-scrolls to contact section

#### Two-Tier Chip Resolution

**Tier 1 — Instant keyword resolver** (`src/lib/chipResolver.ts`): exact-match only against CKORE and Laugical keyword lists. Returns immediately, no API call.

**Tier 2 — AI fallback** (`src/app/api/resolve-chip/route.ts`): any query that misses the keyword list is sent to Groq (`llama-3.1-8b-instant`, `json_object` response format, `max_tokens: 80`). The AI freely invents a short label but routes to one of four fixed destinations:
- `section:work` — work experience / CV section
- `section:contact` — contact section
- `href:/subscriptions#plans` — subscriptions pricing cards
- `href:/catalogue` — full project catalogue

**Label voice**: terse, technical, editorial — concept nodes not menu items (e.g. "Build Index", "Rate Card", "Open Channel", "Stack"). The AI is instructed never to use "ATTA Logical" in a label; brand queries produce "Logical".

**Route normalization**: AI output is lowercased and all whitespace stripped before matching against `VALID_ROUTES`, so minor model drift (spaces, casing) doesn't silently produce a null chip. `max_tokens: 80` prevents JSON truncation on longer routes.

**Display limits**:
- Desktop: max 3 chips on screen — a 4th evicts the oldest
- Mobile: max 1 chip
- `isMobile` is read directly from the `pushChip` closure (not a ref), so the limit is always current at call time. Mobile chip render hard-caps to `.slice(-1)` as a safety net.

**Edge cases handled**:
- Bad words → `isBadWord` guard fires first, chip resolution skipped, "seriously?" messages shown
- Repeated bad words (≥9) → `showYoureDone` state
- Duplicate label → chip not re-added if already active
- After 6s with search open → auto-nudges "logical" to seed the first chip

### 3.4 Chip Orbit System

Each chip orbits the glass pane on a shared ellipse, spread by a fixed phase offset:

```typescript
const CHIP_PHASES = {
  Laugical: 0,
  CKORE:    Math.PI * 0.5,
  logic:    Math.PI,
  Contact:  Math.PI * 1.5,
};
```

AI-generated chips use a deterministic hash (`labelPhase(label)`) so the same label always lands at the same orbital position.

Chip position is updated every rAF frame (no throttle — chips must feel live). Chip SVG graphics use `motion.path` pathLength draw-in animations (Motion SVG animation API).

### 3.5 Project Cards & Popup

**Cards** (`ProjectCard` component):
- 3D perspective tilt driven by `useMotionValue` + `useSpring` + `useTransform`
- Cursor-tracked glare overlay via `useTransform([x, y], ...)`
- Motion `layoutId` for FLIP animation to expanded popup
- Drag-to-scroll row using Motion `drag="x"` with measured `dragConstraints`
- Overflow fix: `paddingTop: 40px` + `marginTop: -40px` on row container gives 3D-tilted cards headroom

**Expanded popup** (`ProjectExpanded` component):
- `AnimatePresence` wraps the overlay; backdrop blurs behind
- Single vertical column: full-width image → title → description → highlights → tags
- Image links to `/catalogue#[slug]`
- Close on Escape key or backdrop click
- Close button floats top-right as frosted glass pill
- **No `backdropFilter` on the FLIP element** — animating `blur(40px)` during a layoutId FLIP causes severe jank (filter composited every frame as element size changes). Solid background only; the backdrop overlay behind provides the blur.
- **Popup scroll fix**: outer `motion.div` has `display: flex; flex-direction: column`; inner scrollable div has `flex: 1; min-height: 0; overscroll-behavior: contain`. Without `min-height: 0`, a flex child cannot shrink below its content height, so `overflow-y: auto` never activates.

### 3.6 Catalogue System

**Route**: `/catalogue` (client component — overrides `overflow: hidden` from globals.css on mount)

**Layout**:
- Top nav: sticky frosted bar with `← ATTA logical` back link
- Per-project sections stacked vertically, each with `id={project.slug}` for anchor navigation
- Horizontal drag-scroll image row per section (Motion `drag="x"`)
- Fixed bottom info panel: project name, link, description, tags — updates with `AnimatePresence mode="wait"` as active project changes

**Info Bar** (fixed bottom panel):
- **Entry**: spring animation (`stiffness: 28, damping: 9, mass: 1.4, delay: 0.28`) — slides up from off-screen with a bouncy feel
- **Exit**: triggered by `page:leaving` event — `leaving` state set, bar slides down (`duration: 0.38, ease: [0.4, 0, 1, 1]`)
- **Portalled to `document.body`** via `createPortal` — lives outside `#page-blur-layer` so the page's opacity fade doesn't hide it during navigation exit
- `mounted` state prevents SSR portal errors

**Active project detection** (Motion scroll API):
```typescript
const { scrollYProgress: centerP } = useScroll({
  target: sectionRef,
  offset: ["start center", "end center"],
});
useMotionValueEvent(centerP, "change", (v) => {
  if (v >= 0 && v <= 1) onBecomeActive();
});
```
When a section straddles the viewport center, `scrollYProgress` is in `[0, 1]` — this triggers the bottom panel update.

**Section header entrance** (scroll-linked):
```typescript
const { scrollYProgress: entranceP } = useScroll({
  target: sectionRef,
  offset: ["start 0.92", "start 0.38"],
});
const headerY = useTransform(entranceP, [0, 1], [38, 0]);
const headerOpacity = useTransform(entranceP, [0, 0.6], [0, 1]);
```

**Image ordering**: `project.image` (thumbnail, filename contains "project") always leads the row; `project.images` (gallery) follow.

**Shadow fix**: Row container uses `paddingTop: 40px / marginTop: -40px` (drop shadow headroom) and `paddingBottom: 40px / marginBottom: -40px` (bottom shadow) to prevent `overflow: hidden` clipping.

**Floor reflections**: Each image row has a floor reflection below a specular glass-edge line. Implementation:
- Shared `dragX = useMotionValue(0)` drives both the main row and the reflection `motion.div` in sync — no listeners, no duplication
- Reflection `motion.div`: `scaleY: -1` (default `transformOrigin: center`) — keeps flipped content in the visible y-range
- Fade: `maskImage` gradient on the reflection container with alpha encoding opacity (`rgba(0,0,0,0.38)`) + fade to transparent
- **GPU compositing**: `will-change: transform` on the reflection container promotes it to a GPU compositing layer — `maskImage` then runs in the GPU compositor (no off-screen buffer, no software rasterization). Without this, `maskImage` requires a full software compositing pass every scroll frame.
- **`overflow: hidden` + GPU layer escape**: A child with `will-change: transform` can visually escape a parent's `overflow: hidden` boundary in some rendering paths. Adding `will-change: transform` to the parent establishes a compositing boundary that contains promoted children.
- Glass surface line: 1.5px specular highlight between images and reflection (`linear-gradient(90deg, ...)`)

**Optimizations** (catalogue-specific):
- `useCallback` for `onBecomeActive` in parent — previously an inline arrow function recreated every render, silently defeating `memo` on all `ProjectSection` instances whenever active project changed
- `onBecomeActive` signature changed to `(slug: string) => void` — stable reference passed to all sections
- `loading="lazy"` + `decoding="async"` on all images except first image of first section; reflection images always lazy

**Per-project pages**: `/projects/[slug]` — Server Component with `generateStaticParams`, kept for future use.

### 3.7 Page Transition System

Blur + fade on every route change. Targets a `#page-blur-layer` wrapper div (not `<body>`) to avoid CSS `filter` creating a stacking context that breaks `position: fixed` children.

- `src/app/layout.tsx` wraps `{children}` in `<div id="page-blur-layer">`
- `src/app/PageTransition.tsx` — listens to `routeChangeStart` / `routeChangeComplete`, applies `filter: blur(12px); opacity: 0` on exit and clears it on entry
- `src/hooks/useTransitionRouter.ts` — programmatic navigation: dispatches `page:leaving` event, triggers blur-out on the layer, then calls `router.push` after 420ms

**Custom event `page:leaving`**: dispatched before blur starts. Used by components that need to react to an imminent navigation (e.g. the catalogue info bar animates out on this event).

### 3.8 Contact Form

The contact form POSTs to `/api/contact` (`src/app/api/contact/route.ts`), which sends two emails via Resend. No email client required on the visitor's end.

**Two emails sent per submission (via `Promise.all`):**
1. **Inquiry** → `boelie@attalogical.com` — subject `Enquiry via ATTAlogical - {name}`, Reply-To set to sender's email so inbox reply goes directly to them
2. **Confirmation** → visitor's email — subject `Message received — ATTA Logical`, body: "Expect an answer within 1-3 business days"

Confirmation failure only logs; the request still returns `{ ok: true }` so the visitor isn't shown an error. Success message shown to visitor: `"Check your email for a confirmation."`

**Validation — both client and server** (`src/lib/validation.ts`):
| Field | Rules |
|---|---|
| Name | Required, ≤100 chars |
| Email | Required, ≤254 chars, must match `x@x.x` format |
| Message | Required, ≤2000 chars |
| All fields | ASCII control characters stripped |

**Rate limiting**: 3 submissions per IP per minute (server-side `Map`), 10s cooldown between submits (client-side throttle).

**Resend setup**:
- FROM: `ATTA Logical <noreply@attalogical.com>` — domain verified in Resend dashboard
- `RESEND_API_KEY` must be set in `.env.local` and Vercel Environment Variables

**Google Workspace MX records** (required for `boelie@attalogical.com` to receive email — added to Vercel DNS):
| Name | Type | Priority | Value |
|------|------|----------|-------|
| @ | MX | 1 | ASPMX.L.GOOGLE.COM |
| @ | MX | 5 | ALT1.ASPMX.L.GOOGLE.COM |
| @ | MX | 5 | ALT2.ASPMX.L.GOOGLE.COM |
| @ | MX | 10 | ALT3.ASPMX.L.GOOGLE.COM |
| @ | MX | 10 | ALT4.ASPMX.L.GOOGLE.COM |

The same form is present on `/subscriptions` — the selected tier is prepended to the message body before sending.

### 3.9 Laugical Store + Stripe Checkout

Route: `/laugical/store` — full storefront for designed objects.

**Product types** (3, with distinct visual densities in the listing):
| Type | Visual treatment | Fulfilment |
|---|---|---|
| `one-of-one` | Singular treatment, full presence, version record | One item only, qty forced to 1 |
| `made-to-order` | Medium presence, horizontal layout, fulfilment indicator | "ready" / "a few days" / "~a week" badges |
| `dropship` | Compact grid, scannable (stickers, prints) | In-stock quantity |

**Availability states**: `in-stock` · `made-to-order` · `sold` · `coming-soon`. Only the first two are buyable.

**Cart** (`src/context/LaugicalCart.tsx`):
- Persists to `localStorage` under `laugical-cart`.
- `MusicState` (`browse` / `accumulating` / `checkout` / `confirmed`) drives ambient audio cues. Auto-set from item count; explicit override on checkout + confirmation.
- Mounted via `LaugicalCartProvider` in `src/app/laugical/layout.tsx`. Available across all `/laugical/*` routes.

**Cart drawer** (`src/app/laugical/CartDrawer.tsx`):
- **Desktop**: slide-in from the right, 420px width.
- **Mobile**: bottom sheet with drag-handle, drag-to-dismiss (offset > 100px or velocity > 500). Decided by `useIsMobile()`.
- Quantity stepper per line (`−` decrements; at 0 removes), per-line remove link, subtotal, shipping note, checkout button.
- Locks body scroll, traps focus, closes on Escape.

**Checkout** (`src/app/api/checkout/route.ts`):
- Creates a Stripe Checkout Session.
- **Server-authoritative pricing**: looks up each line item by slug in `STORE_PRODUCTS`, never trusts client `price`. Rejects items not in `in-stock` / `made-to-order`. Forces `quantity: 1` on `one-of-one`.
- Stripe API version pinned: `2026-04-22.dahlia`.
- Shipping rates: €5.95 Netherlands, €12.95 international (18 EU/EEA + UK + US countries).
- Returns `{ url }`. Client redirects the browser to Stripe-hosted checkout.
- Rate-limited 8/min/IP.

**Success page**: `/laugical/store/success?session_id={CHECKOUT_SESSION_ID}` — clears cart, sets music state to `confirmed`.

**Cancel banner**: `?checkout=cancelled` on the store page renders a top banner ("checkout cancelled — your bag is still here"), then strips the query param from the URL via `history.replaceState`.

### 3.10 Admin / CMS (Phase 1)

A hidden, single-user admin lets Boelie edit log entries from the live site without redeploying.

**Hidden entrance** (homepage only):
1. Type `login` or `admin` in the homepage search bar and press Enter.
2. No chip surfaces. A flag `loginUnlocked` flips true.
3. The "ATTA" portion of the title becomes clickable (`cursor: pointer`, subtle hover halo).
4. Click → password modal (`src/app/LoginModal.tsx`).
5. POST `/api/auth/login` with the password. Bcrypt-compared against `ADMIN_PASSWORD_HASH`. Rate-limited 5 attempts / 5 minutes / IP.
6. On success: HS256-signed JWT in an HttpOnly `atta_auth` cookie (Secure in prod, SameSite=Lax, 7-day TTL). Redirects to `/admin`.

**Middleware** (`middleware.ts`): gates `/admin/*` and `/api/admin/*`. Pages without the cookie redirect to `/`; API returns 401 JSON.

**Admin routes**:
- `/admin` — overview with counts ("Log: N · Projects · Store" — last two are ghosted "phase 2 / phase 5").
- `/admin/log` — full CRUD table over `LogEntry`. Inline form with:
  - Date picker
  - **Brand selector** — fixed "ATTA" prefix + dropdown of `logical` / `Laugical` / `CKORE`
  - Type dropdown (`build` / `project` / `track` / `drop` / `note` / `milestone`)
  - Title, body (≤2000 chars), href, external checkbox
  - **CKORE-only**: Spotify URL field
  - Lineage chip-select (multi-select of other entry slugs — drives ATTLAS connections)

**Spotify integration** (CKORE entries with a `spotifyUrl`):
- On save, `/api/admin/log` server-fetches `https://open.spotify.com/oembed?url=...` and caches `title` + `thumbnail_url` (album art) on the row.
- Public, no auth required. Falls back to null silently if the URL isn't a valid Spotify URL.
- Surfaces on `/temporal` (see §3.11).

**Schema** (`prisma/schema.prisma`):
```prisma
model LogEntry {
  id            String   @id @default(cuid())
  slug          String   @unique
  date          DateTime @db.Date
  branch        String   // "atta" | "laugical" | "ckore"
  type          String   // build | project | track | drop | note | milestone
  title         String
  body          String?
  href          String?
  external      Boolean  @default(false)
  links         String[] // slugs this entry grows out of (Postgres array)
  spotifyUrl    String?
  spotifyTitle  String?
  spotifyThumb  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@index([branch])
  @@index([date])
}
```

**One-time setup tooling** (in `scripts/`):
- `npm run auth:set 'password'` — bcrypts + writes `ADMIN_PASSWORD_HASH` and a random `AUTH_SECRET` into `.env` and `.env.local` directly. Bulletproof against shell-quoting issues.
- `npm run auth:verify 'password'` — diagnostic. Reads the hash from `.env`, bcrypt-compares locally. Confirms hash integrity without involving the server.
- `npm run auth:hash 'password'` — prints both env-file format (single quotes, `\$`-escaped) and Vercel format (raw).
- `npm run db:push` — applies Prisma schema to Neon.
- `npm run db:seed` — idempotent upsert from `LOG_ENTRIES`.

**Dotenv `$` gotcha** (lesson learned): bcrypt hashes contain `$2b$12$...`. Next.js's `@next/env` runs `dotenv-expand`, which interpolates `$VAR` references **even inside single-quoted values**. A literal hash gets mangled (length 60 → ~44, prefix mismatched). Fix: write every `$` as `\$` in the `.env` file. `dotenv-expand` resolves `\$` to a literal `$`. The `auth:set` script does this automatically. Vercel stores env vars as raw strings (no interpolation), so paste hashes there unescaped.

### 3.11 Temporal Log — ATTLAS (desktop) + Card Deck (mobile)

Route: `/temporal` — a chronological + relational record of every entry in the ATTA universe.

**Server component**: `src/app/temporal/page.tsx` fetches all `LogEntry` rows from Prisma, serialises dates to YYYY-MM-DD strings, and passes them to a client component (`TemporalClient`) which chooses the right view per device.

**Floating masthead** (both views): three elements (`← ATTA logical`, "ATTLAS" / "the log" title, live timestamp) positioned `absolute` over the stage. Transparent, no border — does not consume layout space, so cursor moving down from the top hits a node directly.

**Desktop — ATTLAS** (`src/app/temporal/AtlasView.tsx`):
A force-directed organic graph rendered in SVG. Pure physics, no third-party graph lib.

- **Nodes**: one per `LogEntry`. Per-branch color (atta = slate, laug = warm ochre, ckore = cool blue) and per-type size weighting (milestones largest, notes smallest).
- **Edges**: one quadratic Bezier per `LogEntry.links[]` entry. Control point is mid-segment, perpendicular-offset by a slow sine wave so the curve breathes organically.
- **Physics** (custom in-file simulation, ~12 nodes so O(n²) is free):
  - Pairwise repulsion (REPULSION_K = 5200)
  - Spring attraction along edges (SPRING_K = 0.006, rest 150px). Same-branch edges pull 1.35× tighter so branches self-cluster.
  - Soft centering pull toward origin
  - Quadratic soft walls beyond ±480 × ±280 so nothing escapes the viewBox
  - Damping 0.88
  - Ambient drift: two-frequency sine field per node (independent seeds) so movement looks biological, never periodic.
- **Pre-settle**: 400 iterations run synchronously on mount before first paint, so the initial frame looks composed (not "exploded into place").
- **Render path**: direct DOM mutation via refs (`<g>` `transform` and `<path>` `d`), bypassing React re-renders. The rAF loop never goes through React state.
- **Hover-to-pause**: pointer over any node halts the physics + Bezier wobble. Implemented per-node (not stage-level) with a hover counter and 80ms resume timer so cursor transitions between adjacent nodes don't briefly resume. Pause is total — physics step is skipped and `t` does not advance, so the field resumes exactly where it left off.
- **Connection highlight**: hovering a node fades unconnected edges/nodes and brightens the neighborhood (the hovered slug and its `links` targets).
- **Detail panel**: click a node → side panel slides in from the right. Date, branch tag, title, body, CKORE Spotify embed (cover + title), optional `visit` link.

**Mobile — Card Deck** (`src/app/temporal/CardDeckView.tsx`):
A horizontal scroll-snap stack of month cards. Each card is one month; entries listed vertically inside.
- CSS `scroll-snap-type: x mandatory` + `scroll-snap-stop: always`.
- Pager dots at the bottom (tap = jump to that month). Current month label below the dots.
- CKORE entries with Spotify show the cover thumbnail + title inline below the entry title.

**MusicSidebar** (`src/app/temporal/MusicSidebar.tsx`):
- Desktop only, fixed bottom-left corner.
- Lists every CKORE entry with a Spotify URL — cover art + title + date, click opens Spotify in a new tab.
- Hidden on mobile (CardDeck shows the same data inline).

### 3.12 Mobile Broadsheet (homepage)

The mobile homepage hero is **not** a stripped-down desktop hero. Different format entirely:

- **Masthead**: small caps brand mark + live timestamp.
- **Lede**: large editorial title ("ATTA logical"), italic byline, pull-quote ("An ecosystem in three branches.").
- **Index**: typographic table of contents — five numbered routes (Laugical / CKORE / Catalogue / The Log / Contact). Tap routes or anchor-scrolls.
- **Bottom-fixed search dock**: thumb-zone search input with a gradient fade-over-content above. AI chip resolution surfaces as a single floating pill above the search input (replaces the orbital chip behavior on mobile).
- **Hint**: "type below to inquire. answers route inline."

Desktop hero (the planetarium of glass + orbital chips + reflection) is untouched. The mobile branch in `src/app/page.tsx` is gated on `isMobile`.

The sections below the hero (work, contact, projects, footer) use the existing responsive stacked layout — they're vertical-stacked by default and didn't need re-design.

---

## 4. VISUAL DESIGN SPECIFICATIONS

### 4.1 Shared DNA (All Brands)
- **Typography**: Playfair Display serif, sentence case only
- **Background**: White/near-white only — no color temperature shifts
- **Effects**: Glass surfaces with reflections and subtle transparency
- **Layout**: Symmetric and clean for atta logical; asymmetric and expressive for Laugical and CKORE
- **Motion**: Organic, sine-wave based animations

### 4.2 Brand-Specific Variations

#### **atta logical**
- **Text Treatment**: Glossy gradient — bright highlight band creating a shiny, polished look
- **Glass Effects**: Surgical precision — clear glass borders (see 4.3), no frosted blur on large surfaces
- **Color Temperature**: Cool/neutral only, never warm
- **Animation Intensity**: Subtle, professional

#### **ATTA Laugical**
- **Text Treatment**: More fluid reflections, artistic interpretation
- **Glass Effects**: Experimental, layered transparency
- **Color Temperature**: Cool/neutral
- **Animation Intensity**: More expressive movement

#### **ATTA.CKORE**
- **Text Treatment**: Chrome-like metallic gradient — multi-highlight silver/steel look
- **Glass Effects**: TBD
- **Color Temperature**: Cool/neutral

### 4.3 CSS Implementation

#### **Glossy text** (`.glossy-text` — atta logical title, section headings)
```css
background: linear-gradient(180deg, #000000 0%, #111111 40%, #666666 80%, #888888 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2)) drop-shadow(0 2px 6px rgba(255,255,255,0.5));
```
**Note**: `transform` and `-webkit-background-clip: text` cannot be on the same element (webkit rendering bug). Always wrap the glossy text in a parent that holds the transform.

#### **Chrome text** (ATTA.CKORE chip)
```css
background: linear-gradient(180deg, #111111 0%, #2a2a2a 30%, #909090 55%, #1a1a1a 72%, #3a3a3a 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

#### **Liquid glass image frame** (`.glass-image-frame` — all project images)
Works on both light and dark images. The double-layer border (white inner + dark outer ring) provides contrast on any background. Bevels and sheen overlay must be on `::before` (above the `<img>` element) since `inset` box-shadows on the wrapper itself render below content.

```css
.glass-image-frame {
  position: relative;
  overflow: hidden;
  transform: translateZ(0);
  border: 1.5px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 8px 36px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10);
}

/* Sits above the <img> — dark inner ring + four beveled edges + surface sheen */
.glass-image-frame::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(168deg,
    rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.04) 32%,
    transparent 55%, rgba(0,0,0,0.05) 100%);
  box-shadow:
    inset 0 0 0 1px rgba(0,0,0,0.13),   /* dark inner ring */
    inset 0  3px 0 rgba(255,255,255,0.85), /* top bevel bright */
    inset 0 -3px 0 rgba(0,0,0,0.20),       /* bottom bevel dark */
    inset  3px 0 0 rgba(255,255,255,0.28), /* left bevel bright */
    inset -3px 0 0 rgba(0,0,0,0.09);       /* right bevel dark */
  pointer-events: none;
  z-index: 2;
}

/* Top specular line — light catch on the glass rim */
.glass-image-frame::after {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg,
    transparent 0%, rgba(255,255,255,0.90) 10%,
    rgba(255,255,255,1) 50%, rgba(255,255,255,0.90) 90%, transparent 100%);
  pointer-events: none;
  z-index: 3;
}
```

**Applied to**: catalogue image rows (`/catalogue`), homepage project card thumbnails.

---

## 5. USER EXPERIENCE FLOWS

### 5.1 Landing Experience (atta logical) — Implemented
1. User arrives at attalogical.com
2. Sees temporal "ATTA logical" title drifting on glass background (3-day TE cycle)
3. After 9–12 seconds, search prompt fades in with typewriter animation
4. User searches a keyword → matching chip orbits the glass pane
5. **"logic" chip** → page extends, becomes scrollable: Work Experience → Contact → Projects
6. **"Contact" chip** (×3) → auto-scrolls to contact section
7. Contact email surfaces on landing after first Contact chip click

### 5.2 Projects Flow — Implemented
1. In extended page, project cards appear in horizontal drag-scroll row
2. Click card → popup expands with FLIP animation (Motion `layoutId`)
3. Popup: full-width image + title + description + highlights + tags
4. Click image or "view catalogue" → `/catalogue#[slug]`
5. Catalogue: horizontal image rows per project, bottom panel updates as you scroll

### 5.3 Contact Flow — Implemented
1. Contact email and "more →" button surface on landing after first Contact chip
2. "more →" button opens extended sections and scrolls to Contact
3. Contact section: name + email/instagram/github links (left) + bio + quote (right)

### 5.4 Language Toggle — Implemented
- Typing "dutch", "nl", or "nederlands" in search → full NL translation
- Typing "english", "en", or "engels" → back to EN
- All section headings, job descriptions, bio, and bullets are bilingual

### 5.5 Cross-Brand Navigation — Planned
1. "Laugical" chip → navigates to ATTA Laugical brand
2. "CKORE" chip → navigates to ATTA.CKORE brand
3. Each brand has its own search, aesthetic, and contact

---

## 6. CONTENT & INFORMATION ARCHITECTURE

### 6.1 Implemented Routes

#### `/` — Landing (atta logical)
- Hero: "ATTA logical" title + glass pane + orbiting chips + search bar
- Extended (on "logic" chip): Work Experience → Contact → Projects
- **Work Experience**: Fullstack Developer Intern @ Stichting Asha, Utrecht (Feb 2025–present)
  - AshaOS: Next.js/Node.js/GraphQL/PostgreSQL in Turborepo, AI helpdesk via Groq API
- **Contact**: Boelie van Camp — email, Instagram, GitHub + bio
- **Projects**: Drag-scroll card row with popup + catalogue link

#### `/catalogue` — Project Catalogue
- All projects listed as scrollable vertical sections
- Each section: title header (scroll-entrance animation) + horizontal drag-scroll image row
- Fixed bottom panel: active project info (updates with scroll)
- Anchor navigation: `/catalogue#[slug]` scrolls to that project

#### `/subscriptions` — Service Tiers / Pricing
- Pricing cards for four service tiers (I–IV), heights scale with tier level
- Contact form at bottom — POSTs to `/api/contact` with selected tier prepended to message
- `#plans` anchor on `<section className="sub-plate-wrap">` — navigating to `/subscriptions#plans` scrolls directly to the cards via `requestAnimationFrame`
- AI chip `href:/subscriptions#plans` routes here from homepage search

#### `/projects/[slug]` — Per-Project Page (future use)
- Static generation via `generateStaticParams`
- Server Component — no event handlers (CSS classes for hover)
- Masonry image gallery, highlights grid

#### `/temporal` — The Log / ATTLAS
- Async server component reading from Neon via Prisma.
- Desktop: force-directed organic graph (ATTLAS) — see §3.11.
- Mobile: horizontal scroll-snap card deck, one card per month.
- CKORE entries with a Spotify URL surface cover art + title (Atlas detail panel, MusicSidebar on desktop, inline on mobile).

#### `/laugical/store` — Storefront
- Three-tier product layout: one-of-one · made-to-order · dropship. See §3.9.
- Cart drawer (slide-in desktop, bottom-sheet mobile).
- Stripe Checkout (hosted, server-authoritative pricing).
- `/laugical/store/success` — order confirmation, clears cart.

#### `/admin` — Admin overview (gated)
- Overview cards: log count + ghosted phase-2/5 placeholders.
- Hidden entrance from homepage (`login` search → click ATTA → password modal). See §3.10.

#### `/admin/log` — Log CRUD (gated)
- Table of every `LogEntry`, inline edit / create / delete form.
- Brand compound dropdown ("ATTA" + `logical` / `Laugical` / `CKORE`), type dropdown, lineage chip-select.
- CKORE entries: Spotify URL field (server fetches oEmbed metadata on save).

### 6.3 API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/contact` | POST | Resend email (inquiry + confirmation). Rate-limited 3/min/IP. |
| `/api/resolve-chip` | POST | Tier-2 AI chip resolver. Routes to one of 5 destinations (work, contact, subscriptions, catalogue, laugical/store). |
| `/api/checkout` | POST | Creates Stripe Checkout Session. Server-authoritative pricing. |
| `/api/auth/login` | POST | Bcrypt-compares password, signs JWT cookie. Rate-limited 5/5min/IP. |
| `/api/auth/logout` | POST | Clears the auth cookie. |
| `/api/admin/log` | GET / POST | List / create log entries. Gated by middleware. |
| `/api/admin/log/[id]` | PUT / DELETE | Update / delete a log entry. Gated. |

### 6.2 Project Data (`src/data/projects.ts`)

| Slug | Title | Subtitle | Has Images |
|------|-------|----------|------------|
| `ashaos` | AshaOS | Stichting Asha — Utrecht | ✅ 6 images |
| `atta-logical` | ATTA logical | Personal | ✅ 1 image (thumbnail only) |
| `follow-ai` | Follow-AI | follow-ai.nl | ✅ 4 images |

Image naming convention:
- `*-project.png` → card thumbnail + first in catalogue row
- `*-1.png`, `*-3.png`, etc. → catalogue gallery (gaps in numbering are fine)
- All images in `public/img/`

### 6.3 Planned Routes
- `/` extended → already covers CV/portfolio
- Future brand routes: Laugical, CKORE (separate subdomains or routes TBD)

---

## 7. DEVELOPMENT PHASES

### Status at a Glance

| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation | ✅ COMPLETE |
| 2 | Content Integration + Mobile | ✅ COMPLETE |
| 3 | Brand Expansion (Laugical + CKORE) | 🔄 IN PROGRESS — Laugical store live; CKORE music platform pending |
| 4 | Refinement | 🔄 IN PROGRESS — copy review pending |
| 5 | Admin / CMS | 🔄 IN PROGRESS — log CRUD live; projects + store CRUD pending |

---

### 7.1 Phase 1: Foundation ✅ COMPLETE
- Temporal evolution engine (3-day sine wave, single rAF loop)
- Glass effects + reflections
- Search bar with typewriter placeholder
- Floating chip system with SVG path-draw animations
- atta logical landing page

### 7.2 Phase 2: Content Integration + Mobile ✅ COMPLETE

#### Core
- Work Experience section (Stichting Asha)
- Contact section with bio
- Projects section — drag-to-scroll cards, 3D tilt, FLIP popup
- Bilingual support (EN / NL)
- Performance optimization (removed setInterval, backdrop-filter, filter:blur)
- Project data file (`src/data/projects.ts`) — AshaOS, ATTA logical, Follow-AI
- Catalogue page (`/catalogue`) with Motion scroll detection + bottom panel
- Liquid glass image frame CSS (works on light and dark images)
- Floor reflections on catalogue rows with glass surface specular line
- Popup scroll fixed + FLIP animation de-lagged
- Catalogue performance: stable `useCallback` refs, lazy image loading, GPU-composited maskImage
- Per-project pages (`/projects/[slug]`) stubbed for future use
- Vercel Analytics wired up (`@vercel/analytics/next` in root layout)

#### Mobile
- `useIsMobile` hook (`src/hooks/useIsMobile.ts`) — uses `matchMedia`, fires only on breakpoint crosses, desktop-first init (no SSR mismatch)
- `viewport-fit=cover` meta tag in layout — enables `env(safe-area-inset-*)` on iPhone
- **Catalogue**: images `83vw` wide (immersive, single-image-per-screen feel with peek of next); compact bottom panel (title + 2 tags + link in one row); `touchAction: pan-y` on drag row; safe-area-inset padding on bottom panel
- **Homepage popup**: native bottom sheet (`92dvh`, `border-radius: 20px 20px 0 0`); spring slide-up; drag handle; swipe-down to dismiss (velocity >400 or offset >120px); `layoutId` disabled on mobile card (no orphaned FLIP)
- **Homepage extended sections**: stacked single column; reduced padding (`12vw 6vw`); contact columns stack vertically; bio block full-width
- `PopupContent` extracted as shared component — used by both desktop FLIP popup and mobile bottom sheet

### 7.3 Phase 3: Brand Expansion 🔄 IN PROGRESS

- **Complete**:
  - ~~Laugical store~~ — `/laugical/store` live with three product types, cart, Stripe checkout, success page. See §3.9.
  - ~~Cross-brand chip routing~~ — AI resolver knows `href:/laugical/store`; static resolver routes "Store" / "shop" / "merch" instantly. CKORE button in mobile broadsheet links to `/temporal`.
- **Remaining (blocked on mockups)**:
  - Laugical brand surface beyond the store (own search, own contact, progressive loading)
  - CKORE music platform — releases, shop, listen interface
  - Real product images for the Laugical store catalogue (currently shipping with placeholder products)

### 7.4 Phase 4: Refinement 🔄 IN PROGRESS
**Status**: Site is live. Remaining items below.

- **Remaining**:
  - Copy review — all body text, bio, job descriptions
  - Advanced temporal variations (per-brand TE expressions)
- **Complete**:
  - ~~Mobile responsiveness~~ — done in Phase 2
  - ~~Analytics implementation~~ — Vercel Analytics live
  - ~~Domain + Vercel config~~ — site is live at attalogical.com
  - ~~Contact form~~ — server-side via Resend; visitor confirmation email; Google Workspace MX records in Vercel DNS
  - ~~Page transition system~~ — blur/fade on all route changes via `#page-blur-layer` + `page:leaving` event
  - ~~Subscriptions page~~ — pricing tiers with contact form wired to `/api/contact`
  - ~~AI chip system~~ — two-tier resolver (instant keyword + Groq fallback), route normalization, desktop 3 / mobile 1 chip limits
  - ~~Mobile broadsheet hero~~ — see §3.12. Replaced "rearranged desktop" mobile hero with editorial single-column.
  - ~~Brand capitalization sweep~~ — ATTA always caps, logical always lower, Laugical always cap-L.
  - ~~Catalogue info bar size animation~~ — `motion.div` `layout` wrapper smoothly resizes when active project changes (different description / tag count).
  - ~~ATTLAS hover-pause~~ — pauses on node hover (not stage), with 80ms resume timer so adjacent-node transitions stay paused. Removed milestone CSS pulse that was causing visual drift while edges stayed put.

### 7.5 Phase 5: Admin / CMS 🔄 IN PROGRESS

- **Complete**:
  - ~~Hidden login flow~~ — homepage search "login" → click ATTA → password modal → JWT cookie → `/admin`. See §3.10.
  - ~~Neon Postgres + Prisma~~ — `LogEntry` model, seed script, idempotent upsert.
  - ~~`/admin/log` full CRUD~~ — add / edit / delete entries from the live site. Brand compound dropdown, type dropdown, lineage chip-select, CKORE Spotify field.
  - ~~Spotify oEmbed~~ — server-side cache of `spotifyTitle` + `spotifyThumb` per CKORE entry. Surfaces in ATTLAS detail panel, MusicSidebar, CardDeck inline.
- **Remaining**:
  - `/admin/projects` — move `src/data/projects.ts` into the database; add CRUD UI.
  - `/admin/store` — move `STORE_PRODUCTS` into the database; add CRUD UI with image upload.
  - Image upload — Vercel Blob or Cloudinary for product photos + project hero images.

---

## 8. SUCCESS METRICS

### 8.1 Business Objectives (atta logical)
- **Primary**: Client inquiries through contact
- **Secondary**: Time spent on catalogue/portfolio pages
- **Tertiary**: Return visitor percentage

### 8.2 Creative Objectives (ATTA Laugical)
- **Primary**: Engagement depth (scroll behavior, interaction time)
- **Secondary**: Social sharing of creative content
- **Tertiary**: Creative industry recognition

### 8.3 Technical Objectives (All)
- **Performance**: Sub-3 second loading times
- **Compatibility**: 95%+ browser support
- **Accessibility**: WCAG 2.1 compliance

---

## 9. KNOWN CONSTRAINTS & DECISIONS

### 9.1 CSS / Rendering
- **webkit background-clip + transform conflict**: `-webkit-background-clip: text` breaks on elements that also have `transform`. Fix: parent div holds transform, child span holds the glossy class.
- **Inset box-shadows under images**: `inset` box-shadows on a div with `overflow: hidden` render *below* the `<img>` child. Glass bevel effects must live on `::before` (positioned above the image via `z-index`).
- **Outer box-shadows clipped by overflow:hidden parent**: Drop shadows on images inside a drag container are clipped. Fix: `paddingBottom + negative marginBottom` on the container to create unclipped space.
- **overflow: clip vs hidden for drag rows**: `overflow: hidden` creates a scroll container (enables `scrollWidth` measurement for drag constraints). `overflow: clip` does not — requires measuring the inner element's `offsetWidth` instead.

### 9.2 Performance
- No `backdrop-filter` on large areas (expensive GPU compositing)
- No CSS `filter: blur()` on ambient blobs (forces layer creation)
- Single rAF loop for all TE updates; frame throttle SKIP=30 at TE_SPEED≤1
- `memo` on `ChipItem`, `ChipLayer`, `ProjectCard`, `ProjectSection` to prevent unnecessary re-renders
- **`maskImage` performance**: expensive when the masked element is in normal rendering flow (requires off-screen software buffer). Fast when the element already has `will-change: transform` (mask applied in GPU compositor). Always pair `maskImage` with `will-change: transform` on the same element.
- **`repeating-linear-gradient` grain**: looks subtle but forces repaint on every scroll frame — avoid for decorative effects on scrolling content
- **FLIP animation + filters**: never animate `backdrop-filter` or `filter: blur()` on a `layoutId` element — the filter is composited over the growing area every frame, causing severe jank
- **`mask-image` vs cover-fade trade-off**: a cover-fade overlay (gradient from transparent → background color) avoids `maskImage` cost but fails if child GPU layers escape `overflow: hidden`. Use `maskImage` with `will-change: transform` on the container when a true alpha fade is needed.

### 9.4 Environment Variables & Deployment

All keys must be set in `.env` (or `.env.local`) locally **and** in the Vercel project's Environment Variables dashboard — they are never committed (`.env*` is gitignored).

| Key | Purpose | Missing behaviour |
|-----|---------|-------------------|
| `GROQ_API_KEY` | AI chip fallback resolver | Silently returns `{ label: null }` — every query shows a question mark chip |
| `RESEND_API_KEY` | Contact form email sender | `/api/contact` returns 503 |
| `STRIPE_SECRET_KEY` | Store checkout | `/api/checkout` returns 500 "Checkout not configured" |
| `DATABASE_URL` | Neon Postgres pooled connection (app runtime) | `/temporal` + admin pages 500 |
| `DIRECT_URL` | Neon Postgres direct connection (migrations / seed) | `prisma db push` and `db seed` fail |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash of admin password | Login always 401 |
| `AUTH_SECRET` | HS256 JWT signing key (≥32 chars random) | Login throws "AUTH_SECRET must be set and at least 32 characters" |

After adding keys to Vercel, redeploy for them to take effect.

**Local `.env` format** — bcrypt hashes contain `$` which Next.js's `dotenv-expand` interpolates as variable references. The `auth:set` script writes `ADMIN_PASSWORD_HASH` with `\$`-escapes inside single quotes. Don't hand-edit — re-run `npm run auth:set 'password'` to regenerate the line correctly.

**Vercel env vars**: paste hashes raw (no quotes, no `\$` escaping). Vercel stores values as literal strings.

**Setup runbook**: `docs/ADMIN_SETUP.md` walks through Neon project creation, env var configuration, schema push, seeding, and verification.

**Google Workspace MX records** must be present in Vercel DNS for `boelie@attalogical.com` to receive email (see section 3.8). Without MX records, Resend shows "sent" but the email is delivered into a void.

### 9.3 Next.js App Router
- Server Components cannot have event handlers — use CSS classes (`.catalogue-back-link`, `.catalogue-visit-link`) for hover effects
- `generateStaticParams` must live in a Server Component (cannot add `"use client"` to that file)
- Shared data (`PROJECTS_DATA`, `ProjectEntry`) lives in a file with no `"use client"` so both Server and Client Components can import it

---

## 10. QUALITY ASSURANCE

### 10.1 Testing Protocol
- **Cross-browser testing**: Chrome, Safari, Firefox, Edge
- **Device testing**: Desktop, tablet, mobile (iOS/Android)
- **Time-based testing**: Multiple times of day for temporal evolution
- **Performance testing**: Lighthouse scores, Core Web Vitals

### 10.2 Launch Readiness Checklist
- [x] Temporal animations working smoothly (3-day cycle, rAF loop)
- [x] Search functionality returns relevant chips
- [x] Glass effects render on catalogue and cards
- [x] Work experience and contact content live
- [x] Project data (AshaOS, ATTA logical, Follow-AI) wired up
- [x] Catalogue with scroll detection + bottom panel
- [x] Catalogue info bar smoothly resizes when content changes
- [x] Mobile responsiveness
- [x] Mobile broadsheet hero (not a stripped-desktop)
- [x] Analytics tracking (Vercel Analytics — `@vercel/analytics/next`)
- [x] Domain SSL and Vercel config finalized — site live at attalogical.com
- [x] `/temporal` ATTLAS + card deck
- [x] `/laugical/store` end-to-end (cart, Stripe checkout, success page)
- [x] Admin / CMS phase 1: log CRUD with Neon + Prisma
- [x] ATTLAS hover-pause behaves correctly (per-node, no edge drift)
- [ ] Copy review complete
- [ ] `/admin/projects` CRUD
- [ ] `/admin/store` CRUD (with image upload)
- [ ] Real product imagery for Laugical store
- [ ] CKORE music platform surface
- [ ] Laugical brand surface beyond the store

---

## 11. CREATIVE PHILOSOPHY & DESIGN PRINCIPLES

### 11.1 Core Design Philosophy
The ATTA ecosystem operates on the principle that **technology and artistry are not opposing forces** but complementary expressions of the same creative impulse. Every technical decision serves the aesthetic vision, every aesthetic choice proves technical competence.

### 11.2 The Biological Blueprint Concept
Drawing inspiration from natural systems, ATTA brands share fundamental architectural DNA while expressing unique phenotypes:
- **Consistent Foundation**: Typography, spatial relationships, temporal behavior
- **Organic Variation**: Each brand evolves within constraints, like species in an ecosystem
- **Living Systems**: The website breathes, evolves, and responds to time like a living organism

### 11.3 Design Principles

#### **Restraint Through Precision**
Every element must justify its existence. Complexity emerges from simple rules, not additive features.

#### **Time as a Design Medium**
Static websites are dead websites. The 3-day TE cycle creates emotional connection — visitors return to see how the site has changed.

#### **Progressive Disclosure Through Trust**
Reward curiosity with discovery. Search-driven navigation respects user agency. The interface feels collaborative, not controlling.

#### **Authenticity Over Trends**
Avoid design clichés, especially overused "AI aesthetics". Create recognition through consistent vision, not borrowed styles. If it feels like everyone else, it's not ATTA.

---

**Document version 2.5 — Updated May 2026:**
- Added §3.9 — Laugical store + Stripe Checkout (cart drawer with desktop slide-in and mobile bottom-sheet variants, server-authoritative pricing)
- Added §3.10 — Admin / CMS (hidden login flow, Neon + Prisma, dotenv `$`-escape gotcha)
- Added §3.11 — Temporal Log / ATTLAS (force-directed graph desktop, scroll-snap card deck mobile, Spotify oEmbed for CKORE)
- Added §3.12 — Mobile broadsheet hero (editorial single-column replacing stripped-desktop)
- Added new routes in §6 (`/temporal`, `/laugical/store`, `/laugical/store/success`, `/admin`, `/admin/log`, plus the API table in §6.3)
- Added Phase 5 (Admin / CMS) and reorganized Phase 3 (Brand Expansion — now in progress, Laugical store live)
- Updated §9.4 env-var table with all 7 keys (DB, auth, Stripe)
- Updated launch-readiness checklist
- Resolved historical TODOs: catalogue info bar size animation; ATTLAS hover-pause node-scoped; milestone CSS pulse removed (edges stay aligned)
