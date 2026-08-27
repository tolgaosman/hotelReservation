"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, setAuthToken, getStoredToken } from "./api";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "personel";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
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
    router.push("/dashboard");
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
