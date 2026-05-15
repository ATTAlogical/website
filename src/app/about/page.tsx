"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

// ─── Content (placeholder per tab; swap with real content later) ──────────────

type AboutOption = "ATTA" | "CKORE" | "Laugical" | "Petallaugical" | "logical";

const OPTIONS: AboutOption[] = ["ATTA", "CKORE", "Laugical", "Petallaugical", "logical"];

type OptionContent = {
  /** Quick blurb shown in card 1 */
  card1: { kicker: string; title: string; body: string };
  /** Secondary info / links / tags shown in card 2 */
  card2: { kicker: string; title: string; tags: string[]; note?: string };
  /** Main "STATS" content shown in the Win7 frame */
  stats: { label: string; rows: Array<{ label: string; value: string }>; quote?: string };
};

const CONTENT: Record<AboutOption, OptionContent> = {
  ATTA: {
    card1: {
      kicker: "Person",
      title: "Boelie van Camp",
      body: "Software, design, music. Building ATTA logical as a temporal, multi-brand creative ecosystem.",
    },
    card2: {
      kicker: "Reach",
      title: "Channels",
      tags: ["email", "github", "instagram"],
      note: "Boelie@attalogical.com",
    },
    stats: {
      label: "STATS",
      rows: [
        { label: "based in", value: "Utrecht, NL" },
        { label: "currently", value: "fullstack @ Stichting Asha" },
        { label: "since", value: "2025" },
        { label: "stack", value: "Next.js · Postgres · Motion" },
      ],
      quote: "Functional beauty, decorative restraint.",
    },
  },
  CKORE: {
    card1: {
      kicker: "Music",
      title: "ATTA.CKORE",
      body: "Slow attack, sustained low-end. A music catalogue inside the ATTA universe.",
    },
    card2: {
      kicker: "Listen",
      title: "Platforms",
      tags: ["spotify", "bandcamp", "soundcloud"],
      note: "open.spotify.com/artist/…",
    },
    stats: {
      label: "STATS",
      rows: [
        { label: "format", value: "albums · singles · sessions" },
        { label: "active since", value: "2026" },
        { label: "see also", value: "/temporal — the log" },
      ],
      quote: "Time as material.",
    },
  },
  Laugical: {
    card1: {
      kicker: "Creative",
      title: "Laugical",
      body: "Designed objects, one-of-one reworks, and curated items. Clinical precision applied to creative abundance.",
    },
    card2: {
      kicker: "Shop",
      title: "Store",
      tags: ["one-of-one", "made-to-order", "drops"],
      note: "/laugical/store",
    },
    stats: {
      label: "STATS",
      rows: [
        { label: "categories", value: "objects · garments · stickers" },
        { label: "fulfilment", value: "Stripe · NL + EU + UK + US" },
        { label: "ethos", value: "the aesthetic is the selection" },
      ],
      quote: "Frutiger Aero done with intention.",
    },
  },
  Petallaugical: {
    card1: {
      kicker: "Vision",
      title: "Petallaugical",
      body: "Frutiger Surgical. Reflections, white surfaces, clinical precision, material honesty. The brand's design DNA.",
    },
    card2: {
      kicker: "Language",
      title: "Visual rules",
      tags: ["Playfair Display", "glass", "temporal drift", "OKLCH"],
      note: "Recognisable across branches",
    },
    stats: {
      label: "STATS",
      rows: [
        { label: "typography", value: "Playfair Display — Latin + italic" },
        { label: "surfaces", value: "white, hairlines, glass" },
        { label: "motion", value: "3-day temporal cycle" },
        { label: "color", value: "OKLCH, tinted neutrals" },
      ],
      quote: "The design IS the product.",
    },
  },
  logical: {
    card1: {
      kicker: "Business",
      title: "ATTA logical",
      body: "Face of the practice. Portfolio landing. First impression for professional contacts.",
    },
    card2: {
      kicker: "Surfaces",
      title: "Routes",
      tags: ["catalogue", "subscriptions", "contact"],
      note: "/ · /catalogue · /subscriptions",
    },
    stats: {
      label: "STATS",
      rows: [
        { label: "established", value: "2026" },
        { label: "stack", value: "Next.js 16 · Turbopack · Motion" },
        { label: "infra", value: "Vercel · Neon · Prisma · Stripe · Resend" },
        { label: "live at", value: "attalogical.com" },
      ],
      quote: "Sterile high-tech polish.",
    },
  },
};

const OPTION_TINT: Record<AboutOption, string> = {
  ATTA: "oklch(70% 0.04 255)",
  CKORE: "oklch(60% 0.10 240)",
  Laugical: "oklch(70% 0.10 60)",
  Petallaugical: "oklch(75% 0.10 330)",
  logical: "oklch(65% 0.02 255)",
};

// ─── Wheel — vertical, ▲▼ buttons, tactile snap with Motion ───────────────────

function Wheel<T extends string>({
  items,
  value,
  onChange,
  itemLabel,
  ariaLabel,
}: {
  items: T[];
  value: T;
  onChange: (next: T) => void;
  itemLabel?: (item: T) => React.ReactNode;
  ariaLabel: string;
}) {
  const index = items.indexOf(value);
  const len = items.length;

  const cycle = (delta: number) => {
    const next = items[(index + delta + len) % len];
    onChange(next);
  };

  // Compute signed offset from active for each item, with wraparound
  function offsetOf(i: number): number {
    let d = i - index;
    if (d > len / 2) d -= len;
    if (d < -len / 2) d += len;
    return d;
  }

  return (
    <div className="wii-wheel" aria-label={ariaLabel}>
      <button
        type="button"
        className="wii-wheel-arrow"
        onClick={() => cycle(-1)}
        aria-label="previous"
      >
        ▲
      </button>
      <div className="wii-wheel-track" role="listbox">
        <AnimatePresence initial={false}>
          {items.map((item, i) => {
            const off = offsetOf(i);
            if (Math.abs(off) > 2) return null; // hide far items
            return (
              <motion.button
                key={item}
                type="button"
                role="option"
                aria-selected={off === 0}
                className={`wii-wheel-item${off === 0 ? " wii-wheel-item--active" : ""}`}
                onClick={() => onChange(item)}
                initial={{ opacity: 0 }}
                animate={{
                  y: off * 38,
                  scale: off === 0 ? 1 : 0.82,
                  opacity: off === 0 ? 1 : 0.42,
                }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                {itemLabel ? itemLabel(item) : item}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
      <button
        type="button"
        className="wii-wheel-arrow"
        onClick={() => cycle(1)}
        aria-label="next"
      >
        ▼
      </button>
    </div>
  );
}

// ─── Avatar (placeholder circles) ─────────────────────────────────────────────

const AVATARS = [
  { id: "a1", initial: "A", tint: "oklch(70% 0.04 255)" },
  { id: "a2", initial: "C", tint: "oklch(60% 0.10 240)" },
  { id: "a3", initial: "L", tint: "oklch(70% 0.10 60)" },
  { id: "a4", initial: "P", tint: "oklch(75% 0.10 330)" },
  { id: "a5", initial: "B", tint: "oklch(72% 0.06 145)" },
  { id: "a6", initial: "★", tint: "oklch(80% 0.10 80)" },
];

function AvatarWheel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const len = AVATARS.length;

  const cycle = (delta: number) => {
    setActiveIndex((i) => (i + delta + len) % len);
  };

  function offsetOf(i: number): number {
    let d = i - activeIndex;
    if (d > len / 2) d -= len;
    if (d < -len / 2) d += len;
    return d;
  }

  return (
    <div className="wii-avatars">
      <button
        type="button"
        className="wii-wheel-arrow"
        onClick={() => cycle(-1)}
        aria-label="previous avatar"
      >
        ▲
      </button>
      <div className="wii-avatar-cluster" role="listbox" aria-label="ATTA avatars">
        {AVATARS.map((av, i) => {
          const off = offsetOf(i);
          if (Math.abs(off) > 2) return null;
          return (
            <motion.button
              key={av.id}
              type="button"
              role="option"
              aria-selected={off === 0}
              className={`wii-avatar-circle${off === 0 ? " wii-avatar-circle--active" : ""}`}
              onClick={() => setActiveIndex(i)}
              style={{
                background: `radial-gradient(circle at 35% 28%, oklch(96% 0.012 240) 0%, ${av.tint} 78%)`,
                zIndex: 10 - Math.abs(off),
              }}
              initial={false}
              animate={{
                y: off * 38,
                scale: off === 0 ? 1 : 0.72,
                opacity: off === 0 ? 1 : 0.5,
              }}
              transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            >
              {av.initial}
            </motion.button>
          );
        })}
      </div>
      <button
        type="button"
        className="wii-wheel-arrow"
        onClick={() => cycle(1)}
        aria-label="next avatar"
      >
        ▼
      </button>
      <div className="wii-avatars-label">ATTA</div>
    </div>
  );
}

// ─── Win7 user-picture frame (stacked layers for the multi-band border) ──────

function Win7Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="win7-frame">
      <div className="win7-frame-blue">
        <div className="win7-frame-white">
          <div className="win7-frame-inner">
            <div className="win7-frame-content">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Nature motif corners (SVG line art) ─────────────────────────────────────

function NatureCorner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  // Same SVG, rotated per corner
  const rotation = { tl: 0, tr: 90, br: 180, bl: 270 }[position];
  return (
    <svg
      className={`about-leaf about-leaf--${position}`}
      viewBox="0 0 100 100"
      width="120"
      height="120"
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden
    >
      <g fill="none" stroke="#A8C4A2" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
        {/* Branch */}
        <path d="M2 2 Q 18 20, 30 38 T 52 70" />
        {/* Leaves on branch */}
        <path d="M16 16 Q 22 12, 28 18 Q 22 22, 16 16 Z" />
        <path d="M30 32 Q 38 28, 44 36 Q 38 40, 30 32 Z" />
        <path d="M42 54 Q 50 50, 56 58 Q 50 62, 42 54 Z" />
        {/* A second smaller branch */}
        <path d="M8 14 Q 14 22, 22 26" />
        <path d="M14 22 Q 18 18, 22 22 Q 18 26, 14 22 Z" />
      </g>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  // Unlock scroll — globals.css sets html/body overflow:hidden
  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const [option, setOption] = useState<AboutOption>("ATTA");
  const content = CONTENT[option];
  const tint = OPTION_TINT[option];

  return (
    <main className="about-page" style={{ ["--about-tint" as string]: tint } as React.CSSProperties}>
      {/* Nature motifs at four corners */}
      <NatureCorner position="tl" />
      <NatureCorner position="tr" />
      <NatureCorner position="bl" />
      <NatureCorner position="br" />

      {/* Top-left back-link */}
      <Link href="/" className="about-back" aria-label="Back to ATTA logical">
        ← ATTA logical
      </Link>

      <div className="about-stage">
        {/* Avatar wheel on the left */}
        <AvatarWheel />

        {/* Main panel */}
        <section className="about-panel">
          <header className="about-panel-head">
            <h1 className="about-panel-title">ABOUT</h1>
            <div className="about-options">
              <span className="about-options-label">OPTIONS</span>
              <Wheel
                items={OPTIONS}
                value={option}
                onChange={setOption}
                ariaLabel="Section"
              />
            </div>
          </header>

          <div className="about-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={option}
                className="about-grid"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Left column — two stacked smaller placeholders */}
                <div className="about-left-col">
                  {/* Card 1 — small, upper-left */}
                  <article className="about-card about-card--small">
                    <span className="about-card-kicker">{content.card1.kicker}</span>
                    <h2 className="about-card-title">{content.card1.title}</h2>
                    <p className="about-card-body">{content.card1.body}</p>
                  </article>

                  {/* Card 2 — small, middle, "Switch Content Option" */}
                  <article className="about-card about-card--small">
                    <span className="about-card-kicker">{content.card2.kicker}</span>
                    <h2 className="about-card-title">{content.card2.title}</h2>
                    <ul className="about-card-tags">
                      {content.card2.tags.map((tag) => (
                        <li key={tag} className="about-card-tag">{tag}</li>
                      ))}
                    </ul>
                    {content.card2.note && (
                      <p className="about-card-note">{content.card2.note}</p>
                    )}
                  </article>
                </div>

                {/* Right column — big Win7 STATS frame, full panel height */}
                <Win7Frame>
                  <div className="about-stats">
                    <div className="about-stats-label">{content.stats.label}</div>
                    <dl className="about-stats-list">
                      {content.stats.rows.map((row) => (
                        <div key={row.label} className="about-stats-row">
                          <dt>{row.label}</dt>
                          <dd>{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                    {content.stats.quote && (
                      <p className="about-stats-quote">
                        <em>&ldquo;{content.stats.quote}&rdquo;</em>
                      </p>
                    )}
                  </div>
                </Win7Frame>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      </div>
    </main>
  );
}
