import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ClipboardList, PackageCheck, Plus, RefreshCw, Truck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useAppData } from "../contexts/AppDataContext";
import { PageHeader } from "../components/ui/PageHeader";
import {
  cancelPurchaseOrder, createPurchaseOrder, createSupplier, fetchPurchaseOrders, fetchPurchasingBranches,
  fetchSuppliers, orderPurchaseOrder, receivePurchaseOrder, type PurchaseOrder, type PurchasingBranch,
  type Supplier
} from "../api/purchasing";

type LineDraft = { product: string; quantity: string; unitCost: string };
const blankLine = (): LineDraft => ({ product: "", quantity: "1", unitCost: "" });
const money = (value: string | number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 2 }).format(Number(value) || 0);
const statusClasses: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700", ordered: "bg-blue-50 text-blue-700",
  partially_received: "bg-amber-50 text-amber-800", received: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700"
};
const statusLabels: Record<string, string> = {
  draft: "Draft", ordered: "Ordered", partially_received: "Partially received", received: "Received", cancelled: "Cancelled"
};

export function Purchasing() {
  const { user } = useAuth();
  const { products, productsLoading, refreshProducts } = useAppData();
  const [branches, setBranches] = useState<PurchasingBranch[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<number, string>>({});
  const [branchId, setBranchId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([blankLine()]);
  const [supplierDraft, setSupplierDraft] = useState({
    name: "", code: "", contact_name: "", email: "", phone: "", address: "", payment_terms: "", notes: ""
  });

  const isOwner = user?.role === "owner" || user?.is_superuser === true;
  const canManage = Boolean(user && (isOwner || ["manager", "inventory"].includes(user.role)));
  const availableProducts = useMemo(() => products.filter((product) => product.status === "active"), [products]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextBranches, nextSuppliers, nextOrders] = await Promise.all([
        fetchPurchasingBranches(), fetchSuppliers(), fetchPurchaseOrders()
      ]);
      setBranches(nextBranches);
      setSuppliers(nextSuppliers);
      setOrders(nextOrders);
      setBranchId((current) => {
        if (current && nextBranches.some((branch) => branch.id === current)) return current;
        if (user?.branch_id && nextBranches.some((branch) => branch.id === user.branch_id)) return user.branch_id;
        return nextBranches[0]?.id ?? null;
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load purchasing data.");
    } finally {
      setLoading(false);
    }
  }, [user?.branch_id]);

  useEffect(() => { void refresh(); }, [refresh]);

  function updateLine(index: number, field: keyof LineDraft, value: string) {
    setLines((current) => current.map((line, i) => i === index ? { ...line, [field]: value } : line));
  }

  async function submitSupplier(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const created = await createSupplier({
        ...supplierDraft,
        name: supplierDraft.name.trim(),
        code: supplierDraft.code.trim().toLowerCase().replace(/\s+/g, "-")
      });
      setSuppliers((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSupplierId(String(created.id));
      setSupplierDraft({ name: "", code: "", contact_name: "", email: "", phone: "", address: "", payment_terms: "", notes: "" });
      setShowSupplierForm(false);
      toast.success("Supplier created");
    } catch (cause) {
      toast.error("Could not create supplier", { description: cause instanceof Error ? cause.message : "Check supplier details." });
    } finally { setSaving(false); }
  }

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (branchId === null || !supplierId) {
      toast.error("Choose a branch and supplier.");
      return;
    }
    const cleanLines = lines.map((line) => ({
      product: Number(line.product), quantity_ordered: Number(line.quantity), unit_cost: Number(line.unitCost)
    }));
    if (cleanLines.some((line) => !line.product || !Number.isInteger(line.quantity_ordered) || line.quantity_ordered < 1 || !Number.isFinite(line.unit_cost) || line.unit_cost < 0)) {
      toast.error("Each line needs a product, positive whole quantity, and non-negative unit cost.");
      return;
    }
    if (new Set(cleanLines.map((line) => line.product)).size !== cleanLines.length) {
      toast.error("Each product can appear only once per purchase order.");
      return;
    }
    setSaving(true);
    try {
      await createPurchaseOrder({
        order_number: orderNumber.trim(), supplier: Number(supplierId), branch: branchId, notes: notes.trim(), items: cleanLines
      });
      toast.success("Purchase order saved as draft");
      setOrderNumber(""); setNotes(""); setLines([blankLine()]); setShowOrderForm(false);
      await refresh();
    } catch (cause) {
      toast.error("Could not create purchase order", { description: cause instanceof Error ? cause.message : "Check the order details." });
    } finally { setSaving(false); }
  }

  async function runOrderAction(order: PurchaseOrder, action: "order" | "cancel") {
    setSaving(true);
    try {
      if (action === "order") await orderPurchaseOrder(order.id);
      else await cancelPurchaseOrder(order.id);
      toast.success(action === "order" ? "Purchase order submitted to supplier" : "Purchase order cancelled");
      await refresh();
    } catch (cause) {
      toast.error("Purchase order action failed", { description: cause instanceof Error ? cause.message : "Please try again." });
    } finally { setSaving(false); }
  }

  async function receive(order: PurchaseOrder) {
    const items = order.items.map((line) => ({
      item_id: line.id,
      quantity: Number(receiveQuantities[line.id] ?? (line.outstanding_quantity > 0 ? String(line.outstanding_quantity) : "0"))
    })).filter((line) => line.quantity > 0);
    if (!items.length || items.some((line) => !Number.isInteger(line.quantity))) {
      toast.error("Enter at least one positive whole quantity to receive.");
      return;
    }
    setSaving(true);
    try {
      await receivePurchaseOrder(order.id, items);
      toast.success("Goods received", { description: "Stock balances and the inventory movement ledger were updated by the API." });
      setReceiveQuantities({});
      setSelectedOrder(null);
      await Promise.all([refresh(), refreshProducts().catch(() => undefined)]);
    } catch (cause) {
      toast.error("Goods receipt failed", { description: cause instanceof Error ? cause.message : "Check received quantities." });
    } finally { setSaving(false); }
  }

  const visibleOrders = orders.filter((order) => !branchId || order.branch === branchId);
  const totalOutstanding = visibleOrders.filter((order) => ["ordered", "partially_received"].includes(order.status)).length;
  const totalDrafts = visibleOrders.filter((order) => order.status === "draft").length;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader title="Purchasing & Restocking" description="Manage suppliers, create purchase orders, and receive goods directly into branch stock." actions={
        <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-canvas disabled:opacity-50"><RefreshCw className="w-4 h-4" />Refresh</button>
      } />
      {error && <div role="alert" className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertTriangle className="w-5 h-5 shrink-0" /><div className="flex-1">{error}</div><button onClick={() => void refresh()} className="font-semibold underline">Retry</button></div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-line bg-white p-4 shadow-card"><p className="text-xs text-ink-muted">Active suppliers</p><p className="mt-1 text-2xl font-semibold">{suppliers.length}</p></div>
        <div className="rounded-xl border border-line bg-white p-4 shadow-card"><p className="text-xs text-ink-muted">Open orders</p><p className="mt-1 text-2xl font-semibold">{totalOutstanding}</p></div>
        <div className="rounded-xl border border-line bg-white p-4 shadow-card"><p className="text-xs text-ink-muted">Draft orders</p><p className="mt-1 text-2xl font-semibold">{totalDrafts}</p></div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Purchase orders</h2>
          <p className="mt-1 text-sm text-ink-muted">Orders and receipt status are stored in Django, not browser storage.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isOwner && <select aria-label="Filter by branch" value={branchId ?? ""} onChange={(event) => setBranchId(event.target.value ? Number(event.target.value) : null)} className="h-10 rounded-lg border border-line bg-white px-3 text-sm">{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>}
          {canManage && <button onClick={() => setShowSupplierForm((value) => !value)} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold hover:bg-canvas"><Truck className="w-4 h-4" />Add supplier</button>}
          {canManage && <button onClick={() => setShowOrderForm((value) => !value)} className="inline-flex items-center gap-2 rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white hover:opacity-90"><Plus className="w-4 h-4" />New purchase order</button>}
        </div>
      </div>

      {showSupplierForm && canManage && <form onSubmit={submitSupplier} className="rounded-xl border border-line bg-white p-4 shadow-card space-y-3">
        <div className="flex items-center gap-2"><Truck className="w-5 h-5" /><h3 className="font-semibold">Create supplier</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {([
            ["name", "Supplier name", true], ["code", "Supplier code", true], ["contact_name", "Contact person", false],
            ["email", "Email", false], ["phone", "Phone", false], ["address", "Address", false], ["payment_terms", "Payment terms", false]
          ] as const).map(([field, label, required]) => <label key={field} className="block text-xs font-semibold text-ink-muted">{label}<input required={required} type={field === "email" ? "email" : "text"} value={supplierDraft[field]} onChange={(event) => setSupplierDraft((current) => ({ ...current, [field]: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-line px-3 text-sm font-normal text-ink" /></label>)}
        </div>
        <label className="block text-xs font-semibold text-ink-muted">Notes<textarea value={supplierDraft.notes} onChange={(event) => setSupplierDraft((current) => ({ ...current, notes: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-line p-3 text-sm font-normal text-ink" rows={2} /></label>
        <div className="flex gap-2"><button disabled={saving} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save supplier</button><button type="button" onClick={() => setShowSupplierForm(false)} className="rounded-lg border border-line px-4 py-2 text-sm">Cancel</button></div>
      </form>}

      {showOrderForm && canManage && <form onSubmit={submitOrder} className="rounded-xl border border-line bg-white p-4 shadow-card space-y-4">
        <div className="flex items-center gap-2"><ClipboardList className="w-5 h-5" /><h3 className="font-semibold">New purchase order</h3></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="block text-xs font-semibold text-ink-muted">Order number<input required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="e.g. PO-2026-001" className="mt-1.5 h-10 w-full rounded-lg border border-line px-3 text-sm font-normal text-ink" /></label>
          <label className="block text-xs font-semibold text-ink-muted">Supplier<select required value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-normal text-ink"><option value="">Select supplier…</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
          <label className="block text-xs font-semibold text-ink-muted">Receiving branch<select required disabled={!isOwner} value={branchId ?? ""} onChange={(event) => setBranchId(event.target.value ? Number(event.target.value) : null)} className="mt-1.5 h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-normal text-ink">{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><h4 className="text-sm font-semibold">Order lines</h4><button type="button" onClick={() => setLines((current) => [...current, blankLine()])} className="text-sm font-semibold text-accent">+ Add line</button></div>
          {lines.map((line, index) => <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 rounded-lg bg-canvas p-3">
            <label className="sm:col-span-6 text-xs font-semibold text-ink-muted">Product<select required value={line.product} onChange={(event) => { const selected = availableProducts.find((product) => product.id === Number(event.target.value)); setLines((current) => current.map((row, i) => i === index ? { ...row, product: event.target.value, unitCost: selected ? String(selected.costPrice) : row.unitCost } : row)); }} className="mt-1 w-full h-10 rounded-lg border border-line bg-white px-3 text-sm font-normal text-ink"><option value="">Select product…</option>{availableProducts.map((product) => <option key={product.id} value={product.id}>{product.name} — {product.sku}</option>)}</select></label>
            <label className="sm:col-span-2 text-xs font-semibold text-ink-muted">Quantity<input required min={1} step={1} type="number" value={line.quantity} onChange={(event) => updateLine(index, "quantity", event.target.value)} className="mt-1 w-full h-10 rounded-lg border border-line px-3 text-sm font-normal text-ink" /></label>
            <label className="sm:col-span-3 text-xs font-semibold text-ink-muted">Unit cost (KES)<input required min={0} step="0.01" type="number" value={line.unitCost} onChange={(event) => updateLine(index, "unitCost", event.target.value)} className="mt-1 w-full h-10 rounded-lg border border-line px-3 text-sm font-normal text-ink" /></label>
            <div className="sm:col-span-1 flex items-end"><button type="button" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, i) => i !== index))} aria-label="Remove order line" className="h-10 w-full rounded-lg border border-line bg-white text-rose-700 disabled:opacity-40">×</button></div>
          </div>)}
        </div>
        <label className="block text-xs font-semibold text-ink-muted">Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className="mt-1.5 w-full rounded-lg border border-line p-3 text-sm font-normal text-ink" /></label>
        <p className="text-xs text-ink-muted">Saving creates a draft only. Stock changes only when goods are received against an ordered purchase order.</p>
        <div className="flex gap-2"><button disabled={saving || productsLoading || !availableProducts.length || !suppliers.length} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save draft</button><button type="button" onClick={() => setShowOrderForm(false)} className="rounded-lg border border-line px-4 py-2 text-sm">Cancel</button></div>
      </form>}

      <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
        <div className="border-b border-line p-4"><h3 className="font-semibold">Order register</h3><p className="mt-1 text-xs text-ink-muted">Draft, ordered, partial receipt and completed purchase orders.</p></div>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-canvas text-xs text-ink-muted"><tr><th className="px-4 py-3 text-left">Order</th><th className="px-4 py-3 text-left">Supplier</th><th className="px-4 py-3 text-left">Branch</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-right">Order total</th><th className="px-4 py-3 text-right">Received</th><th className="px-4 py-3 text-left">Actions</th></tr></thead>
          <tbody className="divide-y divide-line">
            {loading ? <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-muted">Loading purchase orders…</td></tr> :
              visibleOrders.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-muted">No purchase orders for this branch yet.</td></tr> :
              visibleOrders.map((order) => <React.Fragment key={order.id}>
                <tr className="hover:bg-canvas/60">
                  <td className="px-4 py-3.5"><span className="font-semibold text-ink">{order.order_number}</span><span className="mt-0.5 block text-xs text-ink-muted">{new Date(order.created_at).toLocaleDateString("en-KE")}</span></td>
                  <td className="px-4 py-3.5">{order.supplier_name}</td><td className="px-4 py-3.5">{order.branch_name}</td>
                  <td className="px-4 py-3.5"><span className={"inline-flex rounded-full px-2 py-1 text-[11px] font-semibold " + (statusClasses[order.status] || statusClasses.draft)}>{statusLabels[order.status] || order.status}</span></td>
                  <td className="px-4 py-3.5 text-right tabular-nums">{money(order.total_cost)}</td><td className="px-4 py-3.5 text-right tabular-nums">{money(order.received_cost)}</td>
                  <td className="px-4 py-3.5"><div className="flex flex-wrap gap-2">
                    {canManage && order.status === "draft" && <button disabled={saving} onClick={() => void runOrderAction(order, "order")} className="rounded-md bg-navy px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Mark ordered</button>}
                    {canManage && ["ordered", "partially_received"].includes(order.status) && <button onClick={() => setSelectedOrder((current) => current === order.id ? null : order.id)} className="rounded-md border border-line px-2.5 py-1.5 text-xs font-semibold">Receive goods</button>}
                    {canManage && ["draft", "ordered"].includes(order.status) && <button disabled={saving} onClick={() => void runOrderAction(order, "cancel")} className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50">Cancel</button>}
                  </div></td>
                </tr>
                {selectedOrder === order.id && <tr><td colSpan={7} className="bg-canvas/70 p-4">
                  <div className="mb-3 flex items-center gap-2"><PackageCheck className="w-5 h-5" /><h4 className="font-semibold">Receive against {order.order_number}</h4></div>
                  <div className="space-y-2">{order.items.filter((line) => line.outstanding_quantity > 0).map((line) => <div key={line.id} className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 rounded-lg bg-white p-3">
                    <div className="sm:col-span-7"><p className="text-sm font-medium">{line.product_name} <span className="text-xs text-ink-muted">({line.product_sku})</span></p><p className="text-xs text-ink-muted mt-1">Ordered {line.quantity_ordered} · Received {line.quantity_received} · Outstanding {line.outstanding_quantity}</p></div>
                    <label className="sm:col-span-3 text-xs text-ink-muted">Receive quantity<input type="number" min={0} max={line.outstanding_quantity} step={1} value={receiveQuantities[line.id] ?? String(line.outstanding_quantity)} onChange={(event) => setReceiveQuantities((current) => ({ ...current, [line.id]: event.target.value }))} className="mt-1 h-9 w-full rounded-lg border border-line px-3 text-sm text-ink" /></label>
                    <div className="sm:col-span-2 text-right text-sm font-semibold">{money(Number(line.unit_cost) * line.outstanding_quantity)}</div>
                  </div>)}</div>
                  <div className="mt-3 flex gap-2"><button disabled={saving} onClick={() => void receive(order)} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Confirm receipt</button><button onClick={() => setSelectedOrder(null)} className="rounded-lg border border-line bg-white px-4 py-2 text-sm">Close</button></div>
                </td></tr>}
              </React.Fragment>)}
          </tbody>
        </table></div>
      </section>
      {!canManage && <p className="text-xs text-ink-muted">Read-only access: your role can view purchase orders but cannot create or update purchasing records.</p>}
      {productsLoading && <p className="text-xs text-ink-muted">Loading product catalogue for purchase order lines…</p>}
    </div>
  );
}
