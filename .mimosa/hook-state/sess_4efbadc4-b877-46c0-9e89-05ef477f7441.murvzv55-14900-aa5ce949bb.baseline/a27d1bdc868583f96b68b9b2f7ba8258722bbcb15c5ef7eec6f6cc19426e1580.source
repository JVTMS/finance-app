// Cartão premium de conta bancária com identidade visual própria (cor).

import { useCountUp } from '../hooks/useCountUp';
import { useTilt } from '../hooks/useTilt';
import { useSettings } from '../context/SettingsContext';
import { formatBRL, cx } from '../utils/format';
import { Landmark, Wallet, PiggyBank, Building2 } from 'lucide-react';

const TYPE_ICON = { conta: Landmark, carteira: Wallet, poupanca: PiggyBank, outro: Building2 };
const TYPE_LABEL = { conta: 'Conta corrente', carteira: 'Carteira', poupanca: 'Poupança', outro: 'Outro' };

export default function AccountCard({ account, balance, onClick, delay = 0 }) {
  const { performance: perfMode } = useSettings();
  const display = useCountUp(balance);
  const { ref, tiltHandlers } = useTilt({ enabled: !perfMode, max: 3.5 });
  const Icon = TYPE_ICON[account.type] || Landmark;

  return (
    <article
      ref={ref}
      {...tiltHandlers}
      className="account-card rise-in is-clickable"
      style={{ '--acc-color': account.color, animationDelay: `${delay}ms` }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Detalhes da conta ${account.name}, saldo ${formatBRL(balance)}`}
    >
      <span className="account-card__sheen" aria-hidden />
      <header className="account-card__head">
        <span className="account-card__icon">
          <Icon size={16} aria-hidden />
        </span>
        <div>
          <h3 className="account-card__name">{account.name}</h3>
          <p className="account-card__inst">{account.institution || TYPE_LABEL[account.type]}</p>
        </div>
      </header>
      <strong className={cx('account-card__balance num')}>{formatBRL(display)}</strong>
      <footer className="account-card__foot">
        <span className="account-card__type">{TYPE_LABEL[account.type] || 'Conta'}</span>
        <span className="account-card__cta">Ver detalhes →</span>
      </footer>
    </article>
  );
}
