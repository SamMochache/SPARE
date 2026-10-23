import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangleIcon, ArrowDownToLineIcon, ArrowUpDownIcon, RefreshCwIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useAppData } from "../contexts/AppDataContext";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import {
  adjustStock, fetchBranches, fetchStockBalances, fetchStockMovements, receiveStock,
  type ApiBranch, type StockBalance, type StockMovement
} from "../api/inventory";

type Operation = "receive" | "adjust";
const writableRoles = new Set(["owner", "manager", "inventory"]);
const movementLabels: Record<StockMovement["movement_type"], string> = {
  receipt: "Stock received", sale: "Sale", return: "Customer return",
  adjustment_in: "Positive adjustment", adjustment_out: "Negative adjustment"
};
const numberFormat = new Intl.NumberFormat("en-KE");

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-KE", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

export function Inventory() {
  const { user } = useAuth();
  const { products, productsLoading, productsError, refreshProducts } = useAppData();
  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [operation, setOperation] = useState<Operation>("receive");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const canWrite = Boolean(user && writableRoles.has(user.role));
  const isOwner = user?.role === "owner" || user?.role === "owner" && user.branch_id === null;
  const selectedBranch = branches.find((item) => item.id === branchId) ?? null;
  const productById = useMemo(() => new Map(products.map((item) => [item.id, item])), [products]);

  useEffect(() => {
    let active = true;
    async function loadBranches() {
      setLoadingBranches(true);
      try {
        const result = await fetchBranches();
        if (!active) return;
        setBranches(result);
        const preferred = user?.branch_id && result.some((item) => item.id === user.branch_id)
          ? user.branch_id
          : result[0]?.id ?? null;
        setBranchId(preferred);
        setError(result.length ? "" : "No active branch is available to this account. Ask an administrator to assign your account to a branch.");
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load branches.");
      } finally {
        if (active) setLoadingBranches(false);
      }
    }
    void loadBranches();
    return () => { active = false; };
  }, [user?.branch_id]);

  const refreshInventory = useCallback(async () => {
    if (branchId === null) {
      setBalances([]);
      setMovements([]);
      return;
    }
    setLoadingInventory(true);
    setError("");
    try {
      const [nextBalances, nextMovements] = await Promise.all([
        fetchStockBalances(branchId), fetchStockMovements(branchId)
      ]);
      setBalances(nextBalances);
      setMovements(nextMovements);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load stock data.");
    } finally {
      setLoadingInventory(false);
    }
  }, [branchId]);

  useEffect(() => { void refreshInventory(); }, [refreshInventory]);

  const filteredBalances = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return balances;
    return balances.filter((balance) =>
      [balance.product_name, balance.product_sku].some((value) => value.toLocaleLowerCase().includes(query))
    );
  }, [balances, search]);

  const lowStockCount = balances.filter((item) => item.quantity_on_hand > 0 && item.quantity_on_hand <= 5).length;
  const outOfStockCount = balances.filter((item) => item.quantity_on_hand === 0).length;
  const totalUnits = balances.reduce((total, item) => total + item.quantity_on_hand, 0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (branchId === null) {
      toast.error("Select an active branch first.");
      return;
    }
    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity === 0) {
      toast.error(operation === "receive" ? "Enter a whole quantity greater than zero." : "Adjustment must be a non-zero whole number.");
      return;
    }
    if (operation === "receive" && parsedQuantity < 1) {
      toast.error("Received quantity must be greater than zero.");
      return;
    }
    if (!productId || !reason.trim()) {
      toast.error("Select a product and provide a reason.");
      return;
    }

    setSaving(true);
    try {
      const common = {
        ...(isOwner ? { branch: branchId } : {}),
        product: Number(productId),
        reason: reason.trim(),
        ...(reference.trim() ? { reference: reference.trim() } : {})
      };
      if (operation === "receive") {
        await receiveStock({ ...common, quantity: parsedQuantity });
        toast.success("Stock receipt recorded", { description: "The branch balance and audit ledger have been updated." });
      } else {
        await adjustStock({ ...common, quantity_delta: parsedQuantity });
        toast.success("Stock adjustment recorded", { description: "The branch balance and audit ledger have been updated." });
      }
      setReason("");
      setReference("");
      setQuantity("1");
      await Promise.all([refreshInventory(), refreshProducts().catch(() => undefined)]);
    } catch (cause) {
      toast.error("Stock operation failed", { description: cause instanceof Error ? cause.message : "Check the entered details and try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="Inventory Management"
        description="Live branch stock, receipts, adjustments and an auditable movement ledger."
        actions={<Button icon={RefreshCwIcon} onClick={() => void refreshInventory()} loading={loadingInventory}>Refresh</Button>}
      />

      {error && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 flex items-start gap-3">
          <AlertTriangleIcon className="w-5 h-5 text-danger shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-danger">Inventory could not be fully loaded</p>
            <p className="text-sm text-danger/90 mt-1">{error}</p>
          </div>
          <Button size="sm" onClick={() => void refreshInventory()}>Retry</Button>
        </div>
      )}

      <section className="bg-white border border-line rounded-xl shadow-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1 min-w-0">
          <label htmlFor="inventory-branch" className="block text-xs font-semibold text-ink-muted mb-1.5">Stock location</label>
          <select
            id="inventory-branch" value={branchId ?? ""}
            onChange={(event) => setBranchId(event.target.value ? Number(event.target.value) : null)}
            disabled={loadingBranches || branches.length === 0 || !isOwner}
            className="w-full max-w-md h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:bg-canvas"
          >
            {branches.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}
          </select>
          <p className="text-xs text-ink-muted mt-1.5">
            {isOwner ? "Choose an active branch. Owner stock operations are assigned to the selected branch." : "Your account is scoped to " + (user?.branch_name || selectedBranch?.name || "its assigned branch") + "."}
          </p>
        </div>
        <div className="text-xs text-ink-muted">
          {selectedBranch ? <><span className="font-semibold text-ink">{selectedBranch.name}</span><span className="block mt-1">{selectedBranch.address || "No address on file"}</span></> : "Loading branch details…"}
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-line rounded-xl shadow-card p-4">
          <p className="text-xs font-medium text-ink-muted">Units on hand</p>
          <p className="text-2xl font-semibold tracking-tight text-ink mt-1">{numberFormat.format(totalUnits)}</p>
          <p className="text-xs text-ink-muted mt-1">{balances.length} product balances in this branch</p>
        </div>
        <div className="bg-white border border-line rounded-xl shadow-card p-4">
          <p className="text-xs font-medium text-ink-muted">Low stock</p>
          <p className="text-2xl font-semibold tracking-tight text-ink mt-1">{lowStockCount}</p>
          <p className="text-xs text-ink-muted mt-1">Between 1 and 5 units</p>
        </div>
        <div className="bg-white border border-line rounded-xl shadow-card p-4">
          <p className="text-xs font-medium text-ink-muted">Out of stock</p>
          <p className="text-2xl font-semibold tracking-tight text-ink mt-1">{outOfStockCount}</p>
          <p className="text-xs text-ink-muted mt-1">Products with a recorded zero balance</p>
        </div>
      </div>

      {canWrite && (
        <section className="bg-white border border-line rounded-xl shadow-card p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Record a stock operation</h2>
              <p className="text-sm text-ink-muted mt-1">Every successful operation updates the balance and appends an immutable audit movement.</p>
            </div>
            <div className="inline-flex p-1 rounded-lg bg-canvas border border-line self-start">
              <button type="button" onClick={() => { setOperation("receive"); setQuantity("1"); }} className={"rounded-md px-3 py-2 text-xs font-semibold transition-colors " + (operation === "receive" ? "bg-white text-ink shadow-sm" : "text-ink-muted")}>
                Receive stock
              </button>
              <button type="button" onClick={() => { setOperation("adjust"); setQuantity("1"); }} className={"rounded-md px-3 py-2 text-xs font-semibold transition-colors " + (operation === "adjust" ? "bg-white text-ink shadow-sm" : "text-ink-muted")}>
                Adjust stock
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <div className="xl:col-span-2">
              <label htmlFor="stock-product" className="block text-xs font-semibold text-ink-muted mb-1.5">Product</label>
              <select id="stock-product" value={productId} onChange={(event) => setProductId(event.target.value)} required disabled={productsLoading || products.length === 0} className="w-full h-10 rounded-lg border border-line bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50">
                <option value="">Select a product…</option>
                {products.filter((product) => product.status === "active").map((product) => <option key={product.id} value={product.id}>{product.name} — {product.sku}</option>)}
              </select>
              {productsError && <p className="text-xs text-danger mt-1">{productsError}</p>}
            </div>
            <div>
              <label htmlFor="stock-quantity" className="block text-xs font-semibold text-ink-muted mb-1.5">{operation === "receive" ? "Quantity received" : "Signed quantity change"}</label>
              <input id="stock-quantity" type="number" step="1" min={operation === "receive" ? 1 : undefined} value={quantity} onChange={(event) => setQuantity(event.target.value)} required className="w-full h-10 rounded-lg border border-line px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
              {operation === "adjust" && <p className="text-[11px] text-ink-muted mt-1">Use a negative number to remove stock.</p>}
            </div>
            <div>
              <label htmlFor="stock-reference" className="block text-xs font-semibold text-ink-muted mb-1.5">Reference (optional)</label>
              <input id="stock-reference" maxLength={100} value={reference} onChange={(event) => setReference(event.target.value)} placeholder="e.g. GRN-102" className="w-full h-10 rounded-lg border border-line px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <label htmlFor="stock-reason" className="block text-xs font-semibold text-ink-muted mb-1.5">Reason</label>
              <input id="stock-reason" maxLength={255} value={reason} onChange={(event) => setReason(event.target.value)} required placeholder={operation === "receive" ? "Supplier delivery, opening balance…" : "Cycle count, damaged stock, correction…"} className="w-full h-10 rounded-lg border border-line px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="primary" icon={operation === "receive" ? ArrowDownToLineIcon : ArrowUpDownIcon} loading={saving} disabled={branchId === null || productsLoading || products.length === 0} className="w-full">
                {operation === "receive" ? "Record receipt" : "Record adjustment"}
              </Button>
            </div>
          </form>
          <p className="text-xs text-ink-muted mt-3">Transfers between branches and approval workflows are not included yet. Use Purchasing for purchase-order receipts when that workflow is connected.</p>
        </section>
      )}

      <section className="bg-white border border-line rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ink">Current stock balances</h2>
            <p className="text-xs text-ink-muted mt-1">Live values from Django for the selected branch only.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <SearchIcon className="w-4 h-4 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input aria-label="Search stock balances" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or SKU…" className="w-full h-9 rounded-lg border border-line pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-xs text-ink-muted"><tr>
              <th className="text-left font-semibold px-4 py-3">Product</th><th className="text-left font-semibold px-4 py-3">SKU</th>
              <th className="text-right font-semibold px-4 py-3">On hand</th><th className="text-left font-semibold px-4 py-3">Stock status</th>
              <th className="text-left font-semibold px-4 py-3">Last updated</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {loadingInventory ? <tr><td colSpan={5} className="px-4 py-10 text-center text-ink-muted">Loading branch stock…</td></tr> :
                filteredBalances.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-ink-muted">No stock balances found for this branch. Record a receipt to establish opening stock.</td></tr> :
                filteredBalances.map((balance) => {
                  const q = balance.quantity_on_hand;
                  const status = q === 0 ? { label: "Out of stock", className: "bg-danger-soft text-danger" } :
                    q <= 5 ? { label: "Low stock", className: "bg-amber-50 text-amber-700" } :
                    { label: "In stock", className: "bg-emerald-50 text-emerald-700" };
                  return <tr key={balance.id} className="hover:bg-canvas/60">
                    <td className="px-4 py-3.5 font-medium text-ink">{balance.product_name || productById.get(balance.product)?.name || "Unknown product"}</td>
                    <td className="px-4 py-3.5 text-ink-muted">{balance.product_sku || productById.get(balance.product)?.sku || "—"}</td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums">{numberFormat.format(q)}</td>
                    <td className="px-4 py-3.5"><span className={"inline-flex rounded-full px-2 py-1 text-[11px] font-semibold " + status.className}>{status.label}</span></td>
                    <td className="px-4 py-3.5 text-xs text-ink-muted whitespace-nowrap">{formatDate(balance.updated_at)}</td>
                  </tr>;
                })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white border border-line rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-line">
          <h2 className="text-base font-semibold text-ink">Stock movement history</h2>
          <p className="text-xs text-ink-muted mt-1">Append-only ledger entries including receipts, adjustments, sales and returns.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-xs text-ink-muted"><tr>
              <th className="text-left font-semibold px-4 py-3">Date</th><th className="text-left font-semibold px-4 py-3">Product</th>
              <th className="text-left font-semibold px-4 py-3">Movement</th><th className="text-right font-semibold px-4 py-3">Change</th>
              <th className="text-right font-semibold px-4 py-3">Balance after</th><th className="text-left font-semibold px-4 py-3">Reference / reason</th>
              <th className="text-left font-semibold px-4 py-3">Recorded by</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {loadingInventory ? <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-muted">Loading movement history…</td></tr> :
                movements.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-muted">No stock movements recorded for this branch yet.</td></tr> :
                movements.slice(0, 100).map((movement) => {
                  const increase = ["receipt", "return", "adjustment_in"].includes(movement.movement_type);
                  const decrease = ["sale", "adjustment_out"].includes(movement.movement_type);
                  const sign = increase ? "+" : decrease ? "−" : "";
                  const tone = increase ? "text-emerald-700" : decrease ? "text-danger" : "text-ink";
                  return <tr key={movement.id} className="hover:bg-canvas/60">
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-ink-muted">{formatDate(movement.created_at)}</td>
                    <td className="px-4 py-3.5"><span className="font-medium text-ink">{movement.product_name}</span><span className="block text-xs text-ink-muted mt-0.5">{movement.product_sku}</span></td>
                    <td className="px-4 py-3.5">{movementLabels[movement.movement_type] ?? movement.movement_type}</td>
                    <td className={"px-4 py-3.5 text-right font-semibold tabular-nums " + tone}>{sign}{numberFormat.format(movement.quantity)}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums">{numberFormat.format(movement.balance_after)}</td>
                    <td className="px-4 py-3.5 min-w-44"><span className="block text-ink">{movement.reference || "—"}</span><span className="block text-xs text-ink-muted mt-0.5">{movement.reason || "No reason supplied"}</span></td>
                    <td className="px-4 py-3.5 text-xs text-ink-muted">{movement.created_by_username || "System"}</td>
                  </tr>;
                })}
            </tbody>
          </table>
        </div>
        {movements.length > 100 && <p className="px-4 py-3 border-t border-line text-xs text-ink-muted">Showing the latest 100 of {movements.length} movements loaded for this branch.</p>}
      </section>

      {!canWrite && <p className="text-xs text-ink-muted">Your role has read-only inventory access. An owner, manager, or inventory staff member can record receipts and adjustments.</p>}
    </div>
  );
}
