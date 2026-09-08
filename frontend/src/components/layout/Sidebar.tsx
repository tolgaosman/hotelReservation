"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_CATEGORIES, isNavItemActive } from "@/lib/nav";

import { useAuth } from "@/lib/auth";

const LINK_CLASS =
  "group flex items-center gap-2.5 rounded-[var(--radius-control)] px-3 py-2 text-[13px] font-medium " +
  "transition-all duration-200 [transition-timing-function:var(--ease-organic)]";

function NavLink({ href, label, icon: Icon, active, small }: { href: string; label: string; icon: LucideIcon; active: boolean; small?: boolean }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        LINK_CLASS,
        small && "py-1.5 text-[12.5px]",
        active
          ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]"
          : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
      )}
    >
      <Icon size={small ? 14 : 16} strokeWidth={2} />
      {label}
    </Link>
  );
}

// A parent with a submenu — click-to-expand, auto-opens the moment one of
// its children becomes the active route, and otherwise stays exactly as the
// user left it (never force-collapses a menu they opened deliberately).
function NavGroup({ item, pathname }: { item: (typeof NAV_CATEGORIES)[number]["items"][number]; pathname: string | null }) {
  const children = item.children!;
  const submenuId = useId();
  const hasActiveChild = children.some((c) => isNavItemActive(c, pathname));
  const [open, setOpen] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={submenuId}
        className={cn(
          LINK_CLASS,
          "w-full",
          hasActiveChild ? "text-[var(--color-ink)]" : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
        )}
      >
        <item.icon size={16} strokeWidth={2} />
        {item.label}
        <ChevronRight
          size={14}
          className="ml-auto transition-transform duration-200 [transition-timing-function:var(--ease-organic)]"
          style={{ transform: open ? "rotate(90deg)" : "none" }}
        />
      </button>
      {/* 0fr/1fr grid track carries the height reveal with no JS measurement;
          the visible motion (fade + slide) rides on opacity/transform, which
          is what actually gets composited — 60fps, no layout thrash. */}
      <div
        id={submenuId}
        inert={!open}
        aria-hidden={!open}
        className="grid transition-[grid-template-rows] duration-[220ms] [transition-timing-function:var(--ease-organic)] motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <ul
            className={cn(
              "mt-0.5 ml-[22px] flex flex-col gap-0.5 border-l border-[var(--line)] pl-2.5",
              "transition-[opacity,transform] duration-200 [transition-timing-function:var(--ease-organic)]",
              open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
            )}
          >
            {children.map((c) => (
              <li key={c.href}>
                <NavLink href={c.href} label={c.label} icon={c.icon} active={isNavItemActive(c, pathname)} small />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();

  // hasPermission() already bypasses for admins and returns false for a
  // null user, so it's the only check needed here — a personel user with no
  // role assigned yet gets zero permissions from the backend and is 403'd on
  // every gated action, so hiding the sidebar accordingly keeps nav
  // visibility truthful to what the API will actually allow. A parent with
  // children is visible if it — or any child — is; children are filtered the
  // same way, and a parent left with exactly one visible child collapses to
  // a plain link (a one-item dropdown is just a worse link).
  const visibleCategories = NAV_CATEGORIES.map((category) => ({
    ...category,
    items: category.items
      .map((item) => {
        if (!item.children) return item;
        const children = item.children.filter((c) => hasPermission(c.permission));
        return { ...item, children };
      })
      .filter((item) => hasPermission(item.permission) || (item.children && item.children.length > 0)),
  })).filter((c) => c.items.length > 0);

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--surface)] px-4 py-6">
      <div className="flex items-center justify-center px-2 h-10">
        <img src="/site%20logo.png" alt="Logo" className="h-full w-auto object-contain" />
      </div>

      <nav className="mt-5 flex flex-1 flex-col gap-3">
        {visibleCategories.map((category) => (
          <div key={category.title} className="flex flex-col gap-0.5">
            <h4 className="px-3 mb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              {category.title}
            </h4>
            {category.items.map((item) => {
              if (item.children && item.children.length > 1) {
                return <NavGroup key={item.href} item={item} pathname={pathname} />;
              }
              // No children left (permission-filtered down to zero, or none
              // defined) or exactly one — render as a single flat link.
              const target = item.children?.[0] ?? item;
              return <NavLink key={item.href} href={target.href} label={item.label} icon={item.icon} active={isNavItemActive(target, pathname)} />;
            })}
          </div>
        ))}
      </nav>

      <div className="mt-4 pt-4 border-t border-[var(--line)] shrink-0">
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
