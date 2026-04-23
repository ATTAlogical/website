"use client";

import { useTemporalEvolution, teAngleNow, TE_SPEED } from "@/hooks/useTemporalEvolution";
import { useIsMobile } from "@/hooks/useIsMobile";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { type ProjectEntry, PROJECTS_DATA } from "@/data/projects";
import { resolveChip } from "@/lib/chipResolver";

const BAD_WORDS = new Set([
  "fuck","shit","ass","bitch","bastard","damn","crap","piss","dick","cock","pussy",
  "cunt","whore","slut","fag","faggot","dyke","nigger","nigga","chink","spic","kike",
  "gook","wetback","cracker","tranny","retard","rape","pedo","pedophile","nazi",
  "motherfucker","motherfucking","asshole","bullshit","jackass","dumbass","dipshit",
  "shithead","fucker","fucking","bitchy","slutty","whorish","cocks","dicks","cunts",
]);

function isBadWord(query: string): boolean {
  const words = query.toLowerCase().trim().split(/\s+/);
  return words.some(w => BAD_WORDS.has(w));
}

const SERIOUSLY_MSGS = [
  "seriously?",
  "really? again?",
  "wow... real original",
  "wow... real original",
  "wow... real original",
  "Stop.",
  "Stop it, last warning..",
  "dude, alright",
];

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
    bio: "Software developer & aspiring biologist. An affinity for systems and patterns. Musician, with the ear that comes with it. Perfectionist where it counts, pragmatist where it can.",
    bioQuote: "What matters is how something is made, not just whether it works.",
    preview: "preview",
    noPreview: "no preview",
    viewCatalogue: "view catalogue →",
    highlights: "highlights",
    visitSite: "visit site →",
    more: "more →",
    jobs: [
      {
        role: "Fullstack Developer Intern",
        company: "Stichting Asha",
        city: "Utrecht",
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
    bio: "Softwareontwikkelaar & toekomstig bioloog. Affiniteit met systemen en patronen. Muzikant, met het gehoor dat daarbij hoort. Perfectionist waar het telt, pragmatisch waar het kan.",
    bioQuote: "Het is van belang hoe iets gemaakt is, niet alleen of het werkt.",
    preview: "voorbeeld",
    noPreview: "geen voorbeeld",
    viewCatalogue: "bekijk catalogus →",
    highlights: "hoogtepunten",
    visitSite: "bezoek site →",
    more: "meer →",
    jobs: [
      {
        role: "Stagiair Fullstack Developer",
        company: "Stichting Asha",
        city: "Utrecht",
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

// Each chip orbits the glass pane on a shared ellipse, spread by phase.
const CHIP_PHASES: Record<string, number> = {
  Laugical: 0,
  CKORE:    Math.PI * 0.5,
  logical:  Math.PI,
  Contact:  Math.PI * 1.5,
};

function getChipPosition(
  label: string,
  angle: number,
  W: number,
  H: number,
  glassRect: DOMRect | null,
): { x: number; y: number } {
  const phase = CHIP_PHASES[label] ?? 0;
  const a = angle + phase;

  // Orbit centered on the glass, radii just outside glass edges, capped at viewport
  const cx = glassRect ? (glassRect.left + glassRect.right) / 2 : W / 2;
  const cy = glassRect ? (glassRect.top + glassRect.bottom) / 2 : H / 2;
  const glassRx = glassRect ? (glassRect.right - glassRect.left) / 2 : W * 0.375;
  const glassRy = glassRect ? (glassRect.bottom - glassRect.top) / 2 : H * 0.375;
  const orbitRx = Math.min(glassRx + 100, W / 2 - 60);
  const orbitRy = Math.min(glassRy + 70, H / 2 - 40);

  return {
    x: cx + orbitRx * Math.cos(a),
    y: cy + orbitRy * Math.sin(a),
  };
}

type ChipState = "entering" | "visible" | "exiting";

type Chip = {
  id: string;
  label: string;
  state: ChipState;
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

const CHIP_SVG_STYLE: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "clamp(140px, 14vw, 220px)",
  height: "clamp(70px, 7vw, 110px)",
  pointerEvents: "none",
  color: "#000",
  overflow: "visible",
};

// Inline SVGs so motion.path can animate pathLength (draw-in effect)
const ChipSVG = memo(function ChipSVG({ label }: { label: string }) {
  if (label === "Laugical") return (
    <svg viewBox="0 0 160 80" fill="none" style={CHIP_SVG_STYLE}>
      <motion.path
        d="M18 40 C35 8 75 2 105 12 C135 22 152 38 138 55 C124 72 78 80 48 74 C18 68 1 60 18 40Z"
        stroke="currentColor" strokeWidth="0.8"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.22 }}
        transition={{ duration: 1.6, delay: 0.4, ease: "easeOut" }}
      />
      <motion.path
        d="M32 40 C46 20 76 15 100 24 C124 33 136 40 122 52 C108 64 78 68 54 63 C30 58 18 55 32 40Z"
        stroke="currentColor" strokeWidth="0.4"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.12 }}
        transition={{ duration: 1.8, delay: 0.65, ease: "easeOut" }}
      />
    </svg>
  );

  if (label === "CKORE") return (
    <svg viewBox="0 0 160 80" fill="none" style={CHIP_SVG_STYLE}>
      <motion.circle cx="80" cy="40" r="36" stroke="currentColor" strokeWidth="0.8"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.22 }}
        transition={{ duration: 1.6, delay: 0.4, ease: "easeOut" }}
      />
      <motion.circle cx="80" cy="40" r="23" stroke="currentColor" strokeWidth="0.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.15 }}
        transition={{ duration: 1.4, delay: 0.7, ease: "easeOut" }}
      />
      <motion.circle cx="80" cy="40" r="10" stroke="currentColor" strokeWidth="0.4"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.1 }}
        transition={{ duration: 1.1, delay: 0.95, ease: "easeOut" }}
      />
    </svg>
  );

  if (label === "logical") return (
    <svg viewBox="0 0 160 80" fill="none" style={CHIP_SVG_STYLE}>
      <motion.path
        d="M44 18 L18 40 L44 62"
        stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.22 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
      />
      <motion.path
        d="M116 18 L142 40 L116 62"
        stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.22 }}
        transition={{ duration: 0.8, delay: 0.58, ease: "easeOut" }}
      />
    </svg>
  );

  return null;
});

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
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.3em 0" }}>
        {chip.label !== "Contact" && <ChipSVG label={chip.label} />}
        {chip.label === "CKORE" ? (
          <motion.span
            style={{ ...CHROME_TEXT_STYLE, position: "relative", zIndex: 1 }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.55, ease: "easeOut" }}
          >
            {chip.label}
          </motion.span>
        ) : (
          <motion.span
            className="glossy-text"
            style={{ ...CHIP_TEXT_STYLE, paddingBottom: 0, display: "inline", position: "relative", zIndex: 1 }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.55, ease: "easeOut" }}
          >
            {chip.label}
          </motion.span>
        )}
      </div>
    </div>
  );
});

// 3D tilt card with spring physics and moving glare — Wii U vibe
const ProjectCard = memo(function ProjectCard({
  project,
  isExpanded,
  onExpand,
  isMobile,
  lang,
}: {
  project: ProjectEntry;
  isExpanded: boolean;
  onExpand: (p: ProjectEntry) => void;
  isMobile: boolean;
  lang: "en" | "nl";
}) {
  const cardW = isMobile ? "220px" : "260px";
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useSpring(1, { stiffness: 400, damping: 28 });
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 400, damping: 28 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 400, damping: 28 });
  const glareBackground = useTransform([x, y], ([xv, yv]) => {
    const gx = ((xv as number) + 0.5) * 100;
    const gy = ((yv as number) + 0.5) * 100;
    return `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.5) 0%, transparent 58%)`;
  });

  if (isExpanded) return <div style={{ width: cardW, height: "380px", flexShrink: 0 }} />;

  return (
    <div style={{ perspective: "800px", flexShrink: 0, width: cardW }}>
      <motion.div
        layoutId={isMobile ? undefined : `project-card-${project.title}`}
        style={{
          rotateX, rotateY, scale,
          borderRadius: "18px",
          overflow: "hidden",
          background: "linear-gradient(145deg, rgba(255,255,255,0.97) 0%, rgba(247,247,249,0.94) 100%)",
          border: "1px solid rgba(255,255,255,0.75)",
          boxShadow: "0 2px 20px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)",
          cursor: "pointer",
          position: "relative",
          fontFamily: '"Playfair Display", serif',
        }}
        onClick={() => onExpand(project)}
        onMouseMove={e => {
          const r = e.currentTarget.getBoundingClientRect();
          x.set((e.clientX - r.left) / r.width - 0.5);
          y.set((e.clientY - r.top) / r.height - 0.5);
          scale.set(1.04);
        }}
        onMouseLeave={() => { x.set(0); y.set(0); scale.set(1); }}
      >
        {/* Image / preview */}
        <div className="glass-image-frame" style={{ height: "170px", borderRadius: "18px 18px 10px 10px", background: "linear-gradient(135deg, #f2f2f2, #e6e6e8)" }}>
          {project.image ? (
            <img src={project.image} alt={project.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "0.55rem", letterSpacing: "0.18em", color: "rgba(0,0,0,0.18)", textTransform: "uppercase" }}>{CONTENT[lang].preview}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "1.15rem 1.35rem 1.4rem" }}>
          <p style={{ fontSize: "0.56rem", letterSpacing: "0.14em", color: "rgba(0,0,0,0.28)", textTransform: "uppercase", marginBottom: "0.3rem" }}>
            {project.subtitle}
          </p>
          <h3 style={{ fontSize: "0.98rem", fontWeight: 500, color: "#000", letterSpacing: "0.02em", marginBottom: "0.55rem", lineHeight: 1.3 }}>
            {project.title}
          </h3>
          <p style={{ fontSize: "0.74rem", color: "rgba(0,0,0,0.48)", lineHeight: 1.8, marginBottom: "1rem", letterSpacing: "0.01em" }}>
            {project.description}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.32rem" }}>
            {project.tags.slice(0, 4).map(tag => (
              <span key={tag} style={{ fontSize: "0.54rem", letterSpacing: "0.07em", padding: "0.17rem 0.48rem", border: "1px solid rgba(0,0,0,0.09)", borderRadius: "20px", color: "rgba(0,0,0,0.38)" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Moving glare */}
        <motion.div style={{ position: "absolute", inset: 0, background: glareBackground, pointerEvents: "none", borderRadius: "18px" }} />
      </motion.div>
    </div>
  );
});

// Shared popup content — used in both desktop and mobile layouts
function PopupContent({ project, onClose, lang }: { project: ProjectEntry; onClose: () => void; lang: "en" | "nl" }) {
  const ui = CONTENT[lang];
  return (
    <>
      <Link href={`/catalogue#${project.slug}`} style={{ display: "block", position: "relative", background: "#e8e8ea", overflow: "hidden", flexShrink: 0 }}>
        {project.image ? (
          <img src={project.image} alt={project.title} style={{ width: "100%", height: "auto", display: "block" }} draggable={false} />
        ) : (
          <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "0.55rem", letterSpacing: "0.18em", color: "rgba(0,0,0,0.2)", textTransform: "uppercase" }}>{ui.noPreview}</span>
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", transition: "background 0.2s", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "1.2rem" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.07)"; (e.currentTarget.lastChild as HTMLElement).style.opacity = "1"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0)"; (e.currentTarget.lastChild as HTMLElement).style.opacity = "0"; }}
        >
          <span style={{ fontSize: "0.58rem", letterSpacing: "0.14em", color: "rgba(255,255,255,0.9)", textTransform: "uppercase", textShadow: "0 1px 6px rgba(0,0,0,0.5)", opacity: 0, transition: "opacity 0.2s", pointerEvents: "none" }}>
            {ui.viewCatalogue}
          </span>
        </div>
      </Link>

      <button onClick={onClose}
        style={{ position: "absolute", top: "1.1rem", right: "1.1rem", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "50%", width: "2rem", height: "2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", color: "rgba(0,0,0,0.4)", lineHeight: 1, zIndex: 2 }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,1)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.85)")}
      >×</button>

      <div style={{ padding: "2rem 2.2rem 2.4rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
        <div>
          <p style={{ fontSize: "0.58rem", letterSpacing: "0.14em", color: "rgba(0,0,0,0.28)", textTransform: "uppercase", marginBottom: "0.4rem" }}>{project.subtitle}</p>
          <h2 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.75rem)", fontWeight: 500, color: "#000", letterSpacing: "0.02em", lineHeight: 1.15 }}>{project.title}</h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.58)", lineHeight: 1.9, letterSpacing: "0.01em" }}>
          {project.longDescription ?? project.description}
        </p>
        {project.highlights && (
          <div>
            <p style={{ fontSize: "0.56rem", letterSpacing: "0.14em", color: "rgba(0,0,0,0.25)", textTransform: "uppercase", marginBottom: "0.85rem" }}>{ui.highlights}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {project.highlights.map((h, i) => (
                <li key={i} style={{ fontSize: "0.78rem", color: "rgba(0,0,0,0.48)", lineHeight: 1.75, paddingLeft: "1.2em", position: "relative", letterSpacing: "0.01em" }}>
                  <span style={{ position: "absolute", left: 0, color: "rgba(0,0,0,0.2)" }}>—</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {project.tags.map(tag => (
              <span key={tag} style={{ fontSize: "0.56rem", letterSpacing: "0.08em", padding: "0.2rem 0.55rem", border: "1px solid rgba(0,0,0,0.09)", borderRadius: "20px", color: "rgba(0,0,0,0.38)", background: "rgba(0,0,0,0.02)" }}>{tag}</span>
            ))}
          </div>
          {project.href && (
            <a href={project.href} target="_blank" rel="noreferrer"
              style={{ fontSize: "0.7rem", letterSpacing: "0.08em", color: "rgba(0,0,0,0.4)", textDecoration: "none", borderBottom: "1px solid rgba(0,0,0,0.12)", paddingBottom: "0.1em", transition: "color 0.2s", alignSelf: "flex-start" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#000")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(0,0,0,0.4)")}
            >{ui.visitSite}</a>
          )}
        </div>
      </div>
    </>
  );
}

function ProjectExpanded({ project, onClose, isMobile, lang }: { project: ProjectEntry; onClose: () => void; isMobile: boolean; lang: "en" | "nl" }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (isMobile) {
    return (
      <>
        <motion.div
          style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(8,8,8,0.45)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        />
        <motion.div
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
            height: "92dvh", borderRadius: "20px 20px 0 0",
            background: "rgba(252,252,252,0.99)",
            border: "1px solid rgba(255,255,255,0.7)", borderBottom: "none",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
            fontFamily: '"Playfair Display", serif',
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 36, stiffness: 420 }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragEnd={(_, info) => { if (info.velocity.y > 400 || info.offset.y > 120) onClose(); }}
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", padding: "0.6rem 0 0.2rem" }}>
            <div style={{ width: "36px", height: "4px", background: "rgba(0,0,0,0.12)", borderRadius: "2px" }} />
          </div>
          <div className="no-scrollbar" style={{ overflowY: "auto", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overscrollBehavior: "contain", position: "relative" }}>
            <PopupContent project={project} onClose={onClose} lang={lang} />
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <motion.div
        style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(8,8,8,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />
      <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <motion.div
          layoutId={`project-card-${project.title}`}
          style={{
            width: "min(600px, 90vw)", maxHeight: "90vh", borderRadius: "24px",
            background: "rgba(252,252,252,0.98)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)",
            pointerEvents: "auto", fontFamily: '"Playfair Display", serif',
            overflow: "hidden", position: "relative",
            display: "flex", flexDirection: "column",
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="no-scrollbar" style={{ overflowY: "auto", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overscrollBehavior: "contain" }}>
            <PopupContent project={project} onClose={onClose} lang={lang} />
          </div>
        </motion.div>
      </div>
    </>
  );
}

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
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [logicalNudgeDone, setLogicalNudgeDone] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [chips, setChips] = useState<Chip[]>([]);
  const [chipTransDir, setChipTransDir] = useState<1 | -1>(1);
  const [chipSubmitCount, setChipSubmitCount] = useState(0);
  const [submittedQuery, setSubmittedQuery] = useState<{ value: string; nonce: number } | null>(null);
  const [seriouslyEntry, setSeriouslyEntry] = useState<{ message: string; id: number } | null>(null);
  const [seriouslyCount, setSeriouslyCount] = useState(0);
  const [showYoureDone, setShowYoureDone] = useState(false);
  const [contactClicks, setContactClicks] = useState(0);
  const [lang, setLang] = useState<"en" | "nl">("en");
  const [showExtended, setShowExtended] = useState(false);
  const [scrollToContact, setScrollToContact] = useState(false);
  const [scrollToWork, setScrollToWork] = useState(false);
  const [expandedProject, setExpandedProject] = useState<ProjectEntry | null>(null);
  const [cardRowDragLeft, setCardRowDragLeft] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const workSectionRef = useRef<HTMLElement>(null);
  const contactSectionRef = useRef<HTMLElement>(null);
  const glassRectRef = useRef<DOMRect | null>(null);
  const chipsRef = useRef<Chip[]>([]);
  const chipElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const rafRef = useRef<number>(0);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const reflectionRef = useRef<HTMLDivElement>(null);
  const contactHeadingWrapRef = useRef<HTMLDivElement>(null);
  const contactLinksTeRef = useRef<HTMLDivElement>(null);
  const bioTeRef = useRef<HTMLDivElement>(null);
  const projectsSectionTeRef = useRef<HTMLElement>(null);
  const cardRowContainerRef = useRef<HTMLDivElement>(null);
  const isMobileRef = useRef(false);

  const handleChipClick = useCallback((label: string) => {
    if (label === "Contact") setContactClicks(c => c + 1);
    if (label === "logical") { setShowExtended(true); setScrollToWork(true); }
  }, []);

  const handleClosePopup = useCallback(() => setExpandedProject(null), []);

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
    if (!scrollToWork || !showExtended) return;
    const t = setTimeout(() => {
      workSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      setScrollToWork(false);
    }, 80);
    return () => clearTimeout(t);
  }, [scrollToWork, showExtended]);

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
  useEffect(() => { isMobileRef.current = isMobile; }, [isMobile]);
  useEffect(() => { setMounted(true); }, []);

  // Measure drag constraint for card row once extended sections are visible
  useEffect(() => {
    if (!showExtended) return;
    const measure = () => {
      if (cardRowContainerRef.current) {
        const el = cardRowContainerRef.current;
        // scrollWidth includes overflow even when overflow:hidden
        setCardRowDragLeft(Math.min(0, -(el.scrollWidth - el.clientWidth)));
      }
    };
    const t = setTimeout(measure, 60);
    window.addEventListener("resize", measure);
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); };
  }, [showExtended]);

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
    if (isMobile) { setShowSearch(true); return; }
    const delay = 9000 + Math.random() * 3000;
    const t = setTimeout(() => setShowSearch(true), delay);
    return () => clearTimeout(t);
  }, [mounted, isMobile]);

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
    }, 600);
    return () => clearTimeout(start);
  }, [showSearch, lang]);

  // Single rAF loop: TE DOM updates + chip positions.
  // Frame throttle: at TE_SPEED=1 values change ~0.00001px/frame — 2fps is imperceptible.
  useEffect(() => {
    let frame = 0;
    const SKIP = TE_SPEED <= 1 ? 30 : 1;
    const PI = Math.PI;

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      if (++frame % SKIP !== 0) return;

      const W = window.innerWidth;
      const H = window.innerHeight;
      const angle = teAngleNow();
      const s = Math.sin;
      const co = Math.cos;

      // TE: title container transform
      if (titleContainerRef.current) {
        titleContainerRef.current.style.transform = `translate(${s(angle) * 40}px, ${co(angle) * 28}px) scale(${1 + s(angle) * 0.06})`;
      }
      // TE: title text letterSpacing + fontWeight
      if (h1Ref.current) {
        h1Ref.current.style.letterSpacing = `${s(angle) * 0.02 + 0.02}em`;
        h1Ref.current.style.fontWeight = String(400 + s(angle) * 40 + 40);
      }
      // TE: reflection (fontWeight + letterSpacing only — transform is static scaleY)
      if (reflectionRef.current) {
        reflectionRef.current.style.letterSpacing = `${s(angle) * 0.02 + 0.02}em`;
        reflectionRef.current.style.fontWeight = String(400 + s(angle) * 40 + 40);
      }
      // TE: extended sections — disabled on mobile (±60px shift breaks narrow layouts)
      if (!isMobileRef.current) {
        if (workSectionRef.current) {
          workSectionRef.current.style.transform = `translate(${s(angle) * 55}px, ${co(angle + 0.6) * 35}px)`;
        }
        if (contactHeadingWrapRef.current) {
          contactHeadingWrapRef.current.style.transform = `translate(${s(angle + PI * 0.75) * 44}px, ${co(angle + PI * 0.6) * 28}px)`;
        }
        if (contactLinksTeRef.current) {
          contactLinksTeRef.current.style.transform = `translate(${s(angle + PI * 0.5) * 48}px, ${co(angle + PI * 0.4) * 30}px)`;
        }
        if (bioTeRef.current) {
          bioTeRef.current.style.transform = `translate(${s(angle + PI) * 52}px, ${co(angle + PI * 0.9) * 38}px)`;
        }
        if (projectsSectionTeRef.current) {
          projectsSectionTeRef.current.style.transform = `translate(${s(angle + PI * 1.5) * 60}px, ${co(angle + PI * 1.3) * 40}px)`;
        }
      }

      // Chips
      chipsRef.current.filter(c => c.state === "visible").forEach(chip => {
        const pos = getChipPosition(chip.label, angle, W, H, glassRectRef.current);
        const el = chipElsRef.current.get(chip.id);
        if (el) el.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
      });
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Set initial DOM position on entering
  useEffect(() => {
    chips.filter(c => c.state === "entering").forEach(chip => {
      const el = chipElsRef.current.get(chip.id);
      if (el) {
        const pos = getChipPosition(chip.label, teAngleNow(), window.innerWidth, window.innerHeight, glassRectRef.current);
        el.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
      }
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
    const label = resolveChip(submittedQuery.value);
    if (!label) return;

    setChipSubmitCount(c => c + 1);
    setChipTransDir(prev => (prev === 1 ? -1 : 1) as 1 | -1);

    setChips(prev => {
      const active = prev.filter(c => c.state !== "exiting");
      if (active.some(c => c.label === label)) return prev;

      let next = [...prev];
      if (active.length >= 1) {
        const oldest = active[0];
        next = next.map(c => c.id === oldest.id ? { ...c, state: "exiting" as ChipState } : c);
      }

      next.push({
        id: `${label}-${Date.now()}-${Math.random()}`,
        label,
        state: "entering",
      });
      return next;
    });
  }, [submittedQuery]);

  useEffect(() => {
    if (!submittedQuery || !isBadWord(submittedQuery.value)) return;
    setSeriouslyCount(prev => {
      const next = prev + 1;
      if (next >= 9) {
        setShowYoureDone(true);
      } else {
        const message = SERIOUSLY_MSGS[Math.min(next - 1, SERIOUSLY_MSGS.length - 1)];
        setSeriouslyEntry({ message, id: Date.now() });
      }
      return next;
    });
  }, [submittedQuery]);

  useEffect(() => {
    if (!seriouslyEntry) return;
    const id = seriouslyEntry.id;
    const t = setTimeout(() => {
      setSeriouslyEntry(curr => curr?.id === id ? null : curr);
    }, 6000);
    return () => clearTimeout(t);
  }, [seriouslyEntry]);

  useEffect(() => {
    if (!showSearch || logicalNudgeDone) return;
    const t = setTimeout(() => {
      setSubmittedQuery(prev => ({ value: "logical", nonce: (prev?.nonce ?? 0) + 1 }));
      setLogicalNudgeDone(true);
    }, 6000);
    return () => clearTimeout(t);
  }, [showSearch, logicalNudgeDone]);

  if (!mounted) return null;

  const placeholderVisible = !isFocused && searchValue === "";
  const c = CONTENT[lang];

  return (
    <main className="relative w-full bg-white" style={{ height: showExtended ? "auto" : "100%", overflow: "clip" }}>
      {/* ── HERO ── */}
      <div className="relative w-full" style={{ height: "100svh", overflow: "clip" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent pointer-events-none opacity-30" />

        {isMobile ? (
          /* ── MOBILE HERO ── */
          <>
            {/* Centered glass pane + title */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div
                ref={glassRef}
                style={{
                  position: "absolute",
                  width: "82vw", height: "44vw",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, rgba(0,0,0,0.03), rgba(0,0,0,0.01))",
                  border: "1px solid rgba(0,0,0,0.07)",
                  opacity: 0.4,
                }}
              />
              <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
                <h1
                  className="glossy-text-shadow"
                  style={{
                    fontSize: "clamp(1.8rem, 9.5vw, 3.2rem)",
                    letterSpacing: "0.02em",
                    fontWeight: 440,
                    lineHeight: 1.1,
                    fontFamily: '"Playfair Display", serif',
                    paddingBottom: "0.15em",
                    userSelect: "none",
                  }}
                >
                  <span className="glossy-text">ATTA logical</span>
                </h1>
                <div
                  className="pointer-events-none"
                  style={{
                    marginTop: "-0.1em", opacity: 0.18,
                    transform: "scaleY(-0.85) translateY(0.2rem)",
                    filter: "blur(1.5px)",
                    fontFamily: '"Playfair Display", serif',
                    fontSize: "clamp(1.8rem, 9.5vw, 3.2rem)",
                    fontWeight: 440,
                    letterSpacing: "0.02em",
                    lineHeight: 1.1,
                  }}
                >
                  <span className="glossy-text">ATTA logical</span>
                </div>
              </div>
            </div>

            {/* Active chip — swipes in/out from opposite sides */}
            <div style={{ position: "absolute", top: "calc(50% + 22vw)", left: 0, right: 0, display: "flex", justifyContent: "center", overflow: "hidden" }}>
              <AnimatePresence mode="popLayout">
                {chips.filter(ch => ch.state !== "exiting").map(chip => (
                  <motion.button
                    key={chip.id}
                    initial={chipSubmitCount <= 1
                      ? { x: 0, opacity: 0, scale: 0.88 }
                      : { x: chipTransDir * 500, opacity: 0, scale: 1 }
                    }
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{
                      x: chipTransDir * 500, opacity: 0, scale: 0.95,
                      transition: {
                        type: "spring", stiffness: 60, damping: 12, mass: 1.5,
                        opacity: { type: "tween", duration: 0.38, ease: "easeIn" },
                      },
                    }}
                    transition={{
                      type: "spring", stiffness: 120, damping: 12, mass: 1.5,
                      opacity: { type: "tween", duration: chipSubmitCount <= 1 ? 1.5 : 0.65, ease: "easeOut" },
                    }}
                    onClick={() => handleChipClick(chip.label)}
                    style={{
                      background: "none", border: "none",
                      borderBottom: "1px solid rgba(0,0,0,0.18)",
                      padding: "0.1em 0",
                      fontFamily: '"Playfair Display", serif',
                      fontSize: "clamp(0.9rem, 4.5vw, 1.2rem)",
                      letterSpacing: "0.12em",
                      color: "rgba(0,0,0,0.6)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {chip.label}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {/* Contact email */}
            <div style={{
              position: "absolute", top: "calc(50% + 30vw)", left: 0, right: 0,
              display: "flex", justifyContent: "center",
              opacity: contactClicks > 0 ? 1 : 0,
              transition: "opacity 1s ease-in-out",
              pointerEvents: contactClicks > 0 ? "auto" : "none",
            }}>
              <a href="mailto:Boelie@attalogical.com" className="glossy-text"
                style={{ display: "inline", paddingBottom: 0, fontSize: "clamp(0.65rem, 3.5vw, 0.9rem)", letterSpacing: "0.1em", textDecoration: "none" }}>
                Boelie@attalogical.com
              </a>
            </div>

            {/* Search bar — same underline style as desktop, anchored to bottom */}
            <div style={{ position: "absolute", bottom: "max(4vh, env(safe-area-inset-bottom, 4vh))", left: "50%", transform: "translateX(-50%)" }}>
              <div style={{ position: "relative" }}>
                <span aria-hidden style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "1rem", letterSpacing: "0.08em",
                  color: "rgba(0,0,0,0.35)", pointerEvents: "none",
                  whiteSpace: "nowrap",
                  opacity: placeholderVisible ? 1 : 0,
                  transition: "opacity 0.3s",
                }}>
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
                    setSubmittedQuery(prev => ({ value: searchValue, nonce: (prev?.nonce ?? 0) + 1 }));
                    setSearchValue("");
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{
                    width: "85vw",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid rgba(0,0,0,0.15)",
                    outline: "none",
                    fontFamily: '"Playfair Display", serif',
                    fontSize: "1rem",
                    color: "#000",
                    letterSpacing: "0.08em",
                    padding: "0.4em 0",
                    textAlign: "center",
                    caretColor: "#000",
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          /* ── DESKTOP HERO ── */
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                ref={glassRef}
                className="absolute w-3/4 h-3/4 max-w-4xl rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(0,0,0,0.03), rgba(0,0,0,0.01))",
                  border: "1px solid rgba(0,0,0,0.08)",
                  opacity: 0.4,
                }}
              />

              <div
                ref={titleContainerRef}
                className="relative z-10 flex flex-col items-center justify-center text-center"
                style={{
                  transform: `translate(${temporal.offsetX}px, ${temporal.offsetY}px) scale(${temporal.scale})`,
                }}
              >
                <h1
                  ref={h1Ref}
                  className="glossy-text-shadow"
                  style={{
                    fontSize: "clamp(2rem, 8vw, 6rem)",
                    letterSpacing: `${temporal.letterSpacing}em`,
                    fontWeight: temporal.fontWeight as any,
                    lineHeight: 1.1,
                    fontFamily: '"Playfair Display", serif',
                    paddingBottom: "0.15em",
                    userSelect: "none",
                    cursor: "default",
                  }}
                >
                  <span className="glossy-text">ATTA logical</span>
                </h1>

                <div
                  ref={reflectionRef}
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
                  bottom: "21%", left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 12, textAlign: "center",
                  opacity: contactClicks > 0 ? 1 : 0,
                  transition: "opacity 1s ease-in-out",
                  pointerEvents: contactClicks > 0 ? "auto" : "none",
                }}
              >
                <a href="mailto:Boelie@attalogical.com" className="glossy-text"
                  style={{ display: "block", paddingBottom: 0, fontSize: "clamp(0.7rem, 1.1vw, 0.9rem)", letterSpacing: "0.1em", textDecoration: "none", whiteSpace: "nowrap" }}>
                  Boelie@attalogical.com
                </a>
                <button onClick={goToContact}
                  style={{ marginTop: "0.6em", background: "none", border: "none", fontFamily: '"Playfair Display", serif', fontSize: "clamp(0.6rem, 0.9vw, 0.75rem)", letterSpacing: "0.12em", color: "rgba(0,0,0,0.35)", cursor: "pointer", padding: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(0,0,0,0.7)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(0,0,0,0.35)")}
                >
                  {c.more}
                </button>
              </div>

              <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(0,0,0,0.06) 0%, transparent 70%)", opacity: 0.3 }} />
              <div className="absolute bottom-1/3 -left-1/3 w-96 h-96 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(0,0,0,0.04) 0%, transparent 70%)", opacity: 0.2 }} />
            </div>

            <ChipLayer chips={chips} chipElsRef={chipElsRef} onChipClick={handleChipClick} />

            {/* Search bar */}
            <div className="absolute inset-0 flex items-end justify-center pointer-events-none" style={{ paddingBottom: "12vh" }}>
              <div className="relative pointer-events-auto" style={{
                opacity: showSearch ? 1 : 0,
                transform: showSearch ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 2.5s ease-in-out, transform 2.5s ease-in-out",
              }}>
                <span aria-hidden style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "clamp(0.75rem, 1.5vw, 1rem)",
                  letterSpacing: "0.08em", color: "rgba(0,0,0,0.35)",
                  pointerEvents: "none", whiteSpace: "nowrap",
                  opacity: placeholderVisible ? 1 : 0,
                  transition: "opacity 0.6s ease-in-out",
                }}>
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
                    setSubmittedQuery(prev => ({ value: searchValue, nonce: (prev?.nonce ?? 0) + 1 }));
                  }}
                  onFocus={() => { setShowSearch(true); setIsFocused(true); }}
                  onBlur={() => setIsFocused(false)}
                  style={{
                    background: "transparent", border: "none",
                    borderBottom: "1px solid rgba(0,0,0,0.15)", outline: "none",
                    fontFamily: '"Playfair Display", serif',
                    fontSize: "clamp(0.75rem, 1.5vw, 1rem)",
                    color: "#000", letterSpacing: "0.08em",
                    padding: "0.4em 0",
                    width: "clamp(180px, 25vw, 320px)",
                    textAlign: "center", caretColor: "#000",
                  }}
                />
              </div>
            </div>
          </>
        )}
        {/* ── SERIOUSLY ── */}
        <AnimatePresence>
          {seriouslyEntry && (
            <motion.div
              key={seriouslyEntry.id}
              style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                height: isMobile ? "calc(50svh - 22vw)" : "12.5svh",
                display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "none", zIndex: 50,
              }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 6, times: [0, 0.03, 0.82, 1], ease: "easeInOut" }}
              exit={{ opacity: 0, transition: { duration: 0.22, ease: "easeIn" } }}
            >
              <span style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: "clamp(0.9rem, 3.5vw, 1.3rem)",
                color: "rgba(0,0,0,0.38)",
                letterSpacing: "0.22em",
                fontStyle: "italic",
              }}>
                {seriouslyEntry.message}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>{/* end hero */}

      {/* ── EXTENDED SECTIONS ── */}
      {showExtended && (
        <div style={{ background: "white", fontFamily: '"Playfair Display", serif', overflowX: "clip" }}>

          {/* Work Experience */}
          <section ref={workSectionRef} style={{ padding: isMobile ? "12vw 6vw" : "8vw 12vw", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <h2 className="glossy-text" style={{ display: "block", paddingBottom: 0, fontSize: "clamp(0.7rem, 1vw, 0.9rem)", letterSpacing: `${0.2 + temporal.letterSpacing * 0.15}em`, marginBottom: "4rem", textTransform: "uppercase" }}>
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
          <section ref={contactSectionRef} style={{ padding: isMobile ? "12vw 6vw 12vw 26vw" : "8vw 12vw", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div ref={contactHeadingWrapRef} style={{ marginBottom: "4rem" }}>
              <h2 className="glossy-text" style={{ display: "block", paddingBottom: 0, fontSize: "clamp(0.7rem, 1vw, 0.9rem)", letterSpacing: `${0.2 + temporal.letterSpacing * 0.15}em`, textTransform: "uppercase", textAlign: isMobile ? "right" : "left" }}>
                {c.contact}
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: isMobile ? undefined : "space-between", alignItems: isMobile ? "flex-end" : "flex-start", flexWrap: isMobile ? undefined : "wrap", gap: isMobile ? "2.5rem" : 0 }}>

              {/* contact links */}
              <div ref={contactLinksTeRef} style={{ minWidth: isMobile ? undefined : "220px" }}>
                <p style={{ fontSize: "clamp(1rem, 1.6vw, 1.25rem)", fontWeight: 500, color: "#000", letterSpacing: "0.02em", marginBottom: "2rem", textAlign: isMobile ? "right" : "left" }}>
                  Boelie van Camp
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                  {[
                    { label: "email", href: "mailto:Boelie@attalogical.com", text: "Boelie@attalogical.com" },
                    { label: "instagram", href: "https://www.instagram.com/boelie36/", text: "@boelie36" },
                    { label: "github", href: "https://github.com/ATTAlogical", text: "ATTAlogical" },
                  ].map(({ label, href, text }) => (
                    <div key={label} style={{ display: "flex", flexDirection: isMobile ? "row-reverse" : "row", gap: "2rem", alignItems: "baseline" }}>
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

              {/* bio */}
              <div ref={bioTeRef} style={{ maxWidth: isMobile ? "100%" : "380px", textAlign: isMobile ? "right" : "left" }}>
                <p style={{ fontSize: "clamp(0.8rem, 1.1vw, 0.95rem)", color: "rgba(0,0,0,0.6)", lineHeight: 1.9, marginBottom: "2rem", letterSpacing: "0.02em" }}>
                  {c.bio}
                </p>
                <p style={{ fontSize: "clamp(0.75rem, 1vw, 0.88rem)", color: "rgba(0,0,0,0.35)", lineHeight: 1.8, fontStyle: "italic", letterSpacing: "0.03em", borderLeft: isMobile ? "none" : "1px solid rgba(0,0,0,0.1)", borderRight: isMobile ? "1px solid rgba(0,0,0,0.1)" : "none", paddingLeft: isMobile ? 0 : "1.2em", paddingRight: isMobile ? "1.2em" : 0 }}>
                  "{c.bioQuote}"
                </p>
              </div>

            </div>
          </section>

          {/* Projects */}
          <section ref={projectsSectionTeRef} style={{ padding: isMobile ? "12vw 0" : "8vw 0", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ paddingLeft: isMobile ? "6vw" : "12vw", paddingRight: isMobile ? "6vw" : "12vw", marginBottom: "2.5rem" }}>
              <h2 className="glossy-text" style={{ display: "block", paddingBottom: 0, fontSize: "clamp(0.7rem, 1vw, 0.9rem)", letterSpacing: `${0.2 + temporal.letterSpacing * 0.15}em`, textTransform: "uppercase" }}>
                {c.projects}
              </h2>
            </div>

            {/* Drag-to-scroll card row — paddingTop/marginTop give 3D-tilted cards room above */}
            <div ref={cardRowContainerRef} style={{ overflow: "hidden", paddingTop: "40px", marginTop: "-40px" }}>
              <motion.div
                drag={cardRowDragLeft < 0 ? "x" : false}
                dragConstraints={{ left: cardRowDragLeft, right: 0 }}
                dragElastic={0.06}
                dragMomentum
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
                style={{
                  display: "inline-flex",
                  gap: "1.25rem",
                  paddingLeft: isMobile ? "6vw" : "12vw",
                  paddingRight: isMobile ? "6vw" : "12vw",
                  paddingBottom: "2rem",
                  cursor: cardRowDragLeft < 0 ? "grab" : "default",
                  userSelect: "none",
                  minWidth: "100%",
                  touchAction: "pan-y",
                }}
                whileDrag={{ cursor: "grabbing" }}
              >
                {PROJECTS_DATA.map(project => (
                  <motion.div
                    key={project.title}
                    style={{ flexShrink: 0 }}
                    variants={{
                      hidden: { opacity: 0, y: 28 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                    }}
                  >
                    <ProjectCard
                      project={project}
                      isExpanded={expandedProject?.title === project.title}
                      onExpand={setExpandedProject}
                      isMobile={isMobile}
                      lang={lang}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

        </div>
      )}

      {/* Card expand overlay */}
      <AnimatePresence>
        {expandedProject && (
          <ProjectExpanded
            key={expandedProject.title}
            project={expandedProject}
            onClose={handleClosePopup}
            isMobile={isMobile}
            lang={lang}
          />
        )}
      </AnimatePresence>

      {/* ── YOU'RE DONE ── */}
      <AnimatePresence>
        {showYoureDone && (
          <motion.div
            key="youre-done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeIn" }}
            style={{
              position: "fixed", inset: 0,
              background: "#000",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 9999,
            }}
          >
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", userSelect: "none" }}>
              {/* Main text */}
              <span style={{
                display: "block",
                fontFamily: '"Playfair Display", serif',
                fontSize: "clamp(2.5rem, 9vw, 6rem)",
                letterSpacing: "0.06em",
                fontWeight: 500,
                background: "linear-gradient(180deg, #ffffff 0%, #dddddd 40%, #888888 80%, #666666 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 1px 3px rgba(255,255,255,0.15))",
              }}>
                You&apos;re done
              </span>
              {/* Reflection */}
              <span aria-hidden style={{
                display: "block",
                fontFamily: '"Playfair Display", serif',
                fontSize: "clamp(2.5rem, 9vw, 6rem)",
                letterSpacing: "0.06em",
                fontWeight: 500,
                background: "linear-gradient(180deg, #666666 0%, #333333 40%, transparent 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                transform: "scaleY(-1)",
                marginTop: "-0.05em",
                opacity: 0.45,
                pointerEvents: "none",
              }}>
                You&apos;re done
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LANGUAGE TOGGLE ── */}
      <div style={{
        position: "fixed",
        ...(isMobile
          ? { top: "max(2rem, env(safe-area-inset-top, 1.5rem))", left: "max(1.5rem, env(safe-area-inset-left, 1.5rem))" }
          : { bottom: "max(1.5rem, env(safe-area-inset-bottom, 2rem))", left: "max(2rem, env(safe-area-inset-left, 2rem))" }
        ),
        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem",
        zIndex: 100,
      }}>
        <motion.button
          onClick={() => setLang(l => l === "en" ? "nl" : "en")}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.91 }}
          style={{
            width: "3.1rem", height: "3.1rem",
            borderRadius: "50%",
            background: "linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(235,236,240,0.88) 100%)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1.5px solid rgba(255,255,255,0.75)",
            boxShadow: [
              "0 6px 22px rgba(0,0,0,0.13)",
              "0 2px 6px rgba(0,0,0,0.08)",
              "inset 0 0 0 1px rgba(0,0,0,0.07)",
              "inset 0 2.5px 0 rgba(255,255,255,1)",
              "inset 0 -2.5px 0 rgba(0,0,0,0.14)",
              "inset 2px 0 0 rgba(255,255,255,0.45)",
              "inset -2px 0 0 rgba(0,0,0,0.05)",
            ].join(", "),
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(0,0,0,0.5)",
            padding: 0,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.3rem", height: "1.3rem" }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </motion.button>
        <span style={{
          fontSize: "0.52rem", letterSpacing: "0.14em",
          color: "rgba(0,0,0,0.28)", textTransform: "uppercase",
          fontFamily: '"Playfair Display", serif',
          userSelect: "none",
        }}>
          {lang}
        </span>
      </div>
    </main>
  );
}
