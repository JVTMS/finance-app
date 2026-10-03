// Dashboard: composição cinematográfica — saldo hero, cards flutuantes,
// PATRIMÔNIO, gráficos, visão financeira, contas e timeline.

import { useMemo } from 'react';
import {
  ArrowUpRight, ArrowDownLeft, TrendingUp, PiggyBank, Wallet, Landmark, ChevronRight, Gem,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useHashRoute } from '../hooks/useHashRoute';
import {
  accountsTotal, flowTotals, monthlyFlowSeries, categoryBreakdown, patrimonySeries, accountBalance,
} from '../services/finance';
import { formatBRL, formatCompactBRL } from '../utils/format';
import { currentMonthKey, addMonths, monthRange } from '../utils/dates';
import { monthLabel } from '../utils/format';
import BalanceCard from '../components/BalanceCard';
import FinancialCard from '../components/FinancialCard';
import ChartCard from '../components/charts/ChartCard';
import AreaChart from '../components/charts/AreaChart';
import BarPairChart from '../components/charts/BarPairChart';
import DonutChart from '../components/charts/DonutChart';
import Insights from '../components/Insights';
import TransactionList from '../components/TransactionList';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as api from '../api/api';
import { ReceiptText } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const data = useFinance();
  const { transactions, accounts, investments, categories, reload } = data;
  const { navigate } = useHashRoute();
  const { push } = useToast();

  const model = useMemo(() => {
    const thisKey = currentMonthKey();
    const prevKey = addMonths(thisKey, -1);
    const months = monthRange(addMonths(thisKey, -11), thisKey);

    const cash = accountsTotal(accounts, transactions);
    const invested = investments.reduce((s, i) => s + i.current, 0);
    const patrimonio = cash + invested;

    const cur = flowTotals(transactions, { from: `${thisKey}-01` });
    const prev = flowTotals(transactions, { from: `${prevKey}-01`, to: `${prevKey}-31` });

    const series = monthlyFlowSeries(transactions, months);
    const patrimony = patrimonySeries(accounts, transactions, investments, months);
    const breakdown = categoryBreakdown(transactions, categories, { from: `${thisKey}-01` });

    const lastPatrimony = patrimony[patrimony.length - 1]?.total || 0;
    const prevPatrimony = patrimony[patrimony.length - 2]?.total || 0;
    const yearAgoPatrimony = patrimony[0]?.total || 0;

    return {
      cash,
      invested,
      patrimonio,
      cur,
      prev,
      series,
      patrimony,
      breakdown,
      monthDelta: lastPatrimony - prevPatrimony,
      yearDeltaPct: yearAgoPatrimony > 0 ? (lastPatrimony - yearAgoPatrimony) / yearAgoPatrimony : null,
      receitaDelta: prev.receitas > 0 ? (cur.receitas - prev.receitas) / prev.receitas : null,
      despesaDelta: prev.despesas > 0 ? (cur.despesas - prev.despesas) / prev.despesas : null,
    };
  }, [accounts, transactions, investments, categories]);

  const removeTx = async (tx) => {
    await api.deleteTransaction(user.id, tx.id);
    await reload();
    push({ type: 'info', title: 'Transação excluída', message: tx.name, sound: 'click' });
  };

  const hasData = transactions.length > 0;

  return (
    <div className="page page--dashboard">
      <BalanceCard
        total={model.cash}
        monthDelta={model.monthDelta}
        yearDeltaPct={model.yearDeltaPct}
        accountsCount={accounts.length}
      />

      <div className="dash-cards">
        <FinancialCard
          icon={ArrowUpRight}
          label={`Receitas · ${monthLabel(currentMonthKey(), { short: true, year: false })}`}
          value={model.cur.receitas}
          format={formatBRL}
          delta={model.receitaDelta}
          tone="positive"
          delay={60}
          onClick={() => navigate('/transactions?type=receita')}
          spark={model.series.map((s) => s.receitas)}
          sparkId="rec"
        />
        <FinancialCard
          icon={ArrowDownLeft}
          label={`Despesas · ${monthLabel(currentMonthKey(), { short: true, year: false })}`}
          value={model.cur.despesas}
          format={formatBRL}
          delta={model.despesaDelta}
          tone="negative"
          delay={120}
          onClick={() => navigate('/transactions?type=despesa')}
          spark={model.series.map((s) => s.despesas)}
          sparkId="desp"
        />
        <FinancialCard
          icon={PiggyBank}
          label="Economia do mês"
          value={model.cur.economia}
          format={formatBRL}
          tone="neutral"
          delay={180}
          spark={model.series.map((s) => s.receitas - s.despesas)}
          sparkId="econ"
        />
        <FinancialCard
          icon={TrendingUp}
          label="Investido"
          value={model.invested}
          format={formatBRL}
          tone="accent"
          delay={240}
          onClick={() => navigate('/investments')}
          spark={model.patrimony.map((p) => p.invested)}
          sparkId="inv"
        />
      </div>

      <section className="patrimony-section rise-in" style={{ animationDelay: '220ms' }} aria-label="Patrimônio">
        <header className="patrimony-section__head">
          <div>
            <h2 className="section-title">
              <Gem size={16} aria-hidden /> PATRIMÔNIO
            </h2>
            <p className="section-sub">Evolução consolidada: contas + investimentos</p>
          </div>
          <div className="patrimony-section__stats">
            <div>
              <span>Patrimônio atual</span>
              <strong className="num">{formatBRL(model.patrimonio)}</strong>
            </div>
            <div>
              <span>Variação mensal</span>
              <strong className={`num ${model.monthDelta >= 0 ? 'pos' : 'neg'}`}>
                {formatBRL(model.monthDelta, { signed: true })}
              </strong>
            </div>
            <div>
              <span>Variação anual</span>
              <strong className={`num ${model.yearDeltaPct >= 0 ? 'pos' : 'neg'}`}>
                {model.yearDeltaPct === null ? '—' : `${(model.yearDeltaPct * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
              </strong>
            </div>
            <div>
              <span>Investimentos</span>
              <strong className="num">{formatCompactBRL(model.invested)}</strong>
            </div>
            <div>
              <span>Saldo disponível</span>
              <strong className="num">{formatCompactBRL(model.cash)}</strong>
            </div>
          </div>
        </header>
        <AreaChart
          points={model.patrimony.map((p) => ({ label: monthLabel(p.key, { short: true, year: false }), value: p.total }))}
          ariaLabel={`Evolução do patrimônio nos últimos 12 meses. Atual: ${formatBRL(model.patrimonio)}`}
        />
      </section>

      <Insights />

      <div className="dash-grid-2">
        <ChartCard
          title="Receitas × Despesas"
          subtitle="Últimos 6 meses"
          className="rise-in"
        >
          <BarPairChart
            data={model.series.slice(-6).map((s) => ({
              label: monthLabel(s.key, { short: true, year: false }),
              a: s.receitas,
              b: s.despesas,
            }))}
          />
        </ChartCard>

        <ChartCard title="Gastos por categoria" subtitle={monthLabel(currentMonthKey())} className="rise-in">
          {model.breakdown.rows.length ? (
            <DonutChart
              data={model.breakdown.rows.slice(0, 6).map((r) => ({ label: r.name, value: r.total, color: r.color }))}
              centerTitle="Despesas"
            />
          ) : (
            <EmptyState icon={Wallet} title="Sem despesas neste mês" message="Registre uma despesa para ver a distribuição por categoria." />
          )}
        </ChartCard>
      </div>

      <section className="dash-accounts rise-in" aria-label="Minhas contas">
        <header className="section-head-row">
          <div>
            <h2 className="section-title">
              <Landmark size={16} aria-hidden /> MINHAS CONTAS
            </h2>
            <p className="section-sub">Cada conta com sua identidade visual</p>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={() => navigate('/accounts')}>
            Ver todas <ChevronRight size={14} aria-hidden />
          </button>
        </header>
        <div className="dash-accounts__grid">
          {accounts.map((acc, i) => (
            <button
              key={acc.id}
              className="mini-account rise-in"
              style={{ '--acc-color': acc.color, animationDelay: `${i * 60}ms` }}
              onClick={() => navigate('/accounts')}
            >
              <span className="mini-account__dot" aria-hidden />
              <span className="mini-account__name">{acc.name}</span>
              <strong className="mini-account__balance num">
                {formatBRL(accountBalance(acc, transactions))}
              </strong>
            </button>
          ))}
          {accounts.length === 0 && (
            <EmptyState icon={Landmark} title="Nenhuma conta ainda" message="Adicione contas para acompanhar seus saldos." />
          )}
        </div>
      </section>

      <section className="dash-timeline rise-in" aria-label="Últimas movimentações">
        <header className="section-head-row">
          <div>
            <h2 className="section-title">
              <ReceiptText size={16} aria-hidden /> ÚLTIMAS MOVIMENTAÇÕES
            </h2>
            <p className="section-sub">Sua timeline financeira</p>
          </div>
          <button className="btn btn--ghost btn--sm" onClick={() => navigate('/transactions')}>
            Ver tudo <ChevronRight size={14} aria-hidden />
          </button>
        </header>
        <TransactionList
          transactions={transactions}
          categories={categories}
          accounts={accounts}
          onDelete={removeTx}
          limit={7}
          emptyState={
            <EmptyState
              icon={ReceiptText}
              title="Sem movimentações ainda"
              message='Use o botão "+" para registrar sua primeira receita ou despesa.'
            />
          }
        />
      </section>
    </div>
  );
}
