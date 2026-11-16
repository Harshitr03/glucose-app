import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));
  const [notice, setNotice] = useState('');

  useEffect(() => {
    function handleExpired() {
      setUser((current) => {
        if (current) setNotice('Your session has expired. Please log in again.');
        return null;
      });
    }
    window.addEventListener('sweety:session-expired', handleExpired);
    return () => window.removeEventListener('sweety:session-expired', handleExpired);
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) return;
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const startSession = useCallback(({ token, user: nextUser }) => {
    tokenStore.set(token);
    setNotice('');
    setUser(nextUser);
    return nextUser;
  }, []);

  const login = useCallback(
    (credentials) => api('/auth/login', { method: 'POST', body: credentials }).then(startSession),
    [startSession],
  );

  const register = useCallback(
    (details) => api('/auth/register', { method: 'POST', body: details }).then(startSession),
    [startSession],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setNotice('');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, notice, login, register, logout }),
    [user, loading, notice, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
