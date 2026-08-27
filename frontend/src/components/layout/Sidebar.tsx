"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  CalendarCheck,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reservations", label: "Rezervasyonlar", icon: CalendarCheck },
  { href: "/calendar", label: "Takvim", icon: CalendarDays },
  { href: "/rooms", label: "Odalar", icon: BedDouble },
  { href: "/housekeeping", label: "Temizlik", icon: Sparkles },
  { href: "/guests", label: "Misafirler", icon: Users },
  { href: "/payments", label: "Ödemeler", icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--surface)] px-4 py-6">
      <div className="flex items-center justify-center px-2 h-10">
        <img src="/site%20logo.png" alt="Logo" className="h-full w-auto object-contain" />
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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
      </nav>

      <div className="mt-4 pt-4 border-t border-[var(--line)]">
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
