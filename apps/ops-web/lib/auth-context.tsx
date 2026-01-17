"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { clearAuthCookies, getRole, getToken, setAuthCookies } from "./auth";

type AuthContextValue = {
  token: string | null;
  role: string | null;
  setAuth: (token: string, role: string) => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getToken());
  const [role, setRole] = useState<string | null>(getRole());

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      role,
      setAuth: (nextToken, nextRole) => {
        setAuthCookies(nextToken, nextRole);
        setToken(nextToken);
        setRole(nextRole);
      },
      clearAuth: () => {
        clearAuthCookies();
        setToken(null);
        setRole(null);
      }
    }),
    [token, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
