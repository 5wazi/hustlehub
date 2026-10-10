import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenExpiry, tokenStore } from '../api/client';

export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// Where each role lands after logging in
export const HOME_FOR_ROLE = { client: '/gigs', freelancer: '/my-gigs', admin: '/admin' };

const hasLiveToken = () => {
  const token = tokenStore.get();
  return Boolean(token) && tokenExpiry(token) > Date.now();
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(hasLiveToken);
  const [token, setToken] = useState(() => (hasLiveToken() ? tokenStore.get() : null));
  // Set when the session ends on its own (expiry or a 401), so the login page
  // can explain why the user was signed out.
  const [sessionExpired, setSessionExpired] = useState(false);

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setUser(null);
  }, []);

  const expire = useCallback(() => {
    logout();
    setSessionExpired(true);
  }, [logout]);

  // Any 401 from the API ends the session
  useEffect(() => {
    setUnauthorizedHandler(expire);
  }, [expire]);

  // Restore the session after a page refresh by asking the API who we are
  useEffect(() => {
    if (!hasLiveToken()) {
      tokenStore.clear();
      setLoading(false);
      return;
    }
    api
      .get('/profile')
      .then((res) => setUser(res.data.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  // Log out exactly when the JWT expires (default 1 hour)
  useEffect(() => {
    if (!token) return undefined;
    const timer = setTimeout(expire, Math.max(0, tokenExpiry(token) - Date.now()));
    return () => clearTimeout(timer);
  }, [token, expire]);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    tokenStore.set(res.data.token);
    setToken(res.data.token);
    setSessionExpired(false);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback((payload) => api.post('/auth/register', payload), []);

  const value = useMemo(
    () => ({ user, loading, login, logout, register, sessionExpired }),
    [user, loading, login, logout, register, sessionExpired]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
