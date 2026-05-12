"use client";

import { useIsMobile } from "@/hooks/useIsMobile";

export default function MastheadTitle() {
  const isMobile = useIsMobile();
  return (
    <span className="log-masthead-title" aria-hidden>
      {isMobile ? "the log" : "ATTLAS"}
    </span>
  );
}
