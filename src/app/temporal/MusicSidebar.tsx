"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate, AnimatePresence } from "motion/react";
import type { TemporalEntry } from "./TemporalClient";

const STORAGE_KEY    = "music-sidebar-pos";
const COLLAPSED_KEY  = "music-sidebar-collapsed";
const ROW_HEIGHT     = 60;
const MAX_VISIBLE    = 6;
const CARD_WIDTH     = 280;
const HANDLE_Y       = 14;   // px from card top to grab-handle centre
const WALL_THRESHOLD = 10;   // px — card must be this close to the edge to dock on release
const DOCK_OVER      = 16;   // px past edge when docked (just out of view)
const FLOAT_GAP      = 20;   // px from edge when card returns
const BUBBLE_R       = 22;   // bubble radius (44px diameter)

type DockEdge = "left" | "right" | "top" | "bottom";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtReleaseDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.length === 4 || raw.length === 7) return raw;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toISOString().slice(0, 10);
}

// ─── MusicRow ─────────────────────────────────────────────────────────────────

function MusicRow({ entry, onSelect }: { entry: TemporalEntry; onSelect: () => void }) {
  const rel = fmtReleaseDate(entry.spotifyReleaseDate);
  return (
    <button type="button" className="music-row" title={entry.spotifyTitle ?? entry.title} onClick={onSelect}>
      <span className="music-row-cover-wrap">
        {entry.spotifyThumb
          ? <img src={entry.spotifyThumb} alt="" className="music-row-cover" loading="lazy" decoding="async" />
          : <span className="music-row-cover music-row-cover--placeholder" />}
        {entry.spotifyThumb && <img src={entry.spotifyThumb} alt="" aria-hidden className="music-row-cover-reflection" loading="lazy" decoding="async" />}
      </span>
      <span className="music-row-meta">
        <span className="music-row-title">{entry.spotifyTitle ?? entry.title}</span>
        {rel && <span className="music-row-line2">{rel}</span>}
      </span>
    </button>
  );
}

// ─── DockBubble ───────────────────────────────────────────────────────────────

const ARROW: Record<DockEdge, string> = { right: "←", left: "→", top: "↓", bottom: "↑" };

function DockBubble({
  edge, initialAxisPos, onUndock, onAxisChange,
}: {
  edge: DockEdge;
  initialAxisPos: number;
  onUndock: () => void;
  onAxisChange: (screenPos: number) => void;
}) {
  const offset   = useMotionValue(0);          // drag offset from initialAxisPos along the edge axis
  const [hovered, setHovered] = useState(false);
  const isHoriz  = edge === "top" || edge === "bottom";  // bubble drags left↔right on horiz edges
  const didDrag  = useRef(false);

  // Position the bubble: one axis is fixed to the screen edge, the other is draggable.
  const fixedStyle: React.CSSProperties = isHoriz
    ? {
        [edge === "top" ? "top" : "bottom"]: 10,
        left: initialAxisPos - BUBBLE_R,
      }
    : {
        [edge === "left" ? "left" : "right"]: 10,
        top: initialAxisPos - BUBBLE_R,
      };

  return (
    <motion.button
      type="button"
      drag={isHoriz ? "x" : "y"}
      dragMomentum={false}
      dragElastic={0.1}
      style={{
        position: "fixed",
        zIndex: 42,
        width:  BUBBLE_R * 2,
        height: BUBBLE_R * 2,
        ...fixedStyle,
        x: isHoriz ? offset : 0,
        y: isHoriz ? 0 : offset,
        // glass
        background: "oklch(99% 0.002 255 / 0.76)",
        backdropFilter: "blur(22px) saturate(180%)",
        WebkitBackdropFilter: "blur(22px) saturate(180%)",
        border: "0.5px solid rgba(255,255,255,0.65)",
        borderRadius: "50%",
        boxShadow: "0 4px 22px rgba(0,0,0,0.13), inset 0 0.5px 0 rgba(255,255,255,0.9)",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        userSelect: "none",
        touchAction: "none",
      }}
      initial={{ opacity: 0, scale: 0.55 }}
      animate={{ opacity: 1, scale: hovered ? 1.12 : 1 }}
      exit={{ opacity: 0, scale: 0.55 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onDragStart={() => { didDrag.current = false; }}
      onDrag={() => {
        didDrag.current = true;
        onAxisChange(initialAxisPos + offset.get());
      }}
      onDragEnd={() => { onAxisChange(initialAxisPos + offset.get()); }}
      onClick={() => { if (!didDrag.current) onUndock(); didDrag.current = false; }}
    >
      {/* music note */}
      <span style={{
        fontSize: 14, lineHeight: 1,
        fontFamily: '"Playfair Display", serif',
        color: "rgba(0,0,0,0.52)",
        marginBottom: 1,
      }}>♪</span>

      {/* directional arrow — nudges toward screen center on hover */}
      <motion.span
        animate={{
          x: hovered && !isHoriz ? (edge === "right" ? -3 : 3) : 0,
          y: hovered && isHoriz  ? (edge === "bottom" ? -3 : 3) : 0,
        }}
        transition={{ type: "spring", stiffness: 700, damping: 22 }}
        style={{
          fontSize: 9, lineHeight: 1,
          fontFamily: "ui-monospace, monospace",
          color: "rgba(0,0,0,0.36)",
          display: "block",
        }}
      >
        {ARROW[edge]}
      </motion.span>
    </motion.button>
  );
}

// ─── MusicSidebar ─────────────────────────────────────────────────────────────

export default function MusicSidebar({
  entries, spotifyProfile, detailOpen, onSelect,
}: {
  entries: TemporalEntry[];
  spotifyProfile?: string | null;
  showVanity?: boolean;
  detailOpen?: boolean;
  onSelect: (entry: TemporalEntry) => void;
}) {
  const dragAreaRef = useRef<HTMLDivElement>(null);
  const cardRef     = useRef<Element | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const [mounted,   setMounted]   = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // dock state
  const [dockEdge,  setDockEdge]  = useState<DockEdge | null>(null);
  const [initAxis,  setInitAxis]  = useState(0);     // initial bubble axis pos on screen

  const dockEdgeRef    = useRef<DockEdge | null>(null);
  const bubbleAxisPos  = useRef(0);                  // live bubble axis pos (updated by DockBubble)
  const cardHeightRef  = useRef(0);

  // measure card height after every render
  useEffect(() => {
    if (cardRef.current) cardHeightRef.current = (cardRef.current as HTMLElement).offsetHeight;
  });

  // restore saved position + collapsed state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { x?: number; y?: number };
        const maxYUp = -(window.innerHeight - 200);
        x.set(Math.max(0, Math.min(p.x ?? 0, window.innerWidth - 320)));
        y.set(Math.max(maxYUp, Math.min(p.y ?? 0, 0)));
      }
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch { /* ignore */ }
    setMounted(true);
  }, [x, y]);

  const persistPosition = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: x.get(), y: y.get() })); }
    catch { /* ignore */ }
  }, [x, y]);

  const toggleCollapsed = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  };

  // auto-relocate when detail panel opens — skip when docked
  useEffect(() => {
    if (!detailOpen || !mounted || dockEdgeRef.current !== null) return;
    const rect = document.querySelector(".music-sidebar")?.getBoundingClientRect();
    if (!rect) return;
    if (rect.right > window.innerWidth - 380 || rect.top < 80) {
      animate(x, 0, { duration: 0.5, ease: [0.16, 1, 0.3, 1] });
      animate(y, 0, { duration: 0.5, ease: [0.16, 1, 0.3, 1] });
      setTimeout(persistPosition, 600);
    }
  }, [detailOpen, mounted, persistPosition, x, y]);

  // ── dock ─────────────────────────────────────────────────────────────────────
  const dockTo = useCallback((edge: DockEdge) => {
    const el = cardRef.current as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const W = window.innerWidth, H = window.innerHeight;
    const cardH = cardHeightRef.current || 200;

    // bubble axis pos = grab-handle screen position along the chosen edge's axis
    let axisPos = edge === "left" || edge === "right"
      ? rect.top + HANDLE_Y               // Y coord of handle centre
      : rect.left + CARD_WIDTH / 2;       // X coord of card centre

    // clamp so bubble stays fully on screen
    axisPos = Math.max(BUBBLE_R + 10, Math.min(
      (edge === "left" || edge === "right" ? H : W) - BUBBLE_R - 10,
      axisPos,
    ));

    setInitAxis(axisPos);
    bubbleAxisPos.current = axisPos;

    // off-screen target for the card
    let tx = x.get(), ty = y.get();
    switch (edge) {
      case "right":  tx = W  + DOCK_OVER - 28;                        break;
      case "left":   tx = -DOCK_OVER - CARD_WIDTH - 28;               break;
      case "top":    ty = -DOCK_OVER - H + 28;                        break;
      case "bottom": ty =  DOCK_OVER + 28 + cardH;                    break;
    }

    animate(x, tx, { duration: 0.38, ease: [0.16, 1, 0.3, 1] });
    animate(y, ty, { duration: 0.38, ease: [0.16, 1, 0.3, 1] });
    dockEdgeRef.current = edge;
    setDockEdge(edge);
  }, [x, y]);

  // ── undock ───────────────────────────────────────────────────────────────────
  const undock = useCallback(() => {
    const edge = dockEdgeRef.current;
    if (!edge) return;

    const axis  = bubbleAxisPos.current;
    const W     = window.innerWidth;
    const H     = window.innerHeight;
    const cardH = cardHeightRef.current || 200;

    let tx: number, ty: number;

    switch (edge) {
      case "right":
        // card FLOAT_GAP from right edge; handle aligns with bubble Y
        tx = W - CARD_WIDTH - FLOAT_GAP - 28;
        ty = axis - HANDLE_Y - (H - 28 - cardH);
        break;
      case "left":
        tx = FLOAT_GAP - 28;
        ty = axis - HANDLE_Y - (H - 28 - cardH);
        break;
      case "top":
        // card FLOAT_GAP from top; card centre-X aligns with bubble X
        ty = FLOAT_GAP + cardH - (H - 28);
        tx = axis - CARD_WIDTH / 2 - 28;
        break;
      case "bottom":
        ty = 28 - FLOAT_GAP;                   // card bottom FLOAT_GAP from screen bottom
        tx = axis - CARD_WIDTH / 2 - 28;
        break;
    }

    // clamp to keep card on screen
    tx = Math.max(-28, Math.min(W - CARD_WIDTH - 28, tx));
    ty = Math.max(-(H - 100), Math.min(50, ty));

    animate(x, tx, { duration: 0.48, ease: [0.16, 1, 0.3, 1] });
    animate(y, ty, { duration: 0.48, ease: [0.16, 1, 0.3, 1] });
    dockEdgeRef.current = null;
    setDockEdge(null);
    setTimeout(persistPosition, 600);
  }, [x, y, persistPosition]);

  // ── drag handlers ─────────────────────────────────────────────────────────
  const onDragEnd = useCallback(() => {
    const el = cardRef.current as HTMLElement | null;
    if (!el) { persistPosition(); return; }

    const rect = el.getBoundingClientRect();
    const W = window.innerWidth, H = window.innerHeight;
    const dists: Record<DockEdge, number> = {
      left: rect.left, right: W - rect.right,
      top:  rect.top,  bottom: H - rect.bottom,
    };
    let minEdge: DockEdge = "right", minDist = Infinity;
    for (const [e, d] of Object.entries(dists) as [DockEdge, number][]) {
      if (d < minDist) { minDist = d; minEdge = e; }
    }

    if (minDist < WALL_THRESHOLD) dockTo(minEdge);
    else persistPosition();
  }, [dockTo, persistPosition]);

  // ── render ────────────────────────────────────────────────────────────────
  const scrollable     = entries.length > MAX_VISIBLE;
  const expandedHeight = scrollable ? MAX_VISIBLE * ROW_HEIGHT : entries.length * ROW_HEIGHT;

  return (
    <>
      {/* Full-viewport drag constraint area */}
      <div ref={dragAreaRef} aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 39 }} />

      {/* Card */}
      <motion.aside
        ref={(el) => { cardRef.current = el; }}
        className="music-sidebar"
        drag
        dragConstraints={dragAreaRef}
        dragElastic={0.18}
        dragMomentum
        dragTransition={{ bounceStiffness: 380, bounceDamping: 38 }}
        onDragEnd={onDragEnd as never}
        whileDrag={{ scale: 1.02, boxShadow: "0 22px 60px rgba(0,0,0,0.18), 0 6px 18px rgba(0,0,0,0.10)", cursor: "grabbing" }}
        style={{ x, y, overflow: "hidden" }}
        initial={mounted ? false : { opacity: 0, y: 16 }}
        animate={mounted ? { opacity: 1 } : { opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        aria-label="CKORE albums"
      >
        {/* Grab handle */}
        <div className="music-sidebar-handle" aria-hidden>
          <span /><span /><span />
        </div>

        {/* Header */}
        <div className="music-sidebar-head">
          {spotifyProfile ? (
            <a href={spotifyProfile} target="_blank" rel="noreferrer"
              className="music-sidebar-profile" title="Open CKORE on Spotify"
              onClick={(e) => e.stopPropagation()}>CKORE ↗</a>
          ) : (
            <span>CKORE</span>
          )}
          <button type="button" onClick={toggleCollapsed}
            title={collapsed ? "Expand" : "Collapse"}
            style={{
              background: "none", border: "none", padding: "2px 4px",
              cursor: "pointer", color: "rgba(0,0,0,0.55)",
              display: "flex", alignItems: "center",
            }}
          >
            <motion.span
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{ display: "block" }}
            >
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.span>
          </button>
        </div>

        {/* Row list */}
        <div style={{
          maxHeight: collapsed ? 0 : `${expandedHeight}px`,
          overflowY: collapsed ? "hidden" : (scrollable ? "auto" : "hidden"),
          overflowX: "hidden",
          transition: "max-height 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}>
          {entries.map((entry) => (
            <MusicRow key={entry.slug} entry={entry} onSelect={() => onSelect(entry)} />
          ))}
        </div>
      </motion.aside>

      {/* Dock bubble */}
      <AnimatePresence>
        {dockEdge && (
          <DockBubble
            key={`bubble-${dockEdge}`}
            edge={dockEdge}
            initialAxisPos={initAxis}
            onUndock={undock}
            onAxisChange={(pos) => { bubbleAxisPos.current = pos; }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
