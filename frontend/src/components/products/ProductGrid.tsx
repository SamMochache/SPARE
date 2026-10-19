import React from 'react';
import { MapPinIcon } from 'lucide-react';
import type { Product } from '../../types/product';
import { formatKES } from '../../utils/currency';
import { StockBadge } from '../ui/StockBadge';
import { ProductThumb } from './ProductThumb';

interface ProductGridProps {
  items: Product[];
  onView: (product: Product) => void;
}

export function ProductGrid({ items, onView }: ProductGridProps) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 p-4">
      {items.map((p) =>
      <li key={p.id}>
          <button
          type="button"
          onClick={() => onView(p)}
          className="w-full h-full text-left border border-line rounded-xl p-4 flex flex-col gap-3 hover:border-line-strong hover:shadow-card transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
          
            <div className="flex items-start justify-between gap-3">
              <ProductThumb product={p} size="lg" />
              <StockBadge product={p} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink leading-snug line-clamp-2 min-h-[2.5rem]">{p.name}</p>
              <p className="font-mono text-xs text-ink-muted mt-1 truncate">
                {p.sku} · {p.mpn}
              </p>
              <p className="text-xs text-ink-muted mt-0.5 truncate">
                {p.vehicleMake} {p.compatibleModels.join(', ')}
              </p>
            </div>
            <div className="mt-auto pt-3 border-t border-line flex items-end justify-between gap-2">
              <div>
                <p className="text-[15px] font-semibold tabular-nums text-ink">{formatKES(p.sellingPrice)}</p>
                <p className="text-xs text-ink-muted flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3" aria-hidden="true" />
                  {p.binLocation || 'No bin'}
                </p>
              </div>
              <p className="text-right">
                <span className="text-lg font-semibold tabular-nums text-ink">{p.quantity}</span>
                <span className="block text-xs text-ink-muted">on hand</span>
              </p>
            </div>
          </button>
        </li>
      )}
    </ul>);

}