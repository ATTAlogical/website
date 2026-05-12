import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const logCount = await prisma.logEntry.count();

  return (
    <section className="admin-overview">
      <h1 className="admin-h1">Admin</h1>
      <p className="admin-lede">Manage entries below. Changes are live immediately.</p>

      <div className="admin-cards">
        <Link href="/admin/log" className="admin-card">
          <span className="admin-card-name">Log</span>
          <span className="admin-card-count">{logCount}</span>
          <span className="admin-card-desc">/temporal entries</span>
        </Link>
        <Link href="/admin/settings" className="admin-card">
          <span className="admin-card-name">Settings</span>
          <span className="admin-card-count">·</span>
          <span className="admin-card-desc">Spotify profile, etc.</span>
        </Link>
        <div className="admin-card admin-card--ghost" aria-disabled>
          <span className="admin-card-name">Projects</span>
          <span className="admin-card-count">—</span>
          <span className="admin-card-desc">phase 2</span>
        </div>
        <div className="admin-card admin-card--ghost" aria-disabled>
          <span className="admin-card-name">Store</span>
          <span className="admin-card-count">—</span>
          <span className="admin-card-desc">phase 2</span>
        </div>
      </div>
    </section>
  );
}
