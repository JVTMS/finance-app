// Mini gráfico de linha para acentos em cards.

export default function Sparkline({ values, width = 130, height = 38, color = 'var(--accent)', id = 'sp' }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (width - 6) + 3;
    const y = height - 4 - ((v - min) / span) * (height - 10);
    return `${x},${y}`;
  });
  const line = `M ${pts.join(' L ')}`;
  const area = `${line} L ${width - 3},${height} L 3,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="sparkline" aria-hidden="true">
      <defs>
        <linearGradient id={`sparkFill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sparkFill-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
