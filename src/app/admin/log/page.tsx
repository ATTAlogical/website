import LogManager from "./LogManager";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLogPage() {
  const rows = await prisma.logEntry.findMany({ orderBy: { date: "desc" } });
  // Pre-serialize dates as YYYY-MM-DD strings so the client gets plain JSON
  const entries = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    date: r.date.toISOString().slice(0, 10),
    branch: r.branch,
    type: r.type,
    title: r.title,
    body: r.body,
    href: r.href,
    external: r.external,
    links: r.links,
    spotifyUrl: r.spotifyUrl,
    spotifyTitle: r.spotifyTitle,
    spotifyThumb: r.spotifyThumb,
  }));

  return <LogManager initialEntries={entries} />;
}
