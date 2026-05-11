"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useIsMobile";
import { LOG_ENTRIES } from "@/data/log";
import AtlasView from "./AtlasView";
import CardDeckView from "./CardDeckView";
import LiveTimestamp from "./LiveTimestamp";

export default function TemporalPage() {
  const isMobile = useIsMobile();

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <main className={isMobile ? "log-page log-page--deck" : "log-page log-page--atlas"}>
      <header className="log-masthead">
        <Link href="/" className="log-masthead-back" aria-label="Back to ATTA logical">
          ← ATTA logical
        </Link>
        <span className="log-masthead-title" aria-hidden>
          {isMobile ? "the log" : "ATTLAS"}
        </span>
        <LiveTimestamp />
      </header>

      {isMobile ? (
        <CardDeckView entries={LOG_ENTRIES} />
      ) : (
        <AtlasView entries={LOG_ENTRIES} />
      )}
    </main>
  );
}
