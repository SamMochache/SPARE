import type { Product, StockStatus } from '../types/product';

export type StockFilter = StockStatus | 'all' | 'needs_reorder';

export function getStockStatus(product: Pick<Product, 'quantity' | 'reorderLevel' | 'status'>): StockStatus {
  if (product.status === 'discontinued') return 'discontinued';
  if (product.quantity <= 0) return 'out_of_stock';
  if (product.quantity <= product.reorderLevel) return 'low_stock';
  return 'in_stock';
}

export const stockStatusLabel: Record<StockStatus, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  discontinued: 'Discontinued'
};

export const stockStatusTone: Record<StockStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'danger',
  discontinued: 'neutral'
};

export function matchesStockFilter(product: Product, filter: StockFilter): boolean {
  if (filter === 'all') return true;
  const status = getStockStatus(product);
  if (filter === 'needs_reorder') return status === 'low_stock' || status === 'out_of_stock';
  return status === filter;
}