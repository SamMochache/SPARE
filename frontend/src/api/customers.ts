import { apiRequest, type PaginatedResponse } from "./client";

export type CustomerType = "retail" | "wholesale";

export interface CustomerRecord {
  id: number;
  name: string;
  phone: string;
  email: string;
  type: CustomerType;
  kraPin: string;
  discountRate: string;
  creditLimit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerSalesSummary {
  customer_id: number;
  count: number;
  total_sales: string;
  total_refunded: string;
  results: import('./sales').SaleRecord[];
  next?: string | null;
  previous?: string | null;
}

export interface CustomerInput {
  name: string;
  phone?: string;
  email?: string;
  type?: CustomerType;
  kraPin?: string;
  discountRate?: string;
  creditLimit?: string;
}

export function fetchCustomers(search = "") {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  return apiRequest<PaginatedResponse<CustomerRecord>>(`/api/v1/customers/?${params.toString()}`);
}

export function createCustomer(input: CustomerInput) {
  return apiRequest<CustomerRecord>("/api/v1/customers/", { method: "POST", body: input });
}

export function updateCustomer(id: number, input: Partial<CustomerInput>) {
  return apiRequest<CustomerRecord>(`/api/v1/customers/${id}/`, { method: "PATCH", body: input });
}

export function archiveCustomer(id: number) {
  return apiRequest<void>(`/api/v1/customers/${id}/`, { method: "DELETE" });
}

export function fetchCustomerSalesHistory(id: number) {
  return apiRequest<CustomerSalesSummary>(`/api/v1/customers/${id}/sales/`);
}
