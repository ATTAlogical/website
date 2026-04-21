"use client";

import { useTemporalEvolution } from "@/hooks/useTemporalEvolution";
import { memo, useCallback, useEffect, useRef, useState } from "react";

const PLACEHOLDER = "what are you looking for?";

const CATEGORIES = [
  { label: "Laugical", keywords: ["art", "laugical", "design", "visual", "creative", "gallery", "illustration", "graphic", "draw", "paint", "aesthetic"] },
  { label: "CKORE",    keywords: ["music", "ckore", "track", "audio", "sound", "beat", "song", "release", "listen"] },
  { label: "logic",    keywords: ["logic", "logical", "website", "web", "work", "business", "portfolio", "project", "cv", "resume", "code", "dev", "build"] },
  { label: "Contact",  keywords: ["contact", "email", "reach", "hire", "talk", "hello", "touch", "call"] },
];

function matchLabels(query: string): string[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return CATEGORIES
    .filter(cat => cat.keywords.some(kw => kw.startsWith(q) || q.startsWith(kw) || kw.includes(q)))
    .map(cat => cat.label)
    .slice(0, 3);
}

type ChipState = "entering" | "floating" | "exiting";

type Chip = {
  id: string;
  label: string;
  state: ChipState;
  initialX: number;
  initialY: number;
  exitX: number;
  exitY: number;
};

type ChipPhysics = {
  x: number; y: number;
  vx: number; vy: number;
  noiseAngle: number;
  noiseAngularVel: number;
};

function newChip(label: string): Chip {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const M = 120;
  const x = M + Math.random() * (W - 2 * M);
  const y = M + Math.random() * (H - 2 * M);
  return { id: `${label}-${Date.now()}-${Math.random()}`, label, state: "entering", initialX: x, initialY: y, exitX: x, exitY: y };
}

function computeExit(x: number, y: number) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const dx = x < W / 2 ? -1 : 1;
  const dy = y < H / 2 ? -1 : 1;
  return { exitX: x + dx * W * 0.75, exitY: y + dy * H * 0.75 };
}

const CHROME_TEXT_STYLE: React.CSSProperties = {
  display: "inline",
  paddingBottom: 0,
  fontWeight: 800,
  fontSize: "clamp(1rem, 1.7vw, 1.3rem)",
  background: "linear-gradient(180deg, #111111 0%, #2a2a2a 30%, #909090 55%, #1a1a1a 72%, #3a3a3a 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  textRendering: "geometricPrecision",
  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
};

const CHIP_BUTTON_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.2)",
  border: "1px solid rgba(0,0,0,0.1)",
  borderRadius: "2px",
  padding: "0.5em 1.6em",
  fontFamily: '"Playfair Display", serif',
  fontSize: "clamp(0.85rem, 1.4vw, 1.1rem)",
  letterSpacing: "0.12em",
  backdropFilter: "blur(4px)",
  outline: "none",
  cursor: "pointer",
};

function chipLabel(label: string, isInside: boolean, isExiting: boolean) {
  if (label === "CKORE") return <span style={CHROME_TEXT_STYLE}>{label}</span>;
  if (isInside && !isExiting) return <span className="glossy-text" style={{ display: "inline", paddingBottom: 0 }}>{label}</span>;
  return <span style={{ color: "rgba(0,0,0,0.75)" }}>{label}</span>;
}

const ChipLayer = memo(function ChipLayer({
  chips,
  insideGlass,
  chipElsRef,
  onChipClick,
}: {
  chips: Chip[];
  insideGlass: Record<string, boolean>;
  chipElsRef: React.MutableRefObject<Map<string, HTMLDivElement>>;
  onChipClick: (label: string) => void;
}) {
  return (
    <>
      {chips.map(chip => {
        const isExiting = chip.state === "exiting";
        const isInside = insideGlass[chip.id] !== false;
        const showReflection = chip.state === "floating" && isInside && !isExiting;
        return (
          <div
            key={chip.id}
            ref={el => {
              if (el) chipElsRef.current.set(chip.id, el);
              else chipElsRef.current.delete(chip.id);
            }}
            style={{
              position: "absolute",
              left: 0, top: 0,
              zIndex: isExiting ? 1 : 20,
              opacity: chip.state === "entering" ? 0 : isExiting ? 0 : 1,
              transition: isExiting ? undefined : "opacity 0.9s ease-out",
              pointerEvents: chip.state === "floating" ? "auto" : "none",
              willChange: "transform",
            }}
          >
            <button style={CHIP_BUTTON_STYLE} onClick={() => onChipClick(chip.label)}>
              {chipLabel(chip.label, isInside, isExiting)}
            </button>

            {showReflection && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0, right: 0,
                  pointerEvents: "none",
                  transform: "scaleY(-1)",
                  filter: "blur(1px)",
                  opacity: 0.45,
                }}
              >
                <button style={{ ...CHIP_BUTTON_STYLE, cursor: "default", pointerEvents: "none", width: "100%" }}>
                  {chipLabel(chip.label, true, false)}
                </button>
              </div>
            )}
          </div>
        );
      })}
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
  const [insideGlass, setInsideGlass] = useState<Record<string, boolean>>({});
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [contactClicks, setContactClicks] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const glassRectRef = useRef<DOMRect | null>(null);
  const chipsRef = useRef<Chip[]>([]);
  const physicsRef = useRef<Record<string, ChipPhysics>>({});
  const chipElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const rafRef = useRef<number>(0);

  const handleChipClick = useCallback((label: string) => {
    if (label === "Contact") setContactClicks(c => c + 1);
  }, []);

  useEffect(() => { chipsRef.current = chips; }, [chips]);
  useEffect(() => { setMounted(true); }, []);

  // Cache glass rect — depends on mounted so it runs after DOM exists
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
    let i = 0;
    const start = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setTypedPlaceholder(PLACEHOLDER.slice(0, i));
        if (i >= PLACEHOLDER.length) clearInterval(iv);
      }, 55);
      return () => clearInterval(iv);
    }, 600);
    return () => clearTimeout(start);
  }, [showSearch]);

  // rAF physics loop
  useEffect(() => {
    const MARGIN = 80;
    const REPULSE = 220;
    let frame = 0;

    const tick = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const floating = chipsRef.current.filter(c => c.state === "floating");
      const g = glassRectRef.current;

      floating.forEach(chip => {
        const p = physicsRef.current[chip.id];
        if (!p) return;

        p.noiseAngularVel += (Math.random() - 0.5) * 0.04;
        p.noiseAngularVel *= 0.95;
        p.noiseAngle += p.noiseAngularVel;

        let fx = Math.cos(p.noiseAngle) * 0.012;
        let fy = Math.sin(p.noiseAngle) * 0.012;

        const BF = 0.12;
        if (p.x < MARGIN)     fx += BF * Math.pow(1 - p.x / MARGIN, 2);
        if (p.x > W - MARGIN) fx -= BF * Math.pow(1 - (W - p.x) / MARGIN, 2);
        if (p.y < MARGIN)     fy += BF * Math.pow(1 - p.y / MARGIN, 2);
        if (p.y > H - MARGIN) fy -= BF * Math.pow(1 - (H - p.y) / MARGIN, 2);

        floating.forEach(other => {
          if (other.id === chip.id) return;
          const op = physicsRef.current[other.id];
          if (!op) return;
          const dx = p.x - op.x;
          const dy = p.y - op.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REPULSE && dist > 0) {
            const f = 0.09 * (1 - dist / REPULSE);
            fx += (dx / dist) * f;
            fy += (dy / dist) * f;
          }
        });

        p.vx = (p.vx + fx) * 0.88;
        p.vy = (p.vy + fy) * 0.88;
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 0.8) { p.vx *= 0.8 / spd; p.vy *= 0.8 / spd; }
        p.x = Math.max(MARGIN / 2, Math.min(W - MARGIN / 2, p.x + p.vx));
        p.y = Math.max(MARGIN / 2, Math.min(H - MARGIN / 2, p.y + p.vy));

        // Update chip DOM
        const el = chipElsRef.current.get(chip.id);
        if (el) el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;

      });

      // Inside/outside glass check every ~18 frames
      if (++frame % 18 === 0 && g) {
        const next: Record<string, boolean> = {};
        chipsRef.current.forEach(c => {
          const p = physicsRef.current[c.id];
          if (c.state === "floating" && p)
            next[c.id] = p.x >= g.left && p.x <= g.right && p.y >= g.top && p.y <= g.bottom;
        });
        setInsideGlass(next);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Init physics + initial DOM transform
  useEffect(() => {
    chips.filter(c => c.state === "entering").forEach(chip => {
      if (!physicsRef.current[chip.id]) {
        physicsRef.current[chip.id] = {
          x: chip.initialX, y: chip.initialY,
          vx: 0, vy: 0,
          noiseAngle: Math.random() * Math.PI * 2,
          noiseAngularVel: (Math.random() - 0.5) * 0.03,
        };
      }
      const el = chipElsRef.current.get(chip.id);
      if (el) el.style.transform = `translate(${chip.initialX}px, ${chip.initialY}px) translate(-50%, -50%)`;
    });
  }, [chips]);

  // Exit transform via DOM
  useEffect(() => {
    chips.filter(c => c.state === "exiting").forEach(chip => {
      const el = chipElsRef.current.get(chip.id);
      if (!el) return;
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.9s cubic-bezier(0.6, 0, 1, 0.8), opacity 0.35s ease-in";
        el.style.transform = `translate(${chip.exitX}px, ${chip.exitY}px) translate(-50%, -50%)`;
      });
    });
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
        const p = physicsRef.current[oldest.id];
        const { exitX, exitY } = computeExit(p?.x ?? oldest.initialX, p?.y ?? oldest.initialY);
        next = next.map(c => c.id === oldest.id ? { ...c, state: "exiting" as ChipState, exitX, exitY } : c);
      }
      next.push(newChip(label));
      return next;
    });
  }, [submittedQuery]);

  // entering → floating
  useEffect(() => {
    if (!chips.some(c => c.state === "entering")) return;
    const t = setTimeout(() => {
      setChips(prev => prev.map(c => c.state === "entering" ? { ...c, state: "floating" as ChipState } : c));
    }, 50);
    return () => clearTimeout(t);
  }, [chips]);

  // Remove exited chips
  useEffect(() => {
    if (!chips.some(c => c.state === "exiting")) return;
    const t = setTimeout(() => {
      setChips(prev => {
        prev.filter(c => c.state === "exiting").forEach(c => delete physicsRef.current[c.id]);
        return prev.filter(c => c.state !== "exiting");
      });
    }, 950);
    return () => clearTimeout(t);
  }, [chips]);

  if (!mounted) return null;

  const placeholderVisible = !isFocused && searchValue === "";

  return (
    <main className="relative w-full h-full overflow-hidden bg-white">
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
        <a
          href="mailto:Boelie@attalogical.com"
          className="absolute glossy-text"
          style={{
            bottom: "21%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 12,
            display: "block",
            paddingBottom: 0,
            fontSize: "clamp(0.7rem, 1.1vw, 0.9rem)",
            letterSpacing: "0.1em",
            textDecoration: "none",
            whiteSpace: "nowrap",
            opacity: contactClicks > 0 ? 1 : 0,
            transition: "opacity 1s ease-in-out",
            pointerEvents: contactClicks > 0 ? "auto" : "none",
          }}
        >
          Boelie@attalogical.com
        </a>

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
        insideGlass={insideGlass}
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
            onKeyDown={e => { if (e.key === "Enter") setSubmittedQuery(searchValue); }}
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
    </main>
  );
}
