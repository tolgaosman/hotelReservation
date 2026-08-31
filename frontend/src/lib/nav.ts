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
    items: [
      { href: "/employees", label: "Çalışanlar", icon: IdCard, permission: "employees.view" },
      { href: "/roles", label: "Roller", icon: ShieldCheck, permission: "roles.view" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { href: "/settings", label: "Ayarlar", icon: Settings, permission: "settings.view" },
      { href: "/audit-logs", label: "Aktivite Kayıtları", icon: ScrollText, permission: "audit_logs.view" },
    ],
  },
];

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
      if (unrestricted || hasPermission(item.permission)) return item.href;
    }
  }
  return null;
}
