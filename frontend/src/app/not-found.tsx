import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--canvas)] px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-[var(--surface-alt)] text-[var(--muted)]">
        <Compass size={24} strokeWidth={1.75} />
      </span>
      <h1 className="text-2xl font-bold text-[var(--ink)]">Sayfa bulunamadı</h1>
      <p className="max-w-sm text-sm text-[var(--muted)]">
        Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
      >
        Panele dön
      </Link>
    </div>
  );
}
