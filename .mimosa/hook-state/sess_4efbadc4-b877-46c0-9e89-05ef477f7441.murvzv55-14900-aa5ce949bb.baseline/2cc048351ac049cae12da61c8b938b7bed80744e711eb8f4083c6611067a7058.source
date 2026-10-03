// Card financeiro flutuante com tilt 3D, contador animado e brilho no hover.

import { useCountUp } from '../hooks/useCountUp';
import { useTilt } from '../hooks/useTilt';
import { useSettings } from '../context/SettingsContext';
import { formatPercent } from '../utils/format';
import Sparkline from './charts/Sparkline';

export default function FinancialCard({
  icon: Icon,
  label,
  value,
  format,
  delta = null,
  deltaLabel = 'vs mês anterior',
  spark,
  sparkId,
  tone = 'neutral',
  onClick,
  delay = 0,
  children,
}) {
  const { performance: perfMode } = useSettings();
  const display = useCountUp(value);
  const { ref, tiltHandlers } = useTilt({ enabled: !perfMode });

  return (
    <article
      ref={ref}
      {...tiltHandlers}
      className={`financial-card tone-${tone} rise-in ${onClick ? 'is-clickable' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    >
      <div className="financial-card__glare" aria-hidden />
      <header className="financial-card__head">
        <span className="financial-card__icon">
          {Icon && <Icon size={17} strokeWidth={2} aria-hidden />}
        </span>
        <span className="financial-card__label">{label}</span>
      </header>
      <strong className={`financial-card__value num tone-${tone}-text`}>
        {format ? format(display) : display.toLocaleString('pt-BR')}
      </strong>
      <footer className="financial-card__foot">
        {delta !== null && Number.isFinite(delta) && (
          <span className={`financial-card__delta ${delta >= 0 ? 'pos' : 'neg'}`}>
            {delta >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(delta), { signed: false })}
            <small> {deltaLabel}</small>
          </span>
        )}
        {children}
      </footer>
      {spark && spark.length > 1 && (
        <div className="financial-card__spark">
          <Sparkline values={spark} id={sparkId || label} />
        </div>
      )}
    </article>
  );
}
