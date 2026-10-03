// Timeline financeira agrupada por dia, com microanimação de entrada.

import { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, TrendingUp } from 'lucide-react';
import CategoryIcon from './ui/CategoryIcon';
import { formatBRL, relativeDayLabel, cx } from '../utils/format';
import { sound } from '../services/sound';

const TYPE_META = {
  receita: { icon: ArrowUpRight, cls: 'in' },
  despesa: { icon: ArrowDownLeft, cls: 'out' },
  transferencia: { icon: ArrowLeftRight, cls: 'tr' },
  investimento: { icon: TrendingUp, cls: 'inv' },
};

export function TransactionRow({ tx, categories, accounts, onDelete, delay = 0, compact = false }) {
  const cat = categories.find((c) => c.id === tx.categoryId);
  const account = accounts.find((a) => a.id === tx.accountId);
  const toAccount = accounts.find((a) => a.id === tx.toAccountId);
  const meta = TYPE_META[tx.type] || TYPE_META.despesa;
  const Icon = meta.icon;

  return (
    <li className={cx('tx-row', `tx-row--${meta.cls}`, 'fade-in-up')} style={{ animationDelay: `${delay}ms` }}>
      <span className="tx-row__icon" style={{ '--cat-color': cat?.color || 'var(--text-faint)' }}>
        {cat ? <CategoryIcon name={cat.icon} size={15} color={cat.color} /> : <Icon size={15} aria-hidden />}
      </span>
      <div className="tx-row__main">
        <span className="tx-row__name">{tx.name || 'Sem descrição'}</span>
        <span className="tx-row__meta">
          {cat?.name || (tx.type === 'transferencia' ? 'Transferência' : tx.type === 'investimento' ? 'Investimento' : 'Sem categoria')}
          {!compact && account ? ` · ${account.name}${toAccount ? ` → ${toAccount.name}` : ''}` : ''}
        </span>
      </div>
      <div className="tx-row__side">
        <strong className={cx('tx-row__amount num', tx.type === 'receita' ? 'pos' : tx.type === 'despesa' ? 'neg' : '')}>
          {tx.type === 'receita' ? '+' : tx.type === 'despesa' ? '−' : ''}
          {formatBRL(tx.amount)}
        </strong>
        {onDelete && (
          <button
            className="tx-row__delete icon-btn"
            aria-label={`Excluir ${tx.name || 'transação'}`}
            title="Excluir"
            onClick={(e) => {
              e.stopPropagation();
              sound.click();
              onDelete(tx);
            }}
          >
            ×
          </button>
        )}
      </div>
    </li>
  );
}

export default function TransactionList({ transactions, categories, accounts, onDelete, emptyState, limit }) {
  const groups = useMemo(() => {
    const list = limit ? transactions.slice(0, limit) : transactions;
    const map = new Map();
    for (const tx of list) {
      if (!map.has(tx.date)) map.set(tx.date, []);
      map.get(tx.date).push(tx);
    }
    return [...map.entries()];
  }, [transactions, limit]);

  if (!transactions.length && emptyState) return emptyState;

  let i = 0;
  return (
    <div className="tx-timeline">
      {groups.map(([date, items]) => (
        <section key={date} className="tx-day">
          <h4 className="tx-day__label fade-in">{relativeDayLabel(date)}</h4>
          <ul className="tx-day__list">
            {items.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                categories={categories}
                accounts={accounts}
                onDelete={onDelete}
                delay={Math.min(i++ * 40, 400)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
