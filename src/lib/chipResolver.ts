const CHIPS_DATA = [
  {
    label: "Laugical",
    keywords: [
      // EN — art & design
      "art", "laugical", "design", "visual", "creative", "gallery", "illustration",
      "graphic", "draw", "paint", "aesthetic", "photography", "photo", "image",
      "style", "mood", "color", "colour", "type", "typography", "font", "brand",
      "branding", "identity", "logo", "print", "experimental", "abstract",
      "form", "composition", "texture", "pattern", "editorial", "layout", "concept",
      "direction", "motion", "animation", "film", "video", "render", "3d",
      "generative", "glitch", "collage", "zine", "poster", "exhibit", "showcase",
      "collection", "series", "process", "sketchbook", "archive", "mixed", "media",
      "works", "visuals", "look", "portfolio",
      // NL
      "kunst", "ontwerp", "creatief", "visueel", "tekenen", "schilderen", "fotografie",
      "foto", "stijl", "kleur", "typografie", "lettertype", "merk", "merkidentiteit",
      "drukwerk", "experimenteel", "abstract", "compositie", "textuur", "patroon",
      "redactioneel", "animatie", "tentoonstelling", "collectie", "archief", "schetsboek",
    ],
  },
  {
    label: "CKORE",
    keywords: [
      // EN — music & audio
      "music", "ckore", "track", "audio", "sound", "beat", "song", "release",
      "listen", "album", "ep", "single", "producer", "production", "mix", "mixing",
      "master", "mastering", "sample", "bass", "drums", "melody", "harmony",
      "chord", "lyric", "lyrics", "vocal", "rap", "flow", "instrumental", "bpm",
      "tempo", "vinyl", "stream", "streaming", "spotify", "soundcloud", "bandcamp",
      "concert", "live", "perform", "performance", "set", "dj", "remix", "synth",
      "synthesizer", "vst", "daw", "ableton", "studio", "recording", "tape",
      "frequency", "waveform", "playlist", "drop", "verse", "hook",
      "songs", "beats", "play",
      // NL
      "muziek", "nummer", "geluid", "luisteren", "plaat",
      "productie", "mixen", "masteren", "bas", "melodie", "akkoord",
      "tekst", "instrumentaal", "streamen", "optreden", "opname",
    ],
  },
  {
    label: "logical",
    keywords: [
      // EN — dev & business
      "logic", "logical", "website", "web", "work", "business",
      "project", "cv", "resume", "code", "dev", "build", "developer", "development",
      "frontend", "backend", "fullstack", "full-stack", "app", "application",
      "software", "engineer", "engineering", "tech", "technology", "digital",
      "agency", "freelance", "hire", "service", "solution", "product", "startup",
      "saas", "api", "database", "deploy", "deployment", "react", "next", "nextjs",
      "node", "typescript", "javascript", "python", "cloud", "server", "hosting",
      "ux", "ui", "interface", "system", "ship", "launch", "client",
      "contract", "rate", "stack", "repo", "github", "open source",
      "example", "examples", "demo", "demonstration",
      "case study", "case studies", "proof of concept", "poc",
      "jobs", "experience", "skills", "about", "tools",
      // NL — genuinely Dutch words only
      "werk", "bouwen", "programmeren", "ontwikkelen", "bedrijf", "zakelijk",
      "ontwikkelaar", "ontwikkeling", "applicatie", "technologie",
      "dienst", "oplossing", "systeem", "klant", "opdracht",
      "tarief", "lanceren", "opleveren", "sollicitatie", "coderen",
      "front-end", "back-end", "ingenieur", "digitaal", "bureau",
      "gebruikerservaring", "voorbeeld", "voorbeelden", "demonstratie", "codebase",
    ],
  },
  {
    label: "Contact",
    keywords: [
      // EN
      "contact", "sex", "email", "reach", "hire", "talk", "hello", "touch", "call",
      "message", "dm", "connect", "network", "collab", "collaborate", "collaboration",
      "partnership", "quote", "request", "booking", "book", "inquiry", "enquiry",
      "commission", "commissions", "proposal", "available", "availability", "rates",
      "brief", "brief me", "work together", "lets talk", "get in touch", "say hi",
      "where", "who", "socials", "linkedin", "instagram",
      // NL
      "bereiken", "inhuren", "bellen", "hallo", "hoi", "hey", "samenwerken",
      "samenwerking", "bericht", "verbinden", "offerte", "aanvraag", "boeken",
      "commissie", "beschikbaar", "beschikbaarheid", "tarieven", "mail", "stuur",
    ],
  },
];

function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    prev = curr;
  }
  return prev[b.length];
}

// Lower score = better match. Infinity = no match.
function matchScore(kw: string, q: string): number {
  if (kw === q) return 0;
  if (kw.startsWith(q)) return 1;
  if (q.length >= 3 && q.startsWith(kw)) return 2;
  if (kw.includes(" ") && kw.split(" ").some(w => w.startsWith(q))) return 3;
  if (q.length >= 4 && Math.abs(kw.length - q.length) <= 1 && editDistance(kw, q) <= 1) return 4;
  return Infinity;
}

// Resolves a raw search query to a single chip label, or null if no match.
// Checks the full query as a phrase AND each individual word, returns best match.
export function resolveChip(rawQuery: string): string | null {
  const q = rawQuery.toLowerCase().trim();
  if (!q) return null;

  const words = q.split(/\s+/);
  const queries = words.length > 1 ? [q, ...words] : [q];

  const best = CHIPS_DATA
    .map(cat => ({
      label: cat.label,
      score: Math.min(...queries.flatMap(word => cat.keywords.map(kw => matchScore(kw, word)))),
    }))
    .filter(c => c.score < Infinity)
    .sort((a, b) => a.score - b.score)[0];

  return best?.label ?? null;
}
