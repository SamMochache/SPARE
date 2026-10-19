import React from 'react';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, PencilIcon } from 'lucide-react';
import type { Product } from '../../types/product';
import { formatKES } from '../../utils/currency';
import { getStockStatus } from '../../utils/stock';
import { StatusBadge } from '../ui/StatusBadge';
import { StockBadge } from '../ui/StockBadge';
import { ProductThumb } from './ProductThumb';
import type { SortKey, SortState } from './useProductList';

interface ProductTableProps {
  items: Product[];
  sort: SortState;
  onSort: (key: SortKey) => void;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
}

const columns: {key: SortKey | null;label: string;align?: 'right';className?: string;}[] = [
{ key: 'name', label: 'Product', className: 'pl-4 min-w-[260px]' },
{ key: 'sku', label: 'SKU / Part no.' },
{ key: 'category', label: 'Category' },
{ key: null, label: 'Bin' },
{ key: 'sellingPrice', label: 'Price', align: 'right' },
{ key: 'quantity', label: 'Stock', align: 'right' },
{ key: null, label: 'Status' }];


export function ProductTable({ items, sort, onSort, onView, onEdit }: ProductTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-ink-muted bg-canvas/60 border-b border-line">
            {columns.map((col) => {
              const active = col.key !== null && sort.key === col.key;
              const SortIcon = !active ? ArrowUpDownIcon : sort.dir === 'asc' ? ArrowUpIcon : ArrowDownIcon;
              return (
                <th
                  key={col.label}
                  scope="col"
                  aria-sort={active ? sort.dir === 'asc' ? 'ascending' : 'descending' : undefined}
                  className={`font-medium px-3 py-2.5 whitespace-nowrap ${col.align === 'right' ? 'text-right' : ''} ${col.className ?? ''}`}>
                  
                  {col.key ?
                  <button
                    type="button"
                    onClick={() => onSort(col.key as SortKey)}
                    className={`inline-flex items-center gap-1 hover:text-ink transition-colors duration-150 ${active ? 'text-ink' : ''} ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
                    
                      {col.label}
                      <SortIcon className={`w-3.5 h-3.5 ${active ? '' : 'opacity-40'}`} aria-hidden="true" />
                    </button> :

                  col.label
                  }
                </th>);

            })}
            <th scope="col" className="px-4 py-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((p) => {
            const status = getStockStatus(p);
            return (
              <tr key={p.id} onClick={() => onView(p)} className="cursor-pointer hover:bg-canvas/70 transition-colors duration-150">
                <td className="pl-4 pr-3 py-3">
                  <div className="flex items-center gap-3">
                    <ProductThumb product={p} />
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(p);
                        }}
                        className="font-medium text-ink text-left hover:underline focus-visible:outline-none focus-visible:underline">
                        
                        {p.name}
                      </button>
                      <p className="text-xs text-ink-muted truncate max-w-[320px]">
                        {p.brand} · {p.vehicleMake} {p.compatibleModels.slice(0, 2).join(', ')}
                        {p.compatibleModels.length > 2 && ` +${p.compatibleModels.length - 2}`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <p className="font-mono text-[13px] text-ink">{p.sku}</p>
                  <p className="font-mono text-xs text-ink-muted">{p.mpn}</p>
                </td>
                <td className="px-3 py-3 text-ink-muted whitespace-nowrap">{p.category}</td>
                <td className="px-3 py-3 font-mono text-[13px] text-ink-muted whitespace-nowrap">{p.binLocation || '—'}</td>
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <p className="font-medium tabular-nums text-ink">{formatKES(p.sellingPrice)}</p>
                  <p className="text-xs text-ink-muted tabular-nums">Cost {formatKES(p.costPrice)}</p>
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <p className={`font-semibold tabular-nums ${status === 'out_of_stock' ? 'text-danger' : status === 'low_stock' ? 'text-warning' : 'text-ink'}`}>{p.quantity}</p>
                  <p className="text-xs text-ink-muted tabular-nums">Reorder {p.reorderLevel}</p>
                </td>
                <td className="px-3 py-3">
                  {p.status === 'inactive' ? <StatusBadge tone="neutral">Inactive</StatusBadge> : <StockBadge product={p} />}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(p);
                    }}
                    aria-label={`Edit ${p.name}`}
                    title="Edit"
                    className="w-8 h-8 rounded-lg grid place-items-center text-ink-muted hover:text-ink hover:bg-white border border-transparent hover:border-line transition-colors duration-150">
                    
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>);

          })}
        </tbody>
      </table>
    </div>);

}