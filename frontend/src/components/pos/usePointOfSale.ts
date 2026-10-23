import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAppData } from '../../contexts/AppDataContext';
import { createCustomer as createCustomerApi, fetchCustomers } from '../../api/customers';
import type { CustomerRecord } from '../../api/customers';
import type { Customer } from '../../types/customer';
import { checkoutSale } from '../../api/sales';
import type { Product } from '../../types/product';
import type { CartLine, CompletedSale, Discount, HeldSale, PaymentRecord } from '../../types/sales';
import { formatKES, roundMoney } from '../../utils/currency';
import { computeTotals } from '../../utils/sales';

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
const WALK_IN_CUSTOMER_ID = 0;
const WALK_IN_CUSTOMER: Customer = { id: WALK_IN_CUSTOMER_ID, name: 'Walk-in Customer', phone: '', email: '', type: 'retail', kraPin: '', discountRate: 0, creditLimit: 0, balance: 0 };

function toCustomer(record: CustomerRecord): Customer {
  return { id: record.id, name: record.name, phone: record.phone ?? '', email: record.email ?? '', type: record.type, kraPin: record.kraPin ?? '', discountRate: Number(record.discountRate ?? 0), creditLimit: Number(record.creditLimit ?? 0), balance: 0 };
}

export function usePointOfSale() {
  const { products, customers: prototypeCustomers, heldSales, refreshProducts, holdSale, removeHeldSale } = useAppData();
  const [knownCustomers, setKnownCustomers] = useState<Customer[]>([]);
  const [pickerCustomers, setPickerCustomers] = useState<Customer[]>([WALK_IN_CUSTOMER]);
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
  const totals = useMemo(() => computeTotals(items.map((i) => ({ unitPrice: i.product.sellingPrice, quantity: i.quantity })), discount, 0), [items, discount]);
  const cartQuantities = useMemo(() => new Map(lines.map((l) => [l.productId, l.quantity])), [lines]);
  const customers = [WALK_IN_CUSTOMER, ...knownCustomers.filter((c) => c.id !== WALK_IN_CUSTOMER_ID)];
  const customer = customers.find((c) => c.id === customerId) ?? WALK_IN_CUSTOMER;

  const searchCustomers = useCallback(async (query: string) => {
    const response = await fetchCustomers(query);
    const results = response.results.map(toCustomer);
    setPickerCustomers([WALK_IN_CUSTOMER, ...results]);
    setKnownCustomers((current) => {
      const byId = new Map(current.map((item) => [item.id, item]));
      results.forEach((item) => byId.set(item.id, item));
      return [...byId.values()];
    });
  }, []);

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

  async function createCustomer(input: {name: string;phone: string;}) {
    const record = await createCustomerApi({ name: input.name, phone: input.phone, type: 'retail', discountRate: '0', creditLimit: '0' });
    const created = toCustomer(record);
    setKnownCustomers((current) => [...current.filter((item) => item.id !== created.id), created]);
    setPickerCustomers((current) => [WALK_IN_CUSTOMER, created, ...current.filter((item) => item.id !== WALK_IN_CUSTOMER_ID && item.id !== created.id)]);
    setCustomerId(created.id);
    setDiscount((prev) => prev?.authorizedBy === PROFILE_DISCOUNT ? null : prev);
    toast.success('Customer created', { description: `${created.name} · saved to the customer API` });
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

  async function completeSale(result: CheckoutResult, branchId: number | null, checkoutKey: string): Promise<CompletedSale> {
    if (!branchId) throw new Error("Select an active branch before checking out.");
    const method = result.payments[0]?.method;
    if (!method || result.payments.length !== 1) {
      throw new Error("The live checkout API currently supports one recorded payment method per sale.");
    }
    const response = await checkoutSale({
      branch: branchId,
      sale_number: checkoutKey,
      idempotency_key: checkoutKey,
      payment_method: method,
      customer_name: customer.id === WALK_IN_CUSTOMER_ID ? "" : customer.name,
      customer_phone: customer.id === WALK_IN_CUSTOMER_ID ? "" : customer.phone,
      discount: totals.discount.toFixed(2),
      expected_total: totals.total.toFixed(2),
      amount_paid: result.amountPaid.toFixed(2),
      notes: note,
      items: items.map((item) => ({ product: item.product.id, quantity: item.quantity }))
    });
    const serverSubtotal = Number(response.subtotal);
    const serverDiscount = Number(response.discount);
    const serverTotal = Number(response.total);
    const completed: CompletedSale = {
      receiptNo: response.sale_number,
      createdAt: response.created_at,
      cashier: response.cashier_username || "Signed-in cashier",
      branch: response.branch_name,
      customer,
      lines: response.items.map((line) => ({
        productId: line.product,
        name: line.name_snapshot,
        sku: line.sku_snapshot,
        quantity: line.quantity,
        unitPrice: Number(line.unit_price),
        lineTotal: Number(line.line_total)
      })),
      discount,
      totals: {
        itemCount: response.items.reduce((sum, line) => sum + line.quantity, 0),
        subtotal: serverSubtotal,
        discount: serverDiscount,
        taxable: Math.max(0, serverSubtotal - serverDiscount),
        tax: 0,
        total: serverTotal
      },
      ...result,
      amountPaid: result.amountPaid,
      change: Math.max(0, roundMoney(result.amountPaid - serverTotal)),
      balanceDue: 0,
      note: response.notes
    };
    resetSale();
    try {
      await refreshProducts();
    } catch {
      toast.warning("Sale recorded, but stock refresh failed", { description: "Refresh the product catalogue before starting another sale." });
    }
    return completed;
  }

  return {
    products,
    customers: pickerCustomers,
    heldSales,
    searchCustomers,
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