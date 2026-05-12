"use client";

import { useState, useTransition } from "react";

type Settings = {
  spotifyProfile: string;
};

export default function SettingsManager({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState<Settings>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
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

  return (
    <section className="admin-settings">
      <h1 className="admin-h1">Settings</h1>
      <p className="admin-lede">Site-wide configuration. Changes are live immediately.</p>

      {error && <div className="admin-error" role="alert">{error}</div>}

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
        </div>

        <div className="admin-form-actions">
          {saved && <span className="admin-saved">✓ saved</span>}
          <button type="submit" className="admin-btn admin-btn--primary" disabled={isPending}>
            {isPending ? "saving…" : "save"}
          </button>
        </div>
      </form>
    </section>
  );
}
