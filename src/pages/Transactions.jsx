// Transações: timeline completa com pesquisa, filtros modernos e exportação.

import { useEffect, useMemo, useState } from 'react';
import { Search, Download, SlidersHorizontal, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useHashRoute } from '../hooks/useHashRoute';
import * as api from '../api/api';
import { exportCSV } from '../services/export';
import TransactionList from '../components/TransactionList';
import EmptyState from '../components/ui/EmptyState';
import Dropdown from '../components/ui/Dropdown';
import { ReceiptText } from 'lucide-react';
import { formatBRL, cx, parseAmount, monthLabel } from '../utils/format';
import { monthKey, currentMonthKey, addMonths, monthRange } from '../utils/dates';

const TYPE_OPTIONS = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'receita', label: 'Receitas' },
  { value: 'despesa', label: 'Despesas' },
  { value: 'transferencia', label: 'Transferências' },
  { value: 'investimento', label: 'Investimentos' },
];

const VALUE_OPTIONS = [
  { value: 'todos', label: 'Qualquer valor' },
  { value: 'gte500', label: 'Acima de R$ 500' },
  { value: 'gte100', label: 'Acima de R$ 100' },
  { value: 'lte100', label: 'Até R$ 100' },
];

export default function Transactions() {
  const { user } = useAuth();
  const { transactions, categories, accounts, reload } = useFinance();
  const { push } = useToast();
  const { query } = useHashRoute();

  const [q, setQ] = useState(query.q || '');
  const [type, setType] = useState(query.type || 'todos');
  const [categoryId, setCategoryId] = useState('todas');
  const [accountId, setAccountId] = useState('todas');
  const [month, setMonth] = useState(query.month || 'todos');
  const [valueRange, setValueRange] = useState('todos');
  const [minMax, setMinMax] = useState({ min: query.min || '', max: query.max || '' });

  const monthOptions = useMemo(() => {
    const keys = monthRange(addMonths(currentMonthKey(), -17), currentMonthKey());
    const used = new Set(transactions.map((t) => monthKey(t.date)));
    return [
      { value: 'todos', label: 'Todo o período' },
      ...keys.filter((k) => used.has(k)).map((k) => ({ value: k, label: monthLabel(k) })),
    ];
  }, [transactions]);

  const categoryOptions = useMemo(
    () => [{ value: 'todas', label: 'Todas as categorias' }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
    [categories]
  );
  const accountOptions = useMemo(
    () => [{ value: 'todas', label: 'Todas as contas' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))],
    [accounts]
  );

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    const min = minMax.min !== '' ? parseAmount(String(minMax.min)) : valueRange === 'gte500' ? 500 : valueRange === 'gte100' ? 100 : null;
    const max = minMax.max !== '' ? parseAmount(String(minMax.max)) : valueRange === 'lte100' ? 100 : null;
    return transactions.filter((tx) => {
      if (type !== 'todos' && tx.type !== type) return false;
      if (categoryId !== 'todas' && tx.categoryId !== categoryId) return false;
      if (accountId !== 'todas' && tx.accountId !== accountId && tx.toAccountId !== accountId) return false;
      if (month !== 'todos' && monthKey(tx.date) !== month) return false;
      if (min !== null && !Number.isNaN(min) && tx.amount < min) return false;
      if (max !== null && !Number.isNaN(max) && tx.amount > max) return false;
      if (text) {
        const cat = categories.find((c) => c.id === tx.categoryId)?.name || '';
        const acc = accounts.find((a) => a.id === tx.accountId)?.name || '';
        const hay = `${tx.name} ${cat} ${acc} ${tx.description}`.toLowerCase();
        if (!hay.includes(text)) return false;
      }
      return true;
    });
  }, [transactions, q, type, categoryId, accountId, month, valueRange, minMax, categories, accounts]);

  const totals = useMemo(() => {
    let rec = 0;
    let desp = 0;
    for (const tx of filtered) {
      if (tx.type === 'receita') rec += tx.amount;
      else if (tx.type === 'despesa') desp += tx.amount;
    }
    return { rec, desp };
  }, [filtered]);

  const hasFilters =
    q.trim() !== '' || type !== 'todos' || categoryId !== 'todas' || accountId !== 'todas' || month !== 'todos' || valueRange !== 'todos' || minMax.min !== '' || minMax.max !== '';

  const clearFilters = () => {
    setQ('');
    setType('todos');
    setCategoryId('todas');
    setAccountId('todas');
    setMonth('todos');
    setValueRange('todos');
    setMinMax({ min: '', max: '' });
  };

  const removeTx = (tx) => {
    api.deleteTransaction(user.id, tx.id);
    reload();
    push({ type: 'info', title: 'Transação excluída', message: tx.name, sound: 'click' });
  };

  const exportFiltered = () => {
    if (!filtered.length) {
      push({ type: 'warn', title: 'Nada para exportar', sound: 'warn' });
      return;
    }
    const rows = filtered.map((tx) => ({
      Data: tx.date,
      Tipo: tx.type,
      Nome: tx.name,
      Categoria: categories.find((c) => c.id === tx.categoryId)?.name || '',
      Conta: accounts.find((a) => a.id === tx.accountId)?.name || '',
      Valor: tx.amount.toFixed(2).replace('.', ','),
      Descricao: tx.description,
    }));
    exportCSV('transacoes-finance.csv', rows);
    push({ type: 'success', title: 'CSV exportado', message: `${rows.length} transações.`, sound: 'success' });
  };

  return (
    <div className="page page--transactions">
      <div className="filter-bar rise-in" role="region" aria-label="Filtros de transações">
        <div className="filter-bar__search">
          <Search size={15} aria-hidden />
          <input
            type="search"
            placeholder="Pesquisar em transações…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Pesquisar transações"
          />
        </div>
        <div className="filter-bar__dropdowns">
          <Dropdown value={month} onChange={setMonth} options={monthOptions} ariaLabel="Filtrar por período" />
          <Dropdown value={type} onChange={setType} options={TYPE_OPTIONS} ariaLabel="Filtrar por tipo" />
          <Dropdown value={categoryId} onChange={setCategoryId} options={categoryOptions} ariaLabel="Filtrar por categoria" />
          <Dropdown value={accountId} onChange={setAccountId} options={accountOptions} ariaLabel="Filtrar por conta" />
          <Dropdown value={valueRange} onChange={setValueRange} options={VALUE_OPTIONS} ariaLabel="Filtrar por valor" />
        </div>
        <div className="filter-bar__amounts">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Mín. R$"
            value={minMax.min}
            onChange={(e) => setMinMax((s) => ({ ...s, min: e.target.value }))}
            aria-label="Valor mínimo"
            className="input input--sm"
          />
          <input
            type="text"
            inputMode="decimal"
            placeholder="Máx. R$"
            value={minMax.max}
            onChange={(e) => setMinMax((s) => ({ ...s, max: e.target.value }))}
            aria-label="Valor máximo"
            className="input input--sm"
          />
        </div>
        <div className="filter-bar__actions">
          {hasFilters && (
            <button className="btn btn--ghost btn--sm" onClick={clearFilters}>
              <X size={13} aria-hidden /> Limpar
            </button>
          )}
          <button className="btn btn--ghost btn--sm" onClick={exportFiltered}>
            <Download size={13} aria-hidden /> CSV
          </button>
        </div>
      </div>

      <div className={cx('tx-summary', 'rise-in')}>
        <span className="tx-summary__count num">{filtered.length} resultado{filtered.length === 1 ? '' : 's'}</span>
        <span className="tx-summary__in pos num">+{formatBRL(totals.rec)}</span>
        <span className="tx-summary__out neg num">−{formatBRL(totals.desp)}</span>
      </div>

      <TransactionList
        transactions={filtered}
        categories={categories}
        accounts={accounts}
        onDelete={removeTx}
        emptyState={
          hasFilters ? (
            <EmptyState
              icon={SlidersHorizontal}
              title="Nenhuma transação encontrada"
              message="Ajuste os filtros ou limpe a pesquisa para ver mais resultados."
              action={
                <button className="btn btn--ghost btn--sm" onClick={clearFilters}>
                  Limpar filtros
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={ReceiptText}
              title="Sem transações ainda"
              message='Use o botão "+" para registrar receitas, despesas, transferências ou investimentos.'
            />
          )
        }
      />
    </div>
  );
}
