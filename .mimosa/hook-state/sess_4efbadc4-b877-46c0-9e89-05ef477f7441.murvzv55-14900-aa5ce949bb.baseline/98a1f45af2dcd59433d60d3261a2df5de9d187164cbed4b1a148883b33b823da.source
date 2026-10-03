import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../auth/auth';
import * as api from '../api/api';
import { ensureDemoSeed } from '../services/seed';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      await ensureDemoSeed();
      if (alive) {
        setUser(authApi.currentUser());
        setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const u = await authApi.login(credentials);
    api.createDefaultUserData(u.id);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (credentials) => {
    const u = await authApi.register(credentials);
    api.createDefaultUserData(u.id);
    setUser(u);
    return u;
  }, []);

  const loginDemo = useCallback((email) => {
    const u = authApi.loginDemo(email);
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
