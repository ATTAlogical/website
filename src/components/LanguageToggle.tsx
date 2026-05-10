"use client";
import { motion } from "motion/react";
import { useLang } from "@/context/Language";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function LanguageToggle() {
  const { lang, setLang } = useLang();
  const isMobile = useIsMobile();

  return (
    <div style={{
      position: "fixed",
      bottom: isMobile
        ? "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))"
        : "max(1.5rem, env(safe-area-inset-bottom, 2rem))",
      left: isMobile
        ? "max(1.5rem, env(safe-area-inset-left, 1.5rem))"
        : "max(2rem, env(safe-area-inset-left, 2rem))",
      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem",
      zIndex: 100,
    }}>
      <motion.button
        onClick={() => setLang(lang === "en" ? "nl" : "en")}
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
  );
}
