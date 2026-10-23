import React, { useCallback, useEffect, useState } from "react";
import { Download, RefreshCw, TrendingUp, Package, ShoppingBag, RotateCcw } from "lucide-react";
import { fetchDashboardSummary, fetchInventoryReport, fetchSalesReport, fetchTopProductsReport, type DashboardSummary, type InventoryReport, type SalesReport, type TopProductsReport } from "../api/reports";
import { fetchSales } from "../api/sales";
import type { SaleRecord } from "../api/sales";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { buttonClass } from "../components/ui/Button";
import { formatKES, formatNumber } from "../utils/currency";

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function defaultRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}
function money(value: string | number | undefined) {
  const number = Number(value ?? 0);
  return formatKES(Number.isFinite(number) ? number : 0);
}
function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map((value) => {
    const text = String(value ?? "");
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function Reports() {
  const [period, setPeriod] = useState(defaultRange);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sales, setSales] = useState<SalesReport | null>(null);
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [top, setTop] = useState<TopProductsReport | null>(null);
  const [recentSales, setRecentSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const filters = { ...period };
      const [summaryData, salesData, inventoryData, topData, saleData] = await Promise.all([
        fetchDashboardSummary(filters),
        fetchSalesReport(filters),
        fetchInventoryReport(filters),
        fetchTopProductsReport(filters),
        fetchSales({ from: period.startDate, to: period.endDate })
      ]);
      setSummary(summaryData);
      setSales(salesData);
      setInventory(inventoryData);
      setTop(topData);
      setRecentSales(saleData.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load reports from the API.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { void load(); }, [load]);

  function exportSales() {
    downloadCsv(`spare-sales-${period.startDate}-to-${period.endDate}.csv`, [
      ["Date", "Transactions", "Gross revenue (KES)", "Refunded (KES)", "Net revenue (KES)"],
      ...(sales?.results ?? []).map((row) => [row.date, row.sale_count, row.gross_revenue, row.refunded_total, row.net_revenue])
    ]);
  }
  function exportLowStock() {
    downloadCsv(`spare-low-stock-${period.endDate}.csv`, [
      ["Branch", "SKU", "Product", "Quantity on hand", "Unit cost (KES)", "Estimated cost value (KES)"],
      ...(inventory?.low_stock ?? []).map((row) => [row.branch_name, row.sku, row.name, row.quantity_on_hand, row.cost_price, row.estimated_cost_value])
    ]);
  }

  const inputClass = "rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink";
  return <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
    <PageHeader title="Reports & Analytics" description="Sales, inventory, returns and top products from the Django reporting API." actions={<button type="button" onClick={() => void load()} disabled={loading} className={buttonClass("secondary")}><RefreshCw className="h-4 w-4" />{loading ? "Refreshing…" : "Refresh reports"}</button>} />
    <section className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4">
      <label className="flex flex-col gap-1 text-sm text-ink-muted">From<input aria-label="Report start date" type="date" className={inputClass} value={period.startDate} max={period.endDate} onChange={(e) => setPeriod((p) => ({ ...p, startDate: e.target.value }))} /></label>
      <label className="flex flex-col gap-1 text-sm text-ink-muted">To<input aria-label="Report end date" type="date" className={inputClass} value={period.endDate} min={period.startDate} max={isoDate(new Date())} onChange={(e) => setPeriod((p) => ({ ...p, endDate: e.target.value }))} /></label>
      <span className="pb-2 text-xs text-ink-muted">All figures use the selected period where applicable.</span>
    </section>
    {error && <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm"><p className="font-semibold">Could not load reports</p><p className="mt-1">{error}</p><button className="mt-2 font-semibold underline" type="button" onClick={() => void load()}>Try again</button></div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Net sales" value={loading && !summary ? "—" : money(summary?.sales.net_revenue)} icon={TrendingUp} meta={`${formatNumber(summary?.sales.count ?? 0)} transactions`} />
      <StatCard label="Inventory cost value" value={loading && !summary ? "—" : money(summary?.inventory.inventory_cost_value)} icon={Package} meta={`${formatNumber(summary?.inventory.units_on_hand ?? 0)} units on hand`} />
      <StatCard label="Low-stock positions" value={loading && !inventory ? "—" : formatNumber(summary?.inventory.low_stock_positions ?? 0)} icon={ShoppingBag} meta={`Threshold: ${inventory?.low_stock_threshold ?? 5} units`} />
      <StatCard label="Recorded returns" value={loading && !summary ? "—" : formatNumber(summary?.returns.count ?? 0)} icon={RotateCcw} meta={`Refund value: ${money(summary?.returns.recorded_refund_value)}`} />
    </div>
    <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4"><div><h2 className="font-semibold text-ink">Daily sales</h2><p className="text-sm text-ink-muted">Recorded sales minus recorded refunds, by date</p></div><button type="button" disabled={!sales || loading} onClick={exportSales} className={buttonClass("secondary")}><Download className="h-4 w-4" />Export sales CSV</button></div>
      {loading && !sales ? <p className="p-8 text-sm text-ink-muted">Loading sales report…</p> : (sales?.results.length ?? 0) === 0 ? <p className="p-8 text-sm text-ink-muted">No sales were recorded for this period.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-canvas text-xs uppercase text-ink-muted"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Transactions</th><th className="px-4 py-3">Gross</th><th className="px-4 py-3">Refunded</th><th className="px-4 py-3">Net sales</th></tr></thead><tbody className="divide-y divide-line">{sales?.results.map((row) => <tr key={row.date}><td className="px-4 py-3">{row.date}</td><td className="px-4 py-3">{formatNumber(row.sale_count)}</td><td className="px-4 py-3">{money(row.gross_revenue)}</td><td className="px-4 py-3">{money(row.refunded_total)}</td><td className="px-4 py-3 font-semibold">{money(row.net_revenue)}</td></tr>)}</tbody></table></div>}
    </section>
    <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4"><div><h2 className="font-semibold text-ink">Low-stock inventory</h2><p className="text-sm text-ink-muted">Current stock at or below the reporting threshold</p></div><button type="button" disabled={!inventory || loading} onClick={exportLowStock} className={buttonClass("secondary")}><Download className="h-4 w-4" />Export stock CSV</button></div>
      {loading && !inventory ? <p className="p-8 text-sm text-ink-muted">Loading inventory report…</p> : (inventory?.low_stock.length ?? 0) === 0 ? <p className="p-8 text-sm text-ink-muted">No low-stock positions for this branch and threshold.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-canvas text-xs uppercase text-ink-muted"><tr><th className="px-4 py-3">Branch</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">On hand</th><th className="px-4 py-3">Est. cost value</th></tr></thead><tbody className="divide-y divide-line">{inventory?.low_stock.map((row) => <tr key={`${row.branch}-${row.product}`}><td className="px-4 py-3">{row.branch_name}</td><td className="px-4 py-3 font-mono text-xs">{row.sku}</td><td className="px-4 py-3">{row.name}</td><td className="px-4 py-3">{row.quantity_on_hand}</td><td className="px-4 py-3">{money(row.estimated_cost_value)}</td></tr>)}</tbody></table></div>}
    </section>
    <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className="border-b border-line p-4"><h2 className="font-semibold text-ink">Top products</h2><p className="text-sm text-ink-muted">Ranked by units sold during the selected period</p></div>
      {loading && !top ? <p className="p-8 text-sm text-ink-muted">Loading top products…</p> : (top?.results.length ?? 0) === 0 ? <p className="p-8 text-sm text-ink-muted">No product sales for this period.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-canvas text-xs uppercase text-ink-muted"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Units sold</th><th className="px-4 py-3">Sales value</th><th className="px-4 py-3">Transactions</th></tr></thead><tbody className="divide-y divide-line">{top?.results.map((row) => <tr key={row.product_id}><td className="px-4 py-3 font-medium">{row.name_snapshot}</td><td className="px-4 py-3 font-mono text-xs">{row.sku_snapshot}</td><td className="px-4 py-3">{formatNumber(row.units_sold)}</td><td className="px-4 py-3">{money(row.sales_value)}</td><td className="px-4 py-3">{formatNumber(row.sale_count)}</td></tr>)}</tbody></table></div>}
    </section>
    <section className="rounded-xl border border-line bg-white p-4"><h2 className="font-semibold text-ink">Interpretation notes</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">{(summary?.notes ?? ["Figures are retrieved from the reporting API."]).map((note) => <li key={note}>{note}</li>)}</ul><p className="mt-3 text-xs text-ink-muted">Recent sales records loaded: {formatNumber(recentSales.length)}. Reports respect the branch permissions enforced by Django.</p></section>
  </div>;
}
