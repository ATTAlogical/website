"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue } from "motion/react";
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
  if (raw.length === 4) return raw; // year only
  if (raw.length === 7) return raw; // YYYY-MM
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toISOString().slice(0, 10);
}

/** Map valence (0..1) and energy (0..1) to a quiet color glow string. */
function moodColor(valence: number | null | undefined, energy: number | null | undefined): string | null {
  if (valence == null || energy == null) return null;
  // Hue: 250° (sad/blue) → 60° (happy/yellow)
  const hue = 250 - valence * 190;
  // Lightness softens with low energy
  const light = 60 + energy * 12;
  const chroma = 0.07 + energy * 0.07;
  return `oklch(${light}% ${chroma} ${hue})`;
}

/** Track-tempo → CSS animation duration (ms per beat). Clamped to a sane range. */
function bpmToDuration(bpm: number | null | undefined): string | null {
  if (!bpm || bpm < 30) return null;
  const clamped = Math.max(40, Math.min(220, bpm));
  return `${Math.round(60000 / clamped)}ms`;
}

// ─── Audio preview manager ───────────────────────────────────────────────────
// One shared <audio> element. Plays the hovered row's previewUrl with a small
// fade-in via volume; pauses on hover-out.

function useAudioPreview(): {
  play: (url: string | null | undefined) => void;
  stop: () => void;
} {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const play = (url: string | null | undefined) => {
    if (!url) return;
    const a = ensureAudio();
    if (a.src !== url) {
      a.src = url;
    }
    a.volume = 0;
    a.play().catch(() => { /* autoplay blocked — silent fail */ });
    fadeTo(0.36, 280);
  };

  const stop = () => {
    const a = audioRef.current;
    if (!a) return;
    fadeTo(0, 220, () => {
      a.pause();
    });
  };

  useEffect(() => {
    return () => {
      clearFade();
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return { play, stop };
}

// ─── Music row ────────────────────────────────────────────────────────────────

function MusicRow({
  entry,
  hoveredSlug,
  onHoverStart,
  onHoverEnd,
  showVanity,
}: {
  entry: TemporalEntry;
  hoveredSlug: string | null;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  showVanity?: boolean;
}) {
  const isHovered = hoveredSlug === entry.slug;
  const someoneElseHovered = hoveredSlug !== null && !isHovered;

  const dur = fmtDuration(entry.spotifyDurationMs);
  const rel = fmtReleaseDate(entry.spotifyReleaseDate);
  const mood = moodColor(entry.spotifyValence, entry.spotifyEnergy);
  const bpmDur = bpmToDuration(entry.spotifyTempo);

  // Pulse amplitude states (via CSS class)
  const pulseStrength = isHovered ? "music-row--pulse-strong"
    : someoneElseHovered ? "music-row--pulse-weak"
    : "music-row--pulse-normal";

  const style: React.CSSProperties = {
    ["--mood-color" as string]: mood ?? "transparent",
    ["--bpm-duration" as string]: bpmDur ?? "0ms",
  };

  return (
    <a
      href={entry.spotifyUrl ?? "#"}
      target="_blank"
      rel="noreferrer"
      className={`music-row ${pulseStrength}${entry.spotifyTempo ? " music-row--has-bpm" : ""}`}
      style={style}
      title={entry.spotifyTitle ?? entry.title}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
    >
      {/* Soft mood-tinted glow halo behind the row */}
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
        {/* Glass-reflection of the cover beneath the row */}
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
    </a>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function MusicSidebar({
  entries,
  spotifyProfile,
  showVanity,
}: {
  entries: TemporalEntry[];
  spotifyProfile?: string | null;
  showVanity?: boolean;
}) {
  const dragAreaRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [mounted, setMounted] = useState(false);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const audio = useAudioPreview();

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

  const onRowHoverStart = (entry: TemporalEntry) => {
    setHoveredSlug(entry.slug);
    audio.play(entry.spotifyPreviewUrl);
  };

  const onRowHoverEnd = () => {
    setHoveredSlug(null);
    audio.stop();
  };

  return (
    <>
      {/* Invisible drag-area container fills the viewport */}
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
            onHoverStart={() => onRowHoverStart(entry)}
            onHoverEnd={onRowHoverEnd}
            showVanity={showVanity}
          />
        ))}
      </motion.aside>
    </>
  );
}
