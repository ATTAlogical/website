"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useIsMobile } from "@/hooks/useIsMobile";

// ─── track registry ───────────────────────────────────────────────────────────

const TRACKS = {
  home: {
    src:    "/mp3/wifi settings ATTA MUSICA.wav",
    title:  "Wifi Settings — ATTA.CKORE",
    posKey: "audio-pos-home",
  },
  log: {
    src:    "/mp3/Temporal Log.mp3",
    title:  "Temporal Log — ATTA.CKORE",
    posKey: "audio-pos-log",
  },
  catalogue: {
    src:    "/mp3/CATTALOGUECAL.mp3",
    title:  "CATTALOGUECAL — ATTA.CKORE",
    posKey: "audio-pos-catalogue",
  },
} as const;

type TrackId = keyof typeof TRACKS;

// ─── helpers (pure, no hooks) ─────────────────────────────────────────────────

function saveTrackPos(audio: HTMLAudioElement | null, posKey: string) {
  if (!audio || !isFinite(audio.currentTime) || audio.currentTime === 0) return;
  try { localStorage.setItem(posKey, String(audio.currentTime)); } catch { /* ignore */ }
}

function restoreTrackPos(audio: HTMLAudioElement | null, posKey: string) {
  try {
    const raw = localStorage.getItem(posKey);
    const pos = raw ? parseFloat(raw) : 0;
    if (audio && isFinite(pos) && pos > 0) audio.currentTime = pos;
  } catch { /* ignore */ }
}

function decodeLoopEnd(src: string, loopEndRef: React.MutableRefObject<number>) {
  if (loopEndRef.current !== Infinity) return;
  fetch(src)
    .then(r => r.arrayBuffer())
    .then(buf => {
      const ctx = new AudioContext();
      return ctx.decodeAudioData(buf).then(decoded => {
        const channels = Array.from(
          { length: decoded.numberOfChannels },
          (_, i) => decoded.getChannelData(i),
        );
        for (let i = decoded.length - 1; i >= 0; i--) {
          if (channels.some(ch => Math.abs(ch[i]) > 0.001)) {
            loopEndRef.current = i / decoded.sampleRate;
            break;
          }
        }
        ctx.close();
      });
    })
    .catch(() => {});
}

// ─── context ──────────────────────────────────────────────────────────────────

interface CkoreAudioCtx {
  triggerPlay:   () => void;
  setActiveSong: (song: TrackId) => void;
}

const CkoreAudioContext = createContext<CkoreAudioCtx>({
  triggerPlay:   () => {},
  setActiveSong: () => {},
});

export function useCkoreAudio() {
  return useContext(CkoreAudioContext);
}

// ─── provider ─────────────────────────────────────────────────────────────────

export function CkoreAudioProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  const homeAudioRef      = useRef<HTMLAudioElement>(null);
  const logAudioRef       = useRef<HTMLAudioElement>(null);
  const catalogueAudioRef = useRef<HTMLAudioElement>(null);
  const homeFadeRafRef      = useRef<number>(0);
  const logFadeRafRef       = useRef<number>(0);
  const catalogueFadeRafRef = useRef<number>(0);
  const homeLoopEnd      = useRef<number>(Infinity);
  const logLoopEnd       = useRef<number>(Infinity);
  const catalogueLoopEnd = useRef<number>(Infinity);
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const gainNodeRef  = useRef<GainNode | null>(null);
  const activeIdRef  = useRef<TrackId>("home");
  const volumeRef    = useRef<number>(0.8);
  const mutedRef     = useRef<boolean>(false);
  const showPlayerRef = useRef<boolean>(false);

  const MASTER_GAIN = 0.35;

  const [showPlayer,        setShowPlayer]        = useState(false);
  const [activeSongDisplay, setActiveSongDisplay] = useState<TrackId>("home");
  const [ckoreVolume,       setCkoreVolume]       = useState(0.8);
  const [ckoreMuted,        setCkoreMuted]        = useState(false);
  const [showVolumeSlider,  setShowVolumeSlider]  = useState(false);
  const [fakeCursor, setFakeCursor] = useState<{ x: number; y: number; id: number } | null>(null);
  const [hideCursor, setHideCursor] = useState(false);

  // keep refs in sync
  useEffect(() => { volumeRef.current = ckoreVolume; }, [ckoreVolume]);
  useEffect(() => { mutedRef.current  = ckoreMuted;  }, [ckoreMuted]);

  const getAudioRef = (id: TrackId) =>
    id === "home" ? homeAudioRef : id === "log" ? logAudioRef : catalogueAudioRef;
  const getFadeRef = (id: TrackId) =>
    id === "home" ? homeFadeRafRef : id === "log" ? logFadeRafRef : catalogueFadeRafRef;
  const getLoopEnd = (id: TrackId) =>
    id === "home" ? homeLoopEnd : id === "log" ? logLoopEnd : catalogueLoopEnd;

  // ── per-track fade (independent RAF per track so crossfades don't cancel) ──
  const fadeTrack = useCallback((
    id: TrackId,
    target: number,
    ms = 600,
    onDone?: () => void,
  ) => {
    const audio  = getAudioRef(id).current;
    const rafRef = getFadeRef(id);
    if (!audio) { onDone?.(); return; }
    cancelAnimationFrame(rafRef.current);
    const from  = audio.volume;
    const start = performance.now();
    const tick  = (now: number) => {
      const t = Math.min((now - start) / ms, 1);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      audio.volume = from + (target - from) * e;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else onDone?.();
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fadeActive = useCallback((target: number, ms?: number) => {
    fadeTrack(activeIdRef.current, target, ms);
  }, [fadeTrack]);

  // ── audio context (lazy init on first interaction) ──────────────────────────
  const initAudioCtx = useCallback(() => {
    if (audioCtxRef.current) return;
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = MASTER_GAIN;
    gain.connect(ctx.destination);
    [homeAudioRef.current, logAudioRef.current, catalogueAudioRef.current].forEach(el => {
      if (el) ctx.createMediaElementSource(el).connect(gain);
    });
    audioCtxRef.current = ctx;
    gainNodeRef.current = gain;
  }, []);

  // ── first trigger ───────────────────────────────────────────────────────────
  const triggerPlay = useCallback(() => {
    showPlayerRef.current = true;
    setShowPlayer(true);
  }, []);

  useEffect(() => {
    if (!showPlayer) return;
    initAudioCtx();
    decodeLoopEnd(TRACKS.home.src, homeLoopEnd);

    const audio = homeAudioRef.current;
    if (!audio) return;

    restoreTrackPos(audio, TRACKS.home.posKey);
    audio.volume = 0;
    const t = setTimeout(() => {
      audio.play().catch(() => {});
      fadeTrack("home", volumeRef.current, 200);
    }, 1000);
    return () => clearTimeout(t);
  }, [showPlayer]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── save position every 5 s ─────────────────────────────────────────────────
  useEffect(() => {
    if (!showPlayer) return;
    const id = setInterval(() => {
      const track = activeIdRef.current;
      saveTrackPos(getAudioRef(track).current, TRACKS[track].posKey);
    }, 5000);
    return () => clearInterval(id);
  }, [showPlayer]);

  // ── swap tracks — true crossfade, both tracks fade simultaneously ───────────
  const setActiveSong = useCallback((next: TrackId) => {
    if (!showPlayerRef.current) return;
    if (next === activeIdRef.current) return;

    const prev      = activeIdRef.current;
    const prevAudio = getAudioRef(prev).current;
    const nextAudio = getAudioRef(next).current;

    saveTrackPos(prevAudio, TRACKS[prev].posKey);

    // Prepare next track before starting crossfade
    initAudioCtx();
    decodeLoopEnd(TRACKS[next].src, getLoopEnd(next));
    restoreTrackPos(nextAudio, TRACKS[next].posKey);

    // Fade out prev and fade in next simultaneously
    fadeTrack(prev, 0, 700, () => { prevAudio?.pause(); });

    if (nextAudio && !mutedRef.current) {
      nextAudio.volume = 0;
      nextAudio.play().catch(() => {});
      fadeTrack(next, volumeRef.current, 700);
    }

    activeIdRef.current = next;
    setActiveSongDisplay(next);
  }, [fadeTrack, initAudioCtx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── seamless loop (per track) ───────────────────────────────────────────────
  const makeLoopHandler = (id: TrackId) => () => {
    const audio   = getAudioRef(id).current;
    const loopEnd = getLoopEnd(id);
    if (!audio || loopEnd.current === Infinity) return;
    if (audio.currentTime >= loopEnd.current - 0.06) audio.currentTime = 0;
  };

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <CkoreAudioContext.Provider value={{ triggerPlay, setActiveSong }}>
      {children}

      <audio ref={homeAudioRef}      src={TRACKS.home.src}      preload="none"
        onTimeUpdate={makeLoopHandler("home")} />
      <audio ref={logAudioRef}       src={TRACKS.log.src}       preload="none"
        onTimeUpdate={makeLoopHandler("log")} />
      <audio ref={catalogueAudioRef} src={TRACKS.catalogue.src} preload="none"
        onTimeUpdate={makeLoopHandler("catalogue")} />

      {hideCursor && <style>{`* { cursor: none !important; }`}</style>}

      {/* Track title — cross-fades when track changes */}
      <AnimatePresence mode="wait">
        {showPlayer && (
          <motion.div
            key={`title-${activeSongDisplay}`}
            initial={{ opacity: 0, y: -8, x: "-50%" }}
            animate={{ opacity: 1, y: 0,  x: "-50%" }}
            exit={{    opacity: 0, y: -8, x: "-50%" }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              position: "fixed",
              top: "max(1.5rem, env(safe-area-inset-top, 1.5rem))",
              left: "50%",
              zIndex: 200,
              pointerEvents: "none",
              fontFamily: "var(--font-geist-mono), ui-monospace, Menlo, monospace",
              fontSize: "0.58rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(0,0,0,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            {TRACKS[activeSongDisplay].title}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speaker widget */}
      <AnimatePresence>
        {showPlayer && (
          <motion.div
            key="ckore-speaker"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{    opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
            style={{
              position: "fixed",
              top: "max(1.5rem, env(safe-area-inset-top, 1.5rem))",
              right: "max(1.5rem, env(safe-area-inset-right, 1.5rem))",
              zIndex: 200,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "0.5rem",
            }}
          >
            {isMobile ? (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setCkoreMuted(m => {
                  if (m) { fadeActive(ckoreVolume); } else { fadeActive(0); }
                  return !m;
                })}
                style={{
                  background: "rgba(255,255,255,0.88)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(0,0,0,0.07)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  width: "2.6rem", height: "2.6rem",
                  borderRadius: "50%",
                  padding: 0, cursor: "pointer",
                  color: "rgba(0,0,0,0.45)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "opacity 0.2s",
                }}
              >
                <SpeakerIcon muted={ckoreMuted} />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setCkoreMuted(m => {
                  if (m) { fadeActive(ckoreVolume); } else { fadeActive(0); }
                  return !m;
                })}
                style={{
                  background: "none", border: "none", padding: 0,
                  cursor: "pointer", color: "rgba(0,0,0,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.6")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <SpeakerIcon muted={ckoreMuted} />
              </motion.button>
            )}

            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  key="vol-slider"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{    opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{ overflow: "hidden", display: "flex", justifyContent: "center" }}
                >
                  {isMobile ? (
                    <div style={{
                      padding: "0.6rem 0.5rem",
                      background: "rgba(255,255,255,0.88)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      border: "1px solid rgba(0,0,0,0.07)",
                      borderRadius: "40px",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                    }}>
                      <input
                        type="range" min="0" max="1" step="0.01"
                        value={ckoreMuted ? 0 : ckoreVolume}
                        onChange={e => {
                          const v = parseFloat(e.target.value);
                          setCkoreVolume(v);
                          if (v > 0) setCkoreMuted(false);
                          const audio = getAudioRef(activeIdRef.current).current;
                          if (audio) audio.volume = v;
                        }}
                        style={{
                          writingMode: "vertical-lr" as React.CSSProperties["writingMode"],
                          direction: "rtl" as React.CSSProperties["direction"],
                          height: "80px", width: "4px", cursor: "pointer",
                          accentColor: "rgba(0,0,0,0.7)", background: "transparent",
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{ padding: "0.4rem 11px", display: "flex", justifyContent: "center", cursor: "pointer" }}
                      onPointerDown={e => {
                        const el = e.currentTarget;
                        el.setPointerCapture(e.pointerId);
                        setFakeCursor({ x: e.clientX, y: e.clientY, id: Date.now() });
                        setHideCursor(true);
                        const update = (ev: PointerEvent) => {
                          const rect = el.getBoundingClientRect();
                          const v = Math.max(0, Math.min(1, 1 - (ev.clientY - rect.top) / rect.height));
                          setCkoreVolume(v);
                          if (v > 0) setCkoreMuted(false);
                          const audio = getAudioRef(activeIdRef.current).current;
                          if (audio) audio.volume = v;
                        };
                        update(e.nativeEvent);
                        const onMove = (ev: PointerEvent) => update(ev);
                        const onUp   = () => {
                          setFakeCursor(null);
                          setHideCursor(false);
                          el.removeEventListener("pointermove", onMove);
                          el.removeEventListener("pointerup",   onUp);
                        };
                        el.addEventListener("pointermove", onMove);
                        el.addEventListener("pointerup",   onUp);
                      }}
                    >
                      <div style={{ position: "relative", width: "2px", height: "72px", background: "rgba(0,0,0,0.1)", borderRadius: "1px" }}>
                        <div style={{
                          position: "absolute", bottom: 0, left: 0, right: 0,
                          height: `${(ckoreMuted ? 0 : ckoreVolume) * 100}%`,
                          background: "rgba(0,0,0,0.35)", borderRadius: "1px",
                          transition: "height 0.05s linear",
                        }} />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fake cursor dot on volume drag */}
      <AnimatePresence>
        {fakeCursor && (
          <motion.div
            key={fakeCursor.id}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "fixed",
              left: fakeCursor.x, top: fakeCursor.y,
              width: "10px", height: "10px", borderRadius: "50%",
              background: "rgba(0,0,0,0.3)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none", zIndex: 9999,
            }}
          />
        )}
      </AnimatePresence>
    </CkoreAudioContext.Provider>
  );
}

// ─── speaker icon (shared between mobile / desktop buttons) ───────────────────

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "1.1rem", height: "1.1rem" }}>
      <path d="M3 9v6h4l5 5V4L7 9H3z" />
      <motion.path
        d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"
        animate={{ opacity: muted ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.path
        d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
        animate={{ opacity: muted ? 0 : 1 }}
        transition={{ duration: 0.2, delay: 0.05 }}
      />
      <motion.line
        x1="23" y1="9" x2="17" y2="15"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: muted ? 1 : 0, opacity: muted ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
      />
    </svg>
  );
}
