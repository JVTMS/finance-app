// Tilt 3D em cards: rotação sutil em direção ao cursor + posição do brilho.
// Só ativa para ponteiro de mouse (touch fica estático) e pode ser desativado
// (Performance Mode) passando enabled = false.

import { useRef } from 'react';

export function useTilt({ max = 4.5, enabled = true } = {}) {
  const ref = useRef(null);

  const onPointerMove = (e) => {
    if (!enabled || e.pointerType !== 'mouse') return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${((0.5 - py) * 2 * max).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
  };

  const onPointerLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
  };

  return {
    ref,
    tiltHandlers: enabled ? { onPointerMove, onPointerLeave } : {},
  };
}
