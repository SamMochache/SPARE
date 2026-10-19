import type { Customer } from './customer';

export type PaymentMethod = 'cash' | 'mpesa' | 'card' | 'bank';
export type CheckoutMethod = PaymentMethod | 'split';

export interface CartLine {
  productId: number;
  quantity: number;
}

export interface Discount {
  type: 'percent' | 'amount';
  value: number;
  reason: string;
  authorizedBy: string;
}

export interface SaleTotals {
  itemCount: number;
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
}

export interface PaymentRecord {
  method: PaymentMethod;
  amount: number;
  reference: string;
}

export interface ReceiptLine {
  productId: number;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CompletedSale {
  receiptNo: string;
  createdAt: string;
  cashier: string;
  branch: string;
  customer: Customer;
  lines: ReceiptLine[];
  discount: Discount | null;
  totals: SaleTotals;
  payments: PaymentRecord[];
  amountPaid: number;
  change: number;
  balanceDue: number;
  note: string;
}

export interface HeldSale {
  id: string;
  heldAt: string;
  lines: CartLine[];
  customerId: number;
  discount: Discount | null;
  note: string;
}

export type SaleStatus = 'completed' | 'credit' | 'refunded';

export interface RecentSaleRow {
  receiptNo: string;
  time: string;
  customer: string;
  items: number;
  total: number;
  method: PaymentMethod | 'split' | 'credit';
  status: SaleStatus;
  fromPrototype?: boolean;
}