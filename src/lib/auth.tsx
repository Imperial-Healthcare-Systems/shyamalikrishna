'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const TOKEN_KEY = 'ska-admin-token';
const TOKEN_EXPIRY_KEY = 'ska-admin-expiry';

interface AdminAuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (stored && expiry) {
      if (new Date(expiry) > new Date()) {
        setToken(stored);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      const expiry = new Date(Date.now() + data.expires_in * 1000);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toISOString());
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }, []);

  // Check token expiry periodically
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (expiry && new Date(expiry) <= new Date()) {
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <AdminAuthContext.Provider
      value={{ token, isAuthenticated: !!token, login, logout, loading }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
