import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAppData } from '../../contexts/AppDataContext';
import { WALK_IN_CUSTOMER_ID } from '../../data/customers';
import { currentUser } from '../../data/shop';
import type { Product } from '../../types/product';
import type { CartLine, CompletedSale, Discount, HeldSale, PaymentRecord } from '../../types/sales';
import { formatKES, roundMoney } from '../../utils/currency';
import { computeTotals, generateReceiptNo } from '../../utils/sales';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CheckoutResult {
  payments: PaymentRecord[];
  amountPaid: number;
  change: number;
  balanceDue: number;
}

const PROFILE_DISCOUNT = 'Customer profile';

export function usePointOfSale() {
  const { products, customers, heldSales, sales, branch, recordSale, holdSale, removeHeldSale, addCustomer } = useAppData();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState(WALK_IN_CUSTOMER_ID);
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [note, setNote] = useState('');

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const items = useMemo<CartItem[]>(
    () =>
    lines.flatMap((l) => {
      const product = productMap.get(l.productId);
      return product ? [{ product, quantity: l.quantity }] : [];
    }),
    [lines, productMap]
  );
  const totals = useMemo(() => computeTotals(items.map((i) => ({ unitPrice: i.product.sellingPrice, quantity: i.quantity })), discount), [items, discount]);
  const cartQuantities = useMemo(() => new Map(lines.map((l) => [l.productId, l.quantity])), [lines]);
  const customer = customers.find((c) => c.id === customerId) ?? customers[0];

  function addToCart(product: Product): boolean {
    if (product.status === 'discontinued') {
      toast.error('This part is discontinued', { description: product.name });
      return false;
    }
    const current = cartQuantities.get(product.id) ?? 0;
    if (current + 1 > product.quantity) {
      toast.warning(product.quantity === 0 ? 'Out of stock' : `Only ${product.quantity} in stock`, { description: product.name });
      return false;
    }
    setLines((prev) => current > 0 ? prev.map((l) => l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l) : [...prev, { productId: product.id, quantity: 1 }]);
    return true;
  }

  function setQuantity(productId: number, quantity: number) {
    const product = productMap.get(productId);
    if (!product) return;
    const safe = Math.max(1, Math.floor(quantity) || 1);
    if (safe > product.quantity) toast.warning(`Only ${product.quantity} in stock`, { description: product.name });
    const capped = Math.min(safe, product.quantity);
    setLines((prev) => prev.map((l) => l.productId === productId ? { ...l, quantity: capped } : l));
  }

  function removeLine(productId: number) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  function resetSale() {
    setLines([]);
    setCustomerId(WALK_IN_CUSTOMER_ID);
    setDiscount(null);
    setNote('');
  }

  function selectCustomer(id: number) {
    const next = customers.find((c) => c.id === id);
    if (!next) return;
    setCustomerId(id);
    if (next.discountRate > 0) {
      setDiscount({ type: 'percent', value: next.discountRate, reason: next.type === 'wholesale' ? 'Wholesale pricing' : 'Customer pricing', authorizedBy: PROFILE_DISCOUNT });
    } else {
      setDiscount((prev) => prev?.authorizedBy === PROFILE_DISCOUNT ? null : prev);
    }
  }

  function createCustomer(input: {name: string;phone: string;}) {
    const created = addCustomer({ name: input.name, phone: input.phone, email: '', type: 'retail', kraPin: '', discountRate: 0, creditLimit: 0, balance: 0 });
    setCustomerId(created.id);
    setDiscount((prev) => prev?.authorizedBy === PROFILE_DISCOUNT ? null : prev);
    toast.success('Customer added to this sale', { description: `${created.name} · saved in this browser only` });
  }

  function hold(silent = false) {
    if (lines.length === 0) {
      if (!silent) toast.info('Cart is empty — nothing to hold');
      return;
    }
    const held: HeldSale = { id: `H-${Date.now().toString(36).toUpperCase()}`, heldAt: new Date().toISOString(), lines, customerId, discount, note };
    holdSale(held);
    if (!silent) toast.success('Sale held', { description: `${customer.name} · ${formatKES(totals.total)}` });
    resetSale();
  }

  function resume(held: HeldSale) {
    if (lines.length > 0) hold(true);
    let reduced = false;
    const restored = held.lines.flatMap((l) => {
      const product = productMap.get(l.productId);
      if (!product || product.quantity <= 0) {
        reduced = true;
        return [];
      }
      if (l.quantity > product.quantity) reduced = true;
      return [{ productId: l.productId, quantity: Math.min(l.quantity, product.quantity) }];
    });
    setLines(restored);
    setCustomerId(held.customerId);
    setDiscount(held.discount);
    setNote(held.note);
    removeHeldSale(held.id);
    if (reduced) toast.warning('Some quantities were reduced', { description: 'Stock changed since this sale was held.' });else
    toast.success('Held sale resumed');
  }

  function completeSale(result: CheckoutResult): CompletedSale {
    const now = new Date();
    const sale: CompletedSale = {
      receiptNo: generateReceiptNo(now, 48 + sales.length),
      createdAt: now.toISOString(),
      cashier: currentUser.name,
      branch: branch.name,
      customer,
      lines: items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        sku: i.product.sku,
        quantity: i.quantity,
        unitPrice: i.product.sellingPrice,
        lineTotal: roundMoney(i.product.sellingPrice * i.quantity)
      })),
      discount,
      totals,
      ...result,
      note
    };
    recordSale(sale);
    resetSale();
    return sale;
  }

  return {
    products,
    customers,
    heldSales,
    items,
    totals,
    customer,
    discount,
    note,
    cartQuantities,
    setNote,
    setDiscount,
    addToCart,
    setQuantity,
    removeLine,
    resetSale,
    selectCustomer,
    createCustomer,
    hold,
    resume,
    removeHeldSale,
    completeSale
  };
}