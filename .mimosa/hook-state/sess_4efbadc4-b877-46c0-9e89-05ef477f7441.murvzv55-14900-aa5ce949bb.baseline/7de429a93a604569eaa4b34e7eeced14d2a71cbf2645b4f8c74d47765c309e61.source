// Minhas Contas: cartões premium por conta, detalhes e cadastro.

import { useMemo, useState } from 'react';
import { Landmark, Plus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { accountBalance } from '../services/finance';
import * as api from '../api/api';
import AccountCard from '../components/AccountCard';
import AccountDetailModal from '../components/AccountDetailModal';
import AccountFormModal from '../components/AccountFormModal';
import EmptyState from '../components/ui/EmptyState';
import { formatBRL } from '../utils/format';

export default function Accounts() {
  const { user } = useAuth();
  const { accounts, transactions, reload } = useFinance();
  const { push } = useToast();
  const [detail, setDetail] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const total = useMemo(
    () => accounts.reduce((s, acc) => s + accountBalance(acc, transactions), 0),
    [accounts, transactions]
  );

  const deleteAccount = (acc) => api.deleteAccount(user.id, acc.id);

  return (
    <div className="page page--accounts">
      <header className="section-head-row rise-in">
        <div>
          <h2 className="section-title">
            <Landmark size={16} aria-hidden /> MINHAS CONTAS
          </h2>
          <p className="section-sub">
            Saldo consolidado: <strong className="num">{formatBRL(total)}</strong>
          </p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={15} aria-hidden /> Nova conta
        </button>
      </header>

      {accounts.length ? (
        <div className="accounts-grid">
          {accounts.map((acc, i) => (
            <AccountCard
              key={acc.id}
              account={acc}
              balance={accountBalance(acc, transactions)}
              delay={i * 70}
              onClick={() => setDetail(acc)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Landmark}
          title="Nenhuma conta cadastrada"
          message="Adicione suas contas bancárias, carteiras e poupanças para acompanhar tudo em um só lugar."
          action={
            <button
              className="btn btn--primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus size={15} aria-hidden /> Adicionar conta
            </button>
          }
        />
      )}

      <AccountDetailModal
        account={detail}
        onClose={() => setDetail(null)}
        onDelete={deleteAccount}
        onEdit={(acc) => {
          setEditing(acc);
          setFormOpen(true);
        }}
      />

      <AccountFormModal
        open={formOpen}
        editing={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
