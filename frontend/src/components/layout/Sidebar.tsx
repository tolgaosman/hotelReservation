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
  UtensilsCrossed,
  IdCard,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth";

const NAV_CATEGORIES = [
  {
    title: "Ana Sayfa",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
    ],
  },
  {
    title: "Ön Büro",
    items: [
      { href: "/reservations", label: "Rezervasyonlar", icon: CalendarCheck, permission: "reservations.view" },
      { href: "/calendar", label: "Takvim", icon: CalendarDays, permission: "calendar.view" },
      { href: "/guests", label: "Misafirler", icon: Users, permission: "guests.view" },
    ],
  },
  {
    title: "Operasyon",
    items: [
      { href: "/rooms", label: "Odalar", icon: BedDouble, permission: "rooms.view" },
      { href: "/housekeeping", label: "Temizlik", icon: Sparkles, permission: "housekeeping.view" },
      { href: "/room-service", label: "Oda Servisi", icon: UtensilsCrossed, permission: "room_service.view" },
    ],
  },
  {
    title: "Finans",
    items: [
      { href: "/payments", label: "Ödemeler", icon: Wallet, permission: "payments.view" },
    ],
  },
  {
    title: "Yönetim",
    adminOnly: true,
    items: [
      { href: "/employees", label: "Çalışanlar", icon: IdCard, permission: "employees.view" },
      { href: "/roles", label: "Roller", icon: ShieldCheck, permission: "roles.view" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();

  // A user with no permission assignment at all (no role yet) sees everything —
  // the catalog only starts restricting once a role has actually been picked for them.
  const unrestricted = user?.role === "admin" || (user?.permissions?.length ?? 0) === 0;

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
