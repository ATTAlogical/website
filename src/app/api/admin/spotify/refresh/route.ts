import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchSpotifyMetaFull } from "@/lib/spotifyApi";

/** Re-fetches Spotify metadata for every CKORE entry that has a spotifyUrl.
 *  Useful after first turning on Spotify Web API credentials — fills in all
 *  the new fields on previously-created entries.
 */
export async function POST() {
  const entries = await prisma.logEntry.findMany({
    where: { branch: "ckore", spotifyUrl: { not: null } },
  });

  let refreshed = 0;
  let failed = 0;
  for (const e of entries) {
    if (!e.spotifyUrl) continue;
    const meta = await fetchSpotifyMetaFull(e.spotifyUrl);
    if (!meta) {
      failed += 1;
      continue;
    }
    await prisma.logEntry.update({
      where: { id: e.id },
      data: {
        spotifyTitle: meta.title,
        spotifyThumb: meta.thumbnail,
        spotifyDurationMs: meta.durationMs || null,
        spotifyReleaseDate: meta.releaseDate || null,
        spotifyArtist: meta.artist,
        spotifyAlbum: meta.album,
        spotifyPreviewUrl: meta.previewUrl,
        spotifyPopularity: meta.popularity,
        spotifyTempo: meta.tempo,
        spotifyEnergy: meta.energy,
        spotifyValence: meta.valence,
        spotifyDanceability: meta.danceability,
      },
    });
    refreshed += 1;
  }

  return NextResponse.json({ refreshed, failed, total: entries.length });
}
