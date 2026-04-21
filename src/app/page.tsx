"use client";

import { useTemporalEvolution } from "@/hooks/useTemporalEvolution";
import { memo, useCallback, useEffect, useRef, useState } from "react";

const PLACEHOLDERS = {
  en: "what are you looking for?",
  nl: "wat zoek je?",
};

const CONTENT = {
  en: {
    work: "Work Experience",
    contact: "Contact",
    projects: "Projects",
    contactHeading: "Get in touch",
    projectsPlaceholder: "Projects coming soon.",
    jobs: [
      {
        role: "Fullstack Developer Intern",
        company: "Stichting Asha",
        city: "[city]",
        period: "Feb 2025 – present",
        description: "Designed and built an internal laptop management system (AshaOS) to manage the organisation's complete laptop fleet.",
        bullets: [
          "Fullstack web app: Next.js, Node.js, GraphQL and PostgreSQL in a Turborepo monorepo",
          "Features: laptop status management, reservation system, bulk actions, software requests with licence control, helpdesk module for client intake",
          "Integrated AI assistant (Groq API) for contextual helpdesk support",
          "Independently designed database schema (Prisma ORM), API layer and UI",
          "Deployed via Railway (PostgreSQL) and Vercel",
        ],
      },
    ],
  },
  nl: {
    work: "Werkervaring",
    contact: "Contact",
    projects: "Projecten",
    contactHeading: "Neem contact op",
    projectsPlaceholder: "Projecten volgen binnenkort.",
    jobs: [
      {
        role: "Stagiair Fullstack Developer",
        company: "Stichting Asha",
        city: "[stad]",
        period: "feb 2025 – heden",
        description: "Ontworpen en gebouwd van een intern laptopbeheersysteem (AshaOS) voor het beheren van het volledige laptoppark van de stichting.",
        bullets: [
          "Fullstack webapplicatie: Next.js, Node.js, GraphQL en PostgreSQL in een Turborepo monorepo",
          "Functionaliteiten: laptopstatusbeheer, reserveringssysteem, bulkacties, softwareaanvragen met licentiecontrole en helpdeskmodule voor klantinname",
          "Geïntegreerde AI-assistent (Groq API) voor contextuele helpdesksupport",
          "Zelfstandig ontworpen database schema (Prisma ORM), API-laag en gebruikersinterface",
          "Applicatie live gedraaid via Railway (PostgreSQL) en Vercel",
        ],
      },
    ],
  },
};

const LANG_NL = ["nederlands", "dutch", "nl", "NL", "Dutch", "Nederlands"];
const LANG_EN = ["english", "engels", "eng", "ENG", "English", "Engels"];

const CATEGORIES = [
  {
    label: "Laugical",
    keywords: [
      // EN — art & design
      "art", "laugical", "design", "visual", "creative", "gallery", "illustration",
      "graphic", "draw", "paint", "aesthetic", "photography", "photo", "image",
      "style", "mood", "color", "colour", "type", "typography", "font", "brand",
      "branding", "identity", "logo", "print", "digital", "experimental", "abstract",
      "form", "composition", "texture", "pattern", "editorial", "layout", "concept",
      "direction", "motion", "animation", "film", "video", "render", "3d",
      "generative", "glitch", "collage", "zine", "poster", "exhibit", "showcase",
      "collection", "series", "process", "sketchbook", "archive", "mixed", "media",
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
      // NL
      "muziek", "nummer", "geluid", "luisteren", "album", "plaat", "single",
      "producer", "productie", "mixen", "masteren", "bas", "melodie", "akkoord",
      "tekst", "instrumentaal", "streamen", "optreden", "concert", "opname",
    ],
  },
  {
    label: "logic",
    keywords: [
      // EN — dev & business
      "logic", "logical", "website", "web", "work", "business", "portfolio",
      "project", "cv", "resume", "code", "dev", "build", "developer", "development",
      "frontend", "backend", "fullstack", "full-stack", "app", "application",
      "software", "engineer", "engineering", "tech", "technology", "digital",
      "agency", "freelance", "hire", "service", "solution", "product", "startup",
      "saas", "api", "database", "deploy", "deployment", "react", "next", "nextjs",
      "node", "typescript", "javascript", "python", "cloud", "server", "hosting",
      "ux", "ui", "interface", "system", "build", "ship", "launch", "client",
      "contract", "rate", "stack", "repo", "github", "open source",
      // NL
      "werk", "bouwen", "programmeren", "ontwikkelen", "bedrijf", "zakelijk",
      "ontwikkelaar", "ontwikkeling", "applicatie", "technologie", "freelance",
      "dienst", "oplossing", "systeem", "server", "hosting", "klant", "opdracht",
      "tarief", "lanceren", "opleveren",
    ],
  },
  {
    label: "Contact",
    keywords: [
      // EN
      "contact", "email", "reach", "hire", "talk", "hello", "touch", "call",
      "message", "dm", "connect", "network", "collab", "collaborate", "collaboration",
      "partnership", "quote", "request", "booking", "book", "inquiry", "enquiry",
      "commission", "commissions", "proposal", "available", "availability", "rates",
      "brief", "brief me", "work together", "lets talk", "get in touch", "say hi",
      // NL
      "bereiken", "inhuren", "bellen", "hallo", "hoi", "hey", "samenwerken",
      "samenwerking", "bericht", "verbinden", "offerte", "aanvraag", "boeken",
      "commissie", "beschikbaar", "beschikbaarheid", "tarieven", "samenwerken",
      "mail", "stuur",
    ],
  },
];

function matchLabels(query: string): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return CATEGORIES
    .filter(cat => cat.keywords.some(kw => kw.startsWith(q) || q.startsWith(kw) || kw.includes(q)))
    .map(cat => cat.label)
    .slice(0, 3);
}

// Find a random position outside the glass pane, not overlapping existing chips
function findChipPosition(
  glassRect: DOMRect | null,
  existingChips: Array<{ x: number; y: number; state: string }>,
  W: number,
  H: number
): { x: number; y: number } {
  const MARGIN = 40;
  const GLASS_PAD = 15;
  const MIN_DIST = 130;
  const active = existingChips.filter(c => c.state !== "exiting");

  for (let i = 0; i < 200; i++) {
    const x = MARGIN + Math.random() * (W - 2 * MARGIN);
    const y = MARGIN + Math.random() * (H - 2 * MARGIN);

    if (glassRect) {
      const overGlass =
        x >= glassRect.left - GLASS_PAD &&
        x <= glassRect.right + GLASS_PAD &&
        y >= glassRect.top - GLASS_PAD &&
        y <= glassRect.bottom + GLASS_PAD;
      if (overGlass) continue;
    }

    const tooClose = active.some(c => {
      const dx = x - c.x;
      const dy = y - c.y;
      return dx * dx + dy * dy < MIN_DIST * MIN_DIST;
    });

    if (!tooClose) return { x, y };
  }

  // Fallback: top-left corner
  return { x: MARGIN + 40, y: MARGIN + 40 };
}

type ChipState = "entering" | "visible" | "exiting";

type Chip = {
  id: string;
  label: string;
  state: ChipState;
  x: number;
  y: number;
  phase: number;
};

const CHROME_TEXT_STYLE: React.CSSProperties = {
  fontFamily: '"Playfair Display", serif',
  fontWeight: 800,
  fontSize: "clamp(1rem, 1.7vw, 1.3rem)",
  letterSpacing: "0.1em",
  background: "linear-gradient(180deg, #111111 0%, #2a2a2a 30%, #909090 55%, #1a1a1a 72%, #3a3a3a 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  textRendering: "geometricPrecision",
};

const CHIP_TEXT_STYLE: React.CSSProperties = {
  fontFamily: '"Playfair Display", serif',
  fontSize: "clamp(0.85rem, 1.4vw, 1.1rem)",
  letterSpacing: "0.12em",
};

// Per-chip memoised to prevent animation restarts on sibling updates
const ChipItem = memo(function ChipItem({
  chip,
  chipElsRef,
  onChipClick,
}: {
  chip: Chip;
  chipElsRef: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onChipClick: (label: string) => void;
}) {
  const isVisible = chip.state === "visible";
  const isExiting = chip.state === "exiting";

  return (
    <div
      ref={el => {
        if (el) chipElsRef.current.set(chip.id, el);
        else chipElsRef.current.delete(chip.id);
      }}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 20,
        opacity: isVisible ? 1 : 0,
        transition: isExiting ? "opacity 0.55s ease-in" : "opacity 0.85s ease-out",
        pointerEvents: isVisible ? "auto" : "none",
        willChange: "transform",
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={() => onChipClick(chip.label)}
    >
      <div style={{
        position: "relative",
        width: chip.label === "Contact" ? "clamp(260px, 22vw, 380px)" : "clamp(140px, 14vw, 220px)",
        height: chip.label === "Contact" ? "clamp(130px, 11vw, 190px)" : "clamp(70px, 7vw, 110px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* SVG decoration — user supplies in public/chips/<label>.svg */}
        <img
          src={`/chips/${chip.label.toLowerCase()}.svg`}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            animation: "chipSvgReveal 1.4s ease-out both",
          }}
        />
        {/* Label text */}
        {chip.label === "CKORE" ? (
          <span style={{
            ...CHROME_TEXT_STYLE,
            position: "relative",
            zIndex: 1,
            animation: "chipTextReveal 0.65s 0.55s ease-out both",
          }}>
            {chip.label}
          </span>
        ) : (
          <span
            className="glossy-text"
            style={{
              ...CHIP_TEXT_STYLE,
              paddingBottom: 0,
              display: "inline",
              position: "relative",
              zIndex: 1,
              animation: "chipTextReveal 0.65s 0.55s ease-out both",
            }}
          >
            {chip.label}
          </span>
        )}
      </div>
    </div>
  );
});

const ChipLayer = memo(function ChipLayer({
  chips,
  chipElsRef,
  onChipClick,
}: {
  chips: Chip[];
  chipElsRef: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onChipClick: (label: string) => void;
}) {
  return (
    <>
      {chips.map(chip => (
        <ChipItem
          key={chip.id}
          chip={chip}
          chipElsRef={chipElsRef}
          onChipClick={onChipClick}
        />
      ))}
    </>
  );
});

export default function Home() {
  const temporal = useTemporalEvolution();
  const [mounted, setMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [chips, setChips] = useState<Chip[]>([]);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [contactClicks, setContactClicks] = useState(0);
  const [lang, setLang] = useState<"en" | "nl">("en");
  const [showExtended, setShowExtended] = useState(false);
  const [scrollToContact, setScrollToContact] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const contactSectionRef = useRef<HTMLElement>(null);
  const glassRectRef = useRef<DOMRect | null>(null);
  const chipsRef = useRef<Chip[]>([]);
  const chipElsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleChipClick = useCallback((label: string) => {
    if (label === "Contact") setContactClicks(c => c + 1);
    if (label === "logic") setShowExtended(true);
  }, []);

  const goToContact = useCallback(() => {
    setShowExtended(true);
    setScrollToContact(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = showExtended ? "auto" : "";
    document.documentElement.style.overflow = showExtended ? "auto" : "";
    document.body.style.height = showExtended ? "auto" : "";
    document.documentElement.style.height = showExtended ? "auto" : "";
  }, [showExtended]);

  useEffect(() => {
    if (!scrollToContact || !showExtended) return;
    const t = setTimeout(() => {
      contactSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      setScrollToContact(false);
    }, 80);
    return () => clearTimeout(t);
  }, [scrollToContact, showExtended]);

  useEffect(() => {
    if (contactClicks >= 3) goToContact();
  }, [contactClicks, goToContact]);

  useEffect(() => { chipsRef.current = chips; }, [chips]);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const update = () => {
      if (glassRef.current) glassRectRef.current = glassRef.current.getBoundingClientRect();
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const delay = 9000 + Math.random() * 3000;
    const t = setTimeout(() => setShowSearch(true), delay);
    return () => clearTimeout(t);
  }, [mounted]);

  useEffect(() => {
    if (!showSearch) return;
    const ph = PLACEHOLDERS[lang];
    let i = 0;
    setTypedPlaceholder("");
    const start = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setTypedPlaceholder(ph.slice(0, i));
        if (i >= ph.length) clearInterval(iv);
      }, 55);
      return () => clearInterval(iv);
    }, showSearch ? 600 : 0);
    return () => clearTimeout(start);
  }, [showSearch, lang]);

  // drift disabled — re-enable when ready

  // Set initial DOM position on entering
  useEffect(() => {
    chips.filter(c => c.state === "entering").forEach(chip => {
      const el = chipElsRef.current.get(chip.id);
      if (el) el.style.transform = `translate(${chip.x}px, ${chip.y}px) translate(-50%, -50%)`;
    });
  }, [chips]);

  // entering → visible
  useEffect(() => {
    if (!chips.some(c => c.state === "entering")) return;
    const t = setTimeout(() => {
      setChips(prev => prev.map(c => c.state === "entering" ? { ...c, state: "visible" as ChipState } : c));
    }, 50);
    return () => clearTimeout(t);
  }, [chips]);

  // Remove exited chips after fade
  useEffect(() => {
    if (!chips.some(c => c.state === "exiting")) return;
    const t = setTimeout(() => {
      setChips(prev => prev.filter(c => c.state !== "exiting"));
    }, 600);
    return () => clearTimeout(t);
  }, [chips]);

  // Add chip on submit
  useEffect(() => {
    if (!submittedQuery) return;
    const matches = matchLabels(submittedQuery);
    if (!matches.length) return;
    const label = matches[0];

    setChips(prev => {
      const active = prev.filter(c => c.state !== "exiting");
      if (active.some(c => c.label === label)) return prev;

      let next = [...prev];
      if (active.length >= 3) {
        const oldest = active[0];
        next = next.map(c => c.id === oldest.id ? { ...c, state: "exiting" as ChipState } : c);
      }

      const pos = findChipPosition(glassRectRef.current, next, window.innerWidth, window.innerHeight);

      next.push({
        id: `${label}-${Date.now()}-${Math.random()}`,
        label,
        state: "entering",
        x: pos.x,
        y: pos.y,
        phase: Math.random() * Math.PI * 2,
      });
      return next;
    });
  }, [submittedQuery]);

  if (!mounted) return null;

  const placeholderVisible = !isFocused && searchValue === "";
  const c = CONTENT[lang];

  return (
    <main className="relative w-full bg-white" style={{ height: showExtended ? "auto" : "100%", overflow: showExtended ? "visible" : "hidden" }}>
      {/* ── HERO ── */}
      <div className="relative w-full overflow-hidden" style={{ height: "100svh" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent pointer-events-none opacity-30" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div
            ref={glassRef}
            className="absolute w-3/4 h-3/4 max-w-4xl rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(0,0,0,0.03), rgba(0,0,0,0.01))",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(0,0,0,0.08)",
              opacity: 0.4,
              filter: `blur(${1 + temporal.reflectionIntensity * 0.5}px)`,
              transition: "all 2s ease-in-out",
            }}
          />

          <div
            className="relative z-10 flex flex-col items-start justify-center text-center sm:text-left"
            style={{
              transform: `translate(${temporal.offsetX}px, ${temporal.offsetY}px) scale(${temporal.scale})`,
              transition: "transform 1.5s ease-in-out",
            }}
          >
            <h1
              className="temporal-text glossy-text-shadow"
              style={{
                fontSize: "clamp(2rem, 8vw, 6rem)",
                letterSpacing: `${temporal.letterSpacing}em`,
                fontWeight: temporal.fontWeight as any,
                lineHeight: 1.1,
                fontFamily: '"Playfair Display", serif',
                paddingBottom: "0.15em",
              }}
            >
              <span className="glossy-text">ATTA logical</span>
            </h1>

            <div
              className="pointer-events-none"
              style={{
                marginTop: "-0.1em",
                opacity: 0.18,
                transform: "scaleY(-0.85) translateY(0.2rem)",
                filter: "blur(1.5px)",
                fontFamily: '"Playfair Display", serif',
                fontSize: "clamp(2rem, 8vw, 6rem)",
                fontWeight: temporal.fontWeight as any,
                letterSpacing: `${temporal.letterSpacing}em`,
                lineHeight: 1.1,
              }}
            >
              <span className="glossy-text">ATTA logical</span>
            </div>
          </div>

          {/* Contact email surface */}
          <div
            className="absolute"
            style={{
              bottom: "21%",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 12,
              textAlign: "center",
              opacity: contactClicks > 0 ? 1 : 0,
              transition: "opacity 1s ease-in-out",
              pointerEvents: contactClicks > 0 ? "auto" : "none",
            }}
          >
            <a
              href="mailto:Boelie@attalogical.com"
              className="glossy-text"
              style={{ display: "block", paddingBottom: 0, fontSize: "clamp(0.7rem, 1.1vw, 0.9rem)", letterSpacing: "0.1em", textDecoration: "none", whiteSpace: "nowrap" }}
            >
              Boelie@attalogical.com
            </a>
            <button
              onClick={goToContact}
              style={{
                marginTop: "0.6em",
                background: "none",
                border: "none",
                fontFamily: '"Playfair Display", serif',
                fontSize: "clamp(0.6rem, 0.9vw, 0.75rem)",
                letterSpacing: "0.12em",
                color: "rgba(0,0,0,0.35)",
                cursor: "pointer",
                padding: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(0,0,0,0.7)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(0,0,0,0.35)")}
            >
              more →
            </button>
          </div>

          <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(0,0,0,0.08), transparent)",
              filter: `blur(${40 + temporal.reflectionIntensity * 20}px)`,
              opacity: 0.3 + temporal.reflectionIntensity * 0.1,
              transition: "all 2s ease-in-out",
            }}
          />
          <div className="absolute bottom-1/3 -left-1/3 w-96 h-96 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(0,0,0,0.05), transparent)",
              filter: `blur(${50 + temporal.reflectionIntensity * 25}px)`,
              opacity: 0.2 + temporal.reflectionIntensity * 0.1,
              transition: "all 2s ease-in-out",
            }}
          />
        </div>

        <ChipLayer
          chips={chips}
          chipElsRef={chipElsRef}
          onChipClick={handleChipClick}
        />

        {/* Search bar */}
        <div
          className="absolute inset-0 flex items-end justify-center pointer-events-none"
          style={{ paddingBottom: "12vh" }}
        >
          <div
            className="relative pointer-events-auto"
            style={{
              opacity: showSearch ? 1 : 0,
              transform: showSearch ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 2.5s ease-in-out, transform 2.5s ease-in-out",
            }}
          >
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontFamily: '"Playfair Display", serif',
                fontSize: "clamp(0.75rem, 1.5vw, 1rem)",
                letterSpacing: "0.08em",
                color: "rgba(0,0,0,0.35)",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                opacity: placeholderVisible ? 1 : 0,
                transition: "opacity 0.6s ease-in-out",
              }}
            >
              {typedPlaceholder}
            </span>

            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={e => {
                if (e.key !== "Enter") return;
                const q = searchValue.trim();
                if (LANG_NL.includes(q)) { setLang("nl"); setSearchValue(""); return; }
                if (LANG_EN.includes(q)) { setLang("en"); setSearchValue(""); return; }
                setSubmittedQuery(searchValue);
              }}
              onFocus={() => { setShowSearch(true); setIsFocused(true); }}
              onBlur={() => setIsFocused(false)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "1px solid rgba(0,0,0,0.15)",
                outline: "none",
                fontFamily: '"Playfair Display", serif',
                fontSize: "clamp(0.75rem, 1.5vw, 1rem)",
                color: "#000",
                letterSpacing: "0.08em",
                padding: "0.4em 0",
                width: "clamp(180px, 25vw, 320px)",
                textAlign: "center",
                caretColor: "#000",
              }}
            />
          </div>
        </div>

        <div className="lg:hidden absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-white/40" />
        </div>
      </div>{/* end hero */}

      {/* ── EXTENDED SECTIONS ── */}
      {showExtended && (
        <div style={{ background: "white", fontFamily: '"Playfair Display", serif' }}>

          {/* Work Experience */}
          <section style={{ padding: "8vw 12vw", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <h2 className="glossy-text" style={{ display: "block", paddingBottom: 0, fontSize: "clamp(0.7rem, 1vw, 0.9rem)", letterSpacing: "0.2em", marginBottom: "4rem", textTransform: "uppercase" }}>
              {c.work}
            </h2>
            {c.jobs.map((job, i) => (
              <div key={i} style={{ maxWidth: "640px" }}>
                <p style={{ fontSize: "clamp(1rem, 1.6vw, 1.25rem)", fontWeight: 500, color: "#000", letterSpacing: "0.02em", marginBottom: "0.25em" }}>
                  {job.role}
                </p>
                <p style={{ fontSize: "clamp(0.7rem, 1vw, 0.85rem)", color: "rgba(0,0,0,0.4)", letterSpacing: "0.08em", marginBottom: "1.5rem" }}>
                  {job.company} — {job.city} &nbsp;|&nbsp; {job.period}
                </p>
                <p style={{ fontSize: "clamp(0.8rem, 1.1vw, 0.95rem)", color: "rgba(0,0,0,0.65)", lineHeight: 1.8, marginBottom: "1.25rem" }}>
                  {job.description}
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {job.bullets.map((b, j) => (
                    <li key={j} style={{ fontSize: "clamp(0.75rem, 1vw, 0.88rem)", color: "rgba(0,0,0,0.5)", lineHeight: 1.9, paddingLeft: "1.2em", position: "relative" }}>
                      <span style={{ position: "absolute", left: 0, color: "rgba(0,0,0,0.2)" }}>—</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {/* Contact */}
          <section ref={contactSectionRef} style={{ padding: "8vw 12vw", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <h2 className="glossy-text" style={{ display: "block", paddingBottom: 0, fontSize: "clamp(0.7rem, 1vw, 0.9rem)", letterSpacing: "0.2em", marginBottom: "4rem", textTransform: "uppercase" }}>
              {c.contact}
            </h2>
            <div style={{ maxWidth: "640px" }}>
              <p style={{ fontSize: "clamp(1rem, 1.6vw, 1.25rem)", fontWeight: 500, color: "#000", letterSpacing: "0.02em", marginBottom: "2rem" }}>
                Boelie van Camp
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                {[
                  { label: "email", href: "mailto:Boelie@attalogical.com", text: "Boelie@attalogical.com" },
                  { label: "instagram", href: "https://www.instagram.com/boelie36/", text: "@boelie36" },
                  { label: "github", href: "https://github.com/ATTAlogical", text: "ATTAlogical" },
                ].map(({ label, href, text }) => (
                  <div key={label} style={{ display: "flex", gap: "2rem", alignItems: "baseline" }}>
                    <span style={{ fontSize: "clamp(0.6rem, 0.8vw, 0.72rem)", letterSpacing: "0.15em", color: "rgba(0,0,0,0.3)", width: "5rem", textTransform: "uppercase", flexShrink: 0 }}>{label}</span>
                    <a href={href} target={label !== "email" ? "_blank" : undefined} rel="noreferrer"
                      style={{ fontSize: "clamp(0.8rem, 1.1vw, 0.95rem)", color: "rgba(0,0,0,0.7)", textDecoration: "none", letterSpacing: "0.04em", transition: "color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#000")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(0,0,0,0.7)")}
                    >{text}</a>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Projects */}
          <section style={{ padding: "8vw 12vw", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <h2 className="glossy-text" style={{ display: "block", paddingBottom: 0, fontSize: "clamp(0.7rem, 1vw, 0.9rem)", letterSpacing: "0.2em", marginBottom: "4rem", textTransform: "uppercase" }}>
              {c.projects}
            </h2>
            <p style={{ maxWidth: "640px", fontSize: "clamp(0.8rem, 1.1vw, 0.95rem)", color: "rgba(0,0,0,0.35)", letterSpacing: "0.04em" }}>
              {c.projectsPlaceholder}
            </p>
          </section>

        </div>
      )}
    </main>
  );
}
