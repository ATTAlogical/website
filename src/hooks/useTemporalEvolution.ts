import { useEffect, useState } from 'react';

interface TemporalValues {
  offsetX: number;
  offsetY: number;
  letterSpacing: number;
  fontWeight: number;
  scale: number;
  reflectionIntensity: number;
}

export function useTemporalEvolution(): TemporalValues {
  const [values, setValues] = useState<TemporalValues>({
    offsetX: 0,
    offsetY: 0,
    letterSpacing: 0,
    fontWeight: 450,
    scale: 1,
    reflectionIntensity: 0.5,
  });

  useEffect(() => {
    const updateValues = () => {
      // Time cycle: 24 hours = 86400 seconds
      const hours24InMs = 24 * 60 * 60 * 1000;
      const now = Date.now();
      
      // Normalized time (0 to 1 over 24 hours)
      const cycle = (now % hours24InMs) / hours24InMs;
      
      // 2π radians for smooth sine wave cycling
      const angle = cycle * 2 * Math.PI;
      
      // Position: ±50px over 24 hours
      const offsetX = Math.sin(angle) * 50;
      const offsetY = Math.cos(angle) * 50;
      
      // Letter spacing: oscillate between normal (0) and +0.05em
      const letterSpacing = (Math.sin(angle) * 0.025 + 0.025);
      
      // Font weight: oscillate between 400-500
      const fontWeight = 400 + (Math.sin(angle) * 50 + 50);
      
      // Scale: ±10% (0.9 to 1.1)
      const scale = 1 + (Math.sin(angle) * 0.1);
      
      // Reflection intensity: vary between 0.3 and 0.7
      const reflectionIntensity = 0.5 + (Math.sin(angle) * 0.2);
      
      setValues({
        offsetX,
        offsetY,
        letterSpacing,
        fontWeight,
        scale,
        reflectionIntensity,
      });
    };

    // Update immediately and then every frame
    updateValues();
    const animationId = setInterval(updateValues, 100); // Update every 100ms for smooth effect

    return () => clearInterval(animationId);
  }, []);

  return values;
}
