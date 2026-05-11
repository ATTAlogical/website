import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchSpotifyMeta } from "@/lib/spotify";
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

  // Refresh Spotify metadata only if URL changed and branch is ckore
  let spotifyTitle = existing.spotifyTitle;
  let spotifyThumb = existing.spotifyThumb;
  if (parsed.data.branch !== "ckore" || !parsed.data.spotifyUrl) {
    spotifyTitle = null;
    spotifyThumb = null;
  } else if (parsed.data.spotifyUrl !== existing.spotifyUrl) {
    const meta = await fetchSpotifyMeta(parsed.data.spotifyUrl);
    spotifyTitle = meta?.title ?? null;
    spotifyThumb = meta?.thumbnail ?? null;
  }

  const updated = await prisma.logEntry.update({
    where: { id },
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      spotifyTitle,
      spotifyThumb,
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
