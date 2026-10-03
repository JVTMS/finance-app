// Card de investimento individual: rendimento, sparkline e atualização de valor.

import { useState } from 'react';
import { TrendingUp, RefreshCw, Trash2 } from 'lucide-react';
import Modal from './ui/Modal';
import Field from './ui/Field';
import AmountInput from './ui/AmountInput';
import Sparkline from './charts/Sparkline';
import * as api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useToast } from '../context/ToastContext';
import { formatBRL, formatPercent, cx } from '../utils/format';
import { sound } from '../services/sound';

export default function InvestmentCard({ investment, delay = 0 }) {
  const { user } = useAuth();
  const { reload } = useFinance();
  const { push } = useToast();
  const [updateOpen, setUpdateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newValue, setNewValue] = useState(null);
  const [error, setError] = useState('');

  const rendimento = investment.current - investment.invested;
  const rendPct = investment.invested > 0 ? rendimento / investment.invested : 0;
  const historyValues = (investment.history || []).map((h) => h.value);

  const saveNewValue = async (e) => {
    e.preventDefault();
    if (newValue === null || newValue < 0) {
      setError('Informe o valor atual do investimento.');
      return;
    }
    await api.updateInvestmentValue(user.id, investment.id, newValue);
    await reload();
    push({
      type: 'success',
      title: 'Investimento atualizado',
      message: `${investment.name} · ${formatBRL(newValue)}`,
      sound: 'success',
    });
    setUpdateOpen(false);
  };

  const doDelete = async () => {
    await api.deleteInvestment(user.id, investment.id);
    await reload();
    push({ type: 'info', title: 'Investimento removido', message: investment.name, sound: 'click' });
  };

  return (
    <article className="investment-card rise-in" style={{ '--inv-color': undefined, animationDelay: `${delay}ms` }}>
      <header className="investment-card__head">
        <span className="investment-card__icon">
          <TrendingUp size={16} aria-hidden />
        </span>
        <div className="investment-card__titles">
          <h3 className="investment-card__name">{investment.name}</h3>
          <p className="investment-card__meta">
            <span className="investment-card__type">{investment.type}</span>
            {investment.institution ? ` · ${investment.institution}` : ''}
          </p>
        </div>
      </header>

      <div className="investment-card__numbers">
        <div>
          <span className="investment-card__label">Investido</span>
          <strong className="num">{formatBRL(investment.invested)}</strong>
        </div>
        <div>
          <span className="investment-card__label">Valor atual</span>
          <strong className="num investment-card__current">{formatBRL(investment.current)}</strong>
        </div>
        <div>
          <span className="investment-card__label">Rendimento</span>
          <strong className={cx('num', rendimento >= 0 ? 'pos' : 'neg')}>
            {formatBRL(rendimento, { signed: true })}
            <small> ({formatPercent(rendPct)})</small>
          </strong>
        </div>
      </div>

      {historyValues.length > 1 && (
        <div className="investment-card__spark">
          <Sparkline values={historyValues} id={`inv-${investment.id}`} width={240} height={44} />
        </div>
      )}

      <footer className="investment-card__actions">
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => {
            sound.open();
            setNewValue(investment.current);
            setError('');
            setUpdateOpen(true);
          }}
        >
          <RefreshCw size={13} aria-hidden /> Atualizar valor
        </button>
        <button
          className="btn btn--danger-ghost btn--sm"
          onClick={() => {
            sound.click();
            setConfirmDelete(true);
          }}
        >
          <Trash2 size={13} aria-hidden /> Remover
        </button>
      </footer>

      <Modal open={updateOpen} onClose={() => setUpdateOpen(false)} title="Atualizar valor" subtitle={investment.name} size="sm">
        <form className="stack-form" onSubmit={saveNewValue} noValidate>
          <Field label="Valor atual do investimento" error={error}>
            <AmountInput value={newValue} onChange={setNewValue} autoFocus invalid={!!error} />
          </Field>
          <p className="modal-note">
            Investido até agora: <strong className="num">{formatBRL(investment.invested)}</strong>.
            A diferença será registrada como rendimento.
          </p>
          <footer className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setUpdateOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary">
              Salvar
            </button>
          </footer>
        </form>
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Remover investimento?" subtitle={investment.name} size="sm">
        <p className="modal-note">
          O histórico de aportes permanece nas transações, mas o investimento deixa de compor seu patrimônio.
        </p>
        <footer className="form-actions">
          <button className="btn btn--ghost" onClick={() => setConfirmDelete(false)}>
            Manter
          </button>
          <button className="btn btn--danger" onClick={doDelete}>
            Remover
          </button>
        </footer>
      </Modal>
    </article>
  );
}
