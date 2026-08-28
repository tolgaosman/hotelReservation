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
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: string;
}

interface NavCategory {
  title: string;
  adminOnly?: boolean;
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

// Walks NAV_CATEGORIES in display order and returns the first page a role
// (isAdmin / unrestricted / hasPermission) is actually allowed to open —
// used to bounce a role away from a page it can't see instead of rendering
// a blank "no access" view.
export function getFirstAccessibleRoute(
  { isAdmin, unrestricted, hasPermission }: { isAdmin: boolean; unrestricted: boolean; hasPermission: (key: string) => boolean }
): string | null {
  for (const category of NAV_CATEGORIES) {
    if (category.adminOnly && !isAdmin) continue;
    for (const item of category.items) {
      if (unrestricted || hasPermission(item.permission)) return item.href;
    }
  }
  return null;
}
