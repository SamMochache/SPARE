import { apiRequest, type PaginatedResponse } from "./client";

export interface ApiBranch {
  id: number;
  code: string;
  name: string;
  address: string;
  is_active: boolean;
}
export interface StockBalance {
  id: number;
  branch: number;
  branch_name: string;
  product: number;
  product_sku: string;
  product_name: string;
  quantity_on_hand: number;
  updated_at: string;
}
export type MovementType = "receipt" | "sale" | "return" | "adjustment_in" | "adjustment_out";
export interface StockMovement {
  id: number;
  branch: number;
  branch_name: string;
  product: number;
  product_sku: string;
  product_name: string;
  movement_type: MovementType;
  quantity: number;
  balance_after: number;
  reason: string;
  reference: string;
  created_by: number | null;
  created_by_username: string | null;
  created_at: string;
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

export function fetchBranches(): Promise<ApiBranch[]> {
  return getAll<ApiBranch>("/api/v1/auth/branches/");
}

export function fetchStockBalances(branchId: number): Promise<StockBalance[]> {
  return getAll<StockBalance>("/api/v1/stock-balances/?branch=" + branchId);
}

export function fetchStockMovements(branchId: number): Promise<StockMovement[]> {
  return getAll<StockMovement>("/api/v1/stock-movements/?branch=" + branchId);
}

export interface StockOperationInput {
  branch?: number;
  product: number;
  quantity?: number;
  quantity_delta?: number;
  reason: string;
  reference?: string;
}

export function receiveStock(input: StockOperationInput): Promise<StockMovement> {
  return apiRequest<StockMovement>("/api/v1/stock/receive/", { method: "POST", body: input });
}

export function adjustStock(input: StockOperationInput): Promise<StockMovement> {
  return apiRequest<StockMovement>("/api/v1/stock/adjust/", { method: "POST", body: input });
}
