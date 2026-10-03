// Cabeçalho: título contextual, busca global, notificações e menu do usuário.

import { useEffect, useRef, useState } from 'react';
import { Search, Bell, CheckCircle2, AlertTriangle, Info, LogOut, Settings as SettingsIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useSettings } from '../context/SettingsContext';
import * as api from '../api/api';
import { cx, formatDate, todayISO } from '../utils/format';
import { sound } from '../services/sound';

const NOTIF_ICON = { success: CheckCircle2, warn: AlertTriangle, info: Info, error: AlertTriangle };

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

export default function Header({ title, subtitle, onOpenSearch }) {
  const { user, logout } = useAuth();
  const { notifications, reload } = useFinance();
  const { soundOn } = useSettings();
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const bellRef = useRef(null);
  const userRef = useRef(null);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onDoc = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const openBell = async () => {
    sound.open();
    setBellOpen((o) => !o);
    if (!bellOpen && unread > 0 && user) {
      await api.markNotificationsRead(user.id);
      reload();
    }
  };

  return (
    <header className="header">
      <div className="header__titles">
        <h1 className="header__title">{title}</h1>
        <p className="header__subtitle">{subtitle || formatDate(todayISO())}</p>
      </div>

      <div className="header__actions">
        <button className="header__search" onClick={onOpenSearch} aria-label="Pesquisar (Ctrl+K)">
          <Search size={15} aria-hidden />
          <span className="header__search-text">Pesquisar…</span>
          <kbd className="header__kbd">Ctrl K</kbd>
        </button>

        <div className="header__bell-wrap" ref={bellRef}>
          <button
            className={cx('icon-btn header__bell', bellOpen && 'is-active')}
            onClick={openBell}
            aria-label={`Notificações${unread ? ` (${unread} não lidas)` : ''}`}
            aria-expanded={bellOpen}
          >
            <Bell size={18} aria-hidden />
            {unread > 0 && <span className="header__bell-badge num" aria-hidden>{unread}</span>}
          </button>
          {bellOpen && (
            <div className="notif-panel" role="region" aria-label="Notificações recentes">
              <h3 className="notif-panel__title">Notificações</h3>
              {notifications.length === 0 ? (
                <p className="notif-panel__empty">Nada por aqui ainda.</p>
              ) : (
                <ul className="notif-panel__list">
                  {notifications.slice(0, 10).map((n) => {
                    const Icon = NOTIF_ICON[n.type] || Info;
                    return (
                      <li key={n.id} className={cx('notif-item', `notif-item--${n.type}`)}>
                        <span className="notif-item__icon">
                          <Icon size={15} aria-hidden />
                        </span>
                        <div>
                          <p className="notif-item__title">{n.title}</p>
                          {n.message && <p className="notif-item__msg">{n.message}</p>}
                        </div>
                        <span className="notif-item__time">{timeAgo(n.createdAt)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="notif-panel__hint">{soundOn ? '🔊 Som da interface ativo' : '🔇 Som da interface desativado'}</p>
            </div>
          )}
        </div>

        <div className="header__user-wrap" ref={userRef}>
          <button
            className={cx('header__user', userOpen && 'is-active')}
            onClick={() => {
              sound.open();
              setUserOpen((o) => !o);
            }}
            aria-expanded={userOpen}
            aria-label="Menu do usuário"
          >
            <span className="header__avatar" aria-hidden>
              {(user?.name || 'U').split(' ')[0]?.slice(0, 1).toUpperCase()}
            </span>
            <span className="header__user-name">{user?.name?.split(' ')[0]}</span>
            <ChevronDown size={13} aria-hidden />
          </button>
          {userOpen && (
            <div className="user-menu" role="menu">
              <a href="#/settings" className="user-menu__item" role="menuitem" onClick={() => setUserOpen(false)}>
                <SettingsIcon size={15} aria-hidden /> Configurações
              </a>
              <button className="user-menu__item user-menu__item--danger" role="menuitem" onClick={logout}>
                <LogOut size={15} aria-hidden /> Sair da conta
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
