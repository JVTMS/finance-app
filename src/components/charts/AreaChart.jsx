// Gráfico de área/linha com brilho discreto, desenho animado e tooltip detalhado.

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatBRL } from '../../utils/format';
import { useContainerWidth } from '../../hooks/useContainerWidth';

function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function AreaChart({
  points,
  height = 240,
  formatValue = formatBRL,
  color = 'var(--accent)',
  ariaLabel = 'Gráfico de evolução',
  showGrid = true,
  uid = 'a',
}) {
  const [wrapRef, W] = useContainerWidth();
  const lineRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [drawn, setDrawn] = useState(false);

  const H = height;
  const padX = 14;
  const padTop = 18;
  const padBottom = 26;

  const { coords, areaPath, linePath } = useMemo(() => {
    if (!points.length || W <= 40) return { coords: [], areaPath: '', linePath: '' };
    const values = points.map((p) => p.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const span = rawMax - rawMin || Math.abs(rawMax) || 1;
    const min = rawMin - span * 0.12;
    const max = rawMax + span * 0.15;
    const innerW = W - padX * 2;
    const innerH = H - padTop - padBottom;
    const coords = points.map((p, i) => ({
      x: padX + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW),
      y: padTop + (1 - (p.value - min) / (max - min)) * innerH,
    }));
    const linePath = smoothPath(coords);
    const areaPath =
      points.length > 1
        ? `${linePath} L ${coords[coords.length - 1].x} ${H - padBottom} L ${coords[0].x} ${H - padBottom} Z`
        : '';
    return { coords, areaPath, linePath };
  }, [points, W, H]);

  // Desenho animado da linha
  useEffect(() => {
    const path = lineRef.current;
    if (!path) return undefined;
    const len = path.getTotalLength();
    path.style.transition = 'none';
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (lineRef.current) {
          lineRef.current.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)';
          lineRef.current.style.strokeDashoffset = '0';
        }
        setDrawn(true);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [linePath]);

  const hoverPoint = hover !== null ? points[hover] : null;
  const tooltipLeft = hover !== null ? (coords[hover].x / W) * 100 : 0;
  const prevValue = hover !== null && hover > 0 ? points[hover - 1].value : null;
  const delta =
    hoverPoint && prevValue !== null && prevValue !== 0
      ? ((hoverPoint.value - prevValue) / Math.abs(prevValue)) * 100
      : null;

  const gradId = `areaFill-${uid}`;
  const glowId = `lineGlow-${uid}`;

  return (
    <div className="area-chart" ref={wrapRef} role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${Math.max(W, 40)} ${H}`} width="100%" height={H} className="area-chart__svg">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.30" />
            <stop offset="60%" stopColor={color} stopOpacity="0.08" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {showGrid &&
          [0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={padX}
              x2={W - padX}
              y1={padTop + f * (H - padTop - padBottom)}
              y2={padTop + f * (H - padTop - padBottom)}
              className="chart-grid"
            />
          ))}

        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} className="area-chart__area" />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.4"
            strokeLinecap="round"
            className="area-chart__glow"
            filter={`url(#${glowId})`}
            opacity="0.45"
          />
        )}
        <path
          ref={lineRef}
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="area-chart__line"
        />

        {hover !== null && coords[hover] && (
          <g>
            <line
              x1={coords[hover].x}
              x2={coords[hover].x}
              y1={padTop - 6}
              y2={H - padBottom}
              className="chart-cursor"
            />
            <circle cx={coords[hover].x} cy={coords[hover].y} r="9" className="area-chart__dot-halo" />
            <circle cx={coords[hover].x} cy={coords[hover].y} r="4" className="area-chart__dot" />
          </g>
        )}

        {/* alvos de hover */}
        {coords.map((c, i) => (
          <rect
            key={i}
            x={c.x - (W - padX * 2) / (points.length * 2)}
            y={0}
            width={(W - padX * 2) / points.length}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}

        {points.map((p, i) =>
          i % Math.ceil(points.length / 7) === 0 || i === points.length - 1 ? (
            <text key={i} x={coords[i].x} y={H - 6} textAnchor="middle" className="chart-label">
              {p.label}
            </text>
          ) : null
        )}
      </svg>

      {hoverPoint && (
        <div
          className="chart-tooltip"
          style={{ left: `clamp(60px, ${tooltipLeft}%, calc(100% - 60px))` }}
          role="status"
        >
          <span className="chart-tooltip__label">{hoverPoint.label}</span>
          <strong className="chart-tooltip__value">{formatValue(hoverPoint.value)}</strong>
          {delta !== null && Number.isFinite(delta) && (
            <span className={`chart-tooltip__delta ${delta >= 0 ? 'pos' : 'neg'}`}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% vs anterior
            </span>
          )}
        </div>
      )}
      {!drawn && <span className="sr-only">Carregando gráfico…</span>}
    </div>
  );
}
