import { useMemo } from 'react';

interface TemporalValues {
  offsetX: number;
  offsetY: number;
  letterSpacing: number;
  fontWeight: number;
  scale: number;
  reflectionIntensity: number;
  angle: number;
}

export const HOURS24 = 24 * 60 * 60 * 1000;

// Speed multiplier for testing. 1 = real 24h cycle. 1440 = full cycle in ~60s.
export const TE_SPEED = 1;

export function teAngleNow(): number {
  return ((Date.now() * TE_SPEED) % HOURS24) / HOURS24 * 2 * Math.PI;
}

export function teValuesAt(angle: number): TemporalValues {
  return {
    angle,
    offsetX: Math.sin(angle) * 40,
    offsetY: Math.cos(angle) * 28,
    letterSpacing: Math.sin(angle) * 0.02 + 0.02,
    fontWeight: 400 + Math.sin(angle) * 40 + 40,
    scale: 1 + Math.sin(angle) * 0.06,
    reflectionIntensity: 0.5 + Math.sin(angle) * 0.2,
  };
}

// Returns values computed once at mount — no interval, no re-renders.
// All subsequent DOM updates are handled by the rAF loop in page.tsx.
export function useTemporalEvolution(): TemporalValues {
  return useMemo(() => teValuesAt(teAngleNow()), []);
}
