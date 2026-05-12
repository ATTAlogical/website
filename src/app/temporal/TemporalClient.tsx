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

export default function TemporalClient({
  entries,
  spotifyProfile,
}: {
  entries: TemporalEntry[];
  spotifyProfile?: string | null;
}) {
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

  // Show sidebar if there are CKORE tracks OR a profile URL is set
  const showSidebar = !isMobile && (ckoreWithSpotify.length > 0 || !!spotifyProfile);

  return (
    <>
      {isMobile ? <CardDeckView entries={entries} /> : <AtlasView entries={entries} />}
      {showSidebar && (
        <MusicSidebar entries={ckoreWithSpotify} spotifyProfile={spotifyProfile} />
      )}
    </>
  );
}
