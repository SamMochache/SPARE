import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Product } from '../../types/product';
import { matchesProduct } from '../../utils/productSearch';
import { matchesStockFilter, type StockFilter } from '../../utils/stock';

export type SortKey = 'name' | 'sku' | 'category' | 'sellingPrice' | 'quantity';

export interface SortState {
  key: SortKey;
  dir: 'asc' | 'desc';
}

export interface ProductFilterState {
  q: string;
  category: string;
  brand: string;
  supplier: string;
  stock: StockFilter;
  minPrice: string;
  maxPrice: string;
}

export const emptyFilters: ProductFilterState = { q: '', category: 'all', brand: 'all', supplier: 'all', stock: 'all', minPrice: '', maxPrice: '' };

const validStockFilters: StockFilter[] = ['all', 'needs_reorder', 'in_stock', 'low_stock', 'out_of_stock', 'discontinued'];

export function useProductList(products: Product[]) {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<ProductFilterState>(emptyFilters);
  const [sort, setSort] = useState<SortState>({ key: 'name', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const q = searchParams.get('q');
    const stock = searchParams.get('stock') as StockFilter | null;
    if (q === null && stock === null) return;
    setFilters({ ...emptyFilters, q: q ?? '', stock: stock && validStockFilters.includes(stock) ? stock : 'all' });
    setPage(1);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const min = parseFloat(filters.minPrice);
    const max = parseFloat(filters.maxPrice);
    return products.filter(
      (p) =>
      matchesProduct(p, filters.q) && (
      filters.category === 'all' || p.category === filters.category) && (
      filters.brand === 'all' || p.brand === filters.brand) && (
      filters.supplier === 'all' || p.supplier === filters.supplier) &&
      matchesStockFilter(p, filters.stock) && (
      Number.isNaN(min) || p.sellingPrice >= min) && (
      Number.isNaN(max) || p.sellingPrice <= max)
    );
  }, [products, filters]);

  const sorted = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize);
  const activeFilterCount = [filters.category !== 'all', filters.brand !== 'all', filters.supplier !== 'all', filters.stock !== 'all', filters.minPrice !== '', filters.maxPrice !== ''].filter(Boolean).length;

  function updateFilter<K extends keyof ProductFilterState>(key: K, value: ProductFilterState[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(emptyFilters);
    setPage(1);
  }

  function toggleSort(key: SortKey) {
    setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  }

  return {
    filters,
    updateFilter,
    resetFilters,
    activeFilterCount,
    sort,
    toggleSort,
    page,
    setPage,
    pageSize,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
    totalPages,
    filtered: sorted,
    pageItems
  };
}