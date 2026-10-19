import React from 'react';
import { format } from 'date-fns';
import { PauseCircleIcon } from 'lucide-react';
import type { Customer } from '../../types/customer';
import type { Product } from '../../types/product';
import type { HeldSale } from '../../types/sales';
import { formatKES } from '../../utils/currency';
import { computeTotals } from '../../utils/sales';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface HeldSalesModalProps {
  open: boolean;
  onClose: () => void;
  heldSales: HeldSale[];
  products: Product[];
  customers: Customer[];
  cartHasItems: boolean;
  onResume: (held: HeldSale) => void;
  onDiscard: (id: string) => void;
}

export function HeldSalesModal({ open, onClose, heldSales, products, customers, cartHasItems, onResume, onDiscard }: HeldSalesModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Held sales" description="Parked sales stay on this device until resumed or discarded." size="md">
      {heldSales.length === 0 ?
      <div className="py-10 text-center">
          <PauseCircleIcon className="w-7 h-7 text-ink-subtle mx-auto" aria-hidden="true" />
          <p className="text-sm font-medium text-ink mt-3">No held sales</p>
          <p className="text-[13px] text-ink-muted mt-1">Press F8 or Hold to park a sale while you serve another customer.</p>
        </div> :

      <>
          {cartHasItems && <p className="text-[13px] text-ink-muted mb-3">Your current cart will be held automatically when you resume another sale.</p>}
          <ul className="divide-y divide-line border border-line rounded-lg">
            {heldSales.map((h) => {
            const customer = customers.find((c) => c.id === h.customerId);
            const lines = h.lines.flatMap((l) => {
              const p = products.find((x) => x.id === l.productId);
              return p ? [{ unitPrice: p.sellingPrice, quantity: l.quantity, name: p.name }] : [];
            });
            const totals = computeTotals(lines, h.discount);
            return (
              <li key={h.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {customer?.name ?? 'Walk-in Customer'} <span className="text-ink-subtle font-normal">· held at {format(new Date(h.heldAt), 'HH:mm')}</span>
                    </p>
                    <p className="text-xs text-ink-muted truncate mt-0.5">
                      {totals.itemCount} items · {lines.map((l) => l.name).join(', ')}
                    </p>
                    {h.note && <p className="text-xs text-ink-muted italic mt-0.5 truncate">"{h.note}"</p>}
                  </div>
                  <div className="flex items-center gap-2 sm:text-right">
                    <span className="text-sm font-semibold tabular-nums mr-1">{formatKES(totals.total)}</span>
                    <Button size="sm" variant="ghost" onClick={() => onDiscard(h.id)}>
                      Discard
                    </Button>
                    <Button
                    size="sm"
                    variant="navy"
                    onClick={() => {
                      onResume(h);
                      onClose();
                    }}>
                    
                      Resume
                    </Button>
                  </div>
                </li>);

          })}
          </ul>
        </>
      }
    </Modal>);

}