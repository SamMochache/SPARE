import React, { useState } from 'react';
import { LayoutGridIcon, ListIcon, SearchIcon, SlidersHorizontalIcon, XIcon } from 'lucide-react';
import { brands, categories, suppliers } from '../../data/catalog';
import type { StockFilter } from '../../utils/stock';
import { inputClass } from '../ui/formStyles';
import { SegmentedControl } from '../ui/SegmentedControl';
import type { ProductFilterState } from './useProductList';

export type ProductView = 'table' | 'grid';

interface ProductFiltersProps {
  filters: ProductFilterState;
  onChange: <K extends keyof ProductFilterState>(key: K, value: ProductFilterState[K]) => void;
  onReset: () => void;
  activeCount: number;
  view: ProductView;
  onViewChange: (view: ProductView) => void;
}

const stockOptions: {value: StockFilter;label: string;}[] = [
{ value: 'all', label: 'All stock levels' },
{ value: 'needs_reorder', label: 'Low & out of stock' },
{ value: 'in_stock', label: 'In stock' },
{ value: 'low_stock', label: 'Low stock' },
{ value: 'out_of_stock', label: 'Out of stock' },
{ value: 'discontinued', label: 'Discontinued' }];


const compactSelect = 'h-10 rounded-lg border border-line bg-white pl-3 pr-8 text-sm text-ink focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 cursor-pointer';

export function ProductFilters({ filters, onChange, onReset, activeCount, view, onViewChange }: ProductFiltersProps) {
  const extraActive = [filters.supplier !== 'all', filters.minPrice !== '', filters.maxPrice !== ''].filter(Boolean).length;
  const [moreOpen, setMoreOpen] = useState(extraActive > 0);

  return (
    <div className="p-4 border-b border-line space-y-3">
      <div className="flex flex-col xl:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle pointer-events-none" aria-hidden="true" />
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <input
            id="product-search"
            value={filters.q}
            onChange={(e) => onChange('q', e.target.value)}
            placeholder="Search name, SKU, barcode, part number or vehicle model"
            className={`${inputClass} pl-9 pr-9`} />
          
          {filters.q &&
          <button type="button" onClick={() => onChange('q', '')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded grid place-items-center text-ink-subtle hover:text-ink">
              <XIcon className="w-4 h-4" />
            </button>
          }
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Category" value={filters.category} onChange={(e) => onChange('category', e.target.value)} className={compactSelect}>
            <option value="all">All categories</option>
            {categories.map((c) =>
            <option key={c.name} value={c.name}>
                {c.name}
              </option>
            )}
          </select>
          <select aria-label="Brand" value={filters.brand} onChange={(e) => onChange('brand', e.target.value)} className={compactSelect}>
            <option value="all">All brands</option>
            {brands.map((b) =>
            <option key={b} value={b}>
                {b}
              </option>
            )}
          </select>
          <select aria-label="Stock status" value={filters.stock} onChange={(e) => onChange('stock', e.target.value as StockFilter)} className={compactSelect}>
            {stockOptions.map((o) =>
            <option key={o.value} value={o.value}>
                {o.label}
              </option>
            )}
          </select>
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
            className={`h-10 px-3 rounded-lg border flex items-center gap-2 text-sm font-medium transition-colors duration-150 ${
            moreOpen || extraActive > 0 ? 'border-navy/30 bg-canvas text-ink' : 'border-line text-ink-muted hover:text-ink'}`
            }>
            
            <SlidersHorizontalIcon className="w-4 h-4" aria-hidden="true" />
            More
            {extraActive > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-navy text-white text-[11px] font-semibold grid place-items-center">{extraActive}</span>}
          </button>
          <SegmentedControl
            ariaLabel="View"
            iconOnly
            value={view}
            onChange={onViewChange}
            options={[
            { value: 'table', label: 'Table view', icon: ListIcon },
            { value: 'grid', label: 'Grid view', icon: LayoutGridIcon }]
            } />
          
        </div>
      </div>

      {moreOpen &&
      <div className="flex flex-wrap items-end gap-3 pt-1">
          <div>
            <label htmlFor="filter-supplier" className="block text-xs font-medium text-ink-muted mb-1">
              Supplier
            </label>
            <select id="filter-supplier" value={filters.supplier} onChange={(e) => onChange('supplier', e.target.value)} className={compactSelect}>
              <option value="all">All suppliers</option>
              {suppliers.map((s) =>
            <option key={s} value={s}>
                  {s}
                </option>
            )}
            </select>
          </div>
          <fieldset>
            <legend className="block text-xs font-medium text-ink-muted mb-1">Selling price (KES)</legend>
            <div className="flex items-center gap-2">
              <input aria-label="Minimum price" inputMode="numeric" value={filters.minPrice} onChange={(e) => onChange('minPrice', e.target.value.replace(/[^\d.]/g, ''))} placeholder="Min" className={`${inputClass} w-28 tabular-nums`} />
              <span className="text-ink-subtle">–</span>
              <input aria-label="Maximum price" inputMode="numeric" value={filters.maxPrice} onChange={(e) => onChange('maxPrice', e.target.value.replace(/[^\d.]/g, ''))} placeholder="Max" className={`${inputClass} w-28 tabular-nums`} />
            </div>
          </fieldset>
        </div>
      }

      {activeCount > 0 &&
      <div className="flex items-center gap-2 text-[13px] text-ink-muted">
          <span>
            {activeCount} {activeCount === 1 ? 'filter' : 'filters'} applied
          </span>
          <button type="button" onClick={onReset} className="font-medium text-accent-strong hover:underline">
            Clear all
          </button>
        </div>
      }
    </div>);

}