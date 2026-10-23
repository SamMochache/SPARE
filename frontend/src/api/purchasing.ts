import { apiRequest, type PaginatedResponse } from "./client";
import type { Product } from "../types/product";

export interface PurchasingBranch {
  id: number;
  code: string;
  name: string;
  address: string;
  is_active: boolean;
}
export interface Supplier {
  id: number;
  name: string;
  code: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  payment_terms: string;
  notes: string;
  is_active: boolean;
}
export type PurchaseStatus = "draft" | "ordered" | "partially_received" | "received" | "cancelled";
export interface PurchaseOrderLine {
  id: number;
  product: number;
  product_sku: string;
  product_name: string;
  quantity_ordered: number;
  quantity_received: number;
  outstanding_quantity: number;
  unit_cost: string | number;
  line_total: string | number;
}
export interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier: number;
  supplier_name: string;
  branch: number;
  branch_name: string;
  status: PurchaseStatus;
  notes: string;
  items: PurchaseOrderLine[];
  total_cost: string | number;
  received_cost: string | number;
  created_by_username: string | null;
  ordered_at: string | null;
  created_at: string;
  updated_at: string;
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
        next = url.pathname + url.search;
      }
    }
  }
  return items;
}

export const fetchPurchasingBranches = () => getAll<PurchasingBranch>("/api/v1/auth/branches/");
export const fetchSuppliers = (includeInactive = false) =>
  getAll<Supplier>(includeInactive ? "/api/v1/suppliers/?is_active=false" : "/api/v1/suppliers/");
export const fetchPurchaseOrders = () => getAll<PurchaseOrder>("/api/v1/purchase-orders/");
export const createSupplier = (input: Pick<Supplier, "name" | "code" | "contact_name" | "email" | "phone" | "address" | "payment_terms" | "notes">) =>
  apiRequest<Supplier>("/api/v1/suppliers/", { method: "POST", body: input });
export const createPurchaseOrder = (input: {
  order_number: string;
  supplier: number;
  branch: number;
  notes: string;
  items: { product: number; quantity_ordered: number; unit_cost: number }[];
}) => apiRequest<PurchaseOrder>("/api/v1/purchase-orders/", { method: "POST", body: input });
export const updatePurchaseOrder = (id: number, input: {
  order_number: string;
  supplier: number;
  branch: number;
  notes: string;
  items: { product: number; quantity_ordered: number; unit_cost: number }[];
}) => apiRequest<PurchaseOrder>(`/api/v1/purchase-orders/${id}/`, { method: "PATCH", body: input });
export const orderPurchaseOrder = (id: number) =>
  apiRequest<PurchaseOrder>(`/api/v1/purchase-orders/${id}/order/`, { method: "POST" });
export const receivePurchaseOrder = (id: number, items: { item_id: number; quantity: number }[]) =>
  apiRequest<PurchaseOrder>(`/api/v1/purchase-orders/${id}/receive/`, { method: "POST", body: { items } });
export const cancelPurchaseOrder = (id: number) =>
  apiRequest<PurchaseOrder>(`/api/v1/purchase-orders/${id}/cancel/`, { method: "POST" });

export function purchasingProductOptions(products: Product[]) {
  return products.filter((product) => product.status === "active").map((product) => ({
    id: product.id, name: product.name, sku: product.sku, costPrice: product.costPrice
  }));
}
