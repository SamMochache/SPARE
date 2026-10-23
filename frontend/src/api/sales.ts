import { apiRequest, type PaginatedResponse } from "./client";

export interface SaleLine {
  id: number;
  product: number;
  sku_snapshot: string;
  name_snapshot: string;
  quantity: number;
  quantity_returned: number;
  unit_price: string;
  line_total: string;
}

export interface SaleRecord {
  id: number;
  sale_number: string;
  branch: number;
  branch_name: string;
  cashier: number | null;
  cashier_username: string | null;
  status: "completed" | "partially_refunded" | "refunded";
  payment_method: "cash" | "mpesa" | "card" | "bank" | "credit";
  customer_name: string;
  customer_phone: string;
  subtotal: string;
  discount: string;
  total: string;
  refunded_total: string;
  notes: string;
  created_at: string;
  items: SaleLine[];
}

export interface SaleFilters {
  search?: string;
  status?: string;
  paymentMethod?: string;
  from?: string;
  to?: string;
}

export interface CreateReturnInput {
  return_number: string;
  reason: string;
  refund_method: SaleRecord["payment_method"];
  items: Array<{ sale_item: number; quantity: number }>;
}

function queryString(filters: SaleFilters) {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set("sale_number", filters.search.trim());
  if (filters.status) params.set("status", filters.status);
  if (filters.paymentMethod) params.set("payment_method", filters.paymentMethod);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function fetchSales(filters: SaleFilters = {}): Promise<SaleRecord[]> {
  const response = await apiRequest<PaginatedResponse<SaleRecord> | SaleRecord[]>(
    `/api/v1/sales/${queryString(filters)}`
  );
  return Array.isArray(response) ? response : response.results;
}

export function createSaleReturn(saleId: number, input: CreateReturnInput) {
  return apiRequest<unknown>(`/api/v1/sales/${saleId}/returns/`, { method: "POST", body: input });
}

export interface CheckoutSaleInput {
  branch?: number;
  sale_number: string;
  idempotency_key: string;
  payment_method: "cash" | "mpesa" | "card" | "bank";
  customer_name: string;
  customer_phone: string;
  discount: string;
  expected_total: string;
  amount_paid: string;
  notes: string;
  items: Array<{ product: number; quantity: number }>;
}

export async function checkoutSale(input: CheckoutSaleInput): Promise<SaleRecord> {
  return apiRequest<SaleRecord>("/api/v1/sales/checkout/", { method: "POST", body: input });
}
