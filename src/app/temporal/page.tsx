import Link from "next/link";
import { prisma } from "@/lib/db";
import type { LogEntry } from "@/data/log";
import TemporalClient from "./TemporalClient";
import LiveTimestamp from "./LiveTimestamp";
import MastheadTitle from "./MastheadTitle";

export const dynamic = "force-dynamic";

export default async function TemporalPage() {
  const [rows, settings] = await Promise.all([
    prisma.logEntry.findMany({ orderBy: { date: "desc" } }),
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
  ]);

  // Shape into the existing LogEntry type (the view code already understands this shape)
  const entries = rows.map((r) => ({
    slug: r.slug,
    date: r.date.toISOString().slice(0, 10),
    branch: r.branch as LogEntry["branch"],
    type: r.type as LogEntry["type"],
    title: r.title,
    body: r.body ?? undefined,
    href: r.href ?? undefined,
    external: r.external,
    links: r.links,
    parentSlug: r.parentSlug,
    spotifyUrl: r.spotifyUrl,
    spotifyTitle: r.spotifyTitle,
    spotifyThumb: r.spotifyThumb,
    spotifyDurationMs: r.spotifyDurationMs,
    spotifyReleaseDate: r.spotifyReleaseDate,
    spotifyArtist: r.spotifyArtist,
    spotifyAlbum: r.spotifyAlbum,
    spotifyPreviewUrl: r.spotifyPreviewUrl,
    spotifyPopularity: r.spotifyPopularity,
    spotifyTempo: r.spotifyTempo,
    spotifyEnergy: r.spotifyEnergy,
    spotifyValence: r.spotifyValence,
    spotifyDanceability: r.spotifyDanceability,
  }));

  return (
    <main className="log-page">
      <header className="log-masthead">
        <Link href="/" className="log-masthead-back" aria-label="Back to ATTA logical">
          ← ATTA logical
        </Link>
        <MastheadTitle />
        <LiveTimestamp />
      </header>

      <TemporalClient
        entries={entries}
        spotifyProfile={settings?.spotifyProfile ?? null}
        showVanity={settings?.showSpotifyVanity ?? false}
      />
    </main>
  );
}
