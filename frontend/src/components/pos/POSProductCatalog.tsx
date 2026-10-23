import React, { useMemo, useState } from 'react';
import { RefreshCwIcon, ScanBarcodeIcon, SearchXIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../../types/product';
import { formatKES } from '../../utils/currency';
import { matchesProduct } from '../../utils/productSearch';
import { getStockStatus } from '../../utils/stock';
import { ProductThumb } from '../products/ProductThumb';

interface POSProductCatalogProps {
  products: Product[];
  cartQuantities: Map<number, number>;
  onAdd: (product: Product) => boolean;
  searchRef: React.RefObject<HTMLInputElement>;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

export function POSProductCatalog({ products, cartQuantities, onAdd, searchRef, loading, error, onRetry }: POSProductCatalogProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [brand, setBrand] = useState('All');

  const sellable = useMemo(() => products.filter((p) => p.status !== 'inactive'), [products]);
  const categoryOptions = useMemo(() => ['All', ...Array.from(new Set(sellable.map((p) => p.category))).sort()], [sellable]);
  const brandOptions = useMemo(() => Array.from(new Set(sellable.map((p) => p.brand))).sort(), [sellable]);

  const results = useMemo(
    () =>
    sellable.
    filter((p) => (category === 'All' || p.category === category) && (brand === 'All' || p.brand === brand) && matchesProduct(p, query)).
    sort((a, b) => Number(a.quantity <= 0) - Number(b.quantity <= 0) || a.name.localeCompare(b.name)),
    [sellable, category, brand, query]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setQuery('');
      return;
    }
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const lower = q.toLowerCase();
    const exact = sellable.find((p) => p.barcode === q || p.sku.toLowerCase() === lower || p.mpn.toLowerCase() === lower);
    const target = exact ?? (results.length === 1 ? results[0] : null);
    if (target) {
      if (onAdd(target)) setQuery('');
    } else if (results.length === 0) {
      toast.error(`No part matches "${q}"`);
    } else {
      toast.info(`${results.length} matches — click a part or refine your search`);
    }
  }

  return (
    <div className="flex flex-col lg:h-full lg:min-h-0">
      <div className="p-4 sm:px-5 sm:pt-5 space-y-3 border-b border-line bg-canvas">
        <div className="relative">
          <ScanBarcodeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-subtle pointer-events-none" aria-hidden="true" />
          <label htmlFor="pos-search" className="sr-only">
            Scan barcode or search by part name, SKU or part number
          </label>
          <input
            ref={searchRef}
            id="pos-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scan barcode or search name, SKU, part number, vehicle…"
            autoComplete="off"
            className="w-full h-12 rounded-xl border border-line bg-white pl-11 pr-20 text-[15px] text-ink placeholder:text-ink-subtle shadow-card focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
          
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {query &&
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="w-7 h-7 rounded-md grid place-items-center text-ink-subtle hover:text-ink hover:bg-canvas">
                <XIcon className="w-4 h-4" />
              </button>
            }
            <kbd className="hidden sm:inline-flex h-6 items-center rounded border border-line bg-canvas px-1.5 text-[11px] font-medium text-ink-subtle">F2</kbd>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto pb-0.5" role="radiogroup" aria-label="Filter by category">
            {categoryOptions.map((c) =>
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={category === c}
              onClick={() => setCategory(c)}
              className={`h-8 px-3 rounded-full text-[13px] font-medium whitespace-nowrap border transition-colors duration-150 ${
              category === c ? 'bg-navy text-white border-navy' : 'bg-white text-ink-muted border-line hover:text-ink hover:border-line-strong'}`
              }>
              
                {c}
              </button>
            )}
          </div>
          <label htmlFor="pos-brand" className="sr-only">
            Filter by brand
          </label>
          <select
            id="pos-brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="h-8 shrink-0 rounded-lg border border-line bg-white px-2.5 text-[13px] text-ink focus:outline-none focus:border-accent">
            
            <option value="All">All brands</option>
            {brandOptions.map((b) =>
            <option key={b} value={b}>
                {b}
              </option>
            )}
          </select>
        </div>
      </div>

      <div className="flex-1 lg:overflow-y-auto p-4 sm:p-5">
        <p className="text-xs text-ink-muted mb-3" aria-live="polite">
          {results.length} {results.length === 1 ? 'part' : 'parts'}
          {query && ` matching "${query}"`}
        </p>
        {error ? <div role="alert" className="mx-auto max-w-xl rounded-xl border border-danger/30 bg-danger-soft p-5 text-center"><p className="text-sm font-semibold text-danger">Could not load live products</p><p className="mt-1 text-sm text-danger/90">{error}</p><button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-danger/30 bg-white px-3 py-2 text-sm font-semibold text-ink"><RefreshCwIcon className="h-4 w-4" />Retry</button></div> : loading ? <p className="py-16 text-center text-sm text-ink-muted">Loading products from the API…</p> : results.length === 0 ?
        <div className="py-16 text-center">
            <SearchXIcon className="w-7 h-7 text-ink-subtle mx-auto" aria-hidden="true" />
            <p className="text-sm font-medium text-ink mt-3">No parts found</p>
            <p className="text-[13px] text-ink-muted mt-1">Check the barcode, or try the vehicle model or manufacturer part number.</p>
          </div> :

        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {results.map((p) => {
            const status = getStockStatus(p);
            const unavailable = status === 'out_of_stock' || status === 'discontinued';
            const inCart = cartQuantities.get(p.id) ?? 0;
            return (
              <li key={p.id}>
                  <button
                  type="button"
                  onClick={() => onAdd(p)}
                  disabled={unavailable}
                  className={`w-full h-full text-left bg-white border rounded-xl p-3.5 flex flex-col gap-2 transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                  inCart > 0 ? 'border-navy/40 ring-1 ring-navy/20' : 'border-line'} ${
                  unavailable ? 'opacity-60 cursor-not-allowed' : 'hover:border-accent hover:shadow-card'}`}>
                  
                    <div className="flex items-start justify-between gap-2">
                      <ProductThumb product={p} size="sm" />
                      {inCart > 0 && <span className="rounded-full bg-navy text-white text-[11px] font-semibold px-2 py-0.5 tabular-nums">{inCart} in cart</span>}
                    </div>
                    <p className="text-sm font-medium text-ink leading-snug line-clamp-2 min-h-[2.5rem]">{p.name}</p>
                    <p className="font-mono text-[11px] text-ink-subtle truncate">
                      {p.sku} · {p.mpn}
                    </p>
                    <div className="mt-auto pt-1 flex items-end justify-between gap-2">
                      <span className="text-[15px] font-semibold tabular-nums text-ink">{formatKES(p.sellingPrice)}</span>
                      <span
                      className={`text-xs font-medium tabular-nums whitespace-nowrap ${
                      status === 'in_stock' ? 'text-success' : status === 'low_stock' ? 'text-warning' : 'text-danger'}`
                      }>
                      
                        {status === 'discontinued' ? 'Discontinued' : status === 'out_of_stock' ? 'Out of stock' : `${p.quantity} in stock`}
                      </span>
                    </div>
                  </button>
                </li>);

          })}
          </ul>
        }
      </div>

      <div className="hidden lg:flex items-center gap-4 px-5 py-2.5 border-t border-line bg-white text-xs text-ink-muted">
        {[
        ['F2', 'Search'],
        ['Enter', 'Add scanned part'],
        ['F8', 'Hold sale'],
        ['F9', 'Checkout']].
        map(([key, label]) =>
        <span key={key} className="flex items-center gap-1.5">
            <kbd className="h-5 inline-flex items-center rounded border border-line bg-canvas px-1.5 text-[11px] font-medium text-ink">{key}</kbd>
            {label}
          </span>
        )}
      </div>
    </div>);

}