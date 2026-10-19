import React, { useEffect, useState } from 'react';
import { MinusIcon, PlusIcon, XIcon } from 'lucide-react';
import { formatKES } from '../../utils/currency';
import type { CartItem } from './usePointOfSale';

interface CartLineItemProps {
  item: CartItem;
  onSetQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

export function CartLineItem({ item, onSetQuantity, onRemove }: CartLineItemProps) {
  const { product, quantity } = item;
  const [draft, setDraft] = useState(String(quantity));
  const atMax = quantity >= product.quantity;

  useEffect(() => setDraft(String(quantity)), [quantity]);

  function commit() {
    const n = parseInt(draft, 10);
    if (Number.isNaN(n) || n < 1) {
      setDraft(String(quantity));
      return;
    }
    onSetQuantity(product.id, n);
  }

  const stepBtn = 'w-8 h-8 grid place-items-center text-ink-muted hover:text-ink hover:bg-canvas disabled:opacity-35 disabled:pointer-events-none transition-colors duration-150';

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink leading-snug">{product.name}</p>
          <p className="text-xs text-ink-muted mt-0.5">
            <span className="font-mono">{product.sku}</span>
            <span className="tabular-nums"> · {formatKES(product.sellingPrice)} each</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(product.id)}
          aria-label={`Remove ${product.name}`}
          className="w-7 h-7 -mr-1 rounded-md grid place-items-center text-ink-subtle hover:text-danger hover:bg-danger-soft transition-colors duration-150">
          
          <XIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg border border-line overflow-hidden bg-white">
            <button type="button" className={stepBtn} onClick={() => onSetQuantity(product.id, quantity - 1)} disabled={quantity <= 1} aria-label="Decrease quantity">
              <MinusIcon className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={product.quantity}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
              }}
              aria-label={`Quantity for ${product.name}`}
              className="w-10 h-8 text-center text-sm font-medium tabular-nums border-x border-line focus:outline-none focus:bg-accent-soft" />
            
            <button type="button" className={stepBtn} onClick={() => onSetQuantity(product.id, quantity + 1)} disabled={atMax} aria-label="Increase quantity">
              <PlusIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className={`text-xs tabular-nums ${atMax ? 'text-warning font-medium' : 'text-ink-subtle'}`}>{atMax ? 'Max stock' : `of ${product.quantity}`}</span>
        </div>
        <p className="text-sm font-semibold tabular-nums text-ink">{formatKES(product.sellingPrice * quantity)}</p>
      </div>
    </li>);

}