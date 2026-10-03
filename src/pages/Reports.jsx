// Relatório mensal: resumo, categorias, comparação com mês anterior e exportação.

import { useMemo, useState } from 'react';
import { FileText, FileSpreadsheet, FileDown, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useToast } from '../context/ToastContext';
import { flowTotals, monthlyFlowSeries, categoryBreakdown, patrimonySeries } from '../services/finance';
import { exportCSV, exportXLS, printHTML } from '../services/export';
import { formatBRL, formatPercent, monthLabel, escapeHtmlSafe } from '../utils/format';
import { currentMonthKey, addMonths, monthRange, monthEndISO } from '../utils/dates';
import ChartCard from '../components/charts/ChartCard';
import BarPairChart from '../components/charts/BarPairChart';
import Dropdown from '../components/ui/Dropdown';

export default function Reports() {
  const { transactions, accounts, investments, categories } = useFinance();
  const { push } = useToast();
  const [month, setMonth] = useState(currentMonthKey());

  const monthOptions = useMemo(() => {
    const used = new Set(transactions.map((t) => t.date.slice(0, 7)));
    return monthRange(addMonths(currentMonthKey(), -17), currentMonthKey())
      .filter((k) => used.has(k))
      .map((k) => ({ value: k, label: monthLabel(k) }));
  }, [transactions]);

  const report = useMemo(() => {
    const from = `${month}-01`;
    const to = monthEndISO(month);
    const prevKey = addMonths(month, -1);
    const prevFrom = `${prevKey}-01`;
    const prevTo = monthEndISO(prevKey);

    const cur = flowTotals(transactions, { from, to });
    const prev = flowTotals(transactions, { from: prevFrom, to: prevTo });
    const breakdown = categoryBreakdown(transactions, categories, { from, to });
    const months = monthRange(addMonths(month, -11), month);
    const patrimony = patrimonySeries(accounts, transactions, investments, months);

    const invMonth = transactions
      .filter((t) => t.type === 'investimento' && t.date >= from && t.date <= to)
      .reduce((s, t) => s + t.amount, 0);

    return { cur, prev, breakdown, patrimony, invMonth, prevKey };
  }, [month, transactions, accounts, investments, categories]);

  const delta = (cur, prev) => (prev > 0 ? (cur - prev) / prev : null);

  const rowsForExport = () =>
    transactions
      .filter((t) => t.date >= `${month}-01` && t.date <= monthEndISO(month))
      .map((tx) => ({
        Data: tx.date,
        Tipo: tx.type,
        Nome: tx.name,
        Categoria: categories.find((c) => c.id === tx.categoryId)?.name || '',
        Conta: accounts.find((a) => a.id === tx.accountId)?.name || '',
        Valor: tx.amount.toFixed(2).replace('.', ','),
        Descricao: tx.description,
      }));

  const exportCSVFile = () => {
    const rows = rowsForExport();
    if (!rows.length) return push({ type: 'warn', title: 'Sem dados neste mês', sound: 'warn' });
    exportCSV(`relatorio-${month}.csv`, rows);
    push({ type: 'success', title: 'CSV exportado', message: `${rows.length} linhas.`, sound: 'success' });
  };

  const exportXLSFile = () => {
    const rows = rowsForExport();
    if (!rows.length) return push({ type: 'warn', title: 'Sem dados neste mês', sound: 'warn' });
    const { cur, prev, breakdown } = report;
    const money = (v) => (Number(v) || 0).toFixed(2).replace('.', ',');
    const table = `
      <table>
        <tr><th>Resumo — ${monthLabel(month)}</th><th class="r">Valor</th></tr>
        <tr><td>Receitas</td><td class="num">R$ ${money(cur.receitas)}</td></tr>
        <tr><td>Despesas</td><td class="num">R$ ${money(cur.despesas)}</td></tr>
        <tr><td>Investimentos</td><td class="num">R$ ${money(cur.investido)}</td></tr>
        <tr><td>Saldo do mês</td><td class="num">R$ ${money(cur.saldo)}</td></tr>
        <tr><td>Economia</td><td class="num">R$ ${money(cur.economia)}</td></tr>
        <tr><td>Despesas do mês anterior (${monthLabel(report.prevKey, { short: true })})</td><td class="num">R$ ${money(prev.despesas)}</td></tr>
      </table>
      <table>
        <tr><th>Categoria</th><th class="r">Total</th><th class="r">Participação</th></tr>
        ${breakdown.rows
          .map(
            (r) =>
              `<tr><td>${r.name}</td><td class="num">R$ ${money(r.total)}</td><td class="num">${(r.share * 100).toFixed(1)}%</td></tr>`
          )
          .join('')}
      </table>
      <table>
        <tr><th>Data</th><th>Tipo</th><th>Nome</th><th>Categoria</th><th class="r">Valor</th></tr>
        ${rows
          .map(
            (r) =>
              `<tr><td>${r.Data}</td><td>${r.Tipo}</td><td>${r.Nome}</td><td>${r.Categoria}</td><td class="num">R$ ${r.Valor}</td></tr>`
          )
          .join('')}
      </table>`;
    exportXLS(`relatorio-${month}.xls`, `Relatório financeiro — ${monthLabel(month)}`, table);
    push({ type: 'success', title: 'Excel exportado', message: `${rows.length} transações.`, sound: 'success' });
  };

  const exportPDF = () => {
    const rows = rowsForExport();
    const { cur, prev, breakdown } = report;
    const money = (v) => formatBRL(Number(v) || 0);
    const deltaChip = (d) =>
      d === null ? '—' : `${d >= 0 ? '+' : '−'}${Math.abs(d * 100).toFixed(1)}%`;
    const despDelta = delta(cur.despesas, prev.despesas);
    const recDelta = delta(cur.receitas, prev.receitas);

    printHTML(
      `Relatório ${monthLabel(month)}`,
      `
      <h1>FINANCE — Relatório financeiro</h1>
      <div class="sub">${monthLabel(month)} · gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
      <div class="grid">
        <div class="kpi"><div class="label">Receitas</div><div class="value pos">${money(cur.receitas)}</div><div>${deltaChip(recDelta)} vs mês anterior</div></div>
        <div class="kpi"><div class="label">Despesas</div><div class="value neg">${money(cur.despesas)}</div><div>${deltaChip(despDelta)} vs mês anterior</div></div>
        <div class="kpi"><div class="label">Saldo</div><div class="value">${money(cur.saldo)}</div></div>
        <div class="kpi"><div class="label">Economia</div><div class="value">${money(cur.economia)}</div></div>
      </div>
      <table>
        <tr><th>Categoria</th><th class="r">Total</th><th class="r">Participação</th></tr>
        ${breakdown.rows
          .map(
            (r) =>
              `<tr><td>${escapeHtmlSafe(r.name)}</td><td class="r">${money(r.total)}</td><td class="r">${formatPercent(r.share, { signed: false })}</td></tr>`
          )
          .join('') || '<tr><td colspan="3">Sem despesas neste mês.</td></tr>'}
      </table>
      <table>
        <tr><th>Data</th><th>Tipo</th><th>Nome</th><th>Categoria</th><th class="r">Valor</th></tr>
        ${rows
          .map(
            (r) =>
              `<tr><td>${r.Data}</td><td>${r.Tipo}</td><td>${escapeHtmlSafe(r.Nome)}</td><td>${escapeHtmlSafe(r.Categoria)}</td><td class="r ${r.Tipo === 'receita' ? 'pos' : 'neg'}">${r.Tipo === 'receita' ? '+' : '−'} R$ ${r.Valor}</td></tr>`
          )
          .join('') || '<tr><td colspan="5">Sem transações neste mês.</td></tr>'}
      </table>
      <footer>Documento gerado pelo FINANCE · dados armazenados localmente neste navegador.</footer>`
    );
    push({ type: 'info', title: 'Abrindo impressão', message: 'Escolha “Salvar como PDF”.', sound: 'click' });
  };

  const prevChip = (cur, prev, invert = false) => {
    const d = delta(cur, prev);
    if (d === null || prev === 0) return <span className="report-delta">—</span>;
    const up = d >= 0;
    const good = invert ? !up : up;
    return (
      <span className={`report-delta ${good ? 'pos' : 'neg'}`}>
        {up ? '▲' : '▼'} {formatPercent(d)} vs {monthLabel(report.prevKey, { short: true })}
      </span>
    );
  };

  return (
    <div className="page page--reports">
      <header className="section-head-row rise-in">
        <div>
          <h2 className="section-title">
            <BarChart3 size={16} aria-hidden /> RELATÓRIO MENSAL
          </h2>
          <p className="section-sub">Resumo, categorias e exportação</p>
        </div>
        <div className="report-controls">
          <button
            className="icon-btn"
            onClick={() => setMonth(addMonths(month, -1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <Dropdown value={month} onChange={setMonth} options={monthOptions} ariaLabel="Selecionar mês" />
          <button
            className="icon-btn"
            onClick={() => {
              const next = addMonths(month, 1);
              if (next <= currentMonthKey()) setMonth(next);
            }}
            aria-label="Próximo mês"
            disabled={addMonths(month, 1) > currentMonthKey()}
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      </header>

      <div className="report-kpis">
        <article className="report-kpi rise-in">
          <span className="report-kpi__label">Receitas</span>
          <strong className="report-kpi__value num pos">{formatBRL(report.cur.receitas)}</strong>
          {prevChip(report.cur.receitas, report.prev.receitas)}
        </article>
        <article className="report-kpi rise-in" style={{ animationDelay: '60ms' }}>
          <span className="report-kpi__label">Despesas</span>
          <strong className="report-kpi__value num neg">{formatBRL(report.cur.despesas)}</strong>
          {prevChip(report.cur.despesas, report.prev.despesas, true)}
        </article>
        <article className="report-kpi rise-in" style={{ animationDelay: '120ms' }}>
          <span className="report-kpi__label">Saldo do mês</span>
          <strong className="report-kpi__value num">{formatBRL(report.cur.saldo)}</strong>
          <span className="report-delta">receitas − despesas</span>
        </article>
        <article className="report-kpi rise-in" style={{ animationDelay: '180ms' }}>
          <span className="report-kpi__label">Investimentos</span>
          <strong className="report-kpi__value num">{formatBRL(report.invMonth)}</strong>
          <span className="report-delta">aportes no período</span>
        </article>
        <article className="report-kpi rise-in" style={{ animationDelay: '240ms' }}>
          <span className="report-kpi__label">Economia</span>
          <strong className="report-kpi__value num">{formatBRL(report.cur.economia)}</strong>
          <span className="report-delta">saldo − investimentos</span>
        </article>
      </div>

      <div className="dash-grid-2">
        <ChartCard title="Receitas × Despesas" subtitle={`${monthLabel(report.prevKey, { short: true })} e ${monthLabel(month, { short: true })}`} className="rise-in">
          <BarPairChart
            data={[
              { label: monthLabel(report.prevKey, { short: true, year: false }), a: report.prev.receitas, b: report.prev.despesas },
              { label: monthLabel(month, { short: true, year: false }), a: report.cur.receitas, b: report.cur.despesas },
            ]}
            height={220}
          />
        </ChartCard>

        <ChartCard title="Top categorias" subtitle={monthLabel(month)} className="rise-in">
          <ul className="report-cats">
            {report.breakdown.rows.slice(0, 6).map((r) => (
              <li key={r.id}>
                <span className="report-cats__dot" style={{ background: r.color }} />
                <span className="report-cats__name">{r.name}</span>
                <span className="report-cats__bar" aria-hidden>
                  <span style={{ width: `${Math.max(4, r.share * 100)}%`, background: r.color }} />
                </span>
                <strong className="num">{formatBRL(r.total)}</strong>
              </li>
            ))}
            {!report.breakdown.rows.length && <li className="report-cats__empty">Sem despesas neste mês.</li>}
          </ul>
        </ChartCard>
      </div>

      <section className="report-export rise-in" aria-label="Exportar relatório">
        <h3 className="report-export__title">Exportar relatório</h3>
        <div className="report-export__actions">
          <button className="btn btn--ghost" onClick={exportPDF}>
            <FileText size={15} aria-hidden /> PDF
          </button>
          <button className="btn btn--ghost" onClick={exportCSVFile}>
            <FileDown size={15} aria-hidden /> CSV
          </button>
          <button className="btn btn--ghost" onClick={exportXLSFile}>
            <FileSpreadsheet size={15} aria-hidden /> Excel
          </button>
        </div>
      </section>
    </div>
  );
}
