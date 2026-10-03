// Raiz do aplicativo: entrada cinematográfica, roteamento por hash e layout.

import { useEffect, useState, useCallback } from 'react';
import Background3D from './components/three/Background3D';
import { DesktopSidebar, MobileTabBar } from './components/Sidebar';
import Header from './components/Header';
import FAB from './components/FAB';
import TransactionModal from './components/TransactionModal';
import CommandPalette from './components/CommandPalette';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Investments from './pages/Investments';
import Accounts from './pages/Accounts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { FinanceProvider } from './context/FinanceContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { useHashRoute } from './hooks/useHashRoute';
import { useIsMobile } from './hooks/useMediaQuery';
import { cx } from './utils/format';
import { sound } from './services/sound';

const PAGE_META = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Sua visão financeira em tempo real' },
  '/transactions': { title: 'Transações', subtitle: 'Histórico completo e filtros' },
  '/investments': { title: 'Investimentos', subtitle: 'Patrimônio investido e evolução' },
  '/accounts': { title: 'Minhas Contas', subtitle: 'Saldos e movimentações por conta' },
  '/reports': { title: 'Relatórios', subtitle: 'Resumo mensal e exportação' },
  '/settings': { title: 'Configurações', subtitle: 'Aparência, som e dados' },
};

function AppShell() {
  const { user, ready } = useAuth();
  const { path, query, navigate } = useHashRoute();
  const isMobile = useIsMobile();
  const { push } = useToast();

  const [booting, setBooting] = useState(true);
  const [txOpen, setTxOpen] = useState(false);
  const [txType, setTxType] = useState('receita');

  // Entrada cinematográfica: ~1s, rápida e elegante; respeita reduced-motion.
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => setBooting(false), reduce ? 120 : 1000);
    return () => clearTimeout(t);
  }, []);

  const openTx = useCallback((type = 'receita') => {
    setTxType(type);
    setTxOpen(true);
  }, []);

  // Página Investimentos dispara "novo aporte" via evento.
  useEffect(() => {
    const onAdd = (e) => openTx(e.detail || 'receita');
    window.addEventListener('finance:add-transaction', onAdd);
    return () => window.removeEventListener('finance:add-transaction', onAdd);
  }, [openTx]);

  if (!ready) {
    return (
      <div className="boot-screen" role="status" aria-label="Carregando">
        <span className="boot-screen__orb" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Background3D />
        <Login onEnter={() => setBooting(false)} />
      </>
    );
  }

  const meta = PAGE_META[path] || PAGE_META['/dashboard'];
  const page = (() => {
    switch (path) {
      case '/transactions':
        return <Transactions />;
      case '/investments':
        return <Investments />;
      case '/accounts':
        return <Accounts />;
      case '/reports':
        return <Reports />;
      case '/settings':
        return <Settings />;
      case '/dashboard':
      default:
        return <Dashboard />;
    }
  })();

  return (
    <div className={cx('app', booting && 'is-booting')}>
      <Background3D />
      <div className="boot-veil" aria-hidden />

      <div className="app__body">
        {!isMobile && <DesktopSidebar path={path} query={query} navigate={navigate} />}

        <div className="app__main">
          <Header title={meta.title} subtitle={meta.subtitle} onOpenSearch={() => openPaletteEvent()} />
          <main id="conteudo" className={cx('app__content', isMobile && 'is-mobile')} key={path}>
            {page}
          </main>
        </div>
      </div>

      {isMobile && <MobileTabBar path={path} query={query} navigate={navigate} />}

      <FAB onAdd={openTx} />
      <TransactionModal open={txOpen} onClose={() => setTxOpen(false)} initialType={txType} />
      <CommandPalette navigate={navigate} onAdd={openTx} />
    </div>
  );
}

function openPaletteEvent() {
  sound.open();
  window.dispatchEvent(new CustomEvent('finance:open-palette'));
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <FinanceProvider>
          <ToastProvider>
            <AppShell />
          </ToastProvider>
        </FinanceProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
