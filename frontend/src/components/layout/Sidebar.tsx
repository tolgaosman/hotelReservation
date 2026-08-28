"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_CATEGORIES } from "@/lib/nav";

import { useAuth } from "@/lib/auth";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();

  // Only admins bypass the granular permission catalog — a personel user
  // with no role assigned yet gets zero permissions from the backend and is
  // 403'd on every gated action, so hiding the sidebar accordingly (rather
  // than showing everything) keeps nav visibility truthful to what the API
  // will actually allow. See lib/auth.tsx's `unrestricted` for the same rule.
  const unrestricted = user?.role === "admin";

  const visibleCategories = NAV_CATEGORIES.filter((c) => !c.adminOnly || user?.role === "admin")
    .map((c) => ({ ...c, items: c.items.filter((i) => unrestricted || hasPermission(i.permission)) }))
    .filter((c) => c.items.length > 0);

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--surface)] px-4 py-6">
      <div className="flex items-center justify-center px-2 h-10">
        <img src="/site%20logo.png" alt="Logo" className="h-full w-auto object-contain" />
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-6 overflow-y-auto pr-2">
        {visibleCategories.map((category) => (
          <div key={category.title} className="flex flex-col gap-1">
            <h4 className="px-3 mb-1 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {category.title}
            </h4>
            {category.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname?.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium",
                    "transition-all duration-200 [transition-timing-function:var(--ease-organic)]",
                    active
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]"
                      : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
                  )}
                >
                  <Icon size={17} strokeWidth={2} />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-4 pt-4 border-t border-[var(--line)] shrink-0">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium text-[var(--color-muted)] transition-colors duration-200 [transition-timing-function:var(--ease-organic)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] mb-2"
        >
          <Settings size={17} strokeWidth={2} />
          Ayarlar
        </Link>
        <div className="flex items-center justify-between rounded-[var(--radius-control)] bg-[var(--surface-alt)] p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--ink)]">{user?.name}</p>
            <p className="truncate text-xs text-[var(--muted)]">{user?.role === 'admin' ? 'Yönetici' : 'Personel'}</p>
          </div>
          <button 
            onClick={logout}
            className="text-xs font-semibold text-[var(--crit)] hover:underline ml-2"
          >
            Çıkış
          </button>
        </div>
      </div>
    </aside>
  );
}
