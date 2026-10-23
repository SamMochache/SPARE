import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, tokenStore } from "../api/client";

export interface CurrentUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "owner" | "manager" | "cashier" | "inventory" | "accountant" | string;
  branch_id: number | null;
  branch_name: string | null;
}

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    if (!tokenStore.getAccess() && !tokenStore.getRefresh()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await apiRequest<CurrentUser>("/api/v1/auth/me/"));
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadCurrentUser(); }, [loadCurrentUser]);

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await apiRequest<{ access: string; refresh: string }>(
      "/api/v1/auth/token/",
      { method: "POST", authenticated: false, body: { username: username.trim(), password }, retryAuth: false }
    );
    tokenStore.set(tokens.access, tokens.refresh);
    try {
      const currentUser = await apiRequest<CurrentUser>("/api/v1/auth/me/");
      setUser(currentUser);
    } catch (error) {
      tokenStore.clear();
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokenStore.getRefresh();
    if (refresh) {
      try {
        await apiRequest("/api/v1/auth/logout/", {
          method: "POST",
          body: { refresh },
          retryAuth: false
        });
      } catch {
        // Local logout remains effective if the server cannot be reached.
      }
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
