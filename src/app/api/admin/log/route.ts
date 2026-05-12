import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchSpotifyMetaFull } from "@/lib/spotifyApi";

const VALID_BRANCHES = ["atta", "laugical", "ckore"] as const;
const VALID_TYPES = ["build", "project", "track", "drop", "profile", "note", "milestone"] as const;

type Branch = (typeof VALID_BRANCHES)[number];
type LogType = (typeof VALID_TYPES)[number];

// GET — list all entries, newest first
export async function GET() {
  const entries = await prisma.logEntry.findMany({
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ entries });
}

// POST — create new entry
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseEntryInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  // Ensure slug is unique
  const existing = await prisma.logEntry.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: `Slug "${parsed.data.slug}" is already in use` }, { status: 409 });
  }

  // Fetch full Spotify metadata if applicable (CKORE + URL provided)
  const spotify =
    parsed.data.branch === "ckore" && parsed.data.spotifyUrl
      ? await fetchSpotifyMetaFull(parsed.data.spotifyUrl)
      : null;

  const created = await prisma.logEntry.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      spotifyTitle: spotify?.title ?? null,
      spotifyThumb: spotify?.thumbnail ?? null,
      spotifyDurationMs: spotify?.durationMs ?? null,
      spotifyReleaseDate: spotify?.releaseDate ?? null,
      spotifyArtist: spotify?.artist ?? null,
      spotifyAlbum: spotify?.album ?? null,
      spotifyPreviewUrl: spotify?.previewUrl ?? null,
      spotifyPopularity: spotify?.popularity ?? null,
      spotifyTempo: spotify?.tempo ?? null,
      spotifyEnergy: spotify?.energy ?? null,
      spotifyValence: spotify?.valence ?? null,
      spotifyDanceability: spotify?.danceability ?? null,
    },
  });

  return NextResponse.json({ entry: created }, { status: 201 });
}

// ─── input parsing ────────────────────────────────────────────────────────────

type ParsedInput = {
  slug: string;
  date: string;
  branch: Branch;
  type: LogType;
  title: string;
  body: string | null;
  href: string | null;
  external: boolean;
  links: string[];
  spotifyUrl: string | null;
};

export function parseEntryInput(
  raw: Record<string, unknown>,
): { ok: true; data: ParsedInput } | { ok: false; error: string } {
  const slug = String(raw.slug ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(slug)) {
    return { ok: false, error: "Slug must be kebab-case, 1–81 chars" };
  }

  const date = String(raw.date ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Date must be YYYY-MM-DD" };
  }

  const branch = String(raw.branch ?? "").trim() as Branch;
  if (!VALID_BRANCHES.includes(branch)) {
    return { ok: false, error: `Branch must be one of ${VALID_BRANCHES.join(", ")}` };
  }

  const type = String(raw.type ?? "").trim() as LogType;
  if (!VALID_TYPES.includes(type)) {
    return { ok: false, error: `Type must be one of ${VALID_TYPES.join(", ")}` };
  }

  const title = String(raw.title ?? "").trim();
  if (title.length === 0 || title.length > 200) {
    return { ok: false, error: "Title is required (1–200 chars)" };
  }

  const body = raw.body == null || raw.body === "" ? null : String(raw.body).slice(0, 2000);
  const href = raw.href == null || raw.href === "" ? null : String(raw.href).slice(0, 500);
  const external = Boolean(raw.external);

  const linksRaw = Array.isArray(raw.links) ? raw.links : [];
  const links = linksRaw
    .map((s) => String(s).trim().toLowerCase())
    .filter((s) => /^[a-z0-9][a-z0-9-]{0,80}$/.test(s));

  const spotifyUrl = raw.spotifyUrl == null || raw.spotifyUrl === ""
    ? null
    : String(raw.spotifyUrl).slice(0, 500);

  return {
    ok: true,
    data: { slug, date, branch, type, title, body, href, external, links, spotifyUrl },
  };
}
