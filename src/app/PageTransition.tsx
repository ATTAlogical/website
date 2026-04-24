"use client";

import { useEffect, useLayoutEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();

  // Runs before the browser paints the new page — set blur instantly
  useLayoutEffect(() => {
    document.body.style.transition = "none";
    document.body.style.filter = "blur(12px)";
    document.body.style.opacity = "0";
  }, [pathname]);

  // Runs after DOM is ready — animate blur away, then clear filter entirely
  useEffect(() => {
    document.body.getBoundingClientRect(); // force reflow
    document.body.style.transition = "filter 0.25s ease-out, opacity 0.25s ease-out";
    document.body.style.filter = "blur(0px)";
    document.body.style.opacity = "1";
    const t = setTimeout(() => {
      document.body.style.transition = "";
      document.body.style.filter = "";
      document.body.style.opacity = "";
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

      document.body.style.transition = "filter 0.25s ease-in, opacity 0.25s ease-in";
      document.body.style.filter = "blur(12px)";
      document.body.style.opacity = "0";

      setTimeout(() => router.push(href), 250);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [router]);

  return null;
}
