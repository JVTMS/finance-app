// Detalhes da conta: saldo, fluxo do mês e últimas movimentações.

import { useMemo } from 'react';
import Modal from './ui/Modal';
import TransactionList from './TransactionList';
import { accountBalance, flowTotals } from '../services/finance';
import { formatBRL } from '../utils/format';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as api from '../api/api';
import { currentMonthKey } from '../utils/dates';

export default function AccountDetailModal({ account, onClose, onDelete, onEdit }) {
  const { user } = useAuth();
  const { transactions, categories, accounts, reload } = useFinance();
  const { push } = useToast();

  const data = useMemo(() => {
    if (!account) return null;
    const accTxs = transactions.filter((t) => t.accountId === account.id || t.toAccountId === account.id);
    const balance = accountBalance(account, transactions);
    const mk = currentMonthKey();
    const from = `${mk}-01`;
    let entradas = 0;
    let saidas = 0;
    for (const tx of accTxs) {
      if (tx.date < from) continue;
      if (tx.accountId === account.id) {
        if (tx.type === 'receita') entradas += tx.amount;
        else saidas += tx.amount;
      }
      if (tx.toAccountId === account.id) entradas += tx.amount;
    }
    const recent = accTxs.slice(0, 8);
    return { accTxs, balance, entradas, saidas, recent };
  }, [account, transactions]);

  if (!account || !data) return null;

  const removeTx = async (tx) => {
    await api.deleteTransaction(user.id, tx.id);
    await reload();
    push({ type: 'info', title: 'Transação excluída', message: tx.name, sound: 'click' });
  };

  return (
    <Modal open onClose={onClose} title={account.name} subtitle={account.institution} size="md">
      <div className="acct-detail">
        <div className="acct-detail__balance">
          <span>Saldo atual</span>
          <strong className="num">{formatBRL(data.balance)}</strong>
          <small>Saldo inicial: {formatBRL(account.initialBalance || 0)}</small>
        </div>
        <div className="acct-detail__kpis">
          <div className="kpi kpi--pos">
            <span className="kpi__label">Entradas (mês)</span>
            <span className="kpi__value num">+{formatBRL(data.entradas)}</span>
          </div>
          <div className="kpi kpi--neg">
            <span className="kpi__label">Saídas (mês)</span>
            <span className="kpi__value num">−{formatBRL(data.saidas)}</span>
          </div>
        </div>

        <h4 className="acct-detail__subtitle">Últimas movimentações</h4>
        {data.recent.length ? (
          <TransactionList
            transactions={data.recent}
            categories={categories}
            accounts={accounts}
            onDelete={removeTx}
          />
        ) : (
          <p className="acct-detail__empty">Nenhuma movimentação nesta conta ainda.</p>
        )}

        <div className="acct-detail__actions">
          {onEdit && (
            <button
              className="btn btn--ghost"
              onClick={() => {
                onClose();
                onEdit(account);
              }}
            >
              Editar conta
            </button>
          )}
          {onDelete && (
            <button
              className="btn btn--danger-ghost acct-detail__delete"
              onClick={async () => {
                const res = await onDelete(account);
                if (res?.error) {
                  push({ type: 'warn', title: 'Não foi possível excluir', message: res.error, sound: 'warn' });
                } else {
                  await reload();
                  push({ type: 'info', title: 'Conta excluída', message: account.name, sound: 'click' });
                  onClose();
                }
              }}
            >
              Excluir conta
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
