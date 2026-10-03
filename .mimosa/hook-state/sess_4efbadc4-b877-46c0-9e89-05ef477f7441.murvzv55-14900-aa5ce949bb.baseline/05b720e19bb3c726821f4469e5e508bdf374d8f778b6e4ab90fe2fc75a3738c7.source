// Donut com profundidade (anel de sombra + realce no hover) e legenda lateral.

import { useEffect, useMemo, useState } from 'react';
import { formatBRL, formatPercent } from '../../utils/format';

export default function DonutChart({
  data,
  size = 230,
  thickness = 24,
  centerTitle = 'Total',
  formatValue = formatBRL,
  ariaLabel = 'Gráfico de categorias',
}) {
  const [mounted, setMounted] = useState(false);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const r = (size - thickness * 2 - 14) / 2;
  const C = 2 * Math.PI * r;

  const segments = useMemo(() => {
    let acc = 0;
    return data.map((d) => {
      const frac = total > 0 ? d.value / total : 0;
      const seg = { ...d, frac, offset: acc };
      acc += frac;
      return seg;
    });
  }, [data, total]);

  const active = hover !== null ? segments[hover] : null;

  return (
    <div className="donut-chart" role="img" aria-label={ariaLabel}>
      <div className="donut-chart__wrap" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* profundidade: sombra do anel */}
          <circle
            cx={size / 2}
            cy={size / 2 + 4}
            r={r}
            fill="none"
            stroke="var(--shadow)"
            strokeWidth={thickness}
            opacity="0.5"
            style={{ filter: 'blur(3px)' }}
          />
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--border)"
              strokeWidth={thickness * 0.55}
              opacity="0.5"
            />
            {segments.map((seg, i) => {
              const len = mounted ? seg.frac * C : 0;
              return (
                <circle
                  key={seg.label + i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={hover === i ? thickness + 6 : thickness}
                  strokeDasharray={`${Math.max(0, len - 3)} ${C}`}
                  strokeDashoffset={-seg.offset * C}
                  strokeLinecap="round"
                  className="donut-seg"
                  style={{ transitionDelay: `${i * 60}ms` }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              );
            })}
          </g>
        </svg>
        <div className="donut-chart__center">
          <span className="donut-chart__center-label">{active ? active.label : centerTitle}</span>
          <strong className="donut-chart__center-value">{formatValue(active ? active.value : total)}</strong>
          {active && <span className="donut-chart__center-share">{formatPercent(active.frac, { signed: false })}</span>}
        </div>
      </div>

      <ul className="donut-chart__legend">
        {segments.map((seg, i) => (
          <li
            key={seg.label + i}
            className={hover === i ? 'is-active' : ''}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="donut-chart__dot" style={{ background: seg.color }} />
            <span className="donut-chart__name">{seg.label}</span>
            <span className="donut-chart__val">{formatValue(seg.value)}</span>
            <span className="donut-chart__share">{formatPercent(seg.frac, { signed: false })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
