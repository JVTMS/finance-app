// Card hero do saldo total: objeto 3D, contador animado e flash cinematográfico
// quando o dinheiro entra ou sai.

import { useEffect, useRef, useState } from 'react';
import HeroObject3D from './three/HeroObject3D';
import { useCountUp } from '../hooks/useCountUp';
import { useSettings } from '../context/SettingsContext';
import { formatBRL, formatPercent } from '../utils/format';

export default function BalanceCard({ total, monthDelta = null, yearDeltaPct = null, accountsCount = 0 }) {
  const display = useCountUp(total, { duration: 1100 });
  const [flash, setFlash] = useState(null); // { dir: 'up' | 'down', amount }
  const prevTotal = useRef(total);
  const flashTimer = useRef(0);

  useEffect(() => {
    const prev = prevTotal.current;
    prevTotal.current = total;
    if (prev === total) return undefined;
    const diff = Math.round((total - prev) * 100) / 100;
    if (diff === 0) return undefined;
    setFlash({ dir: diff > 0 ? 'up' : 'down', amount: Math.abs(diff) });
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 1600);
    return () => clearTimeout(flashTimer.current);
  }, [total]);

  return (
    <section className="balance-card rise-in" aria-label="Saldo total">
      <div className="balance-card__veil" aria-hidden />
      <HeroObject3D className="balance-card__object" />

      <div className="balance-card__content">
        <span className="balance-card__eyebrow">
          <span className="balance-card__pulse" aria-hidden />
          Patrimônio disponível · {accountsCount} {accountsCount === 1 ? 'conta' : 'contas'}
        </span>

        <div className="balance-card__value-wrap">
          <strong className={`balance-card__value num ${flash ? (flash.dir === 'up' ? 'is-flash-up' : 'is-flash-down') : ''}`}>
            {formatBRL(display)}
          </strong>
          {flash && (
            <span className={`balance-flash ${flash.dir === 'up' ? 'pos' : 'neg'}`} aria-hidden>
              {flash.dir === 'up' ? '+' : '−'} {formatBRL(flash.amount)}
            </span>
          )}
        </div>

        <div className="balance-card__chips">
          {monthDelta !== null && Number.isFinite(monthDelta) && (
            <span className={`chip ${monthDelta >= 0 ? 'chip--pos' : 'chip--neg'}`}>
              {monthDelta >= 0 ? '▲' : '▼'} {formatBRL(Math.abs(monthDelta))} este mês
            </span>
          )}
          {yearDeltaPct !== null && Number.isFinite(yearDeltaPct) && (
            <span className={`chip ${yearDeltaPct >= 0 ? 'chip--pos' : 'chip--neg'}`}>
              {yearDeltaPct >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(yearDeltaPct), { signed: false })} em 12 meses
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
