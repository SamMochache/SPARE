import type { Product } from '../types/product';

export function matchesProduct(product: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
  product.name,
  product.sku,
  product.barcode,
  product.mpn,
  product.brand,
  product.vehicleMake,
  product.category,
  ...product.compatibleModels].

  join(' ').
  toLowerCase();
  return q.split(/\s+/).every((term) => haystack.includes(term));
}