import { apiRequest, type PaginatedResponse } from "./client";
import type { Product, ProductInput } from "../types/product";

interface ApiCategory {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}
interface ApiProduct {
  id: number;
  sku: string;
  name: string;
  brand: string;
  description: string;
  category: number | null;
  category_name: string | null;
  barcode: string;
  cost_price: string | number;
  selling_price: string | number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
interface ApiStockBalance {
  id: number;
  product: number;
  quantity_on_hand: number;
}
type ListResponse<T> = T[] | PaginatedResponse<T>;

async function getAll<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  let next: string | null = path;
  while (next) {
    const page = await apiRequest<ListResponse<T>>(next);
    if (Array.isArray(page)) {
      items.push(...page);
      next = null;
    } else {
      items.push(...page.results);
      if (!page.next) next = null;
      else {
        const url = new URL(page.next, window.location.origin);
        next = `${url.pathname}${url.search}`;
      }
    }
  }
  return items;
}

function mapProduct(api: ApiProduct, quantity: number): Product {
  return {
    id: api.id,
    name: api.name,
    sku: api.sku,
    barcode: api.barcode || "",
    mpn: "",
    category: api.category_name || "",
    brand: api.brand || "",
    vehicleMake: "",
    compatibleModels: [],
    yearFrom: null,
    yearTo: null,
    engine: "",
    costPrice: Number(api.cost_price),
    sellingPrice: Number(api.selling_price),
    taxRate: 0.16,
    quantity,
    reorderLevel: 0,
    supplier: "",
    binLocation: "",
    imageUrl: "",
    status: api.is_active ? "active" : "inactive",
    updatedAt: api.updated_at
  };
}

async function getCategoryId(name: string): Promise<number | null> {
  if (!name.trim()) return null;
  const categories = await getAll<ApiCategory>("/api/v1/categories/?is_active=true");
  const found = categories.find((category) => category.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase());
  if (found) return found.id;
  const created = await apiRequest<ApiCategory>("/api/v1/categories/", {
    method: "POST",
    body: { name: name.trim(), description: "" }
  });
  return created.id;
}

function toApiProduct(input: ProductInput, categoryId: number | null) {
  return {
    sku: input.sku.trim().toUpperCase(),
    name: input.name.trim(),
    brand: input.brand.trim(),
    description: [
      input.mpn ? `MPN: ${input.mpn}` : "",
      input.vehicleMake ? `Vehicle make: ${input.vehicleMake}` : "",
      input.compatibleModels.length ? `Compatible models: ${input.compatibleModels.join(", ")}` : "",
      input.yearFrom || input.yearTo ? `Years: ${input.yearFrom ?? ""}-${input.yearTo ?? ""}` : "",
      input.engine ? `Engine: ${input.engine}` : "",
      input.supplier ? `Preferred supplier: ${input.supplier}` : "",
      input.binLocation ? `Bin location: ${input.binLocation}` : ""
    ].filter(Boolean).join("\n"),
    category: categoryId,
    barcode: input.barcode.trim(),
    cost_price: input.costPrice,
    selling_price: input.sellingPrice,
    is_active: input.status === "active"
  };
}

export async function fetchCatalogue(): Promise<Product[]> {
  const [apiProducts, balances] = await Promise.all([
    getAll<ApiProduct>("/api/v1/products/?is_active=false"),
    getAll<ApiStockBalance>("/api/v1/stock-balances/")
  ]);
  const quantities = new Map<number, number>();
  for (const balance of balances) {
    quantities.set(balance.product, (quantities.get(balance.product) ?? 0) + balance.quantity_on_hand);
  }
  return apiProducts.map((product) => mapProduct(product, quantities.get(product.id) ?? 0));
}

export async function createCatalogueProduct(input: ProductInput): Promise<Product> {
  const categoryId = await getCategoryId(input.category);
  const created = await apiRequest<ApiProduct>("/api/v1/products/", {
    method: "POST",
    body: toApiProduct(input, categoryId)
  });
  return mapProduct(created, 0);
}

export async function updateCatalogueProduct(id: number, input: ProductInput, currentQuantity: number): Promise<Product> {
  const categoryId = await getCategoryId(input.category);
  const updated = await apiRequest<ApiProduct>(`/api/v1/products/${id}/`, {
    method: "PATCH",
    body: toApiProduct(input, categoryId)
  });
  return mapProduct(updated, currentQuantity);
}
