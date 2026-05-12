// ─── Types ────────────────────────────────────────────────────────────────────

export type Branch = "atta" | "laugical" | "ckore";

export type LogEntryType =
  | "build"      // a feature, system, or technical milestone
  | "project"    // client / commissioned / public work shipped
  | "album"      // a music album or EP release
  | "track"      // a single track / draft / session (smaller than an album)
  | "drop"       // a store drop, edition release, or product
  | "profile"    // an account / artist profile node (e.g. ATTA.CKORE on Spotify)
  | "note"       // a written observation or thought
  | "milestone"; // a beginning, ending, or threshold

export type LogEntry = {
  /** Stable identifier — used for graph edges. kebab-case. */
  slug: string;
  /** ISO date (YYYY-MM-DD). Time optional and ignored for grouping. */
  date: string;
  branch: Branch;
  type: LogEntryType;
  title: string;
  /** Short body, 1–2 sentences. Optional. */
  body?: string;
  /** Optional internal route or external URL */
  href?: string;
  external?: boolean;
  /** Lineage / influence: slugs this entry grows out of. Directed edges. */
  links?: string[];
};

// ─── Seed entries ─────────────────────────────────────────────────────────────
// Newest first by convention. Sorted at render time, but order matters for ties.
//
// `links` encodes lineage — what this entry grows OUT of. Read the arrow as
// "this entry stands on the shoulders of …". The atlas view treats every link
// as a soft connection (springs + curves), so the graph reveals natural
// clusters: the laugical lineage, the atta-tech lineage, the ckore stream.

export const LOG_ENTRIES: LogEntry[] = [
  // ── 2026 May ──
  {
    slug: "the-log",
    date: "2026-05-10",
    branch: "atta",
    type: "build",
    title: "the log",
    body: "Chronological record of the ATTA logical universe. Time as the navigation primitive.",
    links: ["temporal-evolution", "atomic-orbital-chips"],
  },
  {
    slug: "cart-drawer-stripe",
    date: "2026-05-09",
    branch: "laugical",
    type: "build",
    title: "cart drawer + Stripe checkout",
    body: "End-to-end purchase flow. Bag panel, qty stepper, server-authoritative pricing, Stripe-hosted checkout, post-payment confirmation.",
    links: ["laugical-store-opens"],
  },
  {
    slug: "clear-bag-01",
    date: "2026-05-08",
    branch: "laugical",
    type: "drop",
    title: "Clear Bag No. 01",
    body: "Transparent PVC, internal collage of pressed flora and Dymo-tape annotations. €180.",
    href: "/laugical/store",
    links: ["laugical-store-opens"],
  },
  {
    slug: "atomic-orbital-chips",
    date: "2026-05-07",
    branch: "atta",
    type: "build",
    title: "atomic orbital chips",
    body: "Three concentric rings of suggestion chips, each shell on its own angular phase and rotation speed. Inner shell driven by AI search resolution.",
    links: ["ai-chip-resolver"],
  },
  {
    slug: "laugical-store-opens",
    date: "2026-05-03",
    branch: "laugical",
    type: "milestone",
    title: "Laugical store opens",
    body: "First catalogue: stickers, prints, made-to-order garments, and one-of-one reworks.",
    href: "/laugical/store",
    links: ["attalogical-goes-live"],
  },

  // ── 2026 April ──
  {
    slug: "ai-chip-resolver",
    date: "2026-04-22",
    branch: "atta",
    type: "build",
    title: "AI chip resolver",
    body: "Search queries route to chips via a static keyword pass; the rest fall through to a Groq-hosted Llama 3 model that picks a destination and invents a label.",
    links: ["attalogical-goes-live"],
  },
  {
    slug: "clear-bag-02",
    date: "2026-04-12",
    branch: "laugical",
    type: "drop",
    title: "Clear Bag No. 02",
    body: "Found its home.",
    links: ["clear-bag-01"],
  },
  {
    slug: "temporal-evolution",
    date: "2026-04-04",
    branch: "atta",
    type: "build",
    title: "temporal evolution engine",
    body: "A 3-day sine cycle drives imperceptible drift in typography weight, letterspacing, and position. Returning visitors see a slightly different surface.",
    links: ["attalogical-goes-live"],
  },

  // ── 2026 March ──
  {
    slug: "session-untitled",
    date: "2026-03-18",
    branch: "ckore",
    type: "track",
    title: "session — untitled",
    body: "Drafting. Slow attack, sustained low-end, no percussion yet.",
    links: ["attalogical-goes-live"],
  },
  {
    slug: "attalogical-goes-live",
    date: "2026-03-02",
    branch: "atta",
    type: "milestone",
    title: "attalogical.com goes live",
    body: "First public surface. Glass pane, search bar, three brand branches.",
    links: ["ashaos-fullstack"],
  },

  // ── 2026 February ──
  {
    slug: "ashaos-fullstack",
    date: "2026-02-15",
    branch: "atta",
    type: "project",
    title: "AshaOS — fullstack",
    body: "Internal operating system for Stichting Asha. React, Node, Postgres. Ongoing.",
    links: ["internship-begins"],
  },

  // ── 2025 ──
  {
    slug: "internship-begins",
    date: "2025-02-03",
    branch: "atta",
    type: "milestone",
    title: "Stichting Asha internship begins",
    body: "Software development lead for the foundation's digital infrastructure.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const BRANCH_LABEL: Record<Branch, string> = {
  atta: "ATTA",
  laugical: "LAUG",
  ckore: "CKORE",
};

export const TYPE_GLYPH: Record<LogEntryType, string> = {
  build: "·",
  project: "↗",
  album: "▦",
  track: "♪",
  drop: "€",
  profile: "◉",
  note: "¶",
  milestone: "◇",
};

/** Node radius hint per type — milestones largest, notes smallest. */
export const TYPE_WEIGHT: Record<LogEntryType, number> = {
  profile: 1.8,    // artist hub: the largest, connects to everything
  milestone: 1.6,
  album: 1.45,    // full release, sits between project and track
  project: 1.3,
  drop: 1.15,
  track: 1.0,
  build: 0.95,
  note: 0.85,
};

/** Group entries by year+month label, e.g. "2026 May". Returns map preserving order (newest first). */
export function groupByMonth(entries: LogEntry[]): Map<string, LogEntry[]> {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
  const months = new Map<string, LogEntry[]>();
  const fmt = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "long" });
  for (const e of sorted) {
    const d = new Date(e.date);
    const key = fmt.format(d);
    const arr = months.get(key) ?? [];
    arr.push(e);
    months.set(key, arr);
  }
  return months;
}

/** Compute edges from the `links` field on each entry. Returns directed pairs. */
export function computeEdges(entries: LogEntry[]): Array<{ from: string; to: string }> {
  const slugs = new Set(entries.map((e) => e.slug));
  const edges: Array<{ from: string; to: string }> = [];
  for (const e of entries) {
    if (!e.links) continue;
    for (const target of e.links) {
      if (slugs.has(target)) edges.push({ from: e.slug, to: target });
    }
  }
  return edges;
}
