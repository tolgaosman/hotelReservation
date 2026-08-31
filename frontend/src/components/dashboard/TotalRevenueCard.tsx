import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Payment } from "@/lib/types";

interface RecentPayment {
  payment: Payment;
  guestName: string;
  roomNumber: string;
}

export function TotalRevenueCard({
  totalCollected,
  outstanding,
  activeReservations,
  recentPayments,
}: {
  totalCollected: number;
  outstanding: number;
  activeReservations: number;
  recentPayments: RecentPayment[];
}) {
  const [page, setPage] = useState(1);
  const pageSize = 16;
  const pageCount = Math.max(1, Math.ceil(recentPayments.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const pageItems = recentPayments.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  return (
    <Card title="Toplam Tahsilat" subtitle="Tüm rezervasyonlar" className="flex h-full flex-col">
      <div className="px-6 pb-5">
        <p className="text-[32px] leading-none font-bold text-[var(--ink)]">{formatCurrency(totalCollected)}</p>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-[var(--radius-control)] bg-[var(--warn-soft)] px-3 py-2.5">
            <p className="text-[11px] font-medium text-[var(--warn)]">Kalan Bakiye</p>
            <p className="mt-1 text-sm font-bold text-[var(--ink)]">{formatCurrency(outstanding)}</p>
          </div>
          <div className="rounded-[var(--radius-control)] bg-[var(--accent-soft)] px-3 py-2.5">
            <p className="text-[11px] font-medium text-[var(--accent-ink)]">Aktif Rezervasyon</p>
            <p className="mt-1 text-sm font-bold text-[var(--ink)]">{activeReservations}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 border-t border-[var(--color-line)]">
        <div className="px-6 py-4">
          <p className="mb-3 shrink-0 text-[11px] font-semibold tracking-[0.04em] text-[var(--color-muted)] uppercase">Son Ödemeler</p>
          <div className="flex flex-col">
            {pageItems.length === 0 ? (
              <p className="text-xs text-[var(--muted)] py-3">Henüz ödeme kaydı yok.</p>
            ) : (
              pageItems.map(({ payment, guestName, roomNumber }, i) => (
                <div
                  key={payment.id}
                  // Force Next.js recompile to clear ReferenceError: cn
                  className={cn(
                    "flex items-center justify-between gap-2 text-xs py-2.5",
                    i > 0 && "border-t border-[var(--color-line)]/60"
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--ink)]">{guestName}</p>
                    <p className="text-[var(--muted)]">
                      Oda {roomNumber} · {formatDateTime(payment.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-[var(--ok)]">+{formatCurrency(payment.amount)}</span>
                </div>
              ))
            )}
            {/* Pad the page out to a constant row count so the card never resizes when a later page has fewer payments than earlier ones. */}
            {Array.from({ length: Math.max(0, pageSize - pageItems.length) }).map((_, i) => (
              <div key={`filler-${i}`} aria-hidden className="py-2.5">
                <span className="invisible block text-xs leading-tight">
                  &nbsp;
                  <br />
                  &nbsp;
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-auto">
          <Pagination
            page={clampedPage}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </div>
      </div>
    </Card>
  );
}
