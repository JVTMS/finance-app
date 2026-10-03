// Estado financeiro do usuário logado: carrega tudo da API e recarrega
// quando o usuário muda ou quando uma mutação chama reload().

import { createContext, useContext, useEffect, useMemo, useCallback, useState } from 'react';
import * as api from '../api/api';
import { useAuth } from './AuthContext';

const EMPTY_DATA = { accounts: [], transactions: [], investments: [], categories: [], notifications: [] };
const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!user) {
      setData(EMPTY_DATA);
      return;
    }
    setLoading(true);
    try {
      setData(await api.loadUserData(user.id));
    } catch {
      /* erro de rede: mantém o último estado conhecido */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(() => ({ ...data, loading, reload }), [data, loading, reload]);
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance precisa estar dentro de FinanceProvider');
  return ctx;
}
