import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchArtistAllTracksDiag, fetchAudioFeatures, extractArtistId } from "@/lib/spotifyApi";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 81);
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base || `track-${Date.now()}`;
  let n = 0;
  while (await prisma.logEntry.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${base}-${n}`.slice(0, 81);
  }
  return candidate;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine — fall back to settings */
  }

  // Resolve artist ID: from request body, or from SiteSettings.spotifyArtistId,
  // or extracted from SiteSettings.spotifyProfile URL.
  let artistId: string | null = null;
  if (typeof body.artistId === "string" && body.artistId.trim()) {
    artistId = body.artistId.trim();
  } else {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    artistId = settings?.spotifyArtistId
      ?? (settings?.spotifyProfile ? extractArtistId(settings.spotifyProfile) : null);
  }

  if (!artistId) {
    return NextResponse.json(
      { error: "No artist ID configured. Set one in /admin/settings or pass it in the request body." },
      { status: 400 },
    );
  }

  const { tracks, reason, albumCount } = await fetchArtistAllTracksDiag(artistId);
  if (tracks.length === 0) {
    const reasonText = reason === "no-token"
      ? "Spotify credentials are missing or invalid (SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET)."
      : reason === "artist-not-found"
      ? `Artist ID "${artistId}" returned 404 from Spotify. Make sure you pasted only the alphanumeric ID — the part after /artist/ in the URL.`
      : reason === "no-albums"
      ? `Artist exists but has zero albums/singles on Spotify yet.`
      : reason === "no-tracks-in-albums"
      ? `Artist has ${albumCount ?? "some"} albums but no tracks inside them. This is unusual — try a different artist.`
      : "Spotify returned no tracks. Unknown cause.";
    return NextResponse.json(
      { error: reasonText, artistId, reason },
      { status: 502 },
    );
  }

  // Find tracks we already have (by spotifyUrl) so we don't duplicate
  const existingByUrl = await prisma.logEntry.findMany({
    where: { branch: "ckore", spotifyUrl: { not: null } },
    select: { spotifyUrl: true },
  });
  const existingUrls = new Set(existingByUrl.map((e) => e.spotifyUrl).filter(Boolean));

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const track of tracks) {
    const url = track.external_urls?.spotify;
    if (!url) {
      skipped += 1;
      continue;
    }
    if (existingUrls.has(url)) {
      skipped += 1;
      continue;
    }

    const features = await fetchAudioFeatures(track.id);
    const thumb = track.album.images.reduce<{ url: string; width: number } | null>(
      (best, img) => (!best ? img : img.width < best.width ? img : best),
      null,
    );
    const baseSlug = slugify(track.name);
    const slug = await uniqueSlug(baseSlug);

    try {
      await prisma.logEntry.create({
        data: {
          slug,
          date: new Date(track.album.release_date.length === 4
            ? `${track.album.release_date}-01-01`
            : track.album.release_date.length === 7
            ? `${track.album.release_date}-01`
            : track.album.release_date),
          branch: "ckore",
          type: "track",
          title: track.name,
          body: null,
          href: null,
          external: false,
          links: [],
          spotifyUrl: url,
          spotifyTitle: `${track.name} — ${track.artists.map((a) => a.name).join(", ")}`,
          spotifyThumb: thumb?.url ?? null,
          spotifyDurationMs: track.duration_ms,
          spotifyReleaseDate: track.album.release_date,
          spotifyArtist: track.artists.map((a) => a.name).join(", "),
          spotifyAlbum: track.album.name,
          spotifyPreviewUrl: track.preview_url,
          spotifyPopularity: track.popularity,
          spotifyTempo: features?.tempo ?? null,
          spotifyEnergy: features?.energy ?? null,
          spotifyValence: features?.valence ?? null,
          spotifyDanceability: features?.danceability ?? null,
        },
      });
      created += 1;
    } catch (e) {
      errors.push(`${track.name}: ${e instanceof Error ? e.message : "create failed"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    skipped,
    total: tracks.length,
    errors: errors.slice(0, 10),
  });
}
