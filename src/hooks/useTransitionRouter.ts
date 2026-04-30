"use client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useTransitionRouter() {
  const router = useRouter();

  const push = useCallback((href: string) => {
    const el = document.getElementById("page-blur-layer");
    if (el) {
      window.dispatchEvent(new Event("page:leaving"));
      el.style.transition = "filter 0.4s ease-in, opacity 0.4s ease-in";
      el.style.filter = "blur(12px)";
      el.style.opacity = "0";
    }
    setTimeout(() => router.push(href), 420);
  }, [router]);

  return push;
}
