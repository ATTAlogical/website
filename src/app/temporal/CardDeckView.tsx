"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  groupByMonth,
  BRANCH_LABEL,
  TYPE_GLYPH,
  type LogEntry,
} from "@/data/log";

// ─── Entry row (compact, mobile) ──────────────────────────────────────────────

type EntryWithSpotify = LogEntry & {
  spotifyUrl?: string | null;
  spotifyTitle?: string | null;
  spotifyThumb?: string | null;
};

function EntryRow({ entry }: { entry: EntryWithSpotify }) {
  const dayNum = String(new Date(entry.date).getDate()).padStart(2, "0");
  const glyph = TYPE_GLYPH[entry.type];

  const Inner = (
    <>
      <span className="deck-row-day" aria-hidden>{dayNum}</span>
      <span className={`deck-row-branch log-branch-${entry.branch}`}>
        {BRANCH_LABEL[entry.branch]}
      </span>
      <span className="deck-row-glyph" aria-hidden>{glyph}</span>
      <span className="deck-row-title">{entry.title}</span>
      {entry.body && <span className="deck-row-body">{entry.body}</span>}
      {entry.spotifyUrl && entry.spotifyThumb && (
        <a
          href={entry.spotifyUrl}
          target="_blank"
          rel="noreferrer"
          className="deck-spotify"
          onClick={(e) => e.stopPropagation()}
        >
          <img src={entry.spotifyThumb} alt="" className="deck-spotify-cover" loading="lazy" />
          <span className="deck-spotify-title">
            {entry.spotifyTitle ?? "Listen on Spotify"}
          </span>
        </a>
      )}
    </>
  );

  if (entry.href) {
    if (entry.external) {
      return (
        <a href={entry.href} target="_blank" rel="noreferrer" className="deck-row deck-row--link">
          {Inner}
        </a>
      );
    }
    return (
      <Link href={entry.href} className="deck-row deck-row--link">
        {Inner}
      </Link>
    );
  }
  return <div className="deck-row">{Inner}</div>;
}

// ─── CardDeckView ─────────────────────────────────────────────────────────────

export default function CardDeckView({ entries }: { entries: EntryWithSpotify[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const months = useMemo(() => Array.from(groupByMonth(entries).entries()), [entries]);
  const [current, setCurrent] = useState(0);

  // Track which card is centered
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const idx = Math.round(track.scrollLeft / track.clientWidth);
      setCurrent(idx);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [months.length]);

  const jumpTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="deck-stage">
      <p className="deck-hint">
        <em>swipe sideways to move through time</em>
      </p>

      <div className="deck-track" ref={trackRef} tabIndex={-1}>
        {months.map(([monthLabel, monthEntries]) => (
          <article key={monthLabel} className="deck-card" aria-label={monthLabel}>
            <header className="deck-card-head">
              <h2 className="deck-card-month">{monthLabel}</h2>
              <span className="deck-card-count">
                {monthEntries.length} {monthEntries.length === 1 ? "entry" : "entries"}
              </span>
              <span className="deck-card-rule" aria-hidden />
            </header>
            <ol className="deck-card-rows">
              {monthEntries.map((entry, i) => (
                <li key={`${entry.slug}-${i}`} className="deck-card-row-item">
                  <EntryRow entry={entry} />
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>

      <div className="deck-pager" role="tablist" aria-label="Months">
        {months.map(([monthLabel], i) => (
          <button
            key={monthLabel}
            type="button"
            role="tab"
            aria-selected={i === current}
            aria-label={`Go to ${monthLabel}`}
            className={`deck-dot${i === current ? " deck-dot--current" : ""}`}
            onClick={() => jumpTo(i)}
          />
        ))}
      </div>

      <div className="deck-current-label" aria-live="polite">
        {months[current]?.[0] ?? ""}
      </div>
    </div>
  );
}
