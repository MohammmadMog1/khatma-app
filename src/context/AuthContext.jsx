import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setForbiddenHandler } from '../lib/api';

const KEY = 'khatma_auth_v1';
const AuthContext = createContext(null);

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStored); // { user: {id,name,role}, token|null }

  useEffect(() => {
    try {
      if (auth) localStorage.setItem(KEY, JSON.stringify(auth));
      else localStorage.removeItem(KEY);
    } catch {
      /* التخزين المحلي غير متاح: لا مشكلة، سيُطلب الهاتف في المرة القادمة */
    }
  }, [auth]);

  const logout = useCallback(() => setAuth(null), []);
  const updateUser = useCallback(
    (patch) => setAuth((a) => (a ? { ...a, user: { ...a.user, ...patch } } : a)),
    []
  );

  // إذا رفض الخادم جلسة الأدمن (انتهت صلاحيتها) نخرج تلقائياً
  useEffect(() => {
    setForbiddenHandler(logout);
  }, [logout]);

  const value = useMemo(
    () => ({
      user: auth?.user ?? null,
      token: auth?.token ?? null,
      isAdmin: auth?.user?.role === 'admin' && Boolean(auth?.token),
      login: setAuth,
      logout,
      updateUser,
    }),
    [auth, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
