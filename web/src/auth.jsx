// Нэвтэрсэн хэрэглэгчийн төлөв (US-01)
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) {
      setReady(true);
      return;
    }
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, [logout]);

  const signIn = useCallback(async (path, body) => {
    const d = await api(path, { method: 'POST', body });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  const refresh = useCallback(async () => {
    const d = await api('/auth/me');
    setUser(d.user);
  }, []);

  const value = useMemo(() => ({
    user, ready, logout, refresh,
    login: (body) => signIn('/auth/login', body),
    register: (body) => signIn('/auth/register', body),
    isSeeker: user?.role === 'SEEKER',
    isEmployer: user?.role === 'EMPLOYER',
  }), [user, ready, logout, refresh, signIn]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
