// Estado financeiro do usuário logado: carrega tudo em memória e recarrega
// automaticamente quando o banco local muda.

import { createContext, useContext, useEffect, useMemo, useCallback, useState } from 'react';
import * as api from '../api/api';
import { subscribe } from '../database/db';
import { useAuth } from './AuthContext';

const EMPTY_DATA = { accounts: [], transactions: [], investments: [], categories: [], notifications: [] };
const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState(EMPTY_DATA);
  const [reloadCount, setReloadCount] = useState(0);

  const reload = useCallback(() => {
    if (user) setData(api.loadUserData(user.id));
    else setData(EMPTY_DATA);
  }, [user]);

  useEffect(() => {
    reload();
    return subscribe(() => setReloadCount((c) => c + 1));
  }, [reload]);

  useEffect(() => {
    if (reloadCount > 0) reload();
  }, [reloadCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => ({ ...data, reload }), [data, reload]);
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance precisa estar dentro de FinanceProvider');
  return ctx;
}
