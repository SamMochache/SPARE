import { apiRequest } from "./client";

export interface ReportPeriod {
  start_date: string;
  end_date: string;
}

export interface DashboardSummary {
  period: ReportPeriod;
  branch: number | null;
  sales: {
    count: number;
    gross_revenue: string;
    refunded_total: string;
    net_revenue: string;
    units_sold: number;
  };
  inventory: {
    product_positions: number;
    units_on_hand: number;
    inventory_cost_value: string;
    low_stock_positions: number;
  };
  purchasing: {
    purchase_orders: number;
    open_purchase_orders: number;
  };
  returns: {
    count: number;
    recorded_refund_value: string;
  };
  notes: string[];
}

export interface SalesReportRow {
  date: string;
  sale_count: number;
  gross_revenue: string;
  refunded_total: string;
  net_revenue: string;
}

export interface SalesReport {
  period: ReportPeriod;
  branch: number | null;
  results: SalesReportRow[];
}

export interface InventoryReport {
  branch: number | null;
  low_stock_threshold: number;
  inventory: {
    units_on_hand: number;
    estimated_cost_value: string;
  };
  low_stock: Array<{
    branch: number;
    branch_name: string;
    product: number;
    sku: string;
    name: string;
    quantity_on_hand: number;
    cost_price: string;
    estimated_cost_value: string;
  }>;
  note: string;
}

export interface TopProductsReport {
  period: ReportPeriod;
  branch: number | null;
  results: Array<{
    product_id: number;
    sku_snapshot: string;
    name_snapshot: string;
    units_sold: number;
    sales_value: string;
    sale_count: number;
  }>;
  note: string;
}

function query(filters: { startDate: string; endDate: string; branch?: number }) {
  const params = new URLSearchParams({
    start_date: filters.startDate,
    end_date: filters.endDate
  });
  if (filters.branch !== undefined) params.set("branch", String(filters.branch));
  return params.toString();
}

export function fetchDashboardSummary(filters: { startDate: string; endDate: string; branch?: number }) {
  return apiRequest<DashboardSummary>(`/api/v1/reports/dashboard/?${query(filters)}`);
}

export function fetchSalesReport(filters: { startDate: string; endDate: string; branch?: number }) {
  return apiRequest<SalesReport>(`/api/v1/reports/sales/?${query(filters)}`);
}

export function fetchInventoryReport(filters: { startDate: string; endDate: string; branch?: number }) {
  return apiRequest<InventoryReport>(`/api/v1/reports/inventory/?${query(filters)}`);
}

export function fetchTopProductsReport(filters: { startDate: string; endDate: string; branch?: number }) {
  return apiRequest<TopProductsReport>(`/api/v1/reports/top-products/?${query(filters)}`);
}
