"use client";

import { useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import AtlasView from "./AtlasView";
import CardDeckView from "./CardDeckView";
import MusicSidebar from "./MusicSidebar";
import type { LogEntry } from "@/data/log";

export type TemporalEntry = LogEntry & {
  spotifyUrl?: string | null;
  spotifyTitle?: string | null;
  spotifyThumb?: string | null;
};

export default function TemporalClient({ entries }: { entries: TemporalEntry[] }) {
  const isMobile = useIsMobile();

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  const ckoreWithSpotify = entries.filter(
    (e) => e.branch === "ckore" && e.spotifyUrl && e.spotifyThumb,
  );

  return (
    <>
      {isMobile ? <CardDeckView entries={entries} /> : <AtlasView entries={entries} />}
      {!isMobile && ckoreWithSpotify.length > 0 && (
        <MusicSidebar entries={ckoreWithSpotify} />
      )}
    </>
  );
}
