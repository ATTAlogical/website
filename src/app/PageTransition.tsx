"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function PageTransition() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // New page mounted — overlay is white, fade it out to reveal the page
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.style.transition = "none";
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "none";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.transition = "opacity 0.25s ease-out";
        overlay.style.opacity = "0";
      });
    });
  }, [pathname]);

  // Intercept internal link clicks — fade overlay in, then navigate
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("mailto") ||
        href.startsWith("tel") ||
        href.startsWith("#") ||
        a.target === "_blank"
      ) return;

      e.preventDefault();
      e.stopPropagation();

      const overlay = overlayRef.current;
      if (!overlay) { router.push(href); return; }

      overlay.style.transition = "opacity 0.25s ease-in";
      overlay.style.opacity = "1";
      overlay.style.pointerEvents = "all";

      setTimeout(() => router.push(href), 250);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [router]);

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "#fff",
        opacity: 1,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
