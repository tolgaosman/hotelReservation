import { Bell, Search } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-panel)]/80 px-8 py-5 backdrop-blur-sm">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">
          {title}
        </h1>
        <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 sm:flex">
          <Search size={15} className="text-[var(--color-muted)]" />
          <input
            type="text"
            placeholder="Search something..."
            className="w-40 bg-transparent text-xs text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]"
          />
        </div>

        <button
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] text-[var(--color-muted)] transition-colors duration-200 [transition-timing-function:var(--ease-organic)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
        >
          <Bell size={16} />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[var(--color-accent)]" />
        </button>

        <div className="flex items-center gap-2.5 rounded-[var(--radius-control)] border border-[var(--color-border)] py-1.5 pl-1.5 pr-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-xs font-semibold text-[var(--color-accent-ink)]">
            EO
          </span>
          <span className="text-xs font-medium text-[var(--color-ink)]">
            Ertaz Store
          </span>
        </div>
      </div>
    </header>
  );
}
