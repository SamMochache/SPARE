import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({ page, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange, pageSizeOptions = [10, 25, 50] }: PaginationProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => windowStart + i);

  const pageBtn = 'min-w-8 h-8 px-2 rounded-md text-[13px] font-medium tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50';

  return (
    <nav className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-line" aria-label="Pagination">
      <div className="flex items-center gap-3 text-[13px] text-ink-muted">
        <span className="tabular-nums">
          {start}–{end} of {totalItems}
        </span>
        <label className="flex items-center gap-2">
          <span className="sr-only sm:not-sr-only">Rows</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-md border border-line bg-white px-2 text-[13px] text-ink focus:outline-none focus:border-accent">
            
            {pageSizeOptions.map((size) =>
            <option key={size} value={size}>
                {size}
              </option>
            )}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page" className={`${pageBtn} text-ink-muted hover:bg-canvas disabled:opacity-40 disabled:pointer-events-none`}>
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        {pages.map((p) =>
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`${pageBtn} ${p === page ? 'bg-navy text-white' : 'text-ink-muted hover:bg-canvas'}`}>
          
            {p}
          </button>
        )}
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Next page" className={`${pageBtn} text-ink-muted hover:bg-canvas disabled:opacity-40 disabled:pointer-events-none`}>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </nav>);

}