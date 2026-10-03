// Cálculos financeiros puros: saldos, séries mensais, quebra por categoria,
// patrimônio histórico e insights automáticos (sempre a partir dos dados reais).

import { monthKey, monthEndISO, currentMonthKey, addMonths } from '../utils/dates';
import { formatBRL, formatPercent } from '../utils/format';

/** Efeito líquido de uma transação sobre uma conta específica. */
export function txEffectOnAccount(tx, accountId) {
  if (tx.accountId === accountId) {
    if (tx.type === 'receita') return tx.amount;
    if (tx.type === 'despesa' || tx.type === 'investimento') return -tx.amount;
    if (tx.type === 'transferencia') return -tx.amount;
  }
  if (tx.type === 'transferencia' && tx.toAccountId === accountId) return tx.amount;
  return 0;
}

/** Saldo atual (ou até uma data ISO) de uma conta = saldo inicial + movimentações. */
export function accountBalance(account, transactions, upToISO = null) {
  let balance = Number(account.initialBalance) || 0;
  for (const tx of transactions) {
    if (upToISO && tx.date > upToISO) continue;
    balance += txEffectOnAccount(tx, account.id);
  }
  return Math.round(balance * 100) / 100;
}

export function accountsTotal(accounts, transactions, upToISO = null) {
  return (
    Math.round(
      accounts.reduce((sum, acc) => sum + accountBalance(acc, transactions, upToISO), 0) * 100
    ) / 100
  );
}

/** Fluxo de um período: {receitas, despesas, investido, saldo, economia}. */
export function flowTotals(transactions, { from, to } = {}) {
  let receitas = 0;
  let despesas = 0;
  let investido = 0;
  for (const tx of transactions) {
    if (from && tx.date < from) continue;
    if (to && tx.date > to) continue;
    if (tx.type === 'receita') receitas += tx.amount;
    else if (tx.type === 'despesa') despesas += tx.amount;
    else if (tx.type === 'investimento') investido += tx.amount;
  }
  const round = (v) => Math.round(v * 100) / 100;
  return {
    receitas: round(receitas),
    despesas: round(despesas),
    investido: round(investido),
    saldo: round(receitas - despesas),
    economia: round(receitas - despesas - investido),
  };
}

export function monthBounds(key) {
  return { from: `${key}-01`, to: monthEndISO(key) };
}

/** Série mensal de receitas x despesas para as chaves de mês fornecidas. */
export function monthlyFlowSeries(transactions, monthKeys) {
  const map = new Map(monthKeys.map((k) => [k, { key: k, receitas: 0, despesas: 0 }]));
  for (const tx of transactions) {
    const bucket = map.get(monthKey(tx.date));
    if (!bucket) continue;
    if (tx.type === 'receita') bucket.receitas += tx.amount;
    else if (tx.type === 'despesa') bucket.despesas += tx.amount;
  }
  return monthKeys.map((k) => {
    const b = map.get(k);
    return {
      ...b,
      receitas: Math.round(b.receitas * 100) / 100,
      despesas: Math.round(b.despesas * 100) / 100,
    };
  });
}

/** Quebra de despesas (ou receitas) por categoria em um período. */
export function categoryBreakdown(transactions, categories, { from, to, kind = 'despesa' } = {}) {
  const totals = new Map();
  for (const tx of transactions) {
    if (tx.type !== kind) continue;
    if (from && tx.date < from) continue;
    if (to && tx.date > to) continue;
    const key = tx.categoryId ?? 'sem';
    totals.set(key, (totals.get(key) || 0) + tx.amount);
  }
  const rows = [...totals.entries()].map(([id, total]) => {
    const cat = categories.find((c) => c.id === id);
    return {
      id,
      name: cat?.name || 'Sem categoria',
      icon: cat?.icon || 'circle-ellipsis',
      color: cat?.color || '#94a3b8',
      total: Math.round(total * 100) / 100,
    };
  });
  rows.sort((a, b) => b.total - a.total);
  const grand = rows.reduce((s, r) => s + r.total, 0);
  rows.forEach((r) => {
    r.share = grand > 0 ? r.total / grand : 0;
  });
  return { rows, total: Math.round(grand * 100) / 100 };
}

/** Valor de um investimento em uma data ISO (última marcação ≤ data). */
export function investmentValueAt(inv, isoDate) {
  let value = null;
  for (const mark of inv.history || []) {
    if (mark.date <= isoDate) value = mark.value;
    else break;
  }
  return value;
}

/** Série de patrimônio por mês: caixa (contas) + valor dos investimentos. */
export function patrimonySeries(accounts, transactions, investments, monthKeys) {
  return monthKeys.map((key) => {
    const end = monthEndISO(key);
    const cash = accountsTotal(accounts, transactions, end);
    let investedValue = 0;
    for (const inv of investments) {
      if (inv.startedAt > end) continue;
      const v = investmentValueAt(inv, end);
      investedValue += v ?? inv.invested;
    }
    return {
      key,
      cash: Math.round(cash * 100) / 100,
      invested: Math.round(investedValue * 100) / 100,
      total: Math.round((cash + investedValue) * 100) / 100,
    };
  });
}

/** Insights da seção "Visão Financeira" — calculados, nunca inventados. */
export function buildInsights({ accounts, transactions, investments, categories }) {
  const insights = [];
  const thisKey = currentMonthKey();
  const prevKey = addMonths(thisKey, -1);
  const thisMonth = monthBounds(thisKey);
  const prevMonth = monthBounds(prevKey);

  const cur = flowTotals(transactions, thisMonth);
  const prev = flowTotals(transactions, prevMonth);

  // Despesas: comparação com o mês anterior
  if (prev.despesas > 0 && cur.despesas > 0) {
    const delta = (cur.despesas - prev.despesas) / prev.despesas;
    if (Math.abs(delta) >= 0.02) {
      insights.push({
        tone: delta < 0 ? 'positive' : 'negative',
        icon: delta < 0 ? 'trending-down' : 'trending-up',
        text:
          delta < 0
            ? `Você gastou ${formatPercent(Math.abs(delta), { signed: false })} menos que no mês passado (${formatBRL(cur.despesas)} vs ${formatBRL(prev.despesas)}).`
            : `Suas despesas aumentaram ${formatPercent(delta, { signed: false })} em relação ao mês anterior.`,
      });
    }
  }

  // Receitas
  if (prev.receitas > 0 && cur.receitas > 0 && Math.abs(cur.receitas - prev.receitas) / prev.receitas >= 0.03) {
    const delta = (cur.receitas - prev.receitas) / prev.receitas;
    insights.push({
      tone: delta > 0 ? 'positive' : 'neutral',
      icon: 'banknote',
      text: `Suas receitas ${delta > 0 ? 'cresceram' : 'diminuíram'} ${formatPercent(Math.abs(delta), { signed: false })} neste mês.`,
    });
  }

  // Taxa de poupança
  if (cur.receitas > 0) {
    const rate = cur.economia / cur.receitas;
    if (rate > 0) {
      insights.push({
        tone: 'positive',
        icon: 'piggy-bank',
        text: `Você economizou ${formatPercent(rate, { signed: false })} da renda deste mês (${formatBRL(cur.economia)}).`,
      });
    } else if (cur.despesas > 0) {
      insights.push({
        tone: 'negative',
        icon: 'alert-triangle',
        text: `Neste mês as despesas (${formatBRL(cur.despesas)}) superaram as receitas (${formatBRL(cur.receitas)}).`,
      });
    }
  }

  // Categoria dominante
  const breakdown = categoryBreakdown(transactions, categories, { ...thisMonth, kind: 'despesa' });
  if (breakdown.rows[0] && breakdown.total > 0) {
    const top = breakdown.rows[0];
    insights.push({
      tone: 'neutral',
      icon: 'target',
      text: `Maior gasto do mês: ${top.name} — ${formatBRL(top.total)} (${formatPercent(top.share, { signed: false })} das despesas).`,
    });
  }

  // Patrimônio: variação mensal e anual
  const series = patrimonySeries(accounts, transactions, investments, [
    addMonths(thisKey, -13),
    addMonths(thisKey, -1),
    thisKey,
  ]);
  const [yearAgo, last, current] = series;
  if (last?.total > 0) {
    const deltaM = (current.total - last.total) / Math.abs(last.total);
    insights.push({
      tone: deltaM >= 0 ? 'positive' : 'negative',
      icon: 'gem',
      text:
        deltaM >= 0
          ? `Seu patrimônio apresentou crescimento de ${formatPercent(deltaM)} neste mês.`
          : `Seu patrimônio recuou ${formatPercent(deltaM)} frente ao mês anterior.`,
    });
  }
  if (yearAgo?.total > 0) {
    const deltaY = (current.total - yearAgo.total) / Math.abs(yearAgo.total);
    insights.push({
      tone: deltaY >= 0 ? 'positive' : 'negative',
      icon: 'calendar-range',
      text: `Em 12 meses, seu patrimônio ${deltaY >= 0 ? 'cresceu' : 'caiu'} ${formatPercent(Math.abs(deltaY), { signed: false })}.`,
    });
  }

  // Rendimento dos investimentos
  const investedTotal = investments.reduce((s, i) => s + i.invested, 0);
  const currentTotal = investments.reduce((s, i) => s + i.current, 0);
  if (investedTotal > 0) {
    const yieldPct = (currentTotal - investedTotal) / investedTotal;
    insights.push({
      tone: yieldPct >= 0 ? 'positive' : 'negative',
      icon: 'line-chart',
      text: `Rendimento acumulado dos investimentos: ${formatPercent(yieldPct)} (${formatBRL(currentTotal - investedTotal, { signed: true })}).`,
    });
  }

  return insights;
}
