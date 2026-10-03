// Modal de nova transação: Receita, Despesa, Transferência ou Investimento.

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, TrendingUp } from 'lucide-react';
import Modal from './ui/Modal';
import Field from './ui/Field';
import Dropdown from './ui/Dropdown';
import AmountInput from './ui/AmountInput';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as api from '../api/api';
import { accountBalance } from '../services/finance';
import { formatBRL, todayISO, cx } from '../utils/format';
import { INVESTMENT_TYPES } from '../data/categories';
import { sound } from '../services/sound';

const TYPES = [
  { id: 'receita', label: 'Receita', icon: ArrowUpRight },
  { id: 'despesa', label: 'Despesa', icon: ArrowDownLeft },
  { id: 'transferencia', label: 'Transferência', icon: ArrowLeftRight },
  { id: 'investimento', label: 'Investimento', icon: TrendingUp },
];

const BLANK = {
  name: '',
  amount: null,
  date: todayISO(),
  categoryId: null,
  accountId: null,
  toAccountId: null,
  description: '',
  investChoice: 'novo',
  invName: '',
  invType: 'CDB',
  invInstitution: '',
  invNote: '',
};

export default function TransactionModal({ open, onClose, initialType = 'receita' }) {
  const { user } = useAuth();
  const { accounts, categories, investments, transactions, reload } = useFinance();
  const { push } = useToast();

  const [type, setType] = useState(initialType);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setType(initialType);
      setErrors({});
      setForm({ ...BLANK, date: todayISO() });
    }
  }, [open, initialType]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const categoryOptions = useMemo(() => {
    const kind = type === 'receita' ? 'receita' : 'despesa';
    return categories.filter((c) => c.kind === kind).map((c) => ({ value: c.id, label: c.name }));
  }, [categories, type]);

  const accountOptions = useMemo(
    () => accounts.map((a) => ({ value: a.id, label: a.name })),
    [accounts]
  );

  const toAccountOptions = useMemo(
    () => accounts.filter((a) => a.id !== form.accountId).map((a) => ({ value: a.id, label: a.name })),
    [accounts, form.accountId]
  );

  const investmentOptions = useMemo(
    () => [
      { value: 'novo', label: '➕ Novo investimento' },
      ...investments.map((i) => ({ value: i.id, label: `${i.name} · ${i.type}` })),
    ],
    [investments]
  );

  // categoria padrão ao abrir o modal ou trocar o tipo
  useEffect(() => {
    if (!open) return;
    if (type === 'receita' || type === 'despesa') {
      setForm((f) =>
        categoryOptions.some((c) => c.value === f.categoryId)
          ? f
          : { ...f, categoryId: categoryOptions[0]?.value ?? null }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type, categoryOptions]);

  useEffect(() => {
    if (!form.accountId && accountOptions.length) set('accountId', accountOptions[0].value);
    if (form.toAccountId === form.accountId) set('toAccountId', null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountOptions.length, form.accountId]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Dê um nome a esta movimentação.';
    if (form.amount === null || Number.isNaN(form.amount) || form.amount <= 0) e.amount = 'Informe um valor maior que zero.';
    if (!form.date) e.date = 'Selecione a data.';
    if (!form.accountId) e.accountId = 'Selecione a conta.';
    if (type === 'transferencia' && !form.toAccountId) e.toAccountId = 'Selecione a conta de destino.';
    if (type === 'investimento' && form.investChoice === 'novo' && !form.invName.trim()) e.invName = 'Nome do investimento.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) {
      sound.warn();
      return;
    }
    const payload = {
      type,
      name: form.name,
      amount: form.amount,
      date: form.date,
      categoryId: type === 'receita' || type === 'despesa' ? form.categoryId : null,
      accountId: form.accountId,
      toAccountId: type === 'transferencia' ? form.toAccountId : null,
      description: form.description,
    };
    if (type === 'investimento') {
      if (form.investChoice === 'novo') {
        payload.investment = {
          name: form.invName,
          type: form.invType,
          institution: form.invInstitution,
          note: form.invNote,
        };
      } else {
        payload.investmentId = form.investChoice;
      }
    }

    try {
      await api.addTransaction(user.id, payload);
      await reload();

      const valueLabel = formatBRL(form.amount);
      if (type === 'receita') {
        push({ type: 'success', title: 'Receita adicionada', message: `${form.name} · ${valueLabel}`, sound: 'success' });
      } else if (type === 'despesa') {
        push({ type: 'success', title: 'Despesa registrada', message: `${form.name} · ${valueLabel}`, sound: 'expense' });
        const acc = accounts.find((a) => a.id === form.accountId);
        const remaining = acc ? accountBalance(acc, transactions) - form.amount : null;
        if (remaining !== null && remaining < 200) {
          push({
            type: 'warn',
            title: 'Saldo baixo',
            message: `${acc.name} ficará com ${formatBRL(remaining)}.`,
            sound: 'warn',
            duration: 4500,
          });
        }
      } else if (type === 'transferencia') {
        push({ type: 'success', title: 'Transferência registrada', message: `${valueLabel} movimentado entre contas.`, sound: 'success' });
      } else {
        push({ type: 'success', title: 'Investimento registrado', message: `${form.invName || 'Aporte'} · ${valueLabel}`, sound: 'success' });
      }

      onClose();
    } catch (e) {
      push({ type: 'error', title: 'Não foi possível registrar', message: e.message, sound: 'warn', record: false });
    }
  };

  if (!accounts.length) {
    return (
      <Modal open={open} onClose={onClose} title="Nova transação" subtitle="Cadastre uma conta primeiro">
        <p className="modal-note">
          Você ainda não possui contas bancárias cadastradas. Crie uma conta em
          <strong> Minhas Contas </strong> para começar a registrar movimentações.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova transação"
      subtitle="O saldo e os gráficos atualizam em tempo real."
      size="lg"
    >
      <form className="tx-form" onSubmit={submit} noValidate>
        <div className="tx-form__types" role="tablist" aria-label="Tipo de transação">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={type === t.id}
              className={cx('tx-form__type', type === t.id && 'is-active', `tx-form__type--${t.id}`)}
              onClick={() => {
                sound.click();
                setType(t.id);
              }}
            >
              <t.icon size={15} aria-hidden />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="tx-form__grid">
          <Field label="Nome" htmlFor="tx-name" error={errors.name}>
            <input
              id="tx-name"
              type="text"
              className={cx('input', errors.name && 'is-invalid')}
              placeholder={type === 'receita' ? 'Ex.: Salário de outubro' : type === 'despesa' ? 'Ex.: Mercado' : type === 'transferencia' ? 'Ex.: Cobrir aluguel' : 'Ex.: Aporte mensal'}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              autoFocus
            />
          </Field>

          <Field label="Valor" error={errors.amount}>
            <AmountInput value={form.amount} onChange={(v) => set('amount', v)} invalid={!!errors.amount} autoFocus={false} />
          </Field>

          <Field label="Data" htmlFor="tx-date" error={errors.date}>
            <input
              id="tx-date"
              type="date"
              className={cx('input', errors.date && 'is-invalid')}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </Field>

          {(type === 'receita' || type === 'despesa') && (
            <Field label="Categoria">
              <Dropdown
                value={form.categoryId}
                onChange={(v) => set('categoryId', v)}
                options={categoryOptions}
                ariaLabel="Categoria"
              />
            </Field>
          )}

          <Field label={type === 'transferencia' ? 'Conta de origem' : 'Conta'} error={errors.accountId}>
            <Dropdown
              value={form.accountId}
              onChange={(v) => set('accountId', v)}
              options={accountOptions}
              ariaLabel="Conta"
            />
          </Field>

          {type === 'transferencia' && (
            <Field label="Conta de destino" error={errors.toAccountId}>
              <Dropdown
                value={form.toAccountId}
                onChange={(v) => set('toAccountId', v)}
                options={toAccountOptions}
                placeholder="Selecione o destino"
                ariaLabel="Conta de destino"
              />
            </Field>
          )}

          {type === 'investimento' && (
            <>
              <Field label="Investimento">
                <Dropdown
                  value={form.investChoice}
                  onChange={(v) => set('investChoice', v)}
                  options={investmentOptions}
                  ariaLabel="Investimento"
                />
              </Field>
              {form.investChoice === 'novo' && (
                <>
                  <Field label="Nome do investimento" htmlFor="inv-name" error={errors.invName}>
                    <input
                      id="inv-name"
                      type="text"
                      className={cx('input', errors.invName && 'is-invalid')}
                      placeholder="Ex.: CDB Banco Inter"
                      value={form.invName}
                      onChange={(e) => set('invName', e.target.value)}
                    />
                  </Field>
                  <Field label="Tipo">
                    <Dropdown
                      value={form.invType}
                      onChange={(v) => set('invType', v)}
                      options={INVESTMENT_TYPES.map((t) => ({ value: t.id, label: t.name }))}
                      ariaLabel="Tipo de investimento"
                    />
                  </Field>
                  <Field label="Instituição" htmlFor="inv-inst">
                    <input
                      id="inv-inst"
                      type="text"
                      className="input"
                      placeholder="Ex.: XP Investimentos"
                      value={form.invInstitution}
                      onChange={(e) => set('invInstitution', e.target.value)}
                    />
                  </Field>
                  <Field label="Observação" htmlFor="inv-note" className="tx-form__wide">
                    <input
                      id="inv-note"
                      type="text"
                      className="input"
                      placeholder="Ex.: 115% do CDI, vencimento 2029"
                      value={form.invNote}
                      onChange={(e) => set('invNote', e.target.value)}
                    />
                  </Field>
                </>
              )}
            </>
          )}

          <Field label="Descrição (opcional)" htmlFor="tx-desc" className="tx-form__wide">
            <input
              id="tx-desc"
              type="text"
              className="input"
              placeholder="Detalhes adicionais"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
        </div>

        <footer className="tx-form__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className={`btn btn--primary tx-form__submit tx-form__submit--${type}`}>
            {type === 'receita' ? 'Registrar receita' : type === 'despesa' ? 'Registrar despesa' : type === 'transferencia' ? 'Transferir' : 'Investir'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
