import { Search } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export function Topbar({ title, subtitle, action }: TopbarProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink)]">{title}</h1>
        <p className="mt-1 text-xs text-[var(--muted)]">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {action}
      </div>
    </header>
  );
}
