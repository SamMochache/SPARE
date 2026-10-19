import React from 'react';
import { format } from 'date-fns';
import { WALK_IN_CUSTOMER_ID } from '../../data/customers';
import { shopProfile } from '../../data/shop';
import type { CompletedSale } from '../../types/sales';
import { formatKES } from '../../utils/currency';
import { paymentMethodLabel } from '../../utils/sales';

interface ReceiptPreviewProps {
  sale: CompletedSale;
}

export function ReceiptPreview({ sale }: ReceiptPreviewProps) {
  const rule = <div className="border-t border-dashed border-line-strong my-3" role="presentation" />;
  const row = (label: string, value: React.ReactNode, strong = false) =>
  <div className={`flex justify-between gap-4 ${strong ? 'font-semibold text-ink' : ''}`}>
      <span className={strong ? '' : 'text-ink-muted'}>{label}</span>
      <span className="tabular-nums text-right">{value}</span>
    </div>;


  return (
    <article className="print-area mx-auto w-full max-w-[380px] bg-white border border-line rounded-lg shadow-card px-5 py-6 text-[13px] text-ink" aria-label={`Receipt ${sale.receiptNo}`}>
      <header className="text-center">
        <p className="text-base font-bold tracking-tight">{shopProfile.legalName}</p>
        <p className="text-ink-muted">{shopProfile.address}</p>
        <p className="text-ink-muted">
          {shopProfile.phone} · {shopProfile.email}
        </p>
        <p className="text-ink-muted">KRA PIN {shopProfile.kraPin}</p>
      </header>
      {rule}
      <div className="space-y-0.5">
        {row('Receipt no.', <span className="font-mono">{sale.receiptNo}</span>)}
        {row('Date', format(new Date(sale.createdAt), 'dd MMM yyyy, HH:mm'))}
        {row('Branch', sale.branch)}
        {row('Cashier', sale.cashier)}
        {row('Customer', sale.customer.name)}
        {sale.customer.id !== WALK_IN_CUSTOMER_ID && sale.customer.phone && row('Phone', sale.customer.phone)}
        {sale.customer.kraPin && row('Customer PIN', sale.customer.kraPin)}
      </div>
      {rule}
      <ul className="space-y-2">
        {sale.lines.map((l) =>
        <li key={l.productId}>
            <p className="font-medium">{l.name}</p>
            <div className="flex justify-between text-ink-muted tabular-nums">
              <span>
                {l.quantity} × {formatKES(l.unitPrice)}
              </span>
              <span className="text-ink">{formatKES(l.lineTotal)}</span>
            </div>
          </li>
        )}
      </ul>
      {rule}
      <div className="space-y-0.5">
        {row('Subtotal', formatKES(sale.totals.subtotal))}
        {sale.totals.discount > 0 && row(`Discount${sale.discount ? ` (${sale.discount.reason})` : ''}`, `−${formatKES(sale.totals.discount)}`)}
        {row('VAT 16%', formatKES(sale.totals.tax))}
        <div className="pt-1.5">{row('TOTAL', formatKES(sale.totals.total), true)}</div>
      </div>
      {rule}
      <div className="space-y-0.5">
        {sale.payments.map((p, i) =>
        <React.Fragment key={`${p.method}-${i}`}>{row(`${paymentMethodLabel[p.method]}${p.reference ? ` · ${p.reference}` : ''}`, formatKES(p.amount))}</React.Fragment>
        )}
        {row('Total paid', formatKES(sale.amountPaid), true)}
        {sale.change > 0 && row('Change', formatKES(sale.change))}
        {sale.balanceDue > 0 && <div className="text-warning">{row('Balance due (on account)', formatKES(sale.balanceDue), true)}</div>}
      </div>
      {sale.note &&
      <>
          {rule}
          <p className="text-ink-muted">Note: {sale.note}</p>
        </>
      }
      {rule}
      <footer className="text-center text-xs text-ink-muted space-y-0.5">
        <p>Thank you for shopping with us. Goods once sold are returnable within 7 days with this receipt.</p>
        <p className="font-semibold text-ink pt-1">DEMONSTRATION RECEIPT</p>
        <p>Not a fiscal (eTIMS) receipt · No payment was processed</p>
      </footer>
    </article>);

}