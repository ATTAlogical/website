"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LOG_ENTRIES,
  BRANCH_LABEL,
  TYPE_GLYPH,
  groupByMonth,
  type LogEntry,
} from "@/data/log";

// ─── Live timestamp ────────────────────────────────────────────────────────────

function LiveTimestamp() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!now) {
    return <span className="log-stamp" aria-label="Current time">— — — — — — —</span>;
  }

  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return (
    <span className="log-stamp" aria-live="off">
      {yyyy}-{mm}-{dd} · {hh}:{mi}:{ss}
    </span>
  );
}

// ─── Entry row ────────────────────────────────────────────────────────────────

function EntryRow({ entry }: { entry: LogEntry }) {
  const dayNum = String(new Date(entry.date).getDate()).padStart(2, "0");
  const glyph = TYPE_GLYPH[entry.type];
  const branchKey = entry.branch;

  const Inner = (
    <>
      <span className="log-row-day" aria-hidden>{dayNum}</span>
      <span className={`log-row-branch log-branch-${branchKey}`}>
        {BRANCH_LABEL[entry.branch]}
      </span>
      <span className="log-row-glyph" aria-hidden>{glyph}</span>
      <span className="log-row-title">{entry.title}</span>
      {entry.body && (
        <span className="log-row-body">{entry.body}</span>
      )}
    </>
  );

  if (entry.href) {
    if (entry.external) {
      return (
        <a href={entry.href} target="_blank" rel="noreferrer" className="log-row log-row--link">
          {Inner}
        </a>
      );
    }
    return (
      <Link href={entry.href} className="log-row log-row--link">
        {Inner}
      </Link>
    );
  }
  return <div className="log-row">{Inner}</div>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TemporalPage() {
  // Unlock scroll — globals.css sets overflow:hidden on html/body
  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const months = groupByMonth(LOG_ENTRIES);
  const monthEntries = Array.from(months.entries());

  return (
    <main className="log-page">
      <header className="log-masthead">
        <Link href="/" className="log-masthead-back" aria-label="Back to ATTA logical">
          ← atta logical
        </Link>
        <LiveTimestamp />
      </header>

      <section className="log-lede">
        <h1 className="log-lede-title">the log</h1>
        <p className="log-lede-sub">
          Chronological record of the ATTA logical universe. Newest at the top.
          Scroll down to move backward through time.
        </p>

        <ul className="log-legend" aria-label="Legend">
          <li>
            <span className="log-legend-mark log-branch-atta">ATTA</span>
            <span className="log-legend-label">attalogical</span>
          </li>
          <li>
            <span className="log-legend-mark log-branch-laugical">LAUG</span>
            <span className="log-legend-label">laugical</span>
          </li>
          <li>
            <span className="log-legend-mark log-branch-ckore">CKORE</span>
            <span className="log-legend-label">ATTA.CKORE</span>
          </li>
        </ul>
      </section>

      <section className="log-stream" aria-label="Log entries">
        {monthEntries.map(([monthLabel, entries]) => (
          <div key={monthLabel} className="log-month">
            <h2 className="log-month-title">{monthLabel}</h2>
            <div className="log-month-rule" aria-hidden />
            <ol className="log-rows">
              {entries.map((entry, i) => (
                <li key={`${entry.date}-${i}`} className="log-row-item">
                  <EntryRow entry={entry} />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>

      <footer className="log-footer">
        <span className="log-footer-mark" aria-hidden>◇</span>
        <p className="log-footer-text">end of record. before this, the unwritten.</p>
      </footer>
    </main>
  );
}
