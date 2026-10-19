import React from 'react';
import { Link } from 'react-router-dom';
import { PackageCheckIcon } from 'lucide-react';
import type { Product } from '../../types/product';
import { getStockStatus } from '../../utils/stock';
import { Panel } from '../ui/Panel';
import { StockBadge } from '../ui/StockBadge';

interface LowStockAlertsProps {
  items: Product[];
  className?: string;
}

export function LowStockAlerts({ items, className = '' }: LowStockAlertsProps) {
  const sorted = [...items].sort((a, b) => a.quantity / Math.max(a.reorderLevel, 1) - b.quantity / Math.max(b.reorderLevel, 1));
  const outCount = items.filter((p) => getStockStatus(p) === 'out_of_stock').length;

  return (
    <Panel
      className={className}
      title="Stock alerts"
      description={items.length === 0 ? 'All parts above reorder level' : `${outCount} out of stock · ${items.length - outCount} running low`}
      actions={
      items.length > 0 ?
      <Link to="/products?stock=needs_reorder" className="text-[13px] font-medium text-accent-strong hover:underline whitespace-nowrap">
            View all
          </Link> :
      undefined
      }
      bodyClassName="px-5 pb-4">
      
      {items.length === 0 ?
      <div className="py-8 text-center">
          <PackageCheckIcon className="w-6 h-6 text-success mx-auto" aria-hidden="true" />
          <p className="text-sm text-ink mt-2">No stock alerts</p>
        </div> :

      <ul className="divide-y divide-line">
          {sorted.slice(0, 6).map((p) => {
          const pct = Math.min(100, p.quantity / Math.max(p.reorderLevel, 1) * 100);
          const out = p.quantity <= 0;
          return (
            <li key={p.id} className="py-3 first:pt-0">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/products?q=${encodeURIComponent(p.sku)}`} className="min-w-0 group">
                    <p className="text-sm font-medium text-ink truncate group-hover:underline">{p.name}</p>
                    <p className="text-xs text-ink-muted font-mono">
                      {p.sku} · Bin {p.binLocation}
                    </p>
                  </Link>
                  <StockBadge product={p} />
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-canvas overflow-hidden">
                    <div className={`h-full rounded-full ${out ? 'bg-danger' : 'bg-warning'}`} style={{ width: `${Math.max(pct, out ? 0 : 6)}%` }} />
                  </div>
                  <p className="text-xs text-ink-muted tabular-nums whitespace-nowrap">
                    <span className={`font-semibold ${out ? 'text-danger' : 'text-ink'}`}>{p.quantity}</span> / reorder at {p.reorderLevel}
                  </p>
                </div>
              </li>);

        })}
        </ul>
      }
    </Panel>);

}