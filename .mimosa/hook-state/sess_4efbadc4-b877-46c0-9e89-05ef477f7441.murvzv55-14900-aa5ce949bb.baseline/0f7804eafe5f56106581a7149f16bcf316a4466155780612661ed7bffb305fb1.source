// Sidebar vertical compacta que expande suavemente no hover/foco.

import {
  LayoutDashboard, ArrowLeftRight, ArrowUpRight, ArrowDownLeft, TrendingUp,
  Landmark, BarChart3, Settings, LogOut, Gem,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { cx } from '../utils/format';
import { sound } from '../services/sound';

export const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', match: (p) => p === '/dashboard' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transações', match: (p, q) => p === '/transactions' && !q?.type },
  { path: '/transactions?type=receita', icon: ArrowUpRight, label: 'Receitas', match: (p, q) => p === '/transactions' && q?.type === 'receita' },
  { path: '/transactions?type=despesa', icon: ArrowDownLeft, label: 'Despesas', match: (p, q) => p === '/transactions' && q?.type === 'despesa' },
  { path: '/investments', icon: TrendingUp, label: 'Investimentos', match: (p) => p === '/investments' },
  { path: '/accounts', icon: Landmark, label: 'Contas', match: (p) => p === '/accounts' },
  { path: '/reports', icon: BarChart3, label: 'Relatórios', match: (p) => p === '/reports' },
  { path: '/settings', icon: Settings, label: 'Configurações', match: (p) => p === '/settings' },
];

const MOBILE_ITEMS = [
  NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[4], NAV_ITEMS[5], NAV_ITEMS[6],
];

export function DesktopSidebar({ path, query, navigate }) {
  const { user, logout } = useAuth();
  const { transactions } = useFinance();
  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="sidebar" aria-label="Navegação principal">
      <div className="sidebar__panel">
        <a
          className="sidebar__logo"
          href="#/dashboard"
          onClick={() => sound.click()}
          aria-label="FINANCE — ir para o dashboard"
        >
          <span className="sidebar__logo-mark">
            <Gem size={18} strokeWidth={2} aria-hidden />
          </span>
          <span className="sidebar__logo-text">
            FINANCE
            <small>patrimônio</small>
          </span>
        </a>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => {
            const active = item.match?.(path, query) ?? (path === item.path);
            return (
              <a
                key={item.label}
                href={`#${item.path}`}
                className={cx('sidebar__item', active && 'is-active')}
                aria-current={active ? 'page' : undefined}
                onClick={() => sound.click()}
              >
                <span className="sidebar__item-icon">
                  <item.icon size={18} strokeWidth={2} aria-hidden />
                </span>
                <span className="sidebar__item-label">{item.label}</span>
                {item.label === 'Transações' && transactions.length > 0 && (
                  <span className="sidebar__badge num">{transactions.length}</span>
                )}
              </a>
            );
          })}
        </nav>

        <div className="sidebar__foot">
          <div className="sidebar__user" title={user?.email}>
            <span className="sidebar__avatar" aria-hidden>
              {initials}
            </span>
            <span className="sidebar__user-info">
              <strong>{user?.name?.split(' ')[0]}</strong>
              <small>{user?.email}</small>
            </span>
          </div>
          <button className="sidebar__logout" onClick={logout} aria-label="Sair da conta">
            <LogOut size={17} aria-hidden />
            <span className="sidebar__item-label">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileTabBar({ path, query, navigate }) {
  return (
    <nav className="tabbar" aria-label="Navegação principal">
      {MOBILE_ITEMS.map((item) => {
        const active = item.match?.(path, query) ?? (path === item.path && !query?.type);
        return (
          <a
            key={item.label}
            href={`#${item.path}`}
            className={cx('tabbar__item', active && 'is-active')}
            aria-current={active ? 'page' : undefined}
          >
            <item.icon size={19} strokeWidth={2} aria-hidden />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
