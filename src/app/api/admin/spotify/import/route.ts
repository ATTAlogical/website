import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  fetchArtistAllAlbums,
  fetchAlbumTracks,
  fetchAudioFeatures,
  extractArtistId,
  lastFetchError,
} from "@/lib/spotifyApi";

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

async function uniqueSlug(base: string, taken: Set<string>): Promise<string> {
  let candidate = base || `entry-${Date.now()}`;
  if (!taken.has(candidate)) {
    const existing = await prisma.logEntry.findUnique({ where: { slug: candidate } });
    if (!existing) {
      taken.add(candidate);
      return candidate;
    }
  }
  let n = 0;
  while (true) {
    n += 1;
    const next = `${base}-${n}`.slice(0, 81);
    if (taken.has(next)) continue;
    const existing = await prisma.logEntry.findUnique({ where: { slug: next } });
    if (!existing) {
      taken.add(next);
      return next;
    }
  }
}

function parseReleaseDate(raw: string): Date {
  if (raw.length === 4) return new Date(`${raw}-01-01`);
  if (raw.length === 7) return new Date(`${raw}-01`);
  return new Date(raw);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch { /* empty body is fine */ }

  // Resolve artist ID
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

  const { albums, reason } = await fetchArtistAllAlbums(artistId);
  if (albums.length === 0) {
    const err = lastFetchError;
    const statusDetail = err
      ? ` Spotify returned ${err.status} ${err.statusText} on ${err.path}${err.body ? ` — body: ${err.body}` : ""}.`
      : "";
    const reasonText = reason === "no-token"
      ? "Spotify credentials are missing or invalid."
      : reason === "artist-not-found"
      ? `Artist API call failed for ID "${artistId}".${statusDetail}`
      : reason === "no-albums"
      ? `Artist exists but has zero albums/singles on Spotify yet.${statusDetail}`
      : `Spotify returned no albums.${statusDetail}`;
    return NextResponse.json({ error: reasonText, artistId, reason }, { status: 502 });
  }

  // Existing entries by URL — used to skip duplicates
  const existingByUrl = await prisma.logEntry.findMany({
    where: { branch: "ckore", spotifyUrl: { not: null } },
    select: { spotifyUrl: true, slug: true },
  });
  const existingUrls = new Set(existingByUrl.map((e) => e.spotifyUrl).filter(Boolean) as string[]);
  const slugsTaken = new Set<string>(existingByUrl.map((e) => e.slug));

  let albumsCreated = 0;
  let tracksCreated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const album of albums) {
    const albumUrl = album.external_urls?.spotify;
    if (!albumUrl) { skipped += 1; continue; }

    // Create the album entry (if not already in log)
    let albumSlug: string;
    if (existingUrls.has(albumUrl)) {
      const existing = await prisma.logEntry.findFirst({ where: { spotifyUrl: albumUrl } });
      albumSlug = existing?.slug ?? slugify(album.name);
      skipped += 1;
    } else {
      const thumb = album.images.reduce<{ url: string; width: number } | null>(
        (best, img) => (!best ? img : img.width < best.width ? img : best),
        null,
      );
      albumSlug = await uniqueSlug(slugify(album.name), slugsTaken);
      const artists = album.artists.map((a) => a.name).join(", ");
      try {
        await prisma.logEntry.create({
          data: {
            slug: albumSlug,
            date: parseReleaseDate(album.release_date),
            branch: "ckore",
            type: "album",
            title: album.name,
            body: null,
            href: null,
            external: false,
            links: [],
            parentSlug: null,
            spotifyUrl: albumUrl,
            spotifyTitle: `${album.name} — ${artists}`,
            spotifyThumb: thumb?.url ?? null,
            spotifyReleaseDate: album.release_date,
            spotifyArtist: artists,
            spotifyAlbum: album.name,
            spotifyDurationMs: null,
            spotifyPreviewUrl: null,
            spotifyPopularity: null,
            spotifyTempo: null,
            spotifyEnergy: null,
            spotifyValence: null,
            spotifyDanceability: null,
          },
        });
        albumsCreated += 1;
        existingUrls.add(albumUrl);
      } catch (e) {
        errors.push(`album "${album.name}": ${e instanceof Error ? e.message : "create failed"}`);
        continue;
      }
    }

    // Now fetch the album's tracks and create each as a child entry
    const tracks = await fetchAlbumTracks(album.id);
    for (const track of tracks) {
      const trackUrl = track.external_urls?.spotify;
      if (!trackUrl) continue;
      if (existingUrls.has(trackUrl)) { skipped += 1; continue; }

      const features = await fetchAudioFeatures(track.id);
      const artists = track.artists.map((a) => a.name).join(", ");

      const trackSlug = await uniqueSlug(slugify(track.name), slugsTaken);
      try {
        await prisma.logEntry.create({
          data: {
            slug: trackSlug,
            date: parseReleaseDate(album.release_date),
            branch: "ckore",
            type: "track",
            title: track.name,
            body: null,
            href: null,
            external: false,
            links: [],
            parentSlug: albumSlug, // child of its album
            spotifyUrl: trackUrl,
            spotifyTitle: `${track.name} — ${artists}`,
            spotifyThumb: track.album?.images?.[0]?.url ?? null,
            spotifyDurationMs: track.duration_ms,
            spotifyReleaseDate: album.release_date,
            spotifyArtist: artists,
            spotifyAlbum: album.name,
            spotifyPreviewUrl: track.preview_url,
            spotifyPopularity: track.popularity,
            spotifyTempo: features?.tempo ?? null,
            spotifyEnergy: features?.energy ?? null,
            spotifyValence: features?.valence ?? null,
            spotifyDanceability: features?.danceability ?? null,
          },
        });
        tracksCreated += 1;
        existingUrls.add(trackUrl);
      } catch (e) {
        errors.push(`track "${track.name}": ${e instanceof Error ? e.message : "create failed"}`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    created: albumsCreated + tracksCreated,
    albumsCreated,
    tracksCreated,
    skipped,
    total: albums.length,
    errors: errors.slice(0, 10),
  });
}
