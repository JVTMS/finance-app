// Entrada de valor em BRL: digita-se números e a formatação acontece em tempo real.

import { useMemo } from 'react';
import { cx } from '../../utils/format';

const fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AmountInput({ value, onChange, id, placeholder = '0,00', autoFocus, invalid, ariaLabel = 'Valor' }) {
  const display = useMemo(() => (value ? fmt.format(value) : ''), [value]);

  const handle = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 11);
    const cents = Number(digits || 0);
    onChange(digits === '' ? null : cents / 100);
  };

  return (
    <div className={cx('amount-input', invalid && 'is-invalid')}>
      <span className="amount-input__currency" aria-hidden>
        R$
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={display}
        onChange={(e) => handle(e.target.value)}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        className="amount-input__field"
      />
    </div>
  );
}
