import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchSpotifyMetaFull } from "@/lib/spotifyApi";
import { parseEntryInput } from "../route";

// PUT — update an entry
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseEntryInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  // If the user changed the slug, ensure new one is unique (excluding self)
  const existing = await prisma.logEntry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.slug !== parsed.data.slug) {
    const dupe = await prisma.logEntry.findUnique({ where: { slug: parsed.data.slug } });
    if (dupe) {
      return NextResponse.json({ error: `Slug "${parsed.data.slug}" is already in use` }, { status: 409 });
    }
  }

  // Refresh full Spotify metadata when:
  //  - branch becomes non-ckore or URL is removed → null everything
  //  - CKORE + URL is present → always refetch (so existing entries get filled
  //    in on save; cost is one API call per save, which is fine for admin use)
  let spotifyFields: Partial<{
    spotifyTitle: string | null;
    spotifyThumb: string | null;
    spotifyDurationMs: number | null;
    spotifyReleaseDate: string | null;
    spotifyArtist: string | null;
    spotifyAlbum: string | null;
    spotifyPreviewUrl: string | null;
    spotifyPopularity: number | null;
    spotifyTempo: number | null;
    spotifyEnergy: number | null;
    spotifyValence: number | null;
    spotifyDanceability: number | null;
  }> = {};

  if (parsed.data.branch !== "ckore" || !parsed.data.spotifyUrl) {
    spotifyFields = {
      spotifyTitle: null, spotifyThumb: null,
      spotifyDurationMs: null, spotifyReleaseDate: null,
      spotifyArtist: null, spotifyAlbum: null, spotifyPreviewUrl: null,
      spotifyPopularity: null, spotifyTempo: null, spotifyEnergy: null,
      spotifyValence: null, spotifyDanceability: null,
    };
  } else {
    const meta = await fetchSpotifyMetaFull(parsed.data.spotifyUrl);
    spotifyFields = {
      spotifyTitle: meta?.title ?? null,
      spotifyThumb: meta?.thumbnail ?? null,
      spotifyDurationMs: meta?.durationMs ?? null,
      spotifyReleaseDate: meta?.releaseDate ?? null,
      spotifyArtist: meta?.artist ?? null,
      spotifyAlbum: meta?.album ?? null,
      spotifyPreviewUrl: meta?.previewUrl ?? null,
      spotifyPopularity: meta?.popularity ?? null,
      spotifyTempo: meta?.tempo ?? null,
      spotifyEnergy: meta?.energy ?? null,
      spotifyValence: meta?.valence ?? null,
      spotifyDanceability: meta?.danceability ?? null,
    };
  }

  const updated = await prisma.logEntry.update({
    where: { id },
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      ...spotifyFields,
    },
  });

  return NextResponse.json({ entry: updated });
}

// DELETE — remove an entry
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.logEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
