// Botão flutuante principal: expande no hover/foco revelando os 4 tipos.

import { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { cx } from '../utils/format';
import { sound } from '../services/sound';

const ACTIONS = [
  { type: 'receita', label: 'Receita', icon: ArrowUpRight },
  { type: 'despesa', label: 'Despesa', icon: ArrowDownLeft },
  { type: 'transferencia', label: 'Transferência', icon: ArrowLeftRight },
  { type: 'investimento', label: 'Investimento', icon: TrendingUp },
];

export default function FAB({ onAdd }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cx('fab', open && 'is-open')}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <ul className="fab__menu" aria-hidden={!open}>
        {ACTIONS.map((a, i) => (
          <li key={a.type} style={{ transitionDelay: `${(ACTIONS.length - i) * 30}ms` }}>
            <button
              type="button"
              className={`fab__item fab__item--${a.type}`}
              tabIndex={open ? 0 : -1}
              onClick={() => {
                sound.click();
                setOpen(false);
                onAdd(a.type);
              }}
            >
              <a.icon size={14} aria-hidden />
              <span>{a.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="fab__main"
        aria-label="Adicionar transação"
        aria-expanded={open}
        onClick={() => {
          sound.open();
          // Com mouse o menu já está aberto por hover: o clique vai direto ao modal.
          // No toque (sem hover) o primeiro toque revela o menu.
          if (open) {
            setOpen(false);
            onAdd('receita');
          } else {
            setOpen(true);
          }
        }}
      >
        <Plus size={22} strokeWidth={2.4} aria-hidden />
      </button>
    </div>
  );
}
