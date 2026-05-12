"use client";

import { useState, useTransition } from "react";

type Settings = {
  spotifyProfile: string;
  spotifyArtistId: string;
  showSpotifyVanity: boolean;
};

export default function SettingsManager({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState<Settings>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<string | null>(null);
  const [wiping, setWiping] = useState(false);
  const [wipeResult, setWipeResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setSettings({ ...settings, [k]: v });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spotifyProfile: settings.spotifyProfile.trim() || null,
        spotifyArtistId: settings.spotifyArtistId.trim() || null,
        showSpotifyVanity: settings.showSpotifyVanity,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save");
      return;
    }
    setSaved(true);
    startTransition(() => {
      setTimeout(() => setSaved(false), 2400);
    });
  };

  const handleImport = async () => {
    if (importing) return;
    if (!confirm("Import the entire CKORE discography from Spotify? Tracks already in the log will be skipped.")) return;
    setImporting(true);
    setImportResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/spotify/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Import failed");
        setImporting(false);
        return;
      }
      setImportResult(
        `Imported ${data.created} new track${data.created === 1 ? "" : "s"} · ${data.skipped} already in log · ${data.total} total in catalogue.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    }
    setImporting(false);
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    if (!confirm("Re-fetch Spotify metadata for every existing CKORE entry? Takes a few seconds.")) return;
    setRefreshing(true);
    setRefreshResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/spotify/refresh", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Refresh failed");
        setRefreshing(false);
        return;
      }
      setRefreshResult(
        `Refreshed ${data.refreshed} track${data.refreshed === 1 ? "" : "s"} · ${data.failed} failed · ${data.total} total.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    }
    setRefreshing(false);
  };

  const handleWipe = async () => {
    if (wiping) return;
    if (!confirm("Delete ALL CKORE entries that came from Spotify (albums + tracks)? This cannot be undone. Manual CKORE notes without a Spotify URL are kept.")) return;
    setWiping(true);
    setWipeResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/spotify/wipe", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Wipe failed");
        setWiping(false);
        return;
      }
      setWipeResult(`Deleted ${data.deleted} CKORE entr${data.deleted === 1 ? "y" : "ies"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    }
    setWiping(false);
  };

  return (
    <section className="admin-settings">
      <h1 className="admin-h1">Settings</h1>
      <p className="admin-lede">Site-wide configuration. Changes are live immediately.</p>

      {error && <div className="admin-error" role="alert">{error}</div>}
      {importResult && <div className="admin-info">{importResult}</div>}
      {refreshResult && <div className="admin-info">{refreshResult}</div>}
      {wipeResult && <div className="admin-info">{wipeResult}</div>}

      <form className="admin-form" onSubmit={handleSave}>
        <h2 className="admin-form-title">Spotify</h2>

        <div className="admin-form-grid">
          <label className="admin-field admin-field--full">
            <span className="admin-label">CKORE Spotify profile URL</span>
            <input
              type="text"
              className="admin-input"
              value={settings.spotifyProfile}
              onChange={(e) => set("spotifyProfile", e.target.value)}
              placeholder="https://open.spotify.com/artist/..."
            />
            <span className="admin-hint">
              When set, the CKORE label in the /temporal music sidebar links to this URL.
              Leave empty to remove.
            </span>
          </label>

          <label className="admin-field admin-field--full">
            <span className="admin-label">Spotify Artist ID</span>
            <input
              type="text"
              className="admin-input admin-input--mono"
              value={settings.spotifyArtistId}
              onChange={(e) => set("spotifyArtistId", e.target.value)}
              placeholder="e.g. 4iV5W9uYEdYUVa79Axb7Rh"
            />
            <span className="admin-hint">
              Used for auto-import. Find it in your Spotify artist URL — it&rsquo;s the long alphanumeric string after <code>/artist/</code>.
            </span>
          </label>

          <label className="admin-field admin-field--full admin-field--checkbox">
            <input
              type="checkbox"
              checked={settings.showSpotifyVanity}
              onChange={(e) => set("showSpotifyVanity", e.target.checked)}
            />
            <span>
              Show Spotify vanity metrics (follower count, popularity, monthly listeners)
              <em className="admin-label-tag"> — off by default until you want them on</em>
            </span>
          </label>
        </div>

        <div className="admin-form-actions">
          {saved && <span className="admin-saved">✓ saved</span>}
          <button type="submit" className="admin-btn admin-btn--primary" disabled={isPending}>
            {isPending ? "saving…" : "save"}
          </button>
        </div>
      </form>

      <form className="admin-form" onSubmit={(e) => { e.preventDefault(); handleImport(); }}>
        <h2 className="admin-form-title">Auto-import discography</h2>
        <p className="admin-hint" style={{ marginBottom: 16 }}>
          Fetches every track from every album/single on the artist ID above and creates
          new CKORE log entries for any that aren&rsquo;t already in the log. Existing entries
          (matched by Spotify URL) are skipped.
        </p>

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={importing}>
            {importing ? "importing…" : "import from Spotify"}
          </button>
        </div>
      </form>

      <form className="admin-form" onSubmit={(e) => { e.preventDefault(); handleRefresh(); }}>
        <h2 className="admin-form-title">Refresh all CKORE metadata</h2>
        <p className="admin-hint" style={{ marginBottom: 16 }}>
          Re-fetches Spotify metadata (duration, release date, BPM, energy, valence,
          preview URL, album art) for every existing CKORE entry. Works on album URLs,
          track URLs, and artist URLs.
        </p>

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn" disabled={refreshing}>
            {refreshing ? "refreshing…" : "refresh metadata"}
          </button>
        </div>
      </form>

      <form className="admin-form" onSubmit={(e) => { e.preventDefault(); handleWipe(); }}>
        <h2 className="admin-form-title">Wipe all CKORE imports</h2>
        <p className="admin-hint" style={{ marginBottom: 16 }}>
          Deletes every CKORE entry that has a Spotify URL (albums and tracks). Manual
          CKORE notes without a Spotify URL are untouched. Use this to clean up duplicates
          before re-running import.
        </p>

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn admin-btn-danger" disabled={wiping}>
            {wiping ? "wiping…" : "wipe imported CKORE entries"}
          </button>
        </div>
      </form>
    </section>
  );
}
