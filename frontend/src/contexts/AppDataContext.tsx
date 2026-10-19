import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { customers as seedCustomers } from '../data/customers';
import { products as seedProducts } from '../data/products';
import { branches } from '../data/shop';
import type { Customer } from '../types/customer';
import type { Product, ProductInput } from '../types/product';
import type { CompletedSale, HeldSale } from '../types/sales';
import type { Branch } from '../types/shop';

const STORAGE_KEY = 'autoparts-pro:prototype-v1';

interface PersistedState {
  products: Product[];
  customers: Customer[];
  heldSales: HeldSale[];
  sales: CompletedSale[];
  branchId: string;
}

interface AppDataContextValue extends PersistedState {
  branch: Branch;
  setBranchId: (id: string) => void;
  addProduct: (input: ProductInput) => Product;
  updateProduct: (id: number, input: ProductInput) => void;
  addCustomer: (input: Omit<Customer, 'id'>) => Customer;
  recordSale: (sale: CompletedSale) => void;
  holdSale: (sale: HeldSale) => void;
  removeHeldSale: (id: string) => void;
  resetDemoData: () => void;
}

const initialState: PersistedState = {
  products: seedProducts,
  customers: seedCustomers,
  heldSales: [],
  sales: [],
  branchId: branches[0].id
};

function loadState(): PersistedState {
  if (typeof window === 'undefined') return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return { ...initialState, ...(JSON.parse(raw) as Partial<PersistedState>) };
  } catch {
    return initialState;
  }
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: {children: React.ReactNode;}) {
  const [state, setState] = useState<PersistedState>(loadState);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {

      // Storage may be unavailable (private mode / quota); prototype keeps working in memory.
    }}, [state]);

  const value = useMemo<AppDataContextValue>(() => {
    const branch = branches.find((b) => b.id === state.branchId) ?? branches[0];
    return {
      ...state,
      branch,
      setBranchId: (id) => setState((s) => ({ ...s, branchId: id })),
      addProduct: (input) => {
        const product: Product = {
          ...input,
          id: Math.max(0, ...state.products.map((p) => p.id)) + 1,
          updatedAt: new Date().toISOString()
        };
        setState((s) => ({ ...s, products: [product, ...s.products] }));
        return product;
      },
      updateProduct: (id, input) =>
      setState((s) => ({
        ...s,
        products: s.products.map((p) => p.id === id ? { ...p, ...input, updatedAt: new Date().toISOString() } : p)
      })),
      addCustomer: (input) => {
        const customer: Customer = { ...input, id: Math.max(0, ...state.customers.map((c) => c.id)) + 1 };
        setState((s) => ({ ...s, customers: [...s.customers, customer] }));
        return customer;
      },
      recordSale: (sale) =>
      setState((s) => ({
        ...s,
        sales: [sale, ...s.sales],
        products: s.products.map((p) => {
          const line = sale.lines.find((l) => l.productId === p.id);
          return line ? { ...p, quantity: Math.max(0, p.quantity - line.quantity) } : p;
        }),
        customers:
        sale.balanceDue > 0 ?
        s.customers.map((c) => c.id === sale.customer.id ? { ...c, balance: c.balance + sale.balanceDue } : c) :
        s.customers
      })),
      holdSale: (held) => setState((s) => ({ ...s, heldSales: [held, ...s.heldSales] })),
      removeHeldSale: (id) => setState((s) => ({ ...s, heldSales: s.heldSales.filter((h) => h.id !== id) })),
      resetDemoData: () => setState(initialState)
    };
  }, [state]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}