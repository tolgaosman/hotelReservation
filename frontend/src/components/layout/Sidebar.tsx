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
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reservations", label: "Reservations", icon: CalendarCheck },
  { href: "/rooms", label: "Rooms", icon: BedDouble },
  { href: "/guests", label: "Guests", icon: Users },
  { href: "/payments", label: "Payments", icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();

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

      <Link
        href="/settings"
        className="flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium text-[var(--color-muted)] transition-colors duration-200 [transition-timing-function:var(--ease-organic)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
      >
        <Settings size={17} strokeWidth={2} />
        Settings
      </Link>
    </aside>
  );
}
