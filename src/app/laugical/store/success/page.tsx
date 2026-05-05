"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLaugicalCart } from "@/context/LaugicalCart";

export default function StoreSuccessPage() {
  const { clearCart, setMusicState } = useLaugicalCart();

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    clearCart();
    setMusicState("confirmed");
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="store-page">
      <nav className="store-nav" aria-label="Store navigation">
        <Link href="/laugical/store" className="store-nav-back">
          ← back to store
        </Link>
        <span className="store-nav-title" aria-hidden="true">laugical store</span>
        <span aria-hidden style={{ width: 40 }} />
      </nav>

      <div className="store-wrap" style={{ paddingTop: "8vh", paddingBottom: "12vh" }}>
        <div className="store-success">
          <span className="store-success-mark" aria-hidden>✓</span>
          <h1 className="store-success-title">Order received.</h1>
          <p className="store-success-body">
            A confirmation is on its way to your inbox. Made-to-order and
            one-of-one pieces will be prepared by hand — you&rsquo;ll hear from
            Boelie directly with timing.
          </p>
          <p className="store-success-thanks">Thank you.</p>

          <Link href="/laugical/store" className="store-success-link">
            ← keep browsing
          </Link>
        </div>
      </div>
    </main>
  );
}
