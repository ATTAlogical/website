"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { BRANCH_LABEL, TYPE_GLYPH } from "@/data/log";
import type { TemporalEntry } from "./TemporalClient";

function fmtDuration(ms: number | null | undefined): string | null {
  if (!ms || ms < 1000) return null;
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function DetailPanel({
  entry,
  onClose,
}: {
  entry: TemporalEntry;
  onClose: () => void;
}) {
  const dur = fmtDuration(entry.spotifyDurationMs);
  return (
    <motion.aside
      className="atlas-detail"
      role="dialog"
      aria-modal="false"
      aria-label={entry.title}
      initial={{ x: 360, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 360, opacity: 0 }}
      transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="atlas-detail-head">
        <span className={`atlas-detail-branch atlas-branch-${entry.branch}`}>
          {BRANCH_LABEL[entry.branch as keyof typeof BRANCH_LABEL]}
        </span>
        <span className="atlas-detail-date">{entry.date}</span>
        <button className="atlas-detail-close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <h3 className="atlas-detail-title">
        <span className="atlas-detail-glyph" aria-hidden>
          {TYPE_GLYPH[entry.type as keyof typeof TYPE_GLYPH]}
        </span>
        {entry.title}
      </h3>
      {entry.body && <p className="atlas-detail-body">{entry.body}</p>}

      {/* Spotify card — cover, title, duration, release */}
      {entry.spotifyUrl && entry.spotifyThumb && (
        <a
          href={entry.spotifyUrl}
          target="_blank"
          rel="noreferrer"
          className="music-row"
          style={{ marginBottom: 18, cursor: "pointer" }}
        >
          <span className="music-row-cover-wrap">
            <img
              src={entry.spotifyThumb}
              alt=""
              className="music-row-cover"
              loading="lazy"
              decoding="async"
            />
          </span>
          <span className="music-row-meta">
            <span className="music-row-title">
              {entry.spotifyTitle ?? "Listen on Spotify"}
            </span>
            <span className="music-row-line2">
              {dur && <span className="music-row-stat">{dur}</span>}
              {dur && entry.spotifyReleaseDate && <span className="music-row-sep">·</span>}
              {entry.spotifyReleaseDate && (
                <span className="music-row-stat">{entry.spotifyReleaseDate}</span>
              )}
              <span className="music-row-sep">·</span>
              <span className="music-row-stat">spotify ↗</span>
            </span>
          </span>
        </a>
      )}

      {entry.href && (
        entry.external ? (
          <a href={entry.href} target="_blank" rel="noreferrer" className="atlas-detail-link">visit ↗</a>
        ) : (
          <Link href={entry.href} className="atlas-detail-link">visit →</Link>
        )
      )}
    </motion.aside>
  );
}
