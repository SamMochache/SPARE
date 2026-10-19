export type ProductStatus = 'active' | 'inactive' | 'discontinued';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  mpn: string;
  category: string;
  brand: string;
  vehicleMake: string;
  compatibleModels: string[];
  yearFrom: number | null;
  yearTo: number | null;
  engine: string;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  quantity: number;
  reorderLevel: number;
  supplier: string;
  binLocation: string;
  imageUrl: string;
  status: ProductStatus;
  updatedAt: string;
}

export type ProductInput = Omit<Product, 'id' | 'updatedAt'>;