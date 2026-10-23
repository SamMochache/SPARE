import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCatalogue, createCatalogueProduct, updateCatalogueProduct } from '../api/catalogue';
import type { Product, ProductInput } from '../types/product';
import type { HeldSale } from '../types/sales';

const HELD_SALES_STORAGE_KEY = 'autoparts-pro:held-sales-v1';

interface AppDataContextValue {
  products: Product[];
  heldSales: HeldSale[];
  productsLoading: boolean;
  productsError: string;
  refreshProducts: () => Promise<void>;
  addProduct: (input: ProductInput) => Promise<Product>;
  updateProduct: (id: number, input: ProductInput) => Promise<void>;
  holdSale: (sale: HeldSale) => void;
  removeHeldSale: (id: string) => void;
}

function loadHeldSales(): HeldSale[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HELD_SALES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HeldSale[]) : [];
  } catch {
    return [];
  }
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  // Business records always come from the API. An unavailable API means an empty list plus an error,
  // never seeded prototype records that could be mistaken for real inventory.
  const [products, setProducts] = useState<Product[]>([]);
  const [heldSales, setHeldSales] = useState<HeldSale[]>(loadHeldSales);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError('');
    try {
      setProducts(await fetchCatalogue());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load products from the API.';
      setProductsError(message);
      throw error;
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      setProductsLoading(true);
      setProductsError('');
      try {
        const result = await fetchCatalogue();
        if (active) setProducts(result);
      } catch (error) {
        if (active) {
          setProducts([]);
          setProductsError(error instanceof Error ? error.message : 'Could not load products from the API.');
        }
      } finally {
        if (active) setProductsLoading(false);
      }
    }
    void loadProducts();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try {
      // Held sales are an explicitly local POS convenience; products, customers and completed sales
      // are not cached here and must be read from the backend.
      window.localStorage.setItem(HELD_SALES_STORAGE_KEY, JSON.stringify(heldSales));
    } catch {
      // Storage may be unavailable (private mode / quota); keep held sales in memory for this session.
    }
  }, [heldSales]);

  const value = useMemo<AppDataContextValue>(() => ({
    products,
    heldSales,
    productsLoading,
    productsError,
    refreshProducts,
    addProduct: async (input) => {
      const product = await createCatalogueProduct(input);
      setProducts((current) => [product, ...current]);
      return product;
    },
    updateProduct: async (id, input) => {
      const current = products.find((product) => product.id === id);
      if (!current) throw new Error('This product is no longer in the catalogue. Refresh and try again.');
      const updated = await updateCatalogueProduct(id, input, current.quantity);
      setProducts((items) => items.map((product) => product.id === id ? updated : product));
    },
    holdSale: (sale) => setHeldSales((current) => [sale, ...current]),
    removeHeldSale: (id) => setHeldSales((current) => current.filter((sale) => sale.id !== id))
  }), [products, heldSales, productsLoading, productsError, refreshProducts]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within AppDataProvider');
  return context;
}
