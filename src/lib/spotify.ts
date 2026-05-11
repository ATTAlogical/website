// Spotify oEmbed — public, unauthenticated, gives us title + album-art thumbnail
// for any Spotify URL (track / album / artist / playlist). Called server-side
// only, when an admin saves a CKORE entry with a Spotify URL.

type SpotifyOEmbed = {
  title: string;
  thumbnail_url: string;
  html: string;
  provider_name: string;
};

export type SpotifyMeta = {
  title: string;
  thumbnail: string;
};

/**
 * Fetch metadata for a Spotify URL. Returns null on any failure — never throws.
 * Caller should null out spotifyTitle/spotifyThumb when this returns null.
 */
export async function fetchSpotifyMeta(url: string): Promise<SpotifyMeta | null> {
  if (!url) return null;
  // Normalize / validate — must be open.spotify.com URL
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "open.spotify.com" && parsed.hostname !== "spotify.link") {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
      headers: { Accept: "application/json" },
      // No need to cache aggressively; admin saves are infrequent
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
