import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Delete every CKORE entry that originated from a Spotify import.
 *
 * Heuristic: branch="ckore" + has a non-null spotifyUrl. This catches every
 * imported album and track, plus any CKORE entry the admin created with a
 * Spotify URL. Manual notes / sessions without a Spotify URL are NOT deleted.
 *
 * Use this when imports got duplicated or the schema changed and you want
 * to start fresh, then re-run /api/admin/spotify/import.
 */
export async function POST() {
  const result = await prisma.logEntry.deleteMany({
    where: {
      branch: "ckore",
      spotifyUrl: { not: null },
    },
  });
  return NextResponse.json({ deleted: result.count });
}
