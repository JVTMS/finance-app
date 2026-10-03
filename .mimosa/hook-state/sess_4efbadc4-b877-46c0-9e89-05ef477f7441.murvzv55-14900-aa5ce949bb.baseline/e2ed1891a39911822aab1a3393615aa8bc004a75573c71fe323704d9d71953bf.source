// Investimentos: patrimônio investido, rendimento, visualização 3D e evolução.

import { useMemo } from 'react';
import { TrendingUp, Plus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useHashRoute } from '../hooks/useHashRoute';
import { patrimonySeries } from '../services/finance';
import { formatBRL, formatPercent, monthLabel } from '../utils/format';
import { currentMonthKey, addMonths, monthRange } from '../utils/dates';
import ChartCard from '../components/charts/ChartCard';
import AreaChart from '../components/charts/AreaChart';
import Investments3D from '../components/Investments3D';
import InvestmentCard from '../components/InvestmentCard';
import EmptyState from '../components/ui/EmptyState';
import { sound } from '../services/sound';

export default function Investments() {
  const { investments, accounts, transactions } = useFinance();
  const { navigate } = useHashRoute();

  const model = useMemo(() => {
    const invested = investments.reduce((s, i) => s + i.invested, 0);
    const current = investments.reduce((s, i) => s + i.current, 0);
    const rendimento = current - invested;
    const rendPct = invested > 0 ? rendimento / invested : 0;
    const months = monthRange(addMonths(currentMonthKey(), -11), currentMonthKey());
    const series = patrimonySeries(accounts, transactions, investments, months);
    return { invested, current, rendimento, rendPct, series };
  }, [investments, accounts, transactions]);

  const openAdd = () => {
    // navega mantendo contexto e dispara o FAB via evento
    sound.open();
    window.dispatchEvent(new CustomEvent('finance:add-transaction', { detail: 'investimento' }));
  };

  return (
    <div className="page page--investments">
      <div className="inv-hero rise-in">
        <div className="inv-hero__stats">
          <div className="inv-hero__stat">
            <span>Patrimônio investido</span>
            <strong className="num">{formatBRL(model.current)}</strong>
          </div>
          <div className="inv-hero__stat">
            <span>Total aportado</span>
            <strong className="num">{formatBRL(model.invested)}</strong>
          </div>
          <div className="inv-hero__stat">
            <span>Rendimento</span>
            <strong className={`num ${model.rendimento >= 0 ? 'pos' : 'neg'}`}>
              {formatBRL(model.rendimento, { signed: true })}{' '}
              <small>({formatPercent(model.rendPct)})</small>
            </strong>
          </div>
          <button className="btn btn--primary" onClick={openAdd}>
            <Plus size={15} aria-hidden /> Novo aporte
          </button>
        </div>
        <Investments3D investments={investments} />
      </div>

      {investments.length > 0 && (
        <ChartCard
          title="Evolução dos investimentos"
          subtitle="Valor de mercado acumulado — últimos 12 meses"
          className="rise-in"
        >
          <AreaChart
            points={model.series.map((s) => ({ label: monthLabel(s.key, { short: true, year: false }), value: s.invested }))}
            color="var(--accent)"
            ariaLabel={`Evolução dos investimentos. Atual: ${formatBRL(model.current)}`}
          />
        </ChartCard>
      )}

      <section aria-label="Investimentos individuais">
        <header className="section-head-row rise-in">
          <div>
            <h2 className="section-title">
              <TrendingUp size={16} aria-hidden /> MEUS INVESTIMENTOS
            </h2>
            <p className="section-sub">{investments.length} ativo{investments.length === 1 ? '' : 's'}</p>
          </div>
        </header>
        {investments.length ? (
          <div className="inv-grid">
            {investments.map((inv, i) => (
              <InvestmentCard key={inv.id} investment={inv} delay={i * 70} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="Nenhum investimento ainda"
            message="Registre um aporte pelo botão “+” e acompanhe a evolução do seu patrimônio."
            action={
              <button className="btn btn--primary" onClick={openAdd}>
                <Plus size={15} aria-hidden /> Fazer primeiro aporte
              </button>
            }
          />
        )}
      </section>
    </div>
  );
}
