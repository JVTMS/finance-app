// Dropdown moderno (filtro): botão + menu de vidro, navegação por teclado.

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cx } from '../../utils/format';
import { sound } from '../../services/sound';

export default function Dropdown({ value, onChange, options, placeholder = 'Selecione', ariaLabel, className }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listRef = useRef(null);

  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const select = (opt) => {
    onChange(opt.value);
    setOpen(false);
    sound.click();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((o) => !o);
    } else if (e.key === 'ArrowDown' && open) {
      e.preventDefault();
      const items = listRef.current?.querySelectorAll('button');
      items?.[0]?.focus();
    }
  };

  return (
    <div className={cx('dropdown', className)} ref={rootRef}>
      <button
        type="button"
        className="dropdown__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          sound.open();
          setOpen((o) => !o);
        }}
        onKeyDown={onKeyDown}
      >
        <span className={cx('dropdown__value', !current && 'is-placeholder')}>
          {current?.label ?? placeholder}
        </span>
        <ChevronDown size={14} className={cx('dropdown__chevron', open && 'is-open')} aria-hidden />
      </button>
      {open && (
        <ul className="dropdown__menu" role="listbox" ref={listRef}>
          {options.map((opt) => (
            <li key={String(opt.value)}>
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className={cx('dropdown__item', opt.value === value && 'is-selected')}
                onClick={() => select(opt)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const items = [...listRef.current.querySelectorAll('button')];
                    const i = items.indexOf(e.currentTarget);
                    items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus();
                  }
                }}
              >
                {opt.icon && <span className="dropdown__item-icon">{opt.icon}</span>}
                <span>{opt.label}</span>
                {opt.value === value && <Check size={14} aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
