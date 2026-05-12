// Spotify metadata — uses the authenticated Web API when SPOTIFY_CLIENT_ID +
// SPOTIFY_CLIENT_SECRET are set (full metadata: duration, release date, audio
// features, etc.). Falls back to public oEmbed (title + thumbnail only) when
// credentials are missing. Server-side only.

import { fetchSpotifyMetaFull, type SpotifyMetaFull } from "./spotifyApi";

type SpotifyOEmbed = {
  title: string;
  thumbnail_url: string;
};

export type SpotifyMeta = {
  title: string;
  thumbnail: string;
};

/** Light-touch oEmbed fallback when full Web API credentials are missing. */
async function fetchOEmbed(url: string): Promise<SpotifyMeta | null> {
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as SpotifyOEmbed;
    if (!data?.title || !data?.thumbnail_url) return null;
    return { title: data.title, thumbnail: data.thumbnail_url };
  } catch {
    return null;
  }
}

/**
 * Returns title + thumbnail for any Spotify URL. Used as a back-compat shim.
 * Prefer fetchSpotifyMetaFull when you need duration / release date / features.
 */
export async function fetchSpotifyMeta(url: string): Promise<SpotifyMeta | null> {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "open.spotify.com" && parsed.hostname !== "spotify.link") {
      return null;
    }
  } catch {
    return null;
  }

  // Prefer Web API for tracks (gives us more data) — but still degrade to oEmbed
  if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
    const full = await fetchSpotifyMetaFull(url);
    if (full && full.thumbnail) {
      return { title: full.title, thumbnail: full.thumbnail };
    }
  }

  return fetchOEmbed(url);
}

export type { SpotifyMetaFull };
