"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "motion/react";
import type { TemporalEntry } from "./TemporalClient";

const STORAGE_KEY = "music-sidebar-pos";

// ─── Formatting helpers ──────────────────────────────────────────────────────

function fmtDuration(ms: number | null | undefined): string | null {
  if (!ms || ms < 1000) return null;
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtReleaseDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.length === 4) return raw;
  if (raw.length === 7) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toISOString().slice(0, 10);
}

function moodColor(valence: number | null | undefined, energy: number | null | undefined): string | null {
  if (valence == null || energy == null) return null;
  const hue = 250 - valence * 190;
  const light = 60 + energy * 12;
  const chroma = 0.07 + energy * 0.07;
  return `oklch(${light}% ${chroma} ${hue})`;
}

function bpmToDuration(bpm: number | null | undefined): string | null {
  if (!bpm || bpm < 30) return null;
  const clamped = Math.max(40, Math.min(220, bpm));
  return `${Math.round(60000 / clamped)}ms`;
}

// ─── Audio preview manager ───────────────────────────────────────────────────

function useAudioPreview(): {
  play: (url: string | null | undefined, slug: string) => void;
  stop: () => void;
  playingSlug: string | null;
} {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playingSlug, setPlayingSlug] = useState<string | null>(null);

  const ensureAudio = () => {
    if (audioRef.current) return audioRef.current;
    const a = new Audio();
    a.preload = "none";
    a.volume = 0;
    audioRef.current = a;
    return a;
  };

  const clearFade = () => {
    if (fadeRef.current) {
      clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
  };

  const fadeTo = (target: number, duration: number, onDone?: () => void) => {
    const a = ensureAudio();
    clearFade();
    const start = a.volume;
    const steps = 12;
    const stepMs = duration / steps;
    let i = 0;
    fadeRef.current = setInterval(() => {
      i += 1;
      a.volume = Math.max(0, Math.min(1, start + (target - start) * (i / steps)));
      if (i >= steps) {
        clearFade();
        onDone?.();
      }
    }, stepMs);
  };

  const play = (url: string | null | undefined, slug: string) => {
    if (!url) {
      setPlayingSlug(null);
      return;
    }
    const a = ensureAudio();
    if (a.src !== url) a.src = url;
    a.volume = 0;
    a.play()
      .then(() => setPlayingSlug(slug))
      .catch(() => setPlayingSlug(null));
    fadeTo(0.36, 280);
  };

  const stop = () => {
    const a = audioRef.current;
    setPlayingSlug(null);
    if (!a) return;
    fadeTo(0, 220, () => a.pause());
  };

  useEffect(() => {
    return () => {
      clearFade();
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return { play, stop, playingSlug };
}

// ─── Music row ────────────────────────────────────────────────────────────────

function MusicRow({
  entry,
  hoveredSlug,
  playingSlug,
  onHoverStart,
  onHoverEnd,
  onSelect,
  showVanity,
}: {
  entry: TemporalEntry;
  hoveredSlug: string | null;
  playingSlug: string | null;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onSelect: () => void;
  showVanity?: boolean;
}) {
  const isHovered = hoveredSlug === entry.slug;
  const someoneElseHovered = hoveredSlug !== null && !isHovered;
  const isPlaying = playingSlug === entry.slug;

  const dur = fmtDuration(entry.spotifyDurationMs);
  const rel = fmtReleaseDate(entry.spotifyReleaseDate);
  const mood = moodColor(entry.spotifyValence, entry.spotifyEnergy);
  const bpmDur = bpmToDuration(entry.spotifyTempo);

  const pulseStrength = isHovered ? "music-row--pulse-strong"
    : someoneElseHovered ? "music-row--pulse-weak"
    : "music-row--pulse-normal";

  const style = {} as Record<string, string>;
  if (mood) style["--mood-color"] = mood;
  if (bpmDur) style["--bpm-duration"] = bpmDur;

  return (
    <button
      type="button"
      className={`music-row ${pulseStrength}${entry.spotifyTempo ? " music-row--has-bpm" : ""}${isPlaying ? " music-row--playing" : ""}`}
      style={style as React.CSSProperties}
      title={entry.spotifyTitle ?? entry.title}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      onClick={onSelect}
    >
      <span className="music-row-glow" aria-hidden />

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
        {/* Playing indicator — three animated bars over the cover */}
        {isPlaying && (
          <span className="music-row-playing-indicator" aria-hidden>
            <span /><span /><span />
          </span>
        )}
      </span>

      <span className="music-row-meta">
        <span className="music-row-title">
          {entry.spotifyTitle ?? entry.title}
        </span>
        <span className="music-row-line2">
          {dur && <span className="music-row-stat">{dur}</span>}
          {dur && rel && <span className="music-row-sep">·</span>}
          {rel && <span className="music-row-stat">{rel}</span>}
          {showVanity && entry.spotifyPopularity != null && (
            <>
              <span className="music-row-sep">·</span>
              <span className="music-row-stat">pop {entry.spotifyPopularity}</span>
            </>
          )}
        </span>
      </span>
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function MusicSidebar({
  entries,
  spotifyProfile,
  showVanity,
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
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const { play, stop, playingSlug } = useAudioPreview();

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

  // When detail panel opens, if the sidebar would overlap it, glide back to the
  // default bottom-left position. The detail panel is fixed at top-right ~340px
  // wide × ~viewport-height tall.
  useEffect(() => {
    if (!detailOpen || !mounted) return;
    const rect = dragAreaRef.current?.parentElement
      ? document.querySelector(".music-sidebar")?.getBoundingClientRect()
      : null;
    if (!rect) return;
    const overlapsRight = rect.right > window.innerWidth - 380;
    const overlapsTop = rect.top < 80;
    if (overlapsRight || overlapsTop) {
      animate(x, 0, { duration: 0.5, ease: [0.16, 1, 0.3, 1] });
      animate(y, 0, { duration: 0.5, ease: [0.16, 1, 0.3, 1] });
      // Save the snap-back position too
      setTimeout(persistPosition, 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailOpen, mounted]);

  const onRowHoverStart = (entry: TemporalEntry) => {
    setHoveredSlug(entry.slug);
    play(entry.spotifyPreviewUrl, entry.slug);
  };

  const onRowHoverEnd = () => {
    setHoveredSlug(null);
    stop();
  };

  const onRowSelect = (entry: TemporalEntry) => {
    // Selecting a track opens the detail panel. Stop the audio preview so it
    // doesn't keep playing while the user reads the detail.
    stop();
    onSelect(entry);
  };

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
        aria-label="CKORE tracks with Spotify"
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
            hoveredSlug={hoveredSlug}
            playingSlug={playingSlug}
            onHoverStart={() => onRowHoverStart(entry)}
            onHoverEnd={onRowHoverEnd}
            onSelect={() => onRowSelect(entry)}
            showVanity={showVanity}
          />
        ))}
      </motion.aside>
    </>
  );
}
