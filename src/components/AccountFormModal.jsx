// Criação/edição de conta bancária.

import { useEffect, useState } from 'react';
import Modal from './ui/Modal';
import Field from './ui/Field';
import Dropdown from './ui/Dropdown';
import AmountInput from './ui/AmountInput';
import * as api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useToast } from '../context/ToastContext';
import { cx } from '../utils/format';

const TYPES = [
  { value: 'conta', label: 'Conta corrente' },
  { value: 'poupanca', label: 'Poupança' },
  { value: 'carteira', label: 'Carteira (dinheiro)' },
  { value: 'outro', label: 'Outro' },
];

const COLORS = ['#8b5cf6', '#f97316', '#38bdf8', '#34d399', '#f472b6', '#94a3b8', '#d4af37', '#ef4444'];

export default function AccountFormModal({ open, onClose, editing }) {
  const { user } = useAuth();
  const { reload } = useFinance();
  const { push } = useToast();
  const [form, setForm] = useState({ name: '', institution: '', type: 'conta', color: COLORS[0], initialBalance: null });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(
        editing
          ? {
              name: editing.name,
              institution: editing.institution || '',
              type: editing.type,
              color: editing.color,
              initialBalance: editing.initialBalance,
            }
          : { name: '', institution: '', type: 'conta', color: COLORS[0], initialBalance: null }
      );
    }
  }, [open, editing]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Dê um nome à conta.';
    if (form.initialBalance === null) errs.initialBalance = 'Informe o saldo atual (pode ser 0).';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      if (editing) {
        await api.updateAccount(user.id, editing.id, { ...form, name: form.name.trim() });
        push({ type: 'success', title: 'Conta atualizada', message: form.name, sound: 'success' });
      } else {
        await api.addAccount(user.id, form);
        push({ type: 'success', title: 'Conta adicionada', message: form.name, sound: 'success' });
      }
      await reload();
      onClose();
    } catch (err) {
      push({ type: 'error', title: 'Não foi possível salvar a conta', message: err.message, sound: 'warn', record: false });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar conta' : 'Nova conta'} subtitle="Contas aparecem como cartões em Minhas Contas." size="md">
      <form className="form-grid" onSubmit={submit} noValidate>
        <Field label="Nome" htmlFor="acc-name" error={errors.name}>
          <input
            id="acc-name"
            className={cx('input', errors.name && 'is-invalid')}
            type="text"
            placeholder="Ex.: Nubank"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Instituição" htmlFor="acc-inst">
          <input
            id="acc-inst"
            className="input"
            type="text"
            placeholder="Ex.: Nubank / Itaú / Dinheiro físico"
            value={form.institution}
            onChange={(e) => set('institution', e.target.value)}
          />
        </Field>
        <Field label="Tipo">
          <Dropdown value={form.type} onChange={(v) => set('type', v)} options={TYPES} ariaLabel="Tipo de conta" />
        </Field>
        <Field label={editing ? 'Saldo inicial' : 'Saldo atual'} error={errors.initialBalance} hint="Movimentações futuras serão somadas a este valor.">
          <AmountInput value={form.initialBalance} onChange={(v) => set('initialBalance', v)} invalid={!!errors.initialBalance} />
        </Field>
        <Field label="Cor da conta" className="form-grid__wide">
          <div className="color-swatches" role="radiogroup" aria-label="Cor da conta">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={form.color === c}
                aria-label={`Cor ${c}`}
                className={cx('color-swatch', form.color === c && 'is-selected')}
                style={{ '--sw': c }}
                onClick={() => set('color', c)}
              />
            ))}
          </div>
        </Field>
        <footer className="form-actions form-grid__wide">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary">
            {editing ? 'Salvar alterações' : 'Adicionar conta'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
