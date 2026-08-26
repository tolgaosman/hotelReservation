import { Search } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export function Topbar({ title, subtitle, action }: TopbarProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] bg-[var(--canvas)] px-8 py-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--ink)]">{title}</h1>
        <p className="mt-1 text-xs text-[var(--muted)]">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {action}
        <div className="hidden items-center gap-2 rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 sm:flex w-56">
          <Search size={14} className="text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Ara..."
            className="w-full bg-transparent text-xs text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
          />
        </div>

      </div>
    </header>
  );
}
