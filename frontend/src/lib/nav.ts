import {
  BedDouble,
  CalendarCheck,
  LayoutDashboard,
  Users,
  Wallet,
  Sparkles,
  CalendarDays,
  UtensilsCrossed,
  IdCard,
  ShieldCheck,
  Settings,
  ScrollText,
  DoorOpen,
  LayoutGrid,
  Star,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: string;
  /** A submenu — the parent itself is never a link target for matching purposes. */
  children?: NavItem[];
  /** True: this item owns only its exact path; a deeper path belongs to a sibling child instead. */
  exact?: boolean;
}

interface NavCategory {
  title: string;
  items: NavItem[];
}

// Single source of truth for the sidebar's link order — also used to pick
// where to send a user whose role can't see the page they landed on.
export const NAV_CATEGORIES: NavCategory[] = [
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
      {
        href: "/rooms",
        label: "Odalar",
        icon: BedDouble,
        permission: "rooms.view",
        children: [
          { href: "/rooms", label: "Oda İşlemleri", icon: DoorOpen, permission: "rooms.view", exact: true },
          { href: "/rooms/types", label: "Oda Tipleri", icon: LayoutGrid, permission: "room_types.view" },
        ],
      },
      { href: "/housekeeping", label: "Temizlik", icon: Sparkles, permission: "housekeeping.view" },
      { href: "/room-service", label: "Oda Servisi", icon: UtensilsCrossed, permission: "room_service.view" },
      { href: "/addons", label: "Ekstra Hizmetler", icon: Sparkles, permission: "addons.view" },
    ],
  },
  {
    title: "Müşteri İlişkileri",
    items: [
      { href: "/reviews", label: "Yorum Yönetimi", icon: Star, permission: "reviews.view" },
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
    items: [
      { href: "/employees", label: "Çalışanlar", icon: IdCard, permission: "employees.view" },
      { href: "/roles", label: "Roller", icon: ShieldCheck, permission: "roles.view" },
      { href: "/audit-logs", label: "Aktivite Kayıtları", icon: ScrollText, permission: "audit_logs.view" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/settings", label: "Ayarlar", icon: Settings, permission: "settings.view" },
    ],
  },
];

// Whether `pathname` is "on" this item: an `exact` item (a submenu's default
// child sharing the parent's own href) only owns its literal path, since a
// deeper path under that href belongs to a sibling child instead.
export function isNavItemActive(item: NavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

// Parents and children as one flat list, children first — so a longest-match
// lookup (resolveNavItem) naturally prefers a child's more specific
// permission over its parent's.
export function flattenNav(): NavItem[] {
  return NAV_CATEGORIES.flatMap((c) => c.items).flatMap((item) => (item.children ? [...item.children, item] : [item]));
}

// The single most specific nav item whose href matches `pathname` — e.g.
// "/rooms/types" resolves to the "Oda Tipleri" child (room_types.view), not
// the "Odalar" parent (rooms.view), even though both hrefs are a prefix.
export function resolveNavItem(pathname: string | null): NavItem | undefined {
  if (!pathname) return undefined;
  return flattenNav()
    .filter((item) => isNavItemActive(item, pathname))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

// Walks NAV_CATEGORIES in display order and returns the first page a role
// (unrestricted / hasPermission) is actually allowed to open — used to
// bounce a role away from a page it can't see instead of rendering a blank
// "no access" view. "Sistem" is last on purpose: every seeded role has
// settings.view, so it must never win over a real work page.
export function getFirstAccessibleRoute(
  { unrestricted, hasPermission }: { unrestricted: boolean; hasPermission: (key: string) => boolean }
): string | null {
  for (const category of NAV_CATEGORIES) {
    for (const item of category.items) {
      if (item.children) {
        const child = item.children.find((c) => unrestricted || hasPermission(c.permission));
        if (child) return child.href;
        continue;
      }
      if (unrestricted || hasPermission(item.permission)) return item.href;
    }
  }
  return null;
}
