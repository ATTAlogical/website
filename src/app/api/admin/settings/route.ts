import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Singleton id — there's only ever one row in SiteSettings.
const SETTINGS_ID = 1;

// GET — read current settings
export async function GET() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: SETTINGS_ID } });
  return NextResponse.json({
    settings: settings ?? { id: SETTINGS_ID, spotifyProfile: null },
  });
}

// PUT — upsert settings
export async function PUT(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body.spotifyProfile;
  let spotifyProfile: string | null = null;
  if (typeof raw === "string" && raw.trim()) {
    const url = raw.trim();
    try {
      const parsed = new URL(url);
      if (
        parsed.hostname !== "open.spotify.com" &&
        parsed.hostname !== "spotify.com" &&
        parsed.hostname !== "www.spotify.com" &&
        parsed.hostname !== "spotify.link"
      ) {
        return NextResponse.json(
          { error: "Spotify profile must be a Spotify URL (open.spotify.com)" },
          { status: 400 },
        );
      }
      spotifyProfile = url.slice(0, 500);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { spotifyProfile },
    create: { id: SETTINGS_ID, spotifyProfile },
  });

  return NextResponse.json({ settings });
}
