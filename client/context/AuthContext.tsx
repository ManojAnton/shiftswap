import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string>;
  logout: () => void;
  isManager: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get<{ user: User }>('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [token, logout]);

  const login = async (email: string, password: string): Promise<string> => {
    const { token: t, user: u } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
    return u.role;
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, logout,
      isManager: user?.role === 'Manager',
      isEmployee: user?.role === 'Employee',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
