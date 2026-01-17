"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "./api";
import { clearAuth as clearAuthStorage, getRole, getToken, setAuth as setAuthStorage } from "./auth";

type AuthUser = {
  id: string;
  role: string;
  email?: string | null;
  phone?: string | null;
};

type AuthContextValue = {
  token: string | null;
  role: string | null;
  user: AuthUser | null;
  setAuth: (token: string, role: string, user?: AuthUser) => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getToken());
  const [role, setRole] = useState<string | null>(getRole());
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    let cancelled = false;
    apiFetch("/auth/me")
      .then((me: any) => {
        if (cancelled) return;
        const nextUser: AuthUser = {
          id: me.id,
          role: me.role,
          email: me.email ?? null,
          phone: me.phone ?? null
        };
        setUser(nextUser);
        if (me.role && me.role !== role) {
          setRole(me.role);
        }
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token, role]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      role,
      user,
      setAuth: (nextToken, nextRole, nextUser) => {
        setAuthStorage(nextToken, nextRole);
        setToken(nextToken);
        setRole(nextRole);
        setUser(nextUser ?? null);
      },
      clearAuth: () => {
        clearAuthStorage();
        setToken(null);
        setRole(null);
        setUser(null);
      }
    }),
    [token, role, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
