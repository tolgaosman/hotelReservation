"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, setAuthToken, getStoredToken } from "./api";
import { getFirstAccessibleRoute } from "./nav";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "personel";
  roleId: number | null;
  roleName: string | null;
  // Granular permission keys (e.g. "reservations.create") resolved from the
  // user's assigned Role — admins get every key without needing one assigned.
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  hasPermission: (key: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Mount-once: verifying the token against /api/me is a one-time bootstrap.
  // It used to depend on [pathname, router] and so re-fired on every single
  // navigation — on the single-threaded dev backend that meant an extra
  // ~request's worth of latency on every page change.
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setAuthToken(token);
        const res = await api.get("/api/me");
        if (!cancelled) setUser(res.data.data ?? res.data);
      } catch (error) {
        console.error("Auth init failed", error);
        setAuthToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    initAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  // Separate effect for the redirect-when-unauthenticated behavior, which
  // does need to re-check on every route change (e.g. a stale tab navigating
  // after the session died elsewhere) — without re-hitting the network.
  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== "/login") router.push("/login");
  }, [loading, user, pathname, router]);

  // Stable across renders: without useCallback, a fresh `hasPermission`
  // identity on every AuthProvider render meant AppShell's effect (which
  // lists it as a dep) re-ran on every render, and any consumer memoizing
  // against it (the dashboard calls it ~14 times per render) could never
  // treat it as a stable dependency.
  const login = useCallback((token: string, userData: User) => {
    setAuthToken(token);
    setUser(userData);
    const isAdmin = userData.role === "admin";
    // A personel user with no role assigned yet gets zero granular
    // permissions from the backend (User::hasPermission() has no fallback)
    // — treating that as "sees everything" here would contradict the API,
    // which 403s every action-permission check for them. Admins remain the
    // only unconditional bypass.
    const unrestricted = isAdmin;
    const destination = getFirstAccessibleRoute({
      unrestricted,
      hasPermission: (key) => userData.permissions?.includes(key) ?? false,
    });
    router.push(destination ?? "/dashboard");
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/logout");
    } catch (e) {
      // ignore
    }
    setAuthToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const hasPermission = useCallback((key: string): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.permissions?.includes(key) ?? false;
  }, [user]);

  const value = useMemo<AuthContextType>(
    () => ({ user, loading, login, logout, hasPermission }),
    [user, loading, login, logout, hasPermission]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
