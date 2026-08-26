import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "./Pagination";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  filterOptions?: { label: string; value: string }[];
  filterFn?: (row: T, filterValue: string) => boolean;
  filterFixedHeight?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
}

function ColumnFilter({
  options,
  value,
  onChange,
  fixedHeight,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
  fixedHeight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const active = value && value !== "all";

  return (
    <div className="relative ml-1.5 inline-block align-middle" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "flex size-5 items-center justify-center rounded-[var(--radius-pill)] transition-colors duration-150",
          open || active ? "bg-[var(--surface-alt)] text-[var(--ink)]" : "text-[var(--muted)] hover:bg-[var(--surface-alt)] hover:text-[var(--ink)]"
        )}
      >
        <Filter size={12} />
      </button>
      {open && (
        <div
          className={cn(
            "absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 min-w-32 w-max overflow-y-auto rounded-[var(--radius-control)]",
            fixedHeight ? "h-60" : "max-h-60",
            "border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-pop)] font-sans normal-case tracking-normal",
            "flex flex-col divide-y divide-[var(--line)]"
          )}
        >
          <button
            type="button"
            onClick={() => {
              onChange("all");
              setOpen(false);
            }}
            className={cn(
              "block w-full px-4 py-2.5 text-center text-[12px] font-medium transition-colors duration-150 hover:bg-[var(--surface-alt)]",
              value === "all" || !value ? "text-[var(--accent)] bg-[var(--accent-soft)]" : "text-[var(--ink)]"
            )}
          >
            Tümü
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "block w-full px-4 py-2.5 text-center text-[12px] font-medium transition-colors duration-150 hover:bg-[var(--surface-alt)]",
                value === opt.value ? "text-[var(--accent)] bg-[var(--accent-soft)]" : "text-[var(--ink)]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DataTable<T>({ columns, rows, getRowKey, onRowClick, pageSize = 10 }: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      return columns.every((col) => {
        const val = filters[col.key];
        if (!val || val === "all") return true;
        if (col.filterFn) return col.filterFn(row, val);
        return true;
      });
    });
  }, [rows, columns, filters]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const pageRows = filteredRows.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  return (
    <div>
      <div>
        <table className="w-full min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--surface-alt)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "whitespace-nowrap px-6 py-3 text-[11px] font-semibold tracking-[0.04em] text-[var(--muted)] uppercase",
                    col.align === "right" && "text-right",
                    col.align === "left" && "text-left",
                    (!col.align || col.align === "center") && "text-center"
                  )}
                >
                  <div className={cn("inline-flex items-center", col.align === "right" && "justify-end", col.align === "left" && "justify-start", (!col.align || col.align === "center") && "justify-center")}>
                    {col.header}
                    {col.filterOptions && (
                      <ColumnFilter
                        options={col.filterOptions}
                        value={filters[col.key] || "all"}
                        onChange={(val) => {
                          setFilters((prev) => ({ ...prev, [col.key]: val }));
                          setPage(1);
                        }}
                        fixedHeight={col.filterFixedHeight}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {pageRows.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "transition-colors duration-150",
                  onRowClick ? "cursor-pointer hover:bg-[var(--surface-alt)]" : "hover:bg-[var(--surface-alt)]"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "whitespace-nowrap px-6 py-3.5 text-[var(--ink)]",
                      col.align === "right" && "text-right tabular-nums",
                      col.align === "left" && "text-left",
                      (!col.align || col.align === "center") && "text-center",
                      col.className
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={clampedPage}
        pageCount={pageCount}
        onPageChange={setPage}
        totalLabel={`${filteredRows.length} kayıttan ${pageRows.length === 0 ? 0 : (clampedPage - 1) * pageSize + 1}–${(clampedPage - 1) * pageSize + pageRows.length} arası`}
      />
    </div>
  );
}
