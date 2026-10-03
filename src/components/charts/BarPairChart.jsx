// Barras duplas (receitas x despesas) com sensação de volume e crescimento animado.

import { useMemo, useState } from 'react';
import { formatBRL } from '../../utils/format';
import { useContainerWidth } from '../../hooks/useContainerWidth';

export default function BarPairChart({
  data,
  labels = ['Receitas', 'Despesas'],
  colors = ['var(--positive)', 'var(--negative)'],
  height = 240,
  formatValue = formatBRL,
  ariaLabel = 'Gráfico de receitas e despesas',
  uid = 'b',
}) {
  const [wrapRef, W] = useContainerWidth();
  const [hover, setHover] = useState(null);
  const H = height;
  const padX = 10;
  const padTop = 16;
  const padBottom = 26;

  const max = useMemo(() => {
    const m = Math.max(...data.flatMap((d) => [d.a, d.b]), 1);
    return m * 1.12;
  }, [data]);

  const innerW = Math.max(W, 40) - padX * 2;
  const innerH = H - padTop - padBottom;
  const groupW = data.length ? innerW / data.length : innerW;
  const barW = Math.min(26, groupW * 0.26);
  const baseline = H - padBottom;

  const barY = (v) => baseline - (v / max) * innerH;

  const gradA = `barA-${uid}`;
  const gradB = `barB-${uid}`;

  return (
    <div className="bar-chart" ref={wrapRef} role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${Math.max(W, 40)} ${H}`} width="100%" height={H} className="bar-chart__svg">
        <defs>
          <linearGradient id={gradA} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="1" />
            <stop offset="100%" stopColor={colors[0]} stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id={gradB} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[1]} stopOpacity="1" />
            <stop offset="100%" stopColor={colors[1]} stopOpacity="0.55" />
          </linearGradient>
        </defs>

        <line x1={padX} x2={Math.max(W, 40) - padX} y1={baseline} y2={baseline} className="chart-axis" />

        {data.map((d, i) => {
          const cxGroup = padX + groupW * i + groupW / 2;
          const xA = cxGroup - barW - 3;
          const xB = cxGroup + 3;
          const active = hover === i;
          return (
            <g
              key={d.label + i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className={active ? 'bar-group is-active' : 'bar-group'}
            >
              <rect x={padX + groupW * i} y={0} width={groupW} height={H} fill="transparent" />
              <rect
                x={xA}
                y={barY(d.a)}
                width={barW}
                height={Math.max(2, baseline - barY(d.a))}
                rx="5"
                fill={`url(#${gradA})`}
                className="bar-anim"
                style={{ animationDelay: `${i * 45}ms`, transformOrigin: `${xA + barW / 2}px ${baseline}px` }}
              />
              <rect
                x={xB}
                y={barY(d.b)}
                width={barW}
                height={Math.max(2, baseline - barY(d.b))}
                rx="5"
                fill={`url(#${gradB})`}
                className="bar-anim"
                style={{ animationDelay: `${i * 45 + 70}ms`, transformOrigin: `${xB + barW / 2}px ${baseline}px` }}
              />
              {/* brilho de topo — sensação de volume */}
              <line
                x1={xA + 2}
                x2={xA + barW - 2}
                y1={barY(d.a) + 1.2}
                y2={barY(d.a) + 1.2}
                stroke={colors[0]}
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.9"
              />
              <line
                x1={xB + 2}
                x2={xB + barW - 2}
                y1={barY(d.b) + 1.2}
                y2={barY(d.b) + 1.2}
                stroke={colors[1]}
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.9"
              />
              <text x={cxGroup} y={H - 6} textAnchor="middle" className="chart-label">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hover !== null && data[hover] && (
        <div
          className="chart-tooltip"
          style={{ left: `clamp(70px, ${((padX + groupW * hover + groupW / 2) / Math.max(W, 40)) * 100}%, calc(100% - 70px))` }}
          role="status"
        >
          <span className="chart-tooltip__label">{data[hover].fullLabel || data[hover].label}</span>
          <div className="chart-tooltip__rows">
            <span className="pos">● {labels[0]}: {formatValue(data[hover].a)}</span>
            <span className="neg">● {labels[1]}: {formatValue(data[hover].b)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
