import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCatalogue, createCatalogueProduct, updateCatalogueProduct } from '../api/catalogue';
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
  productsLoading: boolean;
  productsError: string;
  refreshProducts: () => Promise<void>;
  setBranchId: (id: string) => void;
  addProduct: (input: ProductInput) => Promise<Product>;
  updateProduct: (id: number, input: ProductInput) => Promise<void>;
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
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');

  const refreshProducts = async () => {
    setProductsLoading(true);
    setProductsError('');
    try {
      const products = await fetchCatalogue();
      setState((s) => ({ ...s, products }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load products from the API.';
      setProductsError(message);
      throw error;
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const products = await fetchCatalogue();
        if (active) {
          setState((s) => ({ ...s, products }));
          setProductsError('');
        }
      } catch (error) {
        if (active) setProductsError(error instanceof Error ? error.message : 'Could not load products from the API.');
      } finally {
        if (active) setProductsLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try {
      // Persist prototype-only customer/sales data, never use cached products as the source of truth.
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, products: seedProducts }));
    } catch {
      // Storage may be unavailable (private mode / quota); keep the app usable in memory.
    }
  }, [state]);

  const value = useMemo<AppDataContextValue>(() => {
    const branch = branches.find((b) => b.id === state.branchId) ?? branches[0];
    return {
      ...state,
      branch,
      productsLoading,
      productsError,
      refreshProducts,
      setBranchId: (id) => setState((s) => ({ ...s, branchId: id })),
      addProduct: async (input) => {
        const product = await createCatalogueProduct(input);
        setState((s) => ({ ...s, products: [product, ...s.products] }));
        return product;
      },
      updateProduct: async (id, input) => {
        const current = state.products.find((p) => p.id === id);
        if (!current) throw new Error('This product is no longer in the catalogue. Refresh and try again.');
        const product = await updateCatalogueProduct(id, input, current.quantity);
        setState((s) => ({ ...s, products: s.products.map((p) => p.id === id ? product : p) }));
      },
      addCustomer: (input) => {
        const customer: Customer = { ...input, id: Math.max(0, ...state.customers.map((c) => c.id)) + 1 };
        setState((s) => ({ ...s, customers: [...s.customers, customer] }));
        return customer;
      },
      recordSale: (sale) => setState((s) => ({
        ...s,
        sales: [sale, ...s.sales],
        products: s.products.map((p) => {
          const line = sale.lines.find((l) => l.productId === p.id);
          return line ? { ...p, quantity: Math.max(0, p.quantity - line.quantity) } : p;
        }),
        customers: sale.balanceDue > 0
          ? s.customers.map((c) => c.id === sale.customer.id ? { ...c, balance: c.balance + sale.balanceDue } : c)
          : s.customers
      })),
      holdSale: (held) => setState((s) => ({ ...s, heldSales: [held, ...s.heldSales] })),
      removeHeldSale: (id) => setState((s) => ({ ...s, heldSales: s.heldSales.filter((h) => h.id !== id) })),
      resetDemoData: () => setState((s) => ({ ...s, customers: seedCustomers, heldSales: [], sales: [] }))
    };
  }, [state, productsLoading, productsError]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
