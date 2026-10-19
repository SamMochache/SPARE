import { format } from 'date-fns';
import { shopProfile } from '../data/shop';
import type { CompletedSale } from '../types/sales';
import { formatKES } from './currency';
import { paymentMethodLabel } from './sales';

const WIDTH = 42;

function row(left: string, right: string): string {
  const space = Math.max(1, WIDTH - left.length - right.length);
  return `${left}${' '.repeat(space)}${right}`;
}

function center(text: string): string {
  const pad = Math.max(0, Math.floor((WIDTH - text.length) / 2));
  return `${' '.repeat(pad)}${text}`;
}

export function buildReceiptText(sale: CompletedSale): string {
  const rule = '-'.repeat(WIDTH);
  const lines: string[] = [
  center(shopProfile.legalName.toUpperCase()),
  center(shopProfile.address),
  center(`Tel ${shopProfile.phone}`),
  center(`KRA PIN ${shopProfile.kraPin}`),
  rule,
  row('Receipt', sale.receiptNo),
  row('Date', format(new Date(sale.createdAt), 'dd MMM yyyy, HH:mm')),
  row('Branch', sale.branch),
  row('Cashier', sale.cashier),
  row('Customer', sale.customer.name),
  rule];

  sale.lines.forEach((l) => {
    lines.push(l.name.slice(0, WIDTH));
    lines.push(row(`  ${l.quantity} x ${formatKES(l.unitPrice)}`, formatKES(l.lineTotal)));
  });
  lines.push(rule);
  lines.push(row('Subtotal', formatKES(sale.totals.subtotal)));
  if (sale.totals.discount > 0) lines.push(row('Discount', `-${formatKES(sale.totals.discount)}`));
  lines.push(row('VAT 16%', formatKES(sale.totals.tax)));
  lines.push(row('TOTAL', formatKES(sale.totals.total)));
  lines.push(rule);
  sale.payments.forEach((p) => lines.push(row(paymentMethodLabel[p.method], formatKES(p.amount))));
  lines.push(row('Total paid', formatKES(sale.amountPaid)));
  if (sale.change > 0) lines.push(row('Change', formatKES(sale.change)));
  if (sale.balanceDue > 0) lines.push(row('Balance due', formatKES(sale.balanceDue)));
  lines.push(rule);
  lines.push(center('DEMONSTRATION RECEIPT'));
  lines.push(center('Not a fiscal (eTIMS) receipt'));
  lines.push(center('No payment was processed'));
  return lines.join('\n');
}