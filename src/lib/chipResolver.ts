const CHIPS_DATA = [
  {
    label: "Laugical",
    keywords: [
      "laugical",
      // EN — art & design
      "art", "design", "visual", "creative", "gallery", "illustration",
      "graphic", "draw", "paint", "aesthetic", "photography", "photo",
      "style", "mood", "color", "colour", "typography", "font", "brand",
      "branding", "identity", "logo", "print", "experimental", "abstract",
      "form", "composition", "texture", "pattern", "editorial", "layout",
      "direction", "motion", "animation", "film", "video", "render", "3d",
      "generative", "glitch", "collage", "zine", "poster", "exhibit",
      "collection", "series", "process", "sketchbook", "archive",
      // NL
      "kunst", "ontwerp", "creatief", "visueel", "tekenen", "schilderen",
      "fotografie", "foto", "stijl", "kleur", "typografie", "lettertype",
      "merkidentiteit", "drukwerk", "compositie", "textuur", "patroon",
      "redactioneel", "tentoonstelling", "archief", "schetsboek",
    ],
  },
  {
    label: "CKORE",
    keywords: [
      "ckore",
      // EN — music & audio
      "music", "track", "audio", "sound", "beat", "song", "release",
      "listen", "album", "ep", "single", "producer", "production", "mix",
      "mixing", "master", "mastering", "sample", "bass", "drums", "melody",
      "harmony", "chord", "lyric", "lyrics", "vocal", "rap", "flow",
      "instrumental", "bpm", "tempo", "vinyl", "stream", "streaming",
      "spotify", "soundcloud", "bandcamp", "concert", "live", "perform",
      "performance", "dj", "remix", "synth", "synthesizer", "vst", "daw",
      "ableton", "studio", "recording", "tape", "frequency", "waveform",
      "playlist", "verse", "hook", "beats",
      // NL
      "muziek", "nummer", "geluid", "luisteren", "plaat", "productie",
      "mixen", "masteren", "bas", "melodie", "akkoord", "tekst",
      "instrumentaal", "streamen", "optreden", "opname",
    ],
  },
];

// Only exact matches (score 0) — prevents short words like "work" bleeding
// into Laugical via prefix-matching "works".
export function resolveChip(rawQuery: string): string | null {
  const q = rawQuery.toLowerCase().trim();
  if (!q) return null;

  const words = q.split(/\s+/);
  const queries = words.length > 1 ? [q, ...words] : [q];

  for (const cat of CHIPS_DATA) {
    for (const word of queries) {
      if (cat.keywords.includes(word)) return cat.label;
    }
  }
  return null;
}
