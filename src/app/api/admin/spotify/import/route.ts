import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  fetchArtistAllAlbums,
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

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base || `album-${Date.now()}`;
  let n = 0;
  while (await prisma.logEntry.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${base}-${n}`.slice(0, 81);
  }
  return candidate;
}

function parseReleaseDate(raw: string): Date {
  // Spotify returns "YYYY", "YYYY-MM", or "YYYY-MM-DD"
  if (raw.length === 4) return new Date(`${raw}-01-01`);
  if (raw.length === 7) return new Date(`${raw}-01`);
  return new Date(raw);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }

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
      ? "Spotify credentials are missing or invalid (SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET)."
      : reason === "artist-not-found"
      ? `Artist API call failed for ID "${artistId}".${statusDetail}`
      : reason === "no-albums"
      ? `Artist exists but has zero albums/singles on Spotify yet.${statusDetail}`
      : `Spotify returned no albums.${statusDetail}`;
    return NextResponse.json(
      { error: reasonText, artistId, reason },
      { status: 502 },
    );
  }

  // Skip albums we already have, matched by Spotify URL
  const existingByUrl = await prisma.logEntry.findMany({
    where: { branch: "ckore", spotifyUrl: { not: null } },
    select: { spotifyUrl: true },
  });
  const existingUrls = new Set(existingByUrl.map((e) => e.spotifyUrl).filter(Boolean));

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const album of albums) {
    const url = album.external_urls?.spotify;
    if (!url) {
      skipped += 1;
      continue;
    }
    if (existingUrls.has(url)) {
      skipped += 1;
      continue;
    }

    // Pick the smallest cover image (good for thumbnail / sidebar)
    const thumb = album.images.reduce<{ url: string; width: number } | null>(
      (best, img) => (!best ? img : img.width < best.width ? img : best),
      null,
    );

    const baseSlug = slugify(album.name);
    const slug = await uniqueSlug(baseSlug);
    const artists = album.artists.map((a) => a.name).join(", ");

    try {
      await prisma.logEntry.create({
        data: {
          slug,
          date: parseReleaseDate(album.release_date),
          branch: "ckore",
          type: "album",
          title: album.name,
          body: null,
          href: null,
          external: false,
          links: [],
          spotifyUrl: url,
          spotifyTitle: `${album.name} — ${artists}`,
          spotifyThumb: thumb?.url ?? null,
          spotifyReleaseDate: album.release_date,
          spotifyArtist: artists,
          spotifyAlbum: album.name,
          // Album-level entries don't have per-track fields:
          spotifyDurationMs: null,
          spotifyPreviewUrl: null,
          spotifyPopularity: null,
          spotifyTempo: null,
          spotifyEnergy: null,
          spotifyValence: null,
          spotifyDanceability: null,
        },
      });
      created += 1;
    } catch (e) {
      errors.push(`${album.name}: ${e instanceof Error ? e.message : "create failed"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    skipped,
    total: albums.length,
    errors: errors.slice(0, 10),
  });
}
