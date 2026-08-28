"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

  useEffect(() => {
    async function initAuth() {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        if (pathname !== "/login") router.push("/login");
        return;
      }

      try {
        setAuthToken(token);
        const res = await api.get("/api/me");
        setUser(res.data.data ?? res.data);
      } catch (error) {
        console.error("Auth init failed", error);
        setAuthToken(null);
        if (pathname !== "/login") router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, [pathname, router]);

  const login = (token: string, userData: User) => {
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
      isAdmin,
      unrestricted,
      hasPermission: (key) => userData.permissions?.includes(key) ?? false,
    });
    router.push(destination ?? "/dashboard");
  };

  const logout = async () => {
    try {
      await api.post("/api/logout");
    } catch (e) {
      // ignore
    }
    setAuthToken(null);
    setUser(null);
    router.push("/login");
  };

  function hasPermission(key: string): boolean {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.permissions?.includes(key) ?? false;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
