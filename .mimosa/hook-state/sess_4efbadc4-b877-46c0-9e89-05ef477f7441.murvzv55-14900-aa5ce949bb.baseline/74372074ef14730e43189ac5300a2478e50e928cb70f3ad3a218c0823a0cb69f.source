// Pesquisa global (Ctrl+K): entende texto, tipo, mês e valores
// ("mercado", "despesas acima de 500", "agosto", "netflix"…).

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, TrendingUp,
  Landmark, Plus, CornerDownLeft, Wallet, LayoutDashboard, BarChart3, Settings as SettingsIcon,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatBRL, formatDateShort, cx, parseAmount, MONTHS_LONG } from '../utils/format';
import { monthKey, currentMonthKey } from '../utils/dates';
import { sound } from '../services/sound';

const PALETTE_EVENT = 'finance:open-palette';
export const openPalette = () => window.dispatchEvent(new CustomEvent(PALETTE_EVENT));

function parseQuery(q) {
  let text = ` ${q} `;
  let min = null;
  let max = null;
  let type = null;

  const minMatch = text.match(/\s(?:acima de|maior(?:\s+que)?|superior(?:\s+a)?|>)\s*r?\$?\s*([\d.,]+)/i);
  if (minMatch) {
    min = parseAmount(minMatch[1]);
    text = text.replace(minMatch[0], ' ');
  }
  const maxMatch = text.match(/\s(?:abaixo de|menor(?:\s+que)?|inferior(?:\s+a)?|<)\s*r?\$?\s*([\d.,]+)/i);
  if (maxMatch) {
    max = parseAmount(maxMatch[1]);
    text = text.replace(maxMatch[0], ' ');
  }
  if (/\s(receitas?|entradas?)\s/i.test(text)) {
    type = 'receita';
    text = text.replace(/\s(receitas?|entradas?)\s/i, ' ');
  } else if (/\s(despesas?|gastos?|sa[ií]das?)\s/i.test(text)) {
    type = 'despesa';
    text = text.replace(/\s(despesas?|gastos?|sa[ií]das?)\s/i, ' ');
  } else if (/\s(investimentos?|aportes?)\s/i.test(text)) {
    type = 'investimento';
    text = text.replace(/\s(investimentos?|aportes?)\s/i, ' ');
  }

  let month = null;
  const lower = text.toLowerCase();
  for (let i = 0; i < 12; i++) {
    if (lower.includes(` ${MONTHS_LONG[i]}`)) {
      const year = new Date().getFullYear();
      let key = `${year}-${String(i + 1).padStart(2, '0')}`;
      if (key > currentMonthKey()) key = `${year - 1}-${String(i + 1).padStart(2, '0')}`;
      month = key;
      text = text.replace(new RegExp(monthsRegexSource(i), 'i'), ' ');
      break;
    }
  }

  return { text: text.replace(/\s+/g, ' ').trim(), min, max, type, month };
}

function monthsRegexSource(i) {
  return `\\s${MONTHS_LONG[i]}(\\s|o|a|s)?`;
}

const TYPE_ICON = {
  receita: ArrowUpRight,
  despesa: ArrowDownLeft,
  transferencia: ArrowLeftRight,
  investimento: TrendingUp,
};

export default function CommandPalette({ navigate, onAdd }) {
  const { transactions, accounts, investments, categories } = useFinance();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const onOpenEvent = () => {
      setOpen(true);
      setQ('');
      setActive(0);
    };
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        sound.open();
        onOpenEvent();
      }
    };
    window.addEventListener(PALETTE_EVENT, onOpenEvent);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(PALETTE_EVENT, onOpenEvent);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => setActive(0), [q]);

  const parsed = useMemo(() => parseQuery(q), [q]);

  const results = useMemo(() => {
    if (q.trim() === '') return [];
    const out = [];
    const text = parsed.text.toLowerCase();

    const matchesText = (...fields) => !text || fields.filter(Boolean).some((f) => f.toLowerCase().includes(text));

    for (const tx of transactions) {
      if (parsed.type && tx.type !== parsed.type) continue;
      if (parsed.month && monthKey(tx.date) !== parsed.month) continue;
      if (parsed.min !== null && (Number.isNaN(parsed.min) || tx.amount < parsed.min)) continue;
      if (parsed.max !== null && (Number.isNaN(parsed.max) || tx.amount > parsed.max)) continue;
      const cat = categories.find((c) => c.id === tx.categoryId)?.name;
      const acc = accounts.find((a) => a.id === tx.accountId)?.name;
      if (!matchesText(tx.name, cat, acc)) continue;
      out.push({
        kind: 'tx',
        id: `tx-${tx.id}`,
        icon: TYPE_ICON[tx.type] || ArrowDownLeft,
        title: tx.name || 'Sem descrição',
        sub: `${formatDateShort(tx.date)} · ${cat || acc || tx.type}`,
        value: tx.amount,
        receita: tx.type === 'receita',
        action: () =>
          navigate(
            `/transactions?q=${encodeURIComponent(text)}${parsed.month ? `&month=${parsed.month}` : ''}${parsed.type ? `&type=${parsed.type}` : ''}${parsed.min ? `&min=${parsed.min}` : ''}${parsed.max ? `&max=${parsed.max}` : ''}`
          ),
      });
      if (out.length >= 9) break;
    }

    for (const acc of accounts) {
      if (matchesText(acc.name, acc.institution)) {
        out.push({
          kind: 'account',
          id: `acc-${acc.id}`,
          icon: Landmark,
          title: acc.name,
          sub: `Conta · ${acc.institution}`,
          action: () => navigate('/accounts'),
        });
      }
    }
    for (const inv of investments) {
      if (matchesText(inv.name, inv.type, inv.institution)) {
        out.push({
          kind: 'inv',
          id: `inv-${inv.id}`,
          icon: TrendingUp,
          title: inv.name,
          sub: `Investimento · ${inv.type}`,
          action: () => navigate('/investments'),
        });
      }
    }

    // ações rápidas sempre relevantes
    const actions = [
      { id: 'act-rec', icon: Plus, title: 'Nova receita', sub: 'Ação rápida', action: () => onAdd('receita') },
      { id: 'act-desp', icon: Plus, title: 'Nova despesa', sub: 'Ação rápida', action: () => onAdd('despesa') },
      { id: 'act-inv', icon: Plus, title: 'Novo investimento', sub: 'Ação rápida', action: () => onAdd('investimento') },
      { id: 'nav-dash', icon: LayoutDashboard, title: 'Ir para Dashboard', sub: 'Navegação', action: () => navigate('/dashboard') },
      { id: 'nav-rep', icon: BarChart3, title: 'Ir para Relatórios', sub: 'Navegação', action: () => navigate('/reports') },
      { id: 'nav-set', icon: SettingsIcon, title: 'Ir para Configurações', sub: 'Navegação', action: () => navigate('/settings') },
    ].filter((a) => matchesText(a.title));

    return [...out, ...actions];
  }, [q, parsed, transactions, accounts, investments, categories, navigate, onAdd]);

  const run = (item) => {
    if (!item) return;
    sound.click();
    setOpen(false);
    item.action();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      run(results[active]);
    }
  };

  useEffect(() => {
    listRef.current?.querySelectorAll('.palette__item')[active]?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  return (
    <div className="palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Pesquisa global">
        <div className="palette__input-wrap">
          <Search size={17} aria-hidden />
          <input
            ref={inputRef}
            className="palette__input"
            placeholder="Pesquise transações, contas, “despesas acima de 500”, “agosto”…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Termo da pesquisa"
          />
          <kbd className="header__kbd">Esc</kbd>
        </div>

        {(parsed.min !== null || parsed.max !== null || parsed.type || parsed.month) && (
          <div className="palette__chips">
            {parsed.type && <span className="chip">{parsed.type}</span>}
            {parsed.month && <span className="chip">{parsed.month}</span>}
            {parsed.min !== null && !Number.isNaN(parsed.min) && <span className="chip">≥ {formatBRL(parsed.min)}</span>}
            {parsed.max !== null && !Number.isNaN(parsed.max) && <span className="chip">≤ {formatBRL(parsed.max)}</span>}
          </div>
        )}

        <ul className="palette__list" ref={listRef} role="listbox">
          {q.trim() === '' && (
            <li className="palette__hint">
              <Wallet size={16} aria-hidden />
              Digite para pesquisar em {transactions.length} transações, {accounts.length} contas e {investments.length} investimentos.
            </li>
          )}
          {q.trim() !== '' && results.length === 0 && (
            <li className="palette__hint">Nenhum resultado para “{q}”.</li>
          )}
          {results.map((r, i) => (
            <li key={r.id}>
              <button
                type="button"
                className={cx('palette__item', i === active && 'is-active')}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(r)}
              >
                <span className="palette__item-icon">
                  <r.icon size={15} aria-hidden />
                </span>
                <span className="palette__item-main">
                  <span className="palette__item-title">{r.title}</span>
                  <span className="palette__item-sub">{r.sub}</span>
                </span>
                {r.value !== undefined && (
                  <span className={cx('palette__item-value num', r.receita ? 'pos' : 'neg')}>
                    {r.receita ? '+' : '−'}
                    {formatBRL(r.value)}
                  </span>
                )}
                {i === active && (
                  <span className="palette__item-enter">
                    <CornerDownLeft size={13} aria-hidden />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
