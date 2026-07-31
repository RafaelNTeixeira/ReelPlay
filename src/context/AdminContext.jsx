import { createContext, useContext, useState, useEffect } from 'react';
import { ADMIN_PASSWORD } from '../config';

const AdminContext = createContext(null);

const SESSION_KEY = 'reelplay_admin_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // stay logged in for 24 hours

// sessionStorage is scoped per-tab, so opening a new tab always looked logged
// out. localStorage is shared across all tabs of the same origin, and we pair
// it with a timestamp so the session still expires instead of lasting forever.
const readSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { loggedInAt } = JSON.parse(raw);
    if (!loggedInAt || Date.now() - loggedInAt > SESSION_DURATION_MS) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(readSession());

    // Re-check periodically so a long-open tab logs itself out once the
    // session actually expires, and sync across tabs if login/logout
    // happens in another one.
    const recheck = () => setIsAdmin(readSession());
    const interval = setInterval(recheck, 60 * 1000);
    window.addEventListener('storage', recheck);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', recheck);
    };
  }, []);

  const login = (password) => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ loggedInAt: Date.now() }));
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};