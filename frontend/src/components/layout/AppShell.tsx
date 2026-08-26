import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { StoreProvider } from "@/lib/store";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <div className="flex min-h-screen bg-[var(--canvas)]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </StoreProvider>
  );
}
