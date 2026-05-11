import Link from "next/link";
import { prisma } from "@/lib/db";
import type { LogEntry } from "@/data/log";
import TemporalClient from "./TemporalClient";
import LiveTimestamp from "./LiveTimestamp";

export const dynamic = "force-dynamic";

export default async function TemporalPage() {
  const rows = await prisma.logEntry.findMany({ orderBy: { date: "desc" } });

  // Shape into the existing LogEntry type (the view code already understands this shape)
  const entries: (LogEntry & {
    spotifyUrl?: string | null;
    spotifyTitle?: string | null;
    spotifyThumb?: string | null;
  })[] = rows.map((r) => ({
    slug: r.slug,
    date: r.date.toISOString().slice(0, 10),
    branch: r.branch as LogEntry["branch"],
    type: r.type as LogEntry["type"],
    title: r.title,
    body: r.body ?? undefined,
    href: r.href ?? undefined,
    external: r.external,
    links: r.links,
    spotifyUrl: r.spotifyUrl,
    spotifyTitle: r.spotifyTitle,
    spotifyThumb: r.spotifyThumb,
  }));

  return (
    <main className="log-page">
      <header className="log-masthead">
        <Link href="/" className="log-masthead-back" aria-label="Back to ATTA logical">
          ← ATTA logical
        </Link>
        <TemporalMastheadTitle />
        <LiveTimestamp />
      </header>

      <TemporalClient entries={entries} />
    </main>
  );
}

// Tiny client wrapper just for the conditional masthead title (the page itself stays server)
function TemporalMastheadTitle() {
  return <span className="log-masthead-title" aria-hidden>the log</span>;
}
