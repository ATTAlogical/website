"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface CkoreAudioCtx {
  triggerPlay: () => void;
}

const CkoreAudioContext = createContext<CkoreAudioCtx>({ triggerPlay: () => {} });

export function useCkoreAudio() {
  return useContext(CkoreAudioContext);
}

export function CkoreAudioProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeRafRef = useRef<number>(0);
  const loopEndRef = useRef<number>(Infinity);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const MASTER_GAIN = 0.35;

  const [showPlayer, setShowPlayer] = useState(false);
  const [ckoreVolume, setCkoreVolume] = useState(0.8);
  const [ckoreMuted, setCkoreMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [fakeCursor, setFakeCursor] = useState<{ x: number; y: number; id: number } | null>(null);
  const [hideCursor, setHideCursor] = useState(false);

  const fadeAudioTo = useCallback((target: number, ms = 450) => {
    const audio = audioRef.current;
    if (!audio) return;
    cancelAnimationFrame(fadeRafRef.current);
    const from = audio.volume;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / ms, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      audio.volume = from + (target - from) * eased;
      if (t < 1) fadeRafRef.current = requestAnimationFrame(tick);
    };
    fadeRafRef.current = requestAnimationFrame(tick);
  }, []);

  const triggerPlay = useCallback(() => {
    setShowPlayer(true);
  }, []);

  // Start playing with fade-in when first triggered
  useEffect(() => {
    if (!showPlayer) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (!audioCtxRef.current) {
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.value = MASTER_GAIN;
      const source = ctx.createMediaElementSource(audio);
      source.connect(gain);
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      gainNodeRef.current = gain;
    }
    audio.volume = 0;
    const t = setTimeout(() => {
      audio.play().catch(() => {});
      fadeAudioTo(ckoreVolume, 200);
    }, 1000);
    return () => clearTimeout(t);
  }, [showPlayer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Decode audio once to find last non-silent sample for seamless looping
  useEffect(() => {
    if (!showPlayer || loopEndRef.current !== Infinity) return;
    fetch("/mp3/wifi settings ATTA MUSICA.wav")
      .then(r => r.arrayBuffer())
      .then(buf => {
        const ctx = new AudioContext();
        return ctx.decodeAudioData(buf).then(decoded => {
          const channels = Array.from({ length: decoded.numberOfChannels }, (_, i) => decoded.getChannelData(i));
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
  }, [showPlayer]);

  return (
    <CkoreAudioContext.Provider value={{ triggerPlay }}>
      {children}

      <audio
        ref={audioRef}
        src="/mp3/wifi settings ATTA MUSICA.wav"
        preload="none"
        onTimeUpdate={() => {
          const audio = audioRef.current;
          if (!audio || loopEndRef.current === Infinity) return;
          if (audio.currentTime >= loopEndRef.current - 0.06) {
            audio.currentTime = 0;
          }
        }}
      />

      {hideCursor && <style>{`* { cursor: none !important; }`}</style>}

      {/* Track title */}
      <AnimatePresence>
        {showPlayer && (
          <motion.div
            key="ckore-title"
            initial={{ opacity: 0, y: -8, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -8, x: "-50%" }}
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
            Wifi Settings — ATTA.CKORE
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
            exit={{ opacity: 0, scale: 0.85 }}
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
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <motion.button
              whileHover={{ opacity: 0.7 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setCkoreMuted(m => {
                if (m) { fadeAudioTo(ckoreVolume); } else { fadeAudioTo(0); }
                return !m;
              })}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "rgba(0,0,0,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.1rem", height: "1.1rem" }}>
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <motion.path d="M15.54 8.46a5 5 0 0 1 0 7.07" animate={{ opacity: ckoreMuted ? 0 : 1 }} transition={{ duration: 0.2 }} />
                <motion.path d="M19.07 4.93a10 10 0 0 1 0 14.14" animate={{ opacity: ckoreMuted ? 0 : 1 }} transition={{ duration: 0.2, delay: 0.05 }} />
                <motion.line x1="23" y1="9" x2="17" y2="15" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: ckoreMuted ? 1 : 0, opacity: ckoreMuted ? 1 : 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} />
              </svg>
            </motion.button>

            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  key="vol-slider"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
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
                          if (audioRef.current) audioRef.current.volume = v;
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
                          if (audioRef.current) audioRef.current.volume = v;
                        };
                        update(e.nativeEvent);
                        const onMove = (ev: PointerEvent) => update(ev);
                        const onUp = () => {
                          setFakeCursor(null);
                          setHideCursor(false);
                          el.removeEventListener("pointermove", onMove);
                          el.removeEventListener("pointerup", onUp);
                        };
                        el.addEventListener("pointermove", onMove);
                        el.addEventListener("pointerup", onUp);
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

      {/* Fake cursor fade */}
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
