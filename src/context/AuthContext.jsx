import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../auth/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Bootstrap: valida o token salvo contra a API.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await authApi.currentUser();
        if (alive) setUser(u);
      } catch {
        /* servidor indisponível → tratado como sem sessão */
      }
      if (alive) setReady(true);
    })();
    const onUnauthorized = () => setUser(null);
    window.addEventListener('finance:unauthorized', onUnauthorized);
    return () => {
      alive = false;
      window.removeEventListener('finance:unauthorized', onUnauthorized);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const u = await authApi.login(credentials);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (credentials) => {
    const u = await authApi.register(credentials);
    setUser(u);
    return u;
  }, []);

  const loginDemo = useCallback(async () => {
    const u = await authApi.loginDemo();
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, register, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return ctx;
}
