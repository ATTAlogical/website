// One-time seed: copies the static LOG_ENTRIES from src/data/log.ts into the
// database. Idempotent — uses upsert by slug, so re-running is safe.
//
// Run with: npx prisma db seed
//
// After this runs once on a fresh DB, the database becomes the source of
// truth. The TS file stays as a code-level fallback / git-tracked history.

// Load .env into process.env BEFORE importing Prisma. Prisma's `db seed`
// command doesn't reliably pass env to the tsx subprocess, so we parse the
// .env file manually here. No dependencies, no surprises.
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  for (const filename of [".env", ".env.local"]) {
    const filePath = path.resolve(process.cwd(), filename);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.replace(/^﻿/, ""); // strip BOM if any
      if (!line || line.trim().startsWith("#")) continue;
      const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match) continue;
      let value = match[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      // Don't overwrite existing process.env values (Vercel etc.)
      if (process.env[match[1]] === undefined) {
        process.env[match[1]] = value;
      }
    }
  }
}

loadEnv();

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL not set after loading .env.");
  console.error("       cwd:", process.cwd());
  console.error("       Make sure .env exists in the project root with DATABASE_URL=...");
  process.exit(1);
}

import { PrismaClient } from "@prisma/client";
import { LOG_ENTRIES } from "../src/data/log";
import { fetchSpotifyMeta } from "../src/lib/spotify";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${LOG_ENTRIES.length} log entries…`);

  for (const entry of LOG_ENTRIES) {
    // Type assertion guard: seed file is statically typed
    type SeedEntry = typeof entry & { spotifyUrl?: string | null };
    const e = entry as SeedEntry;

    // Fetch Spotify metadata if applicable
    const spotifyUrl = e.spotifyUrl ?? null;
    let spotifyTitle: string | null = null;
    let spotifyThumb: string | null = null;
    if (entry.branch === "ckore" && spotifyUrl) {
      try {
        const meta = await fetchSpotifyMeta(spotifyUrl);
        spotifyTitle = meta?.title ?? null;
        spotifyThumb = meta?.thumbnail ?? null;
      } catch {
        // ignore
      }
    }

    await prisma.logEntry.upsert({
      where: { slug: entry.slug },
      update: {
        date: new Date(entry.date),
        branch: entry.branch,
        type: entry.type,
        title: entry.title,
        body: entry.body ?? null,
        href: entry.href ?? null,
        external: entry.external ?? false,
        links: entry.links ?? [],
        spotifyUrl,
        spotifyTitle,
        spotifyThumb,
      },
      create: {
        slug: entry.slug,
        date: new Date(entry.date),
        branch: entry.branch,
        type: entry.type,
        title: entry.title,
        body: entry.body ?? null,
        href: entry.href ?? null,
        external: entry.external ?? false,
        links: entry.links ?? [],
        spotifyUrl,
        spotifyTitle,
        spotifyThumb,
      },
    });
    console.log(`  ✓ ${entry.slug}`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
