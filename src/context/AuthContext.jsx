import { createContext, useContext, useMemo, useState } from 'react';
import { useAppData } from './AppDataContext';

// SIMULATED authentication for the demo. Credentials are compared in the
// browser against mock data. This is NOT secure and must be replaced by a
// real backend (hashed passwords, sessions/tokens, rate limiting) in production.

const AuthContext = createContext(null);
const REMEMBER_KEY = 'csp-demo-remember';

function readRemembered() {
  try {
    return JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeRemembered(value) {
  try {
    if (value) localStorage.setItem(REMEMBER_KEY, JSON.stringify(value));
    else localStorage.removeItem(REMEMBER_KEY);
  } catch {
    /* storage unavailable — remember-me simply won't persist */
  }
}

export function AuthProvider({ children }) {
  const { users, addUser } = useAppData();
  // Only the user id is remembered (never the password).
  const [userId, setUserId] = useState(() => {
    const saved = readRemembered();
    return saved?.userId || null;
  });

  const user = users.find((u) => u.id === userId && u.status === 'Active') || null;

  const value = useMemo(() => {
    const login = (username, password, remember) => {
      const found = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
      if (!found || found.password !== password) {
        return { ok: false, error: 'Incorrect username or password.' };
      }
      if (found.status !== 'Active') {
        return { ok: false, error: 'This demo account has been deactivated by the admin.' };
      }
      setUserId(found.id);
      writeRemembered(remember ? { userId: found.id, username: found.username } : null);
      return { ok: true, user: found };
    };

    const signup = (data) => {
      const exists = users.some((u) => u.username.toLowerCase() === data.username.trim().toLowerCase());
      if (exists) return { ok: false, error: 'That username is already taken.' };
      const created = addUser({
        name: data.name.trim(),
        username: data.username.trim(),
        email: data.email.trim(),
        mobile: data.mobile.trim(),
        password: data.password,
      });
      setUserId(created.id);
      return { ok: true, user: created };
    };

    const logout = () => {
      setUserId(null);
      writeRemembered(null);
    };

    const isUsernameTaken = (name) => users.some((u) => u.username.toLowerCase() === name.trim().toLowerCase());

    return { user, login, signup, logout, isUsernameTaken, rememberedUsername: readRemembered()?.username || '' };
  }, [user, users, addUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
