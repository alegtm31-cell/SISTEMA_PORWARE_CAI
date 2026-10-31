import { useState, useEffect, useRef } from 'react';

/**
 * useCountUp: Interpola numéricamente un valor de forma fluida (60 fps)
 * usando requestAnimationFrame y curva de desaceleración quíntica (easeOutQuint).
 * Respeta 'prefers-reduced-motion': si está activo, salta directamente al valor final sin animación.
 */
export function useCountUp(target: number, durationMs = 700): number {
  const [current, setCurrent] = useState<number>(target);
  const previousRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Si el usuario prefiere movimiento reducido, saltar de inmediato
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrent(target);
      previousRef.current = target;
      return;
    }

    if (Number.isNaN(target) || !Number.isFinite(target)) {
      setCurrent(target);
      return;
    }

    const startVal = previousRef.current;
    const diff = target - startVal;
    if (diff === 0) return;

    const startTime = performance.now();

    const updateFrame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Curva easeOutExpo para desaceleración suave
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const nextVal = Math.round(startVal + diff * ease);

      setCurrent(nextVal);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(updateFrame);
      } else {
        previousRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(updateFrame);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, durationMs]);

  return current;
}
