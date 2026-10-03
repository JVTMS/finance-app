// Contador animado para valores financeiros (rAF + easeOutCubic).

import { useEffect, useRef, useState } from 'react';

export function useCountUp(value, { duration = 850 } = {}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const from = fromRef.current;
    const to = Number(value) || 0;
    if (reduce || from === to) {
      fromRef.current = to;
      setDisplay(to);
      return;
    }
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return display;
}
