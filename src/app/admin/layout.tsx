import type { Metadata } from "next";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export const metadata: Metadata = {
  title: "admin — ATTA logical",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link href="/admin" className="admin-brand">ATTA logical · admin</Link>
        <nav className="admin-nav">
          <Link href="/admin/log">log</Link>
          <Link href="/admin/settings">settings</Link>
          <LogoutButton />
        </nav>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
