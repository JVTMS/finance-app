// Seção "Visão Financeira": insights calculados a partir dos dados reais.

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { buildInsights } from '../services/finance';
import { useFinance } from '../context/FinanceContext';
import CategoryIcon from './ui/CategoryIcon';

export default function Insights() {
  const data = useFinance();
  const insights = useMemo(
    () => buildInsights(data),
    [data.accounts, data.transactions, data.investments, data.categories] // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!insights.length) return null;

  return (
    <section className="insights rise-in" aria-label="Visão financeira">
      <header className="insights__head">
        <Sparkles size={16} aria-hidden />
        <h3>Visão Financeira</h3>
      </header>
      <ul className="insights__list">
        {insights.map((ins, i) => (
          <li key={i} className={`insights__item insights__item--${ins.tone} fade-in-up`} style={{ animationDelay: `${i * 70}ms` }}>
            <span className="insights__icon">
              <CategoryIcon name={ins.icon} size={15} />
            </span>
            <p>{ins.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
