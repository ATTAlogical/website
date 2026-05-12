"use client";

import { useEffect } from "react";

/** globals.css sets `html, body { overflow: hidden }` for the homepage hero.
 *  Admin pages need normal scroll — this component unlocks it on mount and
 *  restores on unmount. */
export default function UnlockScroll() {
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);
  return null;
}
