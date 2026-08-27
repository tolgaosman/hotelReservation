import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "./Pagination";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  filterOptions?: { label: string; value: string }[];
  filterFn?: (row: T, filterValue: string) => boolean;
  filterFixedHeight?: boolean;
  /** Presence of this makes the column header clickable to sort by the returned value. */
  sortValue?: (row: T) => string | number;
}

type SortDir = "asc" | "desc";
interface SortState {
  key: string;
  dir: SortDir;
}

function SortIndicator({ dir }: { dir: SortDir | null }) {
  if (dir === "asc") return <ArrowUp size={12} />;
  if (dir === "desc") return <ArrowDown size={12} />;
  return <ArrowUpDown size={12} />;
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
        aria-label="Sütunu filtrele"
        aria-expanded={open}
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
  const [sort, setSort] = useState<SortState | null>(null);

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

  const sortedRows = useMemo(() => {
    if (!sort) return filteredRows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return filteredRows;
    const getValue = col.sortValue;
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (av < bv) return -sign;
      if (av > bv) return sign;
      return 0;
    });
  }, [filteredRows, sort, columns]);

  // Three-state cycle per column: ascending -> descending -> back to the
  // original (unsorted) order, so a user can always return to how the data
  // was originally handed to the table.
  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const pageRows = sortedRows.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
          <thead>
            <tr className="bg-[var(--surface-alt)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: `${100 / columns.length}%` }}
                  className="px-4 py-3 text-center text-[11px] font-semibold tracking-[0.04em] text-[var(--muted)] uppercase"
                >
                  <div className="inline-flex items-center justify-center">
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-1 py-0.5 transition-colors duration-150 hover:bg-[var(--surface)] hover:text-[var(--ink)]",
                          sort?.key === col.key && "text-[var(--ink)]"
                        )}
                      >
                        {col.header}
                        <SortIndicator dir={sort?.key === col.key ? sort.dir : null} />
                      </button>
                    ) : (
                      col.header
                    )}
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
                    style={{ width: `${100 / columns.length}%` }}
                    className={cn("break-words px-4 py-3.5 text-center tabular-nums text-[var(--ink)]", col.className)}
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
