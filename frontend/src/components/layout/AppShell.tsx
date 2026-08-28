"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { StoreProvider, useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { getStoredToken } from "@/lib/api";
import { ErrorState } from "@/components/ui/ErrorState";
import { NAV_CATEGORIES, getFirstAccessibleRoute } from "@/lib/nav";

// Rooms/guests/reservations failing to load means the backend itself is
// unreachable, not just a permission gate on one widget — show a real error
// with a retry instead of every page silently rendering as empty forever.
// This has to live inside StoreProvider to read the store, so AppShell can't
// check it directly.
function StoreLoadGate({ children }: { children: ReactNode }) {
  const { loadError, hydrating, reload } = useStore();

  if (loadError && !hydrating) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <ErrorState
          title="Sunucuya ulaşılamadı"
          description="Veriler yüklenemedi. Backend çalışıyor mu kontrol edin ve tekrar deneyin."
          onRetry={reload}
        />
      </div>
    );
  }

  return <>{children}</>;
}

// The sidebar only hides links a role can't see — it never stopped someone
// from typing the URL directly, so every nav-catalog route was reachable by
// any authenticated user regardless of permission. This mirrors the same
// unrestricted/permission check the sidebar uses, but as an actual gate.
function RouteGuard({ children }: { children: ReactNode }) {
  const { user, hasPermission } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = user?.role === "admin";
  const unrestricted = isAdmin;

  const category = NAV_CATEGORIES.find((c) =>
    c.items.some((i) => pathname === i.href || pathname?.startsWith(`${i.href}/`))
  );
  const item = category?.items.find((i) => pathname === i.href || pathname?.startsWith(`${i.href}/`));
  const allowed =
    !item || unrestricted || ((!category?.adminOnly || isAdmin) && hasPermission(item.permission));

  useEffect(() => {
    if (!allowed) {
      router.replace(getFirstAccessibleRoute({ isAdmin, unrestricted, hasPermission }) ?? "/login");
    }
  }, [allowed, isAdmin, unrestricted, hasPermission, router]);

  if (!allowed) return null;

  return <>{children}</>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  // A stored token means /api/me is very likely to succeed, so we start the
  // store's data fetch immediately instead of waiting for /api/me to resolve
  // first — that turned auth verification and data loading into a fully
  // serial chain on every full page load. If /api/me does fail, AuthProvider
  // redirects to /login and this tree (and StoreProvider with it) unmounts.
  // localStorage isn't available during SSR, so this starts false (matching
  // the server-rendered markup) and flips in an effect after mount to avoid
  // a hydration mismatch.
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!getStoredToken());
  }, []);

  if (loading && !hasToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)]">
        <div className="size-8 animate-spin rounded-full border-4 border-[var(--line)] border-t-[var(--accent)]" />
      </div>
    );
  }

  if (!loading && !user) {
    return null; // AuthProvider handles redirect
  }

  return (
    <StoreProvider>
      <div className="flex min-h-screen bg-[var(--canvas)]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <StoreLoadGate>
            <RouteGuard>{children}</RouteGuard>
          </StoreLoadGate>
        </div>
      </div>
    </StoreProvider>
  );
}
