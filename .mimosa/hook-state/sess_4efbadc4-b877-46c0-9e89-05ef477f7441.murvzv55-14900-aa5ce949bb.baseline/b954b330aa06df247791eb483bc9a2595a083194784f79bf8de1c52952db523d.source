// Modal cinematográfico: surge do espaço com blur, scale e fade.

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from '../../utils/format';
import { sound } from '../../services/sound';

export default function Modal({ open, onClose, title, subtitle, children, size = 'md', closeLabel = 'Fechar' }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // foco inicial no painel (primeiro input recebe foco via atributo autofocus)
    const t = setTimeout(() => {
      const focusable = panelRef.current?.querySelector('input, select, textarea, button:not(.modal__close)');
      (focusable || panelRef.current)?.focus({ preventScroll: true });
    }, 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={cx('modal', `modal--${size}`)}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header className="modal__head">
          <div>
            <h2 className="modal__title">{title}</h2>
            {subtitle && <p className="modal__subtitle">{subtitle}</p>}
          </div>
          <button
            className="modal__close icon-btn"
            onClick={() => {
              sound.click();
              onClose();
            }}
            aria-label={closeLabel}
          >
            <X size={18} aria-hidden />
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
