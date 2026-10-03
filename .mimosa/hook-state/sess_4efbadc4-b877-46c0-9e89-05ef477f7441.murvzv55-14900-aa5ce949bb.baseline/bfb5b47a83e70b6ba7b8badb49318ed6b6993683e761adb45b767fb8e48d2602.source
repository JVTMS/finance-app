// Notificações cinematográficas (toasts) + histórico no sino do cabeçalho.

import { createContext, useContext, useCallback, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import * as api from '../api/api';
import { sound } from '../services/sound';
import { cx } from '../utils/format';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  warn: AlertTriangle,
  info: Info,
  error: XCircle,
};

export function ToastProvider({ children }) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    // animação de saída antes de remover de verdade
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 280);
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    ({ type = 'info', title, message = '', sound: soundName = null, duration = 3600, record = true }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((list) => [...list.slice(-3), { id, type, title, message }]);
      if (soundName && sound[soundName]) sound[soundName]();
      if (record && user) {
        api.pushNotification(user.id, { type, title, message });
      }
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss, user]
  );

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="region" aria-label="Notificações" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div key={t.id} className={cx('toast', `toast--${t.type}`, t.leaving && 'is-leaving')} role="status">
              <span className="toast__icon">
                <Icon size={18} strokeWidth={2.2} aria-hidden />
              </span>
              <div className="toast__body">
                <p className="toast__title">{t.title}</p>
                {t.message && <p className="toast__msg">{t.message}</p>}
              </div>
              <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Fechar notificação">
                ×
              </button>
              <span className="toast__progress" />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de ToastProvider');
  return ctx;
}
