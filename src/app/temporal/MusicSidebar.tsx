"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "motion/react";
import type { TemporalEntry } from "./TemporalClient";

const STORAGE_KEY = "music-sidebar-pos";

function fmtReleaseDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.length === 4) return raw;
  if (raw.length === 7) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toISOString().slice(0, 10);
}

// ─── Music row — minimal album display ────────────────────────────────────────

function MusicRow({
  entry,
  onSelect,
}: {
  entry: TemporalEntry;
  onSelect: () => void;
}) {
  const rel = fmtReleaseDate(entry.spotifyReleaseDate);

  return (
    <button
      type="button"
      className="music-row"
      title={entry.spotifyTitle ?? entry.title}
      onClick={onSelect}
    >
      <span className="music-row-cover-wrap">
        {entry.spotifyThumb ? (
          <img
            src={entry.spotifyThumb}
            alt=""
            className="music-row-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="music-row-cover music-row-cover--placeholder" />
        )}
        {entry.spotifyThumb && (
          <img
            src={entry.spotifyThumb}
            alt=""
            aria-hidden
            className="music-row-cover-reflection"
            loading="lazy"
            decoding="async"
          />
        )}
      </span>

      <span className="music-row-meta">
        <span className="music-row-title">
          {entry.spotifyTitle ?? entry.title}
        </span>
        {rel && <span className="music-row-line2">{rel}</span>}
      </span>
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function MusicSidebar({
  entries,
  spotifyProfile,
  detailOpen,
  onSelect,
}: {
  entries: TemporalEntry[];
  spotifyProfile?: string | null;
  showVanity?: boolean;
  detailOpen?: boolean;
  onSelect: (entry: TemporalEntry) => void;
}) {
  const dragAreaRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { x?: number; y?: number };
        const maxYUp = -(window.innerHeight - 200);
        const sx = Math.max(0, Math.min(parsed.x ?? 0, window.innerWidth - 320));
        const sy = Math.max(maxYUp, Math.min(parsed.y ?? 0, 0));
        x.set(sx);
        y.set(sy);
      }
    } catch { /* ignore */ }
    setMounted(true);
  }, [x, y]);

  const persistPosition = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: x.get(), y: y.get() }));
    } catch { /* ignore */ }
  };

  // Auto-relocate when detail panel opens if the sidebar overlaps it
  useEffect(() => {
    if (!detailOpen || !mounted) return;
    const rect = document.querySelector(".music-sidebar")?.getBoundingClientRect();
    if (!rect) return;
    const overlapsRight = rect.right > window.innerWidth - 380;
    const overlapsTop = rect.top < 80;
    if (overlapsRight || overlapsTop) {
      animate(x, 0, { duration: 0.5, ease: [0.16, 1, 0.3, 1] });
      animate(y, 0, { duration: 0.5, ease: [0.16, 1, 0.3, 1] });
      setTimeout(persistPosition, 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailOpen, mounted]);

  return (
    <>
      <div
        ref={dragAreaRef}
        aria-hidden
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 39 }}
      />

      <motion.aside
        className="music-sidebar"
        drag
        dragConstraints={dragAreaRef}
        dragElastic={0.18}
        dragMomentum
        dragTransition={{ bounceStiffness: 380, bounceDamping: 38 }}
        onDragEnd={persistPosition}
        whileDrag={{
          scale: 1.02,
          boxShadow: "0 22px 60px rgba(0,0,0,0.18), 0 6px 18px rgba(0,0,0,0.10)",
          cursor: "grabbing",
        }}
        style={{ x, y }}
        initial={mounted ? false : { opacity: 0, y: 16 }}
        animate={mounted ? { opacity: 1 } : { opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        aria-label="CKORE albums"
      >
        <div className="music-sidebar-handle" aria-hidden>
          <span /><span /><span />
        </div>

        <div className="music-sidebar-head">
          {spotifyProfile ? (
            <a
              href={spotifyProfile}
              target="_blank"
              rel="noreferrer"
              className="music-sidebar-profile"
              title="Open CKORE on Spotify"
              onClick={(e) => e.stopPropagation()}
            >
              CKORE ↗
            </a>
          ) : (
            <span>CKORE</span>
          )}
          <span>{entries.length}</span>
        </div>

        {entries.map((entry) => (
          <MusicRow
            key={entry.slug}
            entry={entry}
            onSelect={() => onSelect(entry)}
          />
        ))}
      </motion.aside>
    </>
  );
}
