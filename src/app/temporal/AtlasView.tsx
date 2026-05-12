"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  computeEdges,
  TYPE_WEIGHT,
  type LogEntry,
} from "@/data/log";

// ─── Physics ──────────────────────────────────────────────────────────────────

type PhysicsNode = {
  slug: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  seedX: number;
  seedY: number;
  radius: number;
};

const REPULSION_K = 5200;        // pairwise repulsion
const SPRING_K = 0.006;          // edge spring stiffness
const SPRING_REST = 150;         // edge rest length, px
const CENTER_K = 0.004;          // pull toward origin
const DAMPING = 0.88;            // velocity decay per frame
const DRIFT_K = 0.18;            // ambient organic motion
const SAME_BRANCH_BONUS = 1.35;  // shorter rest length within a branch
const BOUND_X = 480;             // soft wall half-width
const BOUND_Y = 280;             // soft wall half-height
const WALL_K = 0.045;            // wall spring strength
const STEP_DT = 1;

function stepPhysics(
  nodes: PhysicsNode[],
  edges: Array<{ from: string; to: string }>,
  branches: Map<string, string>,
  t: number,
  /** Force-intensity multiplier 0..1. At 1 = normal motion. At 0 = no new forces, existing velocity damps to rest. */
  factor: number = 1,
) {
  const byIndex = new Map<string, number>();
  for (let i = 0; i < nodes.length; i++) byIndex.set(nodes[i].slug, i);

  // Reset force accumulators (use velocity space directly)
  for (const n of nodes) {
    let fx = 0;
    let fy = 0;

    // Centering toward origin (we render in coords centered on (0,0))
    fx += -n.x * CENTER_K * factor;
    fy += -n.y * CENTER_K * factor;

    // Soft walls — quadratic pull-back beyond the safe zone, so nothing escapes.
    // Walls run at full strength regardless of pause so layout never escapes.
    const overX = Math.max(0, Math.abs(n.x) - BOUND_X);
    const overY = Math.max(0, Math.abs(n.y) - BOUND_Y);
    if (overX > 0) fx -= Math.sign(n.x) * overX * WALL_K;
    if (overY > 0) fy -= Math.sign(n.y) * overY * WALL_K;

    // Ambient drift — two-frequency sine field so motion feels organic, not periodic
    fx += (Math.sin((t + n.seedX) * 0.0024) * DRIFT_K
      + Math.sin((t + n.seedX) * 0.0061) * DRIFT_K * 0.4) * factor;
    fy += (Math.cos((t + n.seedY) * 0.0026) * DRIFT_K
      + Math.cos((t + n.seedY) * 0.0067) * DRIFT_K * 0.4) * factor;

    n.vx = (n.vx + fx * STEP_DT) * DAMPING;
    n.vy = (n.vy + fy * STEP_DT) * DAMPING;
  }

  // Pairwise repulsion — O(n²) is fine for n ~12
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distSq = dx * dx + dy * dy + 0.01;
      const dist = Math.sqrt(distSq);
      const f = (REPULSION_K / distSq) * factor;
      const nx = dx / dist;
      const ny = dy / dist;
      a.vx += nx * f * STEP_DT;
      a.vy += ny * f * STEP_DT;
      b.vx -= nx * f * STEP_DT;
      b.vy -= ny * f * STEP_DT;
    }
  }

  // Springs along edges
  for (const edge of edges) {
    const i = byIndex.get(edge.from);
    const j = byIndex.get(edge.to);
    if (i === undefined || j === undefined) continue;
    const a = nodes[i];
    const b = nodes[j];
    const sameBranch = branches.get(edge.from) === branches.get(edge.to);
    const rest = sameBranch ? SPRING_REST / SAME_BRANCH_BONUS : SPRING_REST;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
    const stretch = dist - rest;
    const f = stretch * SPRING_K * factor;
    const nx = dx / dist;
    const ny = dy / dist;
    a.vx += nx * f * STEP_DT;
    a.vy += ny * f * STEP_DT;
    b.vx -= nx * f * STEP_DT;
    b.vy -= ny * f * STEP_DT;
  }

  // Integrate
  for (const n of nodes) {
    n.x += n.vx;
    n.y += n.vy;
  }
}

// ─── Paint frame ──────────────────────────────────────────────────────────────

function paintFrame(
  nodes: PhysicsNode[],
  edges: Array<{ from: string; to: string }>,
  t: number,
  refs: {
    nodes: Map<string, SVGGElement>;
    edges: Map<string, SVGPathElement>;
  },
  /** Wobble amplitude multiplier 0..1. At 0 = straight lines, no curve wobble. */
  factor: number = 1,
) {
  // Nodes
  for (const n of nodes) {
    const el = refs.nodes.get(n.slug);
    if (el) el.setAttribute("transform", `translate(${n.x.toFixed(2)},${n.y.toFixed(2)})`);
  }

  // Edges — curved quadratic bezier with control point that wobbles on a slow sine
  for (const e of edges) {
    const key = `${e.from}->${e.to}`;
    const el = refs.edges.get(key);
    if (!el) continue;
    const from = nodes.find((n) => n.slug === e.from);
    const to = nodes.find((n) => n.slug === e.to);
    if (!from || !to) continue;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len; // perpendicular
    const ny = dx / len;

    // Curve magnitude scales with edge length, modulated by independent sine phase.
    // Multiplied by `factor` so wobble smoothly fades to a straight line on pause.
    const phase = (e.from.charCodeAt(0) + e.to.charCodeAt(0)) * 13.7;
    const wobble = Math.sin((t + phase) * 0.0042) * Math.min(len * 0.18, 60) * factor;

    const mx = (from.x + to.x) / 2 + nx * wobble;
    const my = (from.y + to.y) / 2 + ny * wobble;

    el.setAttribute("d", `M ${from.x.toFixed(2)},${from.y.toFixed(2)} Q ${mx.toFixed(2)},${my.toFixed(2)} ${to.x.toFixed(2)},${to.y.toFixed(2)}`);
  }
}

// ─── Connection lookup helper ─────────────────────────────────────────────────

function neighborSet(slug: string, edges: Array<{ from: string; to: string }>): Set<string> {
  const out = new Set<string>([slug]);
  for (const e of edges) {
    if (e.from === slug) out.add(e.to);
    if (e.to === slug) out.add(e.from);
  }
  return out;
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

type EntryWithSpotify = LogEntry & {
  spotifyUrl?: string | null;
  spotifyTitle?: string | null;
  spotifyThumb?: string | null;
  spotifyDurationMs?: number | null;
  spotifyReleaseDate?: string | null;
  spotifyArtist?: string | null;
  spotifyAlbum?: string | null;
  spotifyPreviewUrl?: string | null;
  spotifyTempo?: number | null;
  spotifyEnergy?: number | null;
  spotifyValence?: number | null;
};

// ─── AtlasView ────────────────────────────────────────────────────────────────

export default function AtlasView({
  entries,
  selected,
  onSelect,
}: {
  entries: EntryWithSpotify[];
  selected: EntryWithSpotify | null;
  onSelect: (entry: EntryWithSpotify | null) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, SVGGElement>>(new Map());
  const edgeRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const physicsRef = useRef<PhysicsNode[]>([]);
  const rafRef = useRef<number>(0);
  const reducedMotion = useRef<boolean>(false);
  /** Paused while the cursor is over a node — the field smoothly decelerates to a stop. */
  const pausedRef = useRef<boolean>(false);
  /** Counter so transitioning between adjacent nodes doesn't briefly resume. */
  const hoverCountRef = useRef<number>(0);
  /** Small delay before resume so mouseLeave → mouseEnter on adjacent node stays paused. */
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Smooth pause factor 0..1. Lerps toward target each frame so the freeze isn't abrupt. */
  const factorRef = useRef<number>(1);

  const beginHoverPause = () => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    hoverCountRef.current += 1;
    pausedRef.current = true;
  };

  const endHoverPause = () => {
    hoverCountRef.current = Math.max(0, hoverCountRef.current - 1);
    if (hoverCountRef.current === 0) {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        if (hoverCountRef.current === 0) pausedRef.current = false;
        resumeTimerRef.current = null;
      }, 80);
    }
  };

  const [hovered, setHovered] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const edges = useMemo(() => computeEdges(entries), [entries]);
  const branchMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of entries) m.set(e.slug, e.branch);
    return m;
  }, [entries]);
  const activeSet = useMemo(
    () => (hovered ? neighborSet(hovered, edges) : null),
    [hovered, edges],
  );

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Initialize physics — scatter nodes on a tilted ellipse so the initial settle has motion
    const seed = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
      return Math.abs(h % 1000) / 1000;
    };

    physicsRef.current = entries.map((entry, i) => {
      const angle = (i / entries.length) * Math.PI * 2 + seed(entry.slug) * 0.6;
      // Wider on X than Y to fit the 1200×760 viewBox aspect
      const rx = 140 + seed(entry.slug + "rx") * 100;
      const ry = 100 + seed(entry.slug + "ry") * 70;
      return {
        slug: entry.slug,
        x: Math.cos(angle) * rx,
        y: Math.sin(angle) * ry,
        vx: 0,
        vy: 0,
        seedX: seed(entry.slug + "x") * 1000,
        seedY: seed(entry.slug + "y") * 1000,
        radius: 6 + (TYPE_WEIGHT[entry.type] ?? 1) * 3,
      };
    });

    // Pre-settle the layout with hidden iterations so the initial paint looks composed
    for (let k = 0; k < 400; k++) {
      stepPhysics(physicsRef.current, edges, branchMap, k);
    }
    paintFrame(physicsRef.current, edges, 240, {
      nodes: nodeRefs.current,
      edges: edgeRefs.current,
    });
    setReady(true);

    // Ambient loop — smoothly ramps the motion-intensity factor 0..1 toward the
    // target (0 when paused, 1 when free). Physics + paint always run, but
    // multiplied by factor, so the field decelerates to a halt and accelerates
    // back rather than freezing instantly.
    if (reducedMotion.current) return;
    let t = 240;
    const RAMP_PER_FRAME = 0.06; // ~0.5s to reach target
    const tick = () => {
      const target = pausedRef.current ? 0 : 1;
      const f = factorRef.current;
      const next = Math.abs(target - f) < 0.005
        ? target
        : f + (target - f) * RAMP_PER_FRAME;
      factorRef.current = next;

      stepPhysics(physicsRef.current, edges, branchMap, t, next);
      paintFrame(
        physicsRef.current,
        edges,
        t,
        { nodes: nodeRefs.current, edges: edgeRefs.current },
        next,
      );
      // Advance time proportional to factor so the bezier phase decelerates too.
      // Floor of 0 so when fully paused, t doesn't drift.
      t += next;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [entries, edges, branchMap]);

  return (
    <div
      className="atlas-stage"
      ref={stageRef}
    >
      {/* Hint copy */}
      <div className="atlas-hint">
        <p className="atlas-hint-text">
          ATTLAS — a record of work as a living organism. each node is a moment, each line a lineage.
        </p>
        <p className="atlas-hint-meta" aria-hidden>
          {entries.length} nodes · {edges.length} connections · hover to hold · click to read
        </p>
      </div>

      <svg
        className="atlas-svg"
        viewBox="-600 -380 1200 760"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="A network graph of log entries, each connected by lineage"
        style={{ opacity: ready ? 1 : 0 }}
      >
        {/* Edges */}
        <g className="atlas-edges">
          {edges.map((e) => {
            const key = `${e.from}->${e.to}`;
            const isActive = activeSet ? activeSet.has(e.from) && activeSet.has(e.to) : false;
            const isDim = activeSet ? !isActive : false;
            return (
              <path
                key={key}
                ref={(el) => {
                  if (el) edgeRefs.current.set(key, el);
                  else edgeRefs.current.delete(key);
                }}
                className={`atlas-edge${isActive ? " atlas-edge--active" : ""}${isDim ? " atlas-edge--dim" : ""}`}
                d=""
                fill="none"
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g className="atlas-nodes">
          {entries.map((entry) => {
            const isActive = activeSet ? activeSet.has(entry.slug) : false;
            const isDim = activeSet ? !isActive : false;
            const isHovered = hovered === entry.slug;
            const isSomeoneElseHovered = hovered !== null && !isHovered;
            const isSelected = selected?.slug === entry.slug;
            const radius = 6 + (TYPE_WEIGHT[entry.type] ?? 1) * 3;

            // BPM-driven pulse — CKORE tracks only, when tempo is known
            const bpm = entry.spotifyTempo;
            const hasBpm = bpm && bpm > 30;
            const bpmDurationMs = hasBpm
              ? Math.round(60000 / Math.max(40, Math.min(220, bpm)))
              : 0;
            const pulseClass = !hasBpm
              ? null
              : isHovered ? "atlas-node--pulse-strong"
              : isSomeoneElseHovered ? "atlas-node--pulse-weak"
              : "atlas-node--pulse-normal";

            // Mood-derived halo color (valence + energy)
            const v = entry.spotifyValence;
            const e = entry.spotifyEnergy;
            const moodColor = (v != null && e != null)
              ? `oklch(${60 + e * 12}% ${0.07 + e * 0.07} ${250 - v * 190})`
              : null;

            const groupStyle = {} as Record<string, string>;
            if (hasBpm) groupStyle["--bpm-duration"] = `${bpmDurationMs}ms`;
            if (moodColor) groupStyle["--mood-color"] = moodColor;

            return (
              <g
                key={entry.slug}
                ref={(el) => {
                  if (el) nodeRefs.current.set(entry.slug, el);
                  else nodeRefs.current.delete(entry.slug);
                }}
                className={[
                  "atlas-node",
                  `atlas-node--${entry.branch}`,
                  `atlas-node--${entry.type}`,
                  pulseClass,
                  moodColor && "atlas-node--mood",
                  isActive && "atlas-node--active",
                  isDim && "atlas-node--dim",
                  isHovered && "atlas-node--hovered",
                  isSelected && "atlas-node--selected",
                ].filter(Boolean).join(" ")}
                style={groupStyle as React.CSSProperties}
                tabIndex={0}
                role="button"
                aria-label={`${entry.title}, ${entry.date}`}
                onMouseEnter={() => { setHovered(entry.slug); beginHoverPause(); }}
                onMouseLeave={() => { setHovered(null); endHoverPause(); }}
                onFocus={() => { setHovered(entry.slug); beginHoverPause(); }}
                onBlur={() => { setHovered(null); endHoverPause(); }}
                onClick={() => {
                  onSelect(entry);
                  // Clear hover state — user is reading the panel now, field should resume.
                  hoverCountRef.current = 0;
                  pausedRef.current = false;
                  if (resumeTimerRef.current) {
                    clearTimeout(resumeTimerRef.current);
                    resumeTimerRef.current = null;
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(entry);
                    hoverCountRef.current = 0;
                    pausedRef.current = false;
                  }
                }}
              >
                {/* Outer glow ring (visible on hover) */}
                <circle className="atlas-node-glow" r={radius + 9} />
                {/* Main dot */}
                <circle className="atlas-node-dot" r={radius} />
                {/* Inner highlight */}
                <circle className="atlas-node-core" r={radius * 0.4} cx={-radius * 0.18} cy={-radius * 0.18} />
                {/* Label */}
                <text
                  className="atlas-node-label"
                  x={0}
                  y={radius + 18}
                  textAnchor="middle"
                >
                  {entry.title}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

    </div>
  );
}
