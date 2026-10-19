import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ScanBarcodeIcon, SearchIcon } from 'lucide-react';
import { useAppData } from '../../contexts/AppDataContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { formatKES } from '../../utils/currency';
import { matchesProduct } from '../../utils/productSearch';
import { StockBadge } from '../ui/StockBadge';

export function GlobalSearch() {
  const { products } = useAppData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useClickOutside<HTMLDivElement>(() => setOpen(false), open);

  const results = useMemo(() => query.trim().length < 2 ? [] : products.filter((p) => matchesProduct(p, query)).slice(0, 6), [products, query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  function goTo(q: string) {
    navigate(`/products?q=${encodeURIComponent(q)}`);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xl">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) goTo(query.trim());
        }}>
        
        <label htmlFor="global-search" className="sr-only">
          Search parts, SKU, barcode or product name
        </label>
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle pointer-events-none" aria-hidden="true" />
        <input
          ref={inputRef}
          id="global-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search parts, SKU, barcode…"
          autoComplete="off"
          className="w-full h-10 rounded-lg bg-canvas border border-transparent pl-9 pr-16 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors duration-150" />
        
        <kbd className="hidden md:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 h-5 items-center rounded border border-line bg-white px-1.5 text-[11px] font-medium text-ink-subtle">/</kbd>
      </form>

      <AnimatePresence>
        {open && query.trim().length >= 2 &&
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="absolute left-0 right-0 top-12 z-40 bg-white border border-line rounded-xl shadow-pop overflow-hidden origin-top">
          
            {results.length === 0 ?
          <div className="px-4 py-6 text-center">
                <ScanBarcodeIcon className="w-5 h-5 text-ink-subtle mx-auto" aria-hidden="true" />
                <p className="text-sm text-ink mt-2">No parts match "{query}"</p>
                <p className="text-xs text-ink-muted mt-0.5">Try a SKU, barcode, part number or vehicle model.</p>
              </div> :

          <ul className="py-1.5" role="listbox" aria-label="Search results">
                {results.map((p) =>
            <li key={p.id}>
                    <button type="button" onClick={() => goTo(p.sku)} className="w-full text-left px-4 py-2.5 hover:bg-canvas flex items-center gap-3 transition-colors duration-150">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                        <p className="text-xs text-ink-muted font-mono truncate">
                          {p.sku} · {p.mpn}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium tabular-nums">{formatKES(p.sellingPrice)}</p>
                        <div className="mt-0.5">
                          <StockBadge product={p} />
                        </div>
                      </div>
                    </button>
                  </li>
            )}
              </ul>
          }
            <button type="button" onClick={() => goTo(query.trim())} className="w-full border-t border-line px-4 py-2.5 text-left text-[13px] text-ink-muted hover:bg-canvas hover:text-ink">
              See all results in Products for "<span className="font-medium text-ink">{query.trim()}</span>"
            </button>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}