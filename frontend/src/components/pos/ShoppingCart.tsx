import React, { useState } from 'react';
import { PauseCircleIcon, PercentIcon, ScanBarcodeIcon, StickyNoteIcon, Trash2Icon, XIcon } from 'lucide-react';
import type { Customer } from '../../types/customer';
import type { Discount, SaleTotals } from '../../types/sales';
import { formatKES } from '../../utils/currency';
import { Button } from '../ui/Button';
import { textareaClass } from '../ui/formStyles';
import { CartLineItem } from './CartLineItem';
import { CustomerPicker } from './CustomerPicker';
import type { CartItem } from './usePointOfSale';

interface ShoppingCartProps {
  items: CartItem[];
  totals: SaleTotals;
  customer: Customer;
  customers: Customer[];
  discount: Discount | null;
  note: string;
  heldCount: number;
  onSetQuantity: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
  onSelectCustomer: (id: number) => void;
  onCreateCustomer: (input: {name: string;phone: string;}) => Promise<void>;
  onSearchCustomers: (query: string) => Promise<void>;
  onOpenDiscount: () => void;
  onRemoveDiscount: () => void;
  onNoteChange: (note: string) => void;
  onHold: () => void;
  onClear: () => void;
  onCheckout: () => void;
  onOpenHeld: () => void;
}

export function ShoppingCart(props: ShoppingCartProps) {
  const { items, totals, customer, customers, discount, note, heldCount } = props;
  const [noteOpen, setNoteOpen] = useState(false);
  const empty = items.length === 0;
  const showNote = noteOpen || note.length > 0;

  return (
    <div className="flex flex-col lg:h-full lg:min-h-0">
      <div className="px-4 pt-4 pb-3 border-b border-line space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-ink">Current sale</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={props.onOpenHeld}
              className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink hover:bg-canvas transition-colors duration-150">
              
              <PauseCircleIcon className="w-4 h-4" aria-hidden="true" />
              Held
              {heldCount > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-accent text-navy-950 text-[11px] font-semibold grid place-items-center tabular-nums">{heldCount}</span>}
            </button>
            <button
              type="button"
              onClick={props.onClear}
              disabled={empty}
              aria-label="Clear cart"
              title="Clear cart"
              className="w-8 h-8 rounded-lg grid place-items-center text-ink-muted hover:text-danger hover:bg-danger-soft disabled:opacity-35 disabled:pointer-events-none transition-colors duration-150">
              
              <Trash2Icon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <CustomerPicker customer={customer} customers={customers} onSelect={props.onSelectCustomer} onCreate={props.onCreateCustomer} onSearch={props.onSearchCustomers} />
      </div>

      <div className="flex-1 min-h-[160px] lg:overflow-y-auto">
        {empty ?
        <div className="h-full flex flex-col items-center justify-center text-center px-8 py-12">
            <span className="w-11 h-11 rounded-full bg-canvas grid place-items-center text-ink-subtle">
              <ScanBarcodeIcon className="w-5 h-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium text-ink mt-3">No items yet</p>
            <p className="text-[13px] text-ink-muted mt-1">Scan a barcode or click a part to add it to this sale.</p>
          </div> :

        <ul className="divide-y divide-line" aria-label="Cart items">
            {items.map((item) =>
          <CartLineItem key={item.product.id} item={item} onSetQuantity={props.onSetQuantity} onRemove={props.onRemove} />
          )}
          </ul>
        }
      </div>

      <div className="border-t border-line px-4 pt-3 pb-4 space-y-3 bg-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNoteOpen((o) => !o)}
            className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[13px] font-medium border transition-colors duration-150 ${
            showNote ? 'border-navy/30 bg-canvas text-ink' : 'border-line text-ink-muted hover:text-ink'}`
            }>
            
            <StickyNoteIcon className="w-3.5 h-3.5" aria-hidden="true" />
            Note
          </button>
          <button
            type="button"
            onClick={props.onOpenDiscount}
            disabled={empty}
            className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[13px] font-medium border border-line text-ink-muted hover:text-ink disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150">
            
            <PercentIcon className="w-3.5 h-3.5" aria-hidden="true" />
            {discount ? 'Change discount' : 'Discount'}
          </button>
        </div>

        {showNote &&
        <div>
            <label htmlFor="sale-note" className="sr-only">
              Transaction note
            </label>
            <textarea
            id="sale-note"
            rows={2}
            value={note}
            onChange={(e) => props.onNoteChange(e.target.value)}
            placeholder="e.g. Vehicle reg KDA 123X, fitted at customer's garage"
            className={textareaClass} />
          
          </div>
        }

        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between text-ink-muted">
            <dt>
              Subtotal · {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'}
            </dt>
            <dd className="tabular-nums text-ink">{formatKES(totals.subtotal)}</dd>
          </div>
          {discount &&
          <div className="flex justify-between items-center text-ink-muted">
              <dt className="flex items-center gap-1.5 min-w-0">
                <span className="truncate">
                  Discount ({discount.type === 'percent' ? `${discount.value}%` : 'fixed'} · {discount.reason})
                </span>
                <button type="button" onClick={props.onRemoveDiscount} aria-label="Remove discount" className="w-5 h-5 rounded grid place-items-center text-ink-subtle hover:text-danger hover:bg-danger-soft shrink-0">
                  <XIcon className="w-3 h-3" />
                </button>
              </dt>
              <dd className="tabular-nums text-success whitespace-nowrap">−{formatKES(totals.discount)}</dd>
            </div>
          }
          <div className="flex justify-between text-ink-muted">
            <dt>VAT 16%</dt>
            <dd className="tabular-nums text-ink">{formatKES(totals.tax)}</dd>
          </div>
          <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-line">
            <dt className="text-[15px] font-semibold text-ink">Total</dt>
            <dd className="text-2xl font-semibold tabular-nums text-ink tracking-tight">{formatKES(totals.total)}</dd>
          </div>
        </dl>

        <div className="grid grid-cols-[auto_1fr] gap-2">
          <Button size="lg" onClick={props.onHold} disabled={empty} title="Hold sale (F8)">
            Hold
          </Button>
          <Button size="lg" variant="primary" onClick={props.onCheckout} disabled={empty} title="Complete sale (F9)">
            Complete sale
            <kbd className="hidden xl:inline-flex h-5 items-center rounded bg-navy-950/10 px-1.5 text-[11px] font-semibold">F9</kbd>
          </Button>
        </div>
      </div>
    </div>);

}