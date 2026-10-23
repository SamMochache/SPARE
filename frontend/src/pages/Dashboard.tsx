import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CoinsIcon, PackageIcon, PackagePlusIcon, PlusIcon, TriangleAlertIcon, TruckIcon, UserPlusIcon } from 'lucide-react';
import { fetchSales } from '../api/sales';
import { fetchDashboardSummary, fetchInventoryReport, fetchSalesReport, fetchTopProductsReport, type DashboardSummary, type InventoryReport, type SalesReport, type TopProductsReport } from '../api/reports';
import type { SaleRecord } from '../api/sales';
import { buttonClass } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { StatCard } from '../components/ui/StatCard';
import { formatCompactKES, formatKES, formatNumber } from '../utils/currency';

function localDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  return { startDate: localDate(start), endDate: localDate(end) };
}

function money(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return formatKES(Number.isFinite(amount) ? amount : 0);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to load reports from the API.';
}

export function Dashboard() {
  const [period, setPeriod] = useState(dateRange);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductsReport | null>(null);
  const [recentSales, setRecentSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters = { ...period };
      const [summaryData, salesData, inventoryData, topProductsData, recentData] = await Promise.all([
        fetchDashboardSummary(filters),
        fetchSalesReport(filters),
        fetchInventoryReport(filters),
        fetchTopProductsReport(filters),
        fetchSales({ from: period.startDate, to: period.endDate })
      ]);
      setSummary(summaryData);
      setSalesReport(salesData);
      setInventory(inventoryData);
      setTopProducts(topProductsData);
      setRecentSales([...recentData].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 7));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const totalNetRevenue = salesReport?.results.reduce((total, row) => total + Number(row.net_revenue), 0) ?? 0;
  const chartData = (salesReport?.results ?? []).map((row) => ({
    label: new Date(`${row.date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    revenue: Number(row.net_revenue),
    transactions: row.sale_count
  }));
  const products = topProducts?.results ?? [];
  const lowStock = inventory?.low_stock ?? [];

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="Overview"
        description="Live figures from the reporting API · branch access is enforced by the server"
        actions={<>
          <Link to="/pos" className={buttonClass('primary')}><PlusIcon className="w-4 h-4" aria-hidden="true" />New sale</Link>
          <Link to="/products?new=1" className={buttonClass('secondary')}><PackagePlusIcon className="w-4 h-4" aria-hidden="true" />Add product</Link>
          <Link to="/purchases" className={buttonClass('secondary')}><TruckIcon className="w-4 h-4" aria-hidden="true" />Receive stock</Link>
          <Link to="/customers" className={buttonClass('secondary')}><UserPlusIcon className="w-4 h-4" aria-hidden="true" />Add customer</Link>
        </>}
      />

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4">
        <label className="text-sm text-ink-muted flex flex-col gap-1">From
          <input type="date" value={period.startDate} max={period.endDate} onChange={(e) => setPeriod((p) => ({ ...p, startDate: e.target.value }))} className="rounded-md border border-line px-3 py-2 text-ink" />
        </label>
        <label className="text-sm text-ink-muted flex flex-col gap-1">To
          <input type="date" value={period.endDate} min={period.startDate} max={localDate(new Date())} onChange={(e) => setPeriod((p) => ({ ...p, endDate: e.target.value }))} className="rounded-md border border-line px-3 py-2 text-ink" />
        </label>
        <button type="button" onClick={() => void loadReports()} disabled={loading} className={buttonClass('secondary')}>{loading ? 'Refreshing…' : 'Refresh reports'}</button>
        <span className="text-xs text-ink-muted">{period.startDate} — {period.endDate}</span>
      </div>

      {error && <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm text-ink">
        <p className="font-medium">Reports could not be loaded.</p><p className="mt-1">{error}</p>
        <button type="button" onClick={() => void loadReports()} className="mt-2 font-semibold underline">Try again</button>
      </div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Net sales" value={loading && !summary ? '—' : money(summary?.sales.net_revenue)} icon={CoinsIcon} meta={`${formatNumber(summary?.sales.count ?? 0)} recorded sales in period`} />
        <StatCard label="Low-stock positions" value={loading && !inventory ? '—' : formatNumber(summary?.inventory.low_stock_positions ?? 0)} icon={TriangleAlertIcon} tone={(summary?.inventory.low_stock_positions ?? 0) > 0 ? 'danger' : 'default'} meta="At or below threshold" to="/products?stock=needs_reorder" />
        <StatCard label="Inventory cost value" value={loading && !summary ? '—' : money(summary?.inventory.inventory_cost_value)} icon={PackageIcon} meta="Current catalogue cost × on-hand quantity" />
        <StatCard label="Units sold" value={loading && !summary ? '—' : formatNumber(summary?.sales.units_sold ?? 0)} icon={PackageIcon} meta="Recorded sales, selected period" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Net sales trend" description="Daily recorded sales less recorded refunds" bodyClassName="px-5 pb-5">
          <p className="text-2xl font-semibold tracking-tight text-ink tabular-nums">{money(totalNetRevenue)}</p>
          <p className="mt-1 text-xs text-ink-muted">Period total · excludes payment settlement verification</p>
          <div className="mt-4 h-[260px]">
            {chartData.length ? <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E3E8EF" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#7D889A', fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={20} />
                <YAxis tickFormatter={(value: number) => formatCompactKES(value)} tick={{ fill: '#7D889A', fontSize: 12 }} axisLine={false} tickLine={false} width={58} />
                <Tooltip formatter={(value) => money(Number(value))} />
                <Line type="monotone" dataKey="revenue" name="Net sales" stroke="#14243A" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#F97316', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer> : <p className="py-12 text-center text-sm text-ink-muted">{loading ? 'Loading sales trend…' : 'No sales recorded for this period.'}</p>}
          </div>
        </Panel>
        <Panel title="Reporting notes" description="How to interpret these figures">
          <ul className="space-y-3 text-sm text-ink-muted">
            {(summary?.notes ?? ['Figures are loaded from the reporting API.']).map((note) => <li key={note} className="border-b border-line pb-3 last:border-0">{note}</li>)}
            <li>Net sales are calculated from recorded sales minus recorded refunds; this does not verify M-Pesa, card, or bank settlement.</li>
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Best-selling parts" description="Ranked by units sold for the selected period" bodyClassName="">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-ink-muted border-y border-line bg-canvas/60">
                <th className="px-5 py-2.5 font-medium">#</th><th className="px-3 py-2.5 font-medium">Part</th><th className="px-3 py-2.5 font-medium text-right">Units sold</th><th className="px-5 py-2.5 font-medium text-right">Sales value</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {products.map((item, index) => <tr key={`${item.product_id}-${item.sku_snapshot}`}>
                  <td className="px-5 py-3 text-ink-subtle">{index + 1}</td>
                  <td className="px-3 py-3"><p className="font-medium text-ink">{item.name_snapshot}</p><p className="font-mono text-xs text-ink-muted">{item.sku_snapshot}</p></td>
                  <td className="px-3 py-3 text-right tabular-nums">{formatNumber(item.units_sold)}</td>
                  <td className="px-5 py-3 text-right tabular-nums whitespace-nowrap">{money(item.sales_value)}</td>
                </tr>)}
                {!products.length && <tr><td colSpan={4} className="px-5 py-8 text-center text-ink-muted">{loading ? 'Loading top products…' : 'No product sales for this period.'}</td></tr>}
              </tbody>
            </table>
          </div>
          {topProducts?.note && <p className="px-5 py-3 text-xs text-ink-muted border-t border-line">{topProducts.note}</p>}
        </Panel>
        <Panel title="Low stock" description={`${lowStock.length} positions at or below reorder threshold`} actions={<Link to="/products?stock=needs_reorder" className="text-[13px] font-medium text-accent-strong hover:underline">View inventory</Link>} bodyClassName="px-5 pb-4">
          {lowStock.length ? <ul className="divide-y divide-line">
            {lowStock.slice(0, 8).map((item) => <li key={`${item.branch}-${item.product}`} className="py-3 first:pt-0">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-ink">{item.name}</p><p className="font-mono text-xs text-ink-muted">{item.sku}{inventory?.branch === null ? ` · ${item.branch_name}` : ''}</p></div>
                <span className={`whitespace-nowrap rounded px-2 py-1 text-xs font-semibold ${item.quantity_on_hand <= 0 ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-ink'}`}>{formatNumber(item.quantity_on_hand)} left</span></div>
            </li>)}
          </ul> : <p className="py-8 text-center text-sm text-ink-muted">{loading ? 'Loading inventory…' : 'No low-stock positions found.'}</p>}
          {inventory?.note && <p className="mt-2 border-t border-line pt-3 text-xs text-ink-muted">{inventory.note}</p>}
        </Panel>
      </div>

      <Panel title="Recent sales" description="Latest transactions in the selected period" actions={<Link to="/sales" className="text-[13px] font-medium text-accent-strong hover:underline">View all</Link>} bodyClassName="">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-ink-muted border-y border-line bg-canvas/60">
              <th className="px-5 py-2.5 font-medium">Receipt</th><th className="px-3 py-2.5 font-medium">Customer</th><th className="px-3 py-2.5 font-medium">Payment</th><th className="px-3 py-2.5 font-medium">Status</th><th className="px-5 py-2.5 font-medium text-right">Total</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {recentSales.map((sale) => <tr key={sale.id}>
                <td className="px-5 py-3 font-mono text-xs text-ink">{sale.sale_number}<p className="font-sans text-ink-muted">{new Date(sale.created_at).toLocaleString()}</p></td>
                <td className="px-3 py-3 text-ink">{sale.customer_name || 'Walk-in customer'}</td>
                <td className="px-3 py-3 capitalize text-ink-muted">{sale.payment_method === 'mpesa' ? 'M-Pesa' : sale.payment_method === 'bank' ? 'Bank' : sale.payment_method}</td>
                <td className="px-3 py-3 capitalize text-ink-muted">{sale.status.replaceAll('_', ' ')}</td>
                <td className="px-5 py-3 text-right font-medium tabular-nums whitespace-nowrap">{money(sale.total)}</td>
              </tr>)}
              {!recentSales.length && <tr><td colSpan={5} className="px-5 py-8 text-center text-ink-muted">{loading ? 'Loading recent sales…' : 'No sales recorded for this period.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
