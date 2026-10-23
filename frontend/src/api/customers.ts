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


export type CustomerAccountEntryType = "charge" | "payment" | "credit_note" | "adjustment_debit" | "adjustment_credit";

export interface CustomerAccountEntry {
  id: number;
  entry_type: CustomerAccountEntryType;
  amount: string;
  sale: number | null;
  reference: string;
  notes: string;
  created_by: number | null;
  created_by_username: string | null;
  created_at: string;
  running_balance?: string;
}

export interface CustomerStatement {
  customer_id: number;
  customer_name: string;
  credit_limit: string;
  balance: string;
  entries: CustomerAccountEntry[];
}

export interface CustomerPaymentInput {
  amount: string;
  reference?: string;
  notes?: string;
}

export interface CustomerPaymentResponse {
  entry: CustomerAccountEntry;
  balance: string;
}

export function fetchCustomerStatement(id: number) {
  return apiRequest<CustomerStatement>(`/api/v1/customers/${id}/statement/`);
}

export function recordCustomerPayment(id: number, input: CustomerPaymentInput) {
  return apiRequest<CustomerPaymentResponse>(`/api/v1/customers/${id}/payments/`, {
    method: "POST",
    body: input,
  });
}
