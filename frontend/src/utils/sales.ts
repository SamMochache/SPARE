import { format } from 'date-fns';
import { VAT_RATE } from '../data/shop';
import type { CheckoutMethod, Discount, PaymentMethod, SaleTotals } from '../types/sales';
import { roundMoney } from './currency';

export const paymentMethodLabel: Record<PaymentMethod | 'split' | 'credit', string> = {
  cash: 'Cash',
  mpesa: 'M-Pesa',
  card: 'Card',
  bank: 'Bank Transfer',
  split: 'Split',
  credit: 'On account'
};

export function computeTotals(
lines: {unitPrice: number;quantity: number;}[],
discount: Discount | null,
taxRate: number = VAT_RATE)
: SaleTotals {
  const subtotal = roundMoney(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  let discountAmount = 0;
  if (discount) {
    discountAmount = discount.type === 'percent' ? subtotal * discount.value / 100 : discount.value;
  }
  discountAmount = roundMoney(Math.min(discountAmount, subtotal));
  const taxable = roundMoney(subtotal - discountAmount);
  const tax = roundMoney(taxable * taxRate);
  return { itemCount, subtotal, discount: discountAmount, taxable, tax, total: roundMoney(taxable + tax) };
}

export function generateReceiptNo(date: Date, sequence: number): string {
  return `APP-${format(date, 'yyMMdd')}-${String(sequence).padStart(4, '0')}`;
}

export function checkoutMethodLabel(method: CheckoutMethod): string {
  return paymentMethodLabel[method];
}