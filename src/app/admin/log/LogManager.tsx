"use client";

import { useMemo, useState, useTransition } from "react";

// ─── Shared types (mirror Prisma row) ────────────────────────────────────────

export type AdminEntry = {
  id: string;
  slug: string;
  date: string; // YYYY-MM-DD
  branch: "atta" | "laugical" | "ckore" | string;
  type: "build" | "project" | "track" | "drop" | "note" | "milestone" | string;
  title: string;
  body: string | null;
  href: string | null;
  external: boolean;
  links: string[];
  spotifyUrl: string | null;
  spotifyTitle: string | null;
  spotifyThumb: string | null;
};

const BRANCH_OPTIONS: { value: AdminEntry["branch"]; label: string }[] = [
  { value: "atta", label: "ATTA logical" },
  { value: "laugical", label: "ATTA Laugical" },
  { value: "ckore", label: "ATTA CKORE" },
];

const TYPE_OPTIONS: AdminEntry["type"][] = [
  "build",
  "project",
  "track",
  "drop",
  "note",
  "milestone",
];

const EMPTY_ENTRY: AdminEntry = {
  id: "",
  slug: "",
  date: new Date().toISOString().slice(0, 10),
  branch: "atta",
  type: "build",
  title: "",
  body: "",
  href: "",
  external: false,
  links: [],
  spotifyUrl: "",
  spotifyTitle: null,
  spotifyThumb: null,
};

// ─── Manager ──────────────────────────────────────────────────────────────────

export default function LogManager({ initialEntries }: { initialEntries: AdminEntry[] }) {
  const [entries, setEntries] = useState<AdminEntry[]>(initialEntries);
  const [editing, setEditing] = useState<AdminEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const slugs = useMemo(() => entries.map((e) => e.slug), [entries]);

  const refreshAll = async () => {
    const res = await fetch("/api/admin/log");
    if (res.ok) {
      const { entries: fresh } = await res.json();
      // Normalize date strings
      const normalized: AdminEntry[] = (fresh as Array<Omit<AdminEntry, "date"> & { date: string }>).map(
        (r) => ({ ...r, date: r.date.slice(0, 10) }),
      );
      setEntries(normalized);
    }
  };

  const handleSave = async (entry: AdminEntry) => {
    setError(null);
    const payload = {
      slug: entry.slug,
      date: entry.date,
      branch: entry.branch,
      type: entry.type,
      title: entry.title,
      body: entry.body || null,
      href: entry.href || null,
      external: entry.external,
      links: entry.links,
      spotifyUrl: entry.branch === "ckore" ? entry.spotifyUrl || null : null,
    };
    const isNew = !entry.id;
    const url = isNew ? "/api/admin/log" : `/api/admin/log/${entry.id}`;
    const method = isNew ? "POST" : "PUT";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save");
      return;
    }
    setEditing(null);
    setIsCreating(false);
    startTransition(refreshAll);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry? Cannot be undone.")) return;
    const res = await fetch(`/api/admin/log/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete");
      return;
    }
    startTransition(refreshAll);
  };

  return (
    <section className="admin-log">
      <header className="admin-log-head">
        <h1 className="admin-h1">Log entries</h1>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => {
            setIsCreating(true);
            setEditing({ ...EMPTY_ENTRY });
          }}
        >
          + new entry
        </button>
      </header>

      {error && <div className="admin-error" role="alert">{error}</div>}

      {editing && (
        <EntryForm
          entry={editing}
          allSlugs={slugs.filter((s) => s !== editing.slug)}
          onChange={setEditing}
          onCancel={() => {
            setEditing(null);
            setIsCreating(false);
            setError(null);
          }}
          onSubmit={() => handleSave(editing)}
          isNew={isCreating}
          isPending={isPending}
        />
      )}

      <table className="admin-log-table">
        <thead>
          <tr>
            <th>date</th>
            <th>brand</th>
            <th>type</th>
            <th>title</th>
            <th>slug</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td className="admin-cell-mono">{e.date}</td>
              <td>
                <span className={`admin-pill admin-pill--${e.branch}`}>
                  {BRANCH_OPTIONS.find((b) => b.value === e.branch)?.label ?? e.branch}
                </span>
              </td>
              <td className="admin-cell-mono">{e.type}</td>
              <td className="admin-cell-title">
                {e.title}
                {e.spotifyThumb && (
                  <img
                    src={e.spotifyThumb}
                    alt=""
                    width={20}
                    height={20}
                    className="admin-spotify-thumb"
                  />
                )}
              </td>
              <td className="admin-cell-mono admin-cell-slug">{e.slug}</td>
              <td className="admin-cell-actions">
                <button type="button" className="admin-btn-ghost" onClick={() => { setEditing(e); setIsCreating(false); }}>
                  edit
                </button>
                <button type="button" className="admin-btn-ghost admin-btn-danger" onClick={() => handleDelete(e.id)}>
                  delete
                </button>
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr><td colSpan={6} className="admin-empty">No entries yet. Click + new entry to add one.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

// ─── Entry form ───────────────────────────────────────────────────────────────

function EntryForm({
  entry,
  allSlugs,
  onChange,
  onCancel,
  onSubmit,
  isNew,
  isPending,
}: {
  entry: AdminEntry;
  allSlugs: string[];
  onChange: (e: AdminEntry) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isNew: boolean;
  isPending: boolean;
}) {
  const set = <K extends keyof AdminEntry>(k: K, v: AdminEntry[K]) => onChange({ ...entry, [k]: v });

  const toggleLink = (slug: string) => {
    const has = entry.links.includes(slug);
    set("links", has ? entry.links.filter((s) => s !== slug) : [...entry.links, slug]);
  };

  return (
    <form
      className="admin-form"
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
    >
      <h2 className="admin-form-title">{isNew ? "New entry" : `Editing: ${entry.title}`}</h2>

      <div className="admin-form-grid">
        {/* Brand: ATTA + sub-dropdown */}
        <label className="admin-field admin-field--brand">
          <span className="admin-label">Brand</span>
          <div className="admin-brand-compound">
            <span className="admin-brand-prefix">ATTA</span>
            <select
              className="admin-input"
              value={entry.branch}
              onChange={(e) => set("branch", e.target.value)}
            >
              <option value="atta">logical</option>
              <option value="laugical">Laugical</option>
              <option value="ckore">CKORE</option>
            </select>
          </div>
        </label>

        <label className="admin-field">
          <span className="admin-label">Type</span>
          <select className="admin-input" value={entry.type} onChange={(e) => set("type", e.target.value)}>
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label className="admin-field">
          <span className="admin-label">Date</span>
          <input
            type="date"
            className="admin-input"
            value={entry.date}
            onChange={(e) => set("date", e.target.value)}
            required
          />
        </label>

        <label className="admin-field">
          <span className="admin-label">Slug (kebab-case)</span>
          <input
            type="text"
            className="admin-input admin-input--mono"
            value={entry.slug}
            onChange={(e) => set("slug", e.target.value.toLowerCase())}
            placeholder="atomic-orbital-chips"
            pattern="^[a-z0-9][a-z0-9-]*$"
            required
          />
        </label>

        <label className="admin-field admin-field--full">
          <span className="admin-label">Title</span>
          <input
            type="text"
            className="admin-input"
            value={entry.title}
            onChange={(e) => set("title", e.target.value)}
            required
            maxLength={200}
          />
        </label>

        <label className="admin-field admin-field--full">
          <span className="admin-label">Body (optional)</span>
          <textarea
            className="admin-input"
            value={entry.body ?? ""}
            onChange={(e) => set("body", e.target.value)}
            rows={3}
            maxLength={2000}
          />
        </label>

        <label className="admin-field">
          <span className="admin-label">Link (URL or path, optional)</span>
          <input
            type="text"
            className="admin-input"
            value={entry.href ?? ""}
            onChange={(e) => set("href", e.target.value)}
            placeholder="/laugical/store or https://…"
          />
        </label>

        <label className="admin-field admin-field--checkbox">
          <input
            type="checkbox"
            checked={entry.external}
            onChange={(e) => set("external", e.target.checked)}
          />
          <span>Open link in new tab (external)</span>
        </label>

        {/* CKORE-only: Spotify */}
        {entry.branch === "ckore" && (
          <label className="admin-field admin-field--full">
            <span className="admin-label">
              Spotify link (optional)
              {entry.spotifyTitle && <em className="admin-label-tag"> — {entry.spotifyTitle}</em>}
            </span>
            <input
              type="text"
              className="admin-input"
              value={entry.spotifyUrl ?? ""}
              onChange={(e) => set("spotifyUrl", e.target.value)}
              placeholder="https://open.spotify.com/track/…"
            />
            <span className="admin-hint">
              When set, the song&rsquo;s cover art and title appear in /temporal.
            </span>
          </label>
        )}

        {/* Links to other entries (lineage) */}
        <label className="admin-field admin-field--full">
          <span className="admin-label">Lineage — links to other entries</span>
          <div className="admin-link-grid">
            {allSlugs.length === 0 && (
              <span className="admin-hint">No other entries yet.</span>
            )}
            {allSlugs.map((s) => {
              const checked = entry.links.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  className={`admin-link-chip${checked ? " admin-link-chip--on" : ""}`}
                  onClick={() => toggleLink(s)}
                >
                  {checked && "✓ "}{s}
                </button>
              );
            })}
          </div>
        </label>
      </div>

      <div className="admin-form-actions">
        <button type="button" className="admin-btn-ghost" onClick={onCancel}>
          cancel
        </button>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={isPending}>
          {isPending ? "saving…" : isNew ? "create" : "save"}
        </button>
      </div>
    </form>
  );
}
