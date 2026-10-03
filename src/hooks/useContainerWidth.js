// Largura real do container para gráficos SVG renderizarem 1:1 (sem distorção).

import { useEffect, useRef, useState } from 'react';

export function useContainerWidth(fallback = 640) {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w > 0) setWidth(Math.round(w));
    });
    ro.observe(el);
    setWidth(Math.round(el.getBoundingClientRect().width) || fallback);
    return () => ro.disconnect();
  }, [fallback]);

  return [ref, width];
}
