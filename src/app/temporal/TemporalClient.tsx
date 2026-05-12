"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useIsMobile } from "@/hooks/useIsMobile";
import AtlasView from "./AtlasView";
import CardDeckView from "./CardDeckView";
import MusicSidebar from "./MusicSidebar";
import DetailPanel from "./DetailPanel";
import type { LogEntry } from "@/data/log";

export type TemporalEntry = LogEntry & {
  spotifyUrl?: string | null;
  spotifyTitle?: string | null;
  spotifyThumb?: string | null;
  spotifyDurationMs?: number | null;
  spotifyReleaseDate?: string | null;
  spotifyArtist?: string | null;
  spotifyAlbum?: string | null;
  spotifyPreviewUrl?: string | null;
  spotifyPopularity?: number | null;
  spotifyTempo?: number | null;
  spotifyEnergy?: number | null;
  spotifyValence?: number | null;
  spotifyDanceability?: number | null;
};

export default function TemporalClient({
  entries,
  spotifyProfile,
  showVanity,
}: {
  entries: TemporalEntry[];
  spotifyProfile?: string | null;
  showVanity?: boolean;
}) {
  const isMobile = useIsMobile();

  // Shared selected entry — drives detail panel from either AtlasView or MusicSidebar
  const [selected, setSelected] = useState<TemporalEntry | null>(null);

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  // Close detail on Escape
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const ckoreWithSpotify = entries.filter(
    (e) => e.branch === "ckore" && e.spotifyUrl,
  );

  const showSidebar = !isMobile && (ckoreWithSpotify.length > 0 || !!spotifyProfile);

  return (
    <>
      {isMobile ? (
        <CardDeckView entries={entries} />
      ) : (
        <AtlasView entries={entries} selected={selected} onSelect={setSelected} />
      )}
      {showSidebar && (
        <MusicSidebar
          entries={ckoreWithSpotify}
          spotifyProfile={spotifyProfile}
          showVanity={showVanity}
          detailOpen={!!selected}
          onSelect={setSelected}
        />
      )}

      <AnimatePresence>
        {selected && (
          <DetailPanel entry={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
