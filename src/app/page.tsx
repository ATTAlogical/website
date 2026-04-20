"use client";

import { useTemporalEvolution } from "@/hooks/useTemporalEvolution";
import { useEffect, useState } from "react";

export default function Home() {
  const temporal = useTemporalEvolution();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <main className="relative w-full h-full overflow-hidden bg-white">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />

      {/* Glass surface effect - top reflection */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent pointer-events-none opacity-30" />

      {/* Main content container */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Breathing glass panel effect - subtle backdrop */}
        <div
          className="absolute w-3/4 h-3/4 max-w-4xl rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.03), rgba(0,0,0,0.01))",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(0,0,0,0.08)",
            opacity: 0.4,
            filter: `blur(${1 + temporal.reflectionIntensity * 0.5}px)`,
            transition: "all 2s ease-in-out",
          }}
        />

        {/* Main name container - positioned asymmetrically */}
        <div
          className="relative z-10 flex flex-col items-start justify-center text-center sm:text-left"
          style={{
            transform: `translate(${temporal.offsetX}px, ${temporal.offsetY}px) scale(${temporal.scale})`,
            transition: "transform 1.5s ease-in-out",
          }}
        >
          {/* ATTA Logical title */}
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

          {/* Subtle reflection below name */}
          <div
            className="pointer-events-none"
            style={{
              marginTop: "-0.25em",
              opacity: temporal.reflectionIntensity * 0.3,
              transform: "scaleY(-0.8) translateY(0.5rem)",
              filter: "blur(8px)",
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

        {/* Subtle animated particles/gloss highlights - top right */}
        <div
          className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,0,0,0.08), transparent)",
            filter: `blur(${40 + temporal.reflectionIntensity * 20}px)`,
            opacity: 0.3 + temporal.reflectionIntensity * 0.1,
            transition: "all 2s ease-in-out",
          }}
        />

        {/* Subtle animated particles/gloss highlights - bottom left */}
        <div
          className="absolute bottom-1/3 -left-1/3 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,0,0,0.05), transparent)",
            filter: `blur(${50 + temporal.reflectionIntensity * 25}px)`,
            opacity: 0.2 + temporal.reflectionIntensity * 0.1,
            transition: "all 2s ease-in-out",
          }}
        />
      </div>

      {/* Mobile responsive adjustments */}
      <div className="lg:hidden absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Mobile background adjustment */}
        <div className="absolute inset-0 bg-white/40" />
      </div>
    </main>
  );
}
