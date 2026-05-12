// Spotify Web API — server-side only.
// Uses client-credentials flow (no user OAuth) for public catalog data.
// Token cached in module scope (refreshed on expiry).

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

type CachedToken = { token: string; expiresAt: number };
let cached: CachedToken | null = null;

/** Returns a valid access token, refreshing if expired or missing. */
async function getToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;

  if (cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.token;
  }

  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    cached = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    };
    return cached.token;
  } catch {
    return null;
  }
}

async function authedFetch<T>(path: string): Promise<T | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ─── URL parsers ──────────────────────────────────────────────────────────────

/** Extracts the Spotify ID from a track URL like https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh?si=... */
export function extractTrackId(url: string): string | null {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/track\/([A-Za-z0-9]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function extractArtistId(url: string): string | null {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/artist\/([A-Za-z0-9]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

// ─── Types (slim — only the fields we use) ────────────────────────────────────

type SpotifyArtist = { id: string; name: string };
type SpotifyImage = { url: string; width: number; height: number };
type SpotifyAlbum = {
  id: string;
  name: string;
  release_date: string; // "YYYY-MM-DD" | "YYYY-MM" | "YYYY"
  images: SpotifyImage[];
};

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  preview_url: string | null;
  external_urls: { spotify: string };
  popularity: number;
  explicit: boolean;
};

export type SpotifyAudioFeatures = {
  id: string;
  tempo: number; // BPM
  energy: number; // 0..1
  valence: number; // 0..1
  danceability: number; // 0..1
  acousticness: number;
  instrumentalness: number;
  loudness: number;
  key: number;
  mode: number;
  time_signature: number;
};

export type SpotifyArtistDetail = {
  id: string;
  name: string;
  genres: string[];
  followers: { total: number };
  images: SpotifyImage[];
  external_urls: { spotify: string };
};

// ─── Endpoint wrappers ────────────────────────────────────────────────────────

export async function fetchTrack(id: string): Promise<SpotifyTrack | null> {
  return authedFetch<SpotifyTrack>(`/tracks/${encodeURIComponent(id)}`);
}

export async function fetchAudioFeatures(id: string): Promise<SpotifyAudioFeatures | null> {
  return authedFetch<SpotifyAudioFeatures>(`/audio-features/${encodeURIComponent(id)}`);
}

export async function fetchArtist(id: string): Promise<SpotifyArtistDetail | null> {
  return authedFetch<SpotifyArtistDetail>(`/artists/${encodeURIComponent(id)}`);
}

/** Fetches every track from every album of an artist. Albums + singles, no compilations. */
export async function fetchArtistAllTracks(artistId: string): Promise<SpotifyTrack[]> {
  const albums = await authedFetch<{
    items: Array<{ id: string; album_group: string }>;
    next: string | null;
  }>(
    `/artists/${encodeURIComponent(artistId)}/albums?include_groups=album,single&limit=50&market=US`,
  );
  if (!albums) return [];

  const albumIds = albums.items.map((a) => a.id);
  // Spotify allows batch /albums?ids=... up to 20
  const trackUrls: string[] = [];
  for (let i = 0; i < albumIds.length; i += 20) {
    const batch = albumIds.slice(i, i + 20);
    const result = await authedFetch<{
      albums: Array<{
        id: string;
        name: string;
        release_date: string;
        images: SpotifyImage[];
        tracks: { items: Array<{ id: string }> };
      }>;
    }>(`/albums?ids=${batch.join(",")}&market=US`);
    if (!result) continue;
    for (const album of result.albums) {
      for (const item of album.tracks.items) {
        trackUrls.push(item.id);
      }
    }
  }

  // De-dup track IDs (same track can appear on album + single)
  const uniqueIds = Array.from(new Set(trackUrls));
  const tracks: SpotifyTrack[] = [];
  for (let i = 0; i < uniqueIds.length; i += 50) {
    const batch = uniqueIds.slice(i, i + 50);
    const result = await authedFetch<{ tracks: SpotifyTrack[] }>(
      `/tracks?ids=${batch.join(",")}&market=US`,
    );
    if (result?.tracks) {
      for (const t of result.tracks) if (t) tracks.push(t);
    }
  }
  return tracks;
}

// ─── High-level fetcher used by admin/log ────────────────────────────────────

export type SpotifyMetaFull = {
  title: string;
  thumbnail: string | null;
  durationMs: number;
  releaseDate: string;
  artist: string;
  album: string;
  previewUrl: string | null;
  popularity: number;
  tempo: number | null;
  energy: number | null;
  valence: number | null;
  danceability: number | null;
};

/** Fetches everything in one shot for a track URL. Returns null on any failure. */
export async function fetchSpotifyMetaFull(url: string): Promise<SpotifyMetaFull | null> {
  const id = extractTrackId(url);
  if (!id) return null;
  const [track, features] = await Promise.all([
    fetchTrack(id),
    fetchAudioFeatures(id),
  ]);
  if (!track) return null;

  const thumb = track.album.images.reduce<SpotifyImage | null>((best, img) => {
    if (!best) return img;
    return img.width > best.width ? best : img; // smallest is fine for thumbnail
  }, null);

  return {
    title: `${track.name} — ${track.artists.map((a) => a.name).join(", ")}`,
    thumbnail: thumb?.url ?? null,
    durationMs: track.duration_ms,
    releaseDate: track.album.release_date,
    artist: track.artists.map((a) => a.name).join(", "),
    album: track.album.name,
    previewUrl: track.preview_url,
    popularity: track.popularity,
    tempo: features?.tempo ?? null,
    energy: features?.energy ?? null,
    valence: features?.valence ?? null,
    danceability: features?.danceability ?? null,
  };
}
