"use client";

import { useEffect, useLayoutEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

function layer(): HTMLElement | null {
  return document.getElementById("page-blur-layer");
}

export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();

  // Runs before the browser paints the new page — set blur instantly
  useLayoutEffect(() => {
    const el = layer();
    if (!el) return;
    el.style.transition = "none";
    el.style.filter = "blur(12px)";
    el.style.opacity = "0";
  }, [pathname]);

  // Runs after DOM is ready — animate blur away, then clear filter entirely
  useEffect(() => {
    const el = layer();
    if (!el) return;
    el.getBoundingClientRect(); // force reflow
    el.style.transition = "filter 0.25s ease-out, opacity 0.25s ease-out";
    el.style.filter = "blur(0px)";
    el.style.opacity = "1";
    const t = setTimeout(() => {
      el.style.transition = "";
      el.style.filter = "";
      el.style.opacity = "";
    }, 300);
    return () => clearTimeout(t);
  }, [pathname]);

  // Intercept link clicks — blur out, then navigate
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

      if (href === "/" || href.startsWith("/?")) {
        sessionStorage.setItem("from-nav", "1");
      }

      const el = layer();
      if (el) {
        window.dispatchEvent(new Event("page:leaving"));
        el.style.transition = "filter 0.4s ease-in, opacity 0.4s ease-in";
        el.style.filter = "blur(12px)";
        el.style.opacity = "0";
      }

      setTimeout(() => router.push(href), 420);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [router]);

  return null;
}
