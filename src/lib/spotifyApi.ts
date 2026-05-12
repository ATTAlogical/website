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

/** Last failure captured for diagnostics. Read by the import endpoint to
 *  surface the actual HTTP status in error messages. */
export let lastFetchError: { status: number; statusText: string; body: string; path: string } | null = null;

async function authedFetch<T>(path: string): Promise<T | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      let body = "";
      try {
        body = (await res.text()).slice(0, 200);
      } catch { /* ignore */ }
      lastFetchError = {
        status: res.status,
        statusText: res.statusText,
        body,
        path,
      };
      console.error(`[spotify] ${res.status} ${res.statusText} on ${path}:`, body);
      return null;
    }
    lastFetchError = null;
    return (await res.json()) as T;
  } catch (e) {
    lastFetchError = {
      status: 0,
      statusText: e instanceof Error ? e.message : "fetch failed",
      body: "",
      path,
    };
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

/** Fetch every track on an album (paginated). Uses /albums/{id}/tracks which
 *  is more permissive on client-credentials than the batch /tracks?ids= form. */
export async function fetchAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
  type Page = {
    items: Array<{
      id: string;
      name: string;
      artists: SpotifyArtist[];
      duration_ms: number;
      preview_url: string | null;
      external_urls: { spotify: string };
    }>;
    next: string | null;
  };

  // First, get the album so we have the images (the tracks endpoint omits them)
  const album = await authedFetch<{
    id: string;
    name: string;
    release_date: string;
    images: SpotifyImage[];
  }>(`/albums/${encodeURIComponent(albumId)}?` + new URLSearchParams({ market: "NL" }).toString());
  if (!album) return [];

  const collected: SpotifyTrack[] = [];
  let nextPath: string | null = `/albums/${encodeURIComponent(albumId)}/tracks?` +
    new URLSearchParams({ market: "NL" }).toString();
  let safety = 0;
  while (nextPath && safety < 20) {
    safety += 1;
    const page: Page | null = await authedFetch<Page>(nextPath);
    if (!page) break;
    for (const item of page.items) {
      collected.push({
        id: item.id,
        name: item.name,
        artists: item.artists,
        album: {
          id: album.id,
          name: album.name,
          release_date: album.release_date,
          images: album.images,
        },
        duration_ms: item.duration_ms,
        preview_url: item.preview_url,
        external_urls: item.external_urls,
        popularity: 0, // not provided by this endpoint
        explicit: false,
      });
    }
    nextPath = page.next ? page.next.replace(API_BASE, "") : null;
  }
  return collected;
}

export async function fetchArtist(id: string): Promise<SpotifyArtistDetail | null> {
  return authedFetch<SpotifyArtistDetail>(`/artists/${encodeURIComponent(id)}`);
}

export type SimplifiedAlbum = {
  id: string;
  name: string;
  album_type: "album" | "single" | "compilation";
  release_date: string;
  release_date_precision: "year" | "month" | "day";
  images: SpotifyImage[];
  external_urls: { spotify: string };
  total_tracks: number;
  artists: SpotifyArtist[];
};

export type ImportDiagnostic = {
  tracks: SpotifyTrack[];
  /** Diagnostic reasons when the result is empty. */
  reason?: "no-token" | "artist-not-found" | "no-albums" | "no-tracks-in-albums";
  albumCount?: number;
};

export type ImportAlbumsDiagnostic = {
  albums: SimplifiedAlbum[];
  reason?: "no-token" | "artist-not-found" | "no-albums";
};

/** Fetches every album + single for an artist. Returns the simplified album
 *  objects directly from /artists/{id}/albums (no need to drill into tracks). */
export async function fetchArtistAllAlbums(artistId: string): Promise<ImportAlbumsDiagnostic> {
  const token = await getToken();
  if (!token) return { albums: [], reason: "no-token" };

  type AlbumsPage = {
    items: SimplifiedAlbum[];
    next: string | null;
  };

  const collected: SimplifiedAlbum[] = [];
  let nextPath: string | null =
    `/artists/${encodeURIComponent(artistId)}/albums?` +
    new URLSearchParams({ include_groups: "album,single" }).toString();
  let safety = 0;
  let firstPage = true;
  while (nextPath && safety < 20) {
    safety += 1;
    const page: AlbumsPage | null = await authedFetch<AlbumsPage>(nextPath);
    if (!page) {
      if (firstPage) return { albums: [], reason: "artist-not-found" };
      break;
    }
    firstPage = false;
    for (const album of page.items) {
      collected.push(album);
    }
    nextPath = page.next ? page.next.replace(API_BASE, "") : null;
  }

  if (collected.length === 0) {
    return { albums: [], reason: "no-albums" };
  }

  // De-dup by id (same album can appear under multiple album_groups)
  const seen = new Set<string>();
  const unique = collected.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
  return { albums: unique };
}

/** Fetches every track from every album of an artist. Albums + singles, no compilations.
 *  Returns a diagnostic object so admin UI can show *why* zero tracks came back. */
export async function fetchArtistAllTracksDiag(artistId: string): Promise<ImportDiagnostic> {
  const token = await getToken();
  if (!token) return { tracks: [], reason: "no-token" };

  // Pull every page of albums for the artist. Spotify's docs say limit max=50,
  // but in practice (May 2026) the API returns 400 "Invalid limit" for
  // anything > the default. We paginate at 20 per page until next === null.
  type AlbumsPage = {
    items: Array<{ id: string; album_group: string }>;
    next: string | null;
  };
  let albums: AlbumsPage | null = null;
  let nextPath: string | null =
    `/artists/${encodeURIComponent(artistId)}/albums?` +
    new URLSearchParams({ include_groups: "album,single" }).toString();
  let safety = 0;
  while (nextPath && safety < 20) {
    safety += 1;
    const page: AlbumsPage | null = await authedFetch<AlbumsPage>(nextPath);
    if (!page) break;
    if (!albums) {
      albums = page;
    } else {
      albums.items.push(...page.items);
      albums.next = page.next;
    }
    // Spotify returns absolute URLs in `next`; strip the API base.
    nextPath = page.next ? page.next.replace(API_BASE, "") : null;
  }
  if (!albums) return { tracks: [], reason: "artist-not-found" };
  if (albums.items.length === 0) return { tracks: [], reason: "no-albums", albumCount: 0 };

  const albumIds = albums.items.map((a) => a.id);

  // Fetch each album's tracks individually. Spotify's batch /albums?ids=...
  // endpoint returns 403 for client-credentials calls in some markets;
  // /albums/{id}/tracks is more reliable.
  const trackIds: string[] = [];
  for (const albumId of albumIds) {
    const result = await authedFetch<{
      items: Array<{ id: string }>;
    }>(`/albums/${encodeURIComponent(albumId)}/tracks?` +
       new URLSearchParams({ market: "NL" }).toString());
    if (!result) continue;
    for (const item of result.items) {
      trackIds.push(item.id);
    }
  }

  const uniqueIds = Array.from(new Set(trackIds));
  if (uniqueIds.length === 0) {
    return { tracks: [], reason: "no-tracks-in-albums", albumCount: albums.items.length };
  }

  // Fetch full track details (with audio features) one at a time too, for
  // consistency with the per-album approach above.
  const tracks: SpotifyTrack[] = [];
  for (const tid of uniqueIds) {
    const t = await authedFetch<SpotifyTrack>(
      `/tracks/${encodeURIComponent(tid)}?` + new URLSearchParams({ market: "NL" }).toString(),
    );
    if (t) tracks.push(t);
  }
  return { tracks, albumCount: albums.items.length };
}

/** Back-compat wrapper that returns just the tracks. */
export async function fetchArtistAllTracks(artistId: string): Promise<SpotifyTrack[]> {
  const { tracks } = await fetchArtistAllTracksDiag(artistId);
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

export function extractAlbumId(url: string): string | null {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/album\/([A-Za-z0-9]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/** Fetches everything in one shot for a Spotify URL. Supports track / album /
 *  artist URLs. Returns null on any failure. */
export async function fetchSpotifyMetaFull(url: string): Promise<SpotifyMetaFull | null> {
  // Track URL → full track + audio features
  const trackId = extractTrackId(url);
  if (trackId) {
    const [track, features] = await Promise.all([
      fetchTrack(trackId),
      fetchAudioFeatures(trackId),
    ]);
    if (!track) return null;
    const thumb = track.album.images.reduce<SpotifyImage | null>((best, img) => {
      if (!best) return img;
      return img.width > best.width ? best : img;
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

  // Album URL → album metadata (no audio features at album level)
  const albumId = extractAlbumId(url);
  if (albumId) {
    const album = await authedFetch<{
      id: string;
      name: string;
      release_date: string;
      images: SpotifyImage[];
      artists: SpotifyArtist[];
    }>(`/albums/${encodeURIComponent(albumId)}?` + new URLSearchParams({ market: "NL" }).toString());
    if (!album) return null;
    const thumb = album.images.reduce<SpotifyImage | null>((best, img) => {
      if (!best) return img;
      return img.width > best.width ? best : img;
    }, null);
    const artistNames = album.artists.map((a) => a.name).join(", ");
    return {
      title: `${album.name} — ${artistNames}`,
      thumbnail: thumb?.url ?? null,
      durationMs: 0,
      releaseDate: album.release_date,
      artist: artistNames,
      album: album.name,
      previewUrl: null,
      popularity: 0,
      tempo: null,
      energy: null,
      valence: null,
      danceability: null,
    };
  }

  // Artist URL → profile data (for profile-type entries like the CKORE hub)
  const artistId = extractArtistId(url);
  if (artistId) {
    const artist = await fetchArtist(artistId);
    if (!artist) return null;
    const thumb = artist.images.reduce<SpotifyImage | null>((best, img) => {
      if (!best) return img;
      return img.width > best.width ? best : img;
    }, null);
    return {
      title: artist.name,
      thumbnail: thumb?.url ?? null,
      durationMs: 0,
      releaseDate: "",
      artist: artist.name,
      album: artist.genres.slice(0, 3).join(", ") || "Spotify artist",
      previewUrl: null,
      popularity: artist.followers.total,
      tempo: null,
      energy: null,
      valence: null,
      danceability: null,
    };
  }

  return null;
}
