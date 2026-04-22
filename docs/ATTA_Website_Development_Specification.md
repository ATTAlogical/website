# ATTA Website Development Specification
**Project Management Document**  
*Version 2.0 — April 2026*

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
- **Data**: `src/data/projects.ts` — shared type + data file, no "use client", works in both Server and Client Components

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

#### `/projects/[slug]` — Per-Project Page (future use)
- Static generation via `generateStaticParams`
- Server Component — no event handlers (CSS classes for hover)
- Masonry image gallery, highlights grid

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

### 7.1 Phase 1: Foundation ✅ COMPLETE
- Temporal evolution engine (3-day sine wave, single rAF loop)
- Glass effects + reflections
- Search bar with typewriter placeholder
- Floating chip system with SVG path-draw animations
- atta logical landing page

### 7.2 Phase 2: Content Integration ✅ COMPLETE
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

### 7.2.1 Phase 2 Mobile Addendum ✅ COMPLETE
- `useIsMobile` hook (`src/hooks/useIsMobile.ts`) — uses `matchMedia`, fires only on breakpoint crosses, desktop-first init (no SSR mismatch)
- `viewport-fit=cover` meta tag in layout — enables `env(safe-area-inset-*)` on iPhone
- **Catalogue mobile**: images `83vw` wide (immersive, single-image-per-screen feel with peek of next); compact bottom panel (title + 2 tags + link in one row); `touchAction: pan-y` on drag row; safe-area-inset padding on bottom panel
- **Homepage popup mobile**: native bottom sheet (`92dvh`, `border-radius: 20px 20px 0 0`, `border-bottom: none`); spring slide-up animation; drag handle; swipe-down to dismiss (velocity >400 or offset >120px); `layoutId` disabled on mobile card (no orphaned FLIP animation)
- **Homepage extended sections**: stacked single column; reduced padding (`12vw 6vw`); contact columns stack vertically; bio block goes full-width
- **`PopupContent`** extracted as shared component — used by both desktop FLIP popup and mobile bottom sheet

### 7.3 Phase 3: Brand Expansion
- **Goal**: Launch ATTA Laugical and ATTA.CKORE
- **Deliverables**:
  - Laugical artistic interface — own search, own contact, progressive loading
  - CKORE music platform — own search, own contact, releases, shop
  - Cross-brand chip navigation

### 7.4 Phase 4: Refinement
- **Goal**: Polish and optimization
- **Deliverables**:
  - Mobile responsiveness
  - Advanced temporal variations
  - Analytics implementation
  - Launch preparation

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
- [x] Mobile responsiveness
- [ ] Analytics tracking
- [ ] Domain SSL and Vercel config finalized
- [ ] Copy review complete

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

**Document version 2.2 — Updated April 2026 to reflect mobile responsiveness completion**
