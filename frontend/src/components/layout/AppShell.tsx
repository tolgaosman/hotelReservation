import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { StoreProvider } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)]">
        <div className="size-8 animate-spin rounded-full border-4 border-[var(--line)] border-t-[var(--accent)]" />
      </div>
    );
  }

  if (!user) {
    return null; // AuthProvider handles redirect
  }

  return (
    <StoreProvider>
      <div className="flex min-h-screen bg-[var(--canvas)]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </StoreProvider>
  );
}
