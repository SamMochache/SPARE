import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { createSaleReturn, fetchSales, type SaleRecord } from "../api/sales";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import { formatKES } from "../utils/currency";

const statusLabels: Record<SaleRecord["status"], string> = { completed: "Completed", partially_refunded: "Partially refunded", refunded: "Refunded" };
const statusClasses: Record<SaleRecord["status"], string> = { completed: "bg-emerald-50 text-emerald-700", partially_refunded: "bg-amber-50 text-amber-700", refunded: "bg-rose-50 text-rose-700" };
const paymentLabels: Record<SaleRecord["payment_method"], string> = { cash: "Cash", mpesa: "M-Pesa (recorded)", card: "Card", bank: "Bank transfer", credit: "Credit" };
const canProcessReturns = new Set(["owner", "manager", "cashier"]);
function money(value: string | number) { const parsed = Number(value); return formatKES(Number.isFinite(parsed) ? parsed : 0); }
function formatDate(value: string) { return new Date(value).toLocaleString("en-KE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
function newReturnNumber(saleNumber: string) { return `RET-${saleNumber.replace(/[^a-zA-Z0-9-]/g, "").slice(-18)}-${Date.now().toString(36).toUpperCase()}`.slice(0, 40); }

export function SalesHistory() {
  const { user } = useAuth();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [returnSaleId, setReturnSaleId] = useState<number | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<SaleRecord["payment_method"]>("cash");
  const [returnQuantities, setReturnQuantities] = useState<Record<number, string>>({});
  const canReturn = Boolean(user && (canProcessReturns.has(user.role) || user.is_superuser));
  const isOwner = user?.role === "owner" || user?.is_superuser === true;

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { setSales(await fetchSales({ search, status, paymentMethod, from, to })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load sales from the API."); }
    finally { setLoading(false); }
  }, [search, status, paymentMethod, from, to]);
  useEffect(() => { void refresh(); }, [refresh]);

  const totalSales = useMemo(() => sales.reduce((sum, sale) => sum + Number(sale.total), 0), [sales]);
  const totalRefunds = useMemo(() => sales.reduce((sum, sale) => sum + Number(sale.refunded_total), 0), [sales]);

  function startReturn(sale: SaleRecord) {
    setReturnSaleId(sale.id); setReturnReason(""); setRefundMethod(sale.payment_method);
    setReturnQuantities(Object.fromEntries(sale.items.map((line) => [line.id, "0"])));
  }

  async function submitReturn(sale: SaleRecord) {
    if (!returnReason.trim()) { toast.error("Enter a reason for the return."); return; }
    const items = sale.items.map((line) => ({ sale_item: line.id, quantity: Number(returnQuantities[line.id] ?? "0") })).filter((line) => line.quantity > 0);
    if (!items.length || items.some((line) => !Number.isInteger(line.quantity))) { toast.error("Enter a positive whole return quantity for at least one item."); return; }
    if (items.some((item) => { const line = sale.items.find((candidate) => candidate.id === item.sale_item); return !line || item.quantity > line.quantity - line.quantity_returned; })) {
      toast.error("A return quantity exceeds the remaining quantity available to return."); return;
    }
    setSaving(true);
    try {
      await createSaleReturn(sale.id, { return_number: newReturnNumber(sale.sale_number), reason: returnReason.trim(), refund_method: refundMethod, items });
      toast.success("Return recorded", { description: "The API recorded the refund and restocked the returned items." });
      setReturnSaleId(null); setReturnReason(""); setReturnQuantities({});
      await refresh();
    } catch (cause) { toast.error("Could not process return", { description: cause instanceof Error ? cause.message : "Check return quantities and try again." }); }
    finally { setSaving(false); }
  }

  return <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
    <PageHeader title="Sales & Returns" description="Search recorded transactions, inspect receipt lines, and process auditable returns through Django." actions={<Button icon={RefreshCw} onClick={() => void refresh()} loading={loading}>Refresh</Button>} />
    {error && <div role="alert" className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertTriangle className="w-5 h-5 shrink-0" /><div className="flex-1">{error}</div><button onClick={() => void refresh()} className="font-semibold underline">Retry</button></div>}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="rounded-xl border border-line bg-white p-4 shadow-card"><p className="text-xs text-ink-muted">Transactions</p><p className="mt-1 text-2xl font-semibold">{sales.length}</p><p className="mt-1 text-xs text-ink-muted">Matching current filters</p></div>
      <div className="rounded-xl border border-line bg-white p-4 shadow-card"><p className="text-xs text-ink-muted">Sale totals</p><p className="mt-1 text-2xl font-semibold">{money(totalSales)}</p><p className="mt-1 text-xs text-ink-muted">Gross total of matching sales</p></div>
      <div className="rounded-xl border border-line bg-white p-4 shadow-card"><p className="text-xs text-ink-muted">Refunded so far</p><p className="mt-1 text-2xl font-semibold">{money(totalRefunds)}</p><p className="mt-1 text-xs text-ink-muted">Recorded refunds in matching sales</p></div>
    </div>
    <section className="rounded-xl border border-line bg-white p-4 shadow-card">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <label className="block text-xs font-semibold text-ink-muted">Receipt / sale number<div className="relative mt-1.5"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-subtle" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sale number…" className="h-10 w-full rounded-lg border border-line pl-9 pr-3 text-sm font-normal text-ink" /></div></label>
        <label className="block text-xs font-semibold text-ink-muted">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-normal text-ink"><option value="">All statuses</option><option value="completed">Completed</option><option value="partially_refunded">Partially refunded</option><option value="refunded">Refunded</option></select></label>
        <label className="block text-xs font-semibold text-ink-muted">Payment method<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-normal text-ink"><option value="">All methods</option>{Object.entries(paymentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="block text-xs font-semibold text-ink-muted">From date<input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-line px-3 text-sm font-normal text-ink" /></label>
        <label className="block text-xs font-semibold text-ink-muted">To date<input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-line px-3 text-sm font-normal text-ink" /></label>
      </div>
      <div className="mt-3 flex justify-end"><button type="button" onClick={() => { setSearch(""); setStatus(""); setPaymentMethod(""); setFrom(""); setTo(""); }} className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink-muted hover:bg-canvas">Clear filters</button></div>
    </section>
    <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className="border-b border-line p-4"><h2 className="font-semibold">Sales register</h2><p className="mt-1 text-xs text-ink-muted">Sales are retrieved from the API. Branch-level access is enforced by Django.</p></div>
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-canvas text-xs text-ink-muted"><tr><th className="px-4 py-3 text-left">Receipt</th><th className="px-4 py-3 text-left">Branch / cashier</th><th className="px-4 py-3 text-left">Customer</th><th className="px-4 py-3 text-left">Payment</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Refunded</th><th className="px-4 py-3 text-left">Details</th></tr></thead>
        <tbody className="divide-y divide-line">
          {loading ? <tr><td colSpan={8} className="px-4 py-10 text-center text-ink-muted">Loading sales…</td></tr> : sales.length === 0 ? <tr><td colSpan={8} className="px-4 py-10 text-center text-ink-muted">No recorded sales match these filters.</td></tr> :
            sales.map((sale) => <React.Fragment key={sale.id}>
              <tr className="hover:bg-canvas/60">
                <td className="px-4 py-3.5"><span className="font-semibold text-ink">{sale.sale_number}</span><span className="mt-0.5 block text-xs text-ink-muted">{formatDate(sale.created_at)}</span></td>
                <td className="px-4 py-3.5"><span>{sale.branch_name}</span><span className="mt-0.5 block text-xs text-ink-muted">{sale.cashier_username || "Unknown cashier"}</span></td>
                <td className="px-4 py-3.5"><span>{sale.customer_name || "Walk-in customer"}</span><span className="mt-0.5 block text-xs text-ink-muted">{sale.customer_phone || "No phone recorded"}</span></td>
                <td className="px-4 py-3.5">{paymentLabels[sale.payment_method] || sale.payment_method}</td>
                <td className="px-4 py-3.5"><span className={"inline-flex rounded-full px-2 py-1 text-[11px] font-semibold " + statusClasses[sale.status]}>{statusLabels[sale.status]}</span></td>
                <td className="px-4 py-3.5 text-right font-semibold tabular-nums">{money(sale.total)}</td><td className="px-4 py-3.5 text-right tabular-nums">{money(sale.refunded_total)}</td>
                <td className="px-4 py-3.5"><div className="flex gap-2"><button type="button" onClick={() => setExpandedId((current) => current === sale.id ? null : sale.id)} className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-semibold">{expandedId === sale.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}Details</button>{canReturn && sale.status !== "refunded" && <button type="button" onClick={() => { setExpandedId(sale.id); startReturn(sale); }} className="inline-flex items-center gap-1 rounded-md bg-navy px-2.5 py-1.5 text-xs font-semibold text-white"><RotateCcw className="h-3.5 w-3.5" />Return</button>}</div></td>
              </tr>
              {expandedId === sale.id && <tr><td colSpan={8} className="bg-canvas/70 p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 rounded-lg border border-line bg-white p-3"><h3 className="font-semibold">Receipt items</h3>
                    <div className="mt-3 overflow-x-auto"><table className="w-full text-xs"><thead className="bg-canvas text-ink-muted"><tr><th className="p-2 text-left">Part</th><th className="p-2 text-right">Qty sold</th><th className="p-2 text-right">Returned</th><th className="p-2 text-right">Unit price</th><th className="p-2 text-right">Line total</th></tr></thead><tbody className="divide-y divide-line">{sale.items.map((line) => <tr key={line.id}><td className="p-2"><span className="font-semibold">{line.name_snapshot}</span><span className="block text-ink-muted">{line.sku_snapshot}</span></td><td className="p-2 text-right">{line.quantity}</td><td className="p-2 text-right">{line.quantity_returned}</td><td className="p-2 text-right">{money(line.unit_price)}</td><td className="p-2 text-right">{money(line.line_total)}</td></tr>)}</tbody></table></div>
                    {sale.notes && <p className="mt-3 text-xs text-ink-muted">Notes: {sale.notes}</p>}<div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-line pt-3 text-sm"><span>Subtotal: {money(sale.subtotal)} · Discount: {money(sale.discount)}</span><span className="font-semibold">Total: {money(sale.total)}</span></div>
                  </div>
                  <div className="rounded-lg border border-line bg-white p-3"><h3 className="font-semibold">Transaction summary</h3><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-2"><dt className="text-ink-muted">Receipt</dt><dd className="font-medium text-right">{sale.sale_number}</dd></div><div className="flex justify-between gap-2"><dt className="text-ink-muted">Date</dt><dd className="text-right">{formatDate(sale.created_at)}</dd></div><div className="flex justify-between gap-2"><dt className="text-ink-muted">Refunded</dt><dd className="font-medium">{money(sale.refunded_total)}</dd></div><div className="flex justify-between gap-2"><dt className="text-ink-muted">Remaining value</dt><dd className="font-medium">{money(Number(sale.total) - Number(sale.refunded_total))}</dd></div></dl></div>
                </div>
                {returnSaleId === sale.id && canReturn && <form onSubmit={(event) => { event.preventDefault(); void submitReturn(sale); }} className="mt-4 rounded-lg border border-amber-200 bg-white p-4">
                  <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4" /><h3 className="font-semibold">Process return for {sale.sale_number}</h3></div><p className="mt-1 text-xs text-ink-muted">Returned quantities are added back to stock at the original sale branch. Refund values are calculated by the backend using original unit prices.</p>
                  <div className="mt-3 space-y-2">{sale.items.map((line) => { const remaining = line.quantity - line.quantity_returned; return <div key={line.id} className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 rounded-lg bg-canvas p-3"><div className="sm:col-span-7"><p className="text-sm font-medium">{line.name_snapshot} <span className="text-xs text-ink-muted">({line.sku_snapshot})</span></p><p className="mt-1 text-xs text-ink-muted">Sold {line.quantity} · Already returned {line.quantity_returned} · Remaining {remaining}</p></div><label className="sm:col-span-3 text-xs font-semibold text-ink-muted">Return quantity<input type="number" min={0} max={remaining} step={1} disabled={remaining === 0} value={returnQuantities[line.id] ?? "0"} onChange={(event) => setReturnQuantities((current) => ({ ...current, [line.id]: event.target.value }))} className="mt-1 h-9 w-full rounded-lg border border-line px-3 text-sm font-normal text-ink" /></label><div className="sm:col-span-2 text-right text-sm font-semibold">{money(Number(line.unit_price) * Math.max(0, Number(returnQuantities[line.id] ?? 0)))}</div></div>; })}</div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3"><label className="block text-xs font-semibold text-ink-muted">Reason<input maxLength={255} required value={returnReason} onChange={(event) => setReturnReason(event.target.value)} placeholder="e.g. Wrong part supplied" className="mt-1.5 h-10 w-full rounded-lg border border-line px-3 text-sm font-normal text-ink" /></label><label className="block text-xs font-semibold text-ink-muted">Refund method<select value={refundMethod} onChange={(event) => setRefundMethod(event.target.value as SaleRecord["payment_method"])} className="mt-1.5 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-normal text-ink">{Object.entries(paymentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
                  <div className="mt-3 flex gap-2"><Button type="submit" loading={saving} disabled={saving || sale.items.every((line) => line.quantity === line.quantity_returned)} icon={RotateCcw}>Confirm return</Button><Button type="button" variant="secondary" disabled={saving} onClick={() => setReturnSaleId(null)}>Cancel</Button></div>
                </form>}
              </td></tr>}
            </React.Fragment>)}
        </tbody>
      </table></div>
    </section>
    {!canReturn && <p className="text-xs text-ink-muted">Read-only returns access: your role can view sales but cannot process returns.</p>}
    {isOwner && <p className="text-xs text-ink-muted">Owner view: sales are returned from all branches visible to your account. Other roles are scoped by the API to their assigned branch.</p>}
    <p className="text-xs text-ink-muted">M-Pesa is currently a recorded payment method only; this screen does not initiate or verify payments through Safaricom Daraja.</p>
  </div>;
}
