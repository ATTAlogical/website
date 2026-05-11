"use client";

import { motion } from "motion/react";
import type { TemporalEntry } from "./TemporalClient";

export default function MusicSidebar({ entries }: { entries: TemporalEntry[] }) {
  return (
    <motion.aside
      className="music-sidebar"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      aria-label="CKORE tracks with Spotify"
    >
      <div className="music-sidebar-head">
        <span>CKORE</span>
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
  );
}
