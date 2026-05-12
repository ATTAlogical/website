"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue } from "motion/react";
import type { TemporalEntry } from "./TemporalClient";

const STORAGE_KEY = "music-sidebar-pos";

export default function MusicSidebar({
  entries,
  spotifyProfile,
}: {
  entries: TemporalEntry[];
  spotifyProfile?: string | null;
}) {
  const dragAreaRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [mounted, setMounted] = useState(false);

  // Restore last position on mount (single read; persist below).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { x?: number; y?: number };
        // Clamp y so it never restores off the top of the viewport on a smaller window
        const maxYUp = -(window.innerHeight - 200);
        const sx = Math.max(0, Math.min(parsed.x ?? 0, window.innerWidth - 320));
        const sy = Math.max(maxYUp, Math.min(parsed.y ?? 0, 0));
        x.set(sx);
        y.set(sy);
      }
    } catch {
      /* ignore parse errors */
    }
    setMounted(true);
  }, [x, y]);

  const persistPosition = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: x.get(), y: y.get() }));
    } catch {
      /* ignore quota errors */
    }
  };

  return (
    <>
      {/* Invisible drag-area container fills the viewport so the sidebar can be
          dragged anywhere on screen. pointer-events:none lets clicks through. */}
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
        aria-label="CKORE tracks with Spotify"
      >
        {/* Drag handle — three subtle dots like a macOS window strip */}
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
          >
            CKORE ↗
          </a>
        ) : (
          <span>CKORE</span>
        )}
        <span>{entries.length}</span>
      </div>
      {entries.map((entry) => {
        if (!entry.spotifyUrl) return null;
        return (
          <a
            key={entry.slug}
            href={entry.spotifyUrl}
            target="_blank"
            rel="noreferrer"
            className="music-row"
            title={entry.spotifyTitle ?? entry.title}
          >
            {entry.spotifyThumb && (
              <img
                src={entry.spotifyThumb}
                alt=""
                className="music-row-cover"
                loading="lazy"
                decoding="async"
              />
            )}
            <span className="music-row-meta">
              <span className="music-row-title">
                {entry.spotifyTitle ?? entry.title}
              </span>
              <span className="music-row-date">{entry.date}</span>
            </span>
          </a>
        );
      })}
      </motion.aside>
    </>
  );
}
