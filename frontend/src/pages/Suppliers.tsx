import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, RefreshCw, Search, Truck, UserRound, X } from "lucide-react";
import { apiRequest } from "../api/client";
import { createSupplier, fetchSuppliers, type Supplier } from "../api/purchasing";
import { PageHeader } from "../components/ui/PageHeader";
import { buttonClass } from "../components/ui/Button";

const inputClass = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const emptyDraft = { name: "", code: "", contact_name: "", email: "", phone: "", address: "", payment_terms: "", notes: "" };

export function Suppliers() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await fetchSuppliers());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load suppliers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = items.filter((supplier) =>
    [supplier.name, supplier.code, supplier.contact_name, supplier.email, supplier.phone]
      .some((value) => value?.toLowerCase().includes(query.trim().toLowerCase()))
  );

  function update(field: keyof typeof emptyDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const created = await createSupplier({
        ...draft,
        name: draft.name.trim(),
        code: draft.code.trim().toLowerCase().replace(/\s+/g, "-"),
        contact_name: draft.contact_name.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        address: draft.address.trim(),
        payment_terms: draft.payment_terms.trim(),
        notes: draft.notes.trim()
      });
      setItems((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setDraft(emptyDraft);
      setShowForm(false);
      toast.success("Supplier created");
    } catch (cause) {
      toast.error("Supplier could not be created", { description: cause instanceof Error ? cause.message : "Check the supplied details." });
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(supplier: Supplier) {
    if (!window.confirm(`Deactivate supplier "${supplier.name}"? Existing purchase history will be preserved.`)) return;
    try {
      await apiRequest<Supplier>(`/api/v1/suppliers/${supplier.id}/`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== supplier.id));
      toast.success("Supplier deactivated");
    } catch (cause) {
      toast.error("Supplier could not be deactivated", { description: cause instanceof Error ? cause.message : "Please try again." });
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <PageHeader title="Suppliers" description="Manage supplier contacts using the Django purchasing API." actions={
        <button type="button" onClick={() => setShowForm((value) => !value)} className={buttonClass("primary")}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{showForm ? "Cancel" : "Add supplier"}
        </button>
      } />
      {error && <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm">
        <p className="font-medium">Suppliers could not be loaded.</p><p className="mt-1">{error}</p>
        <button type="button" onClick={() => void load()} className="mt-2 font-semibold underline">Retry</button>
      </div>}
      {showForm && <form onSubmit={submit} className="space-y-4 rounded-xl border border-line bg-white p-5 shadow-card">
        <h2 className="font-semibold text-ink">New supplier</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-medium">Supplier name *<input required maxLength={200} className={inputClass + " mt-1"} value={draft.name} onChange={(e) => update("name", e.target.value)} /></label>
          <label className="text-sm font-medium">Supplier code *<input required maxLength={50} className={inputClass + " mt-1"} value={draft.code} onChange={(e) => update("code", e.target.value)} placeholder="e.g. nairobi-parts" /></label>
          <label className="text-sm font-medium">Contact person<input maxLength={150} className={inputClass + " mt-1"} value={draft.contact_name} onChange={(e) => update("contact_name", e.target.value)} /></label>
          <label className="text-sm font-medium">Email<input type="email" maxLength={254} className={inputClass + " mt-1"} value={draft.email} onChange={(e) => update("email", e.target.value)} /></label>
          <label className="text-sm font-medium">Phone<input maxLength={40} className={inputClass + " mt-1"} value={draft.phone} onChange={(e) => update("phone", e.target.value)} /></label>
          <label className="text-sm font-medium">Payment terms<input maxLength={100} className={inputClass + " mt-1"} value={draft.payment_terms} onChange={(e) => update("payment_terms", e.target.value)} placeholder="e.g. 30 days" /></label>
          <label className="text-sm font-medium sm:col-span-2 lg:col-span-3">Address<input maxLength={300} className={inputClass + " mt-1"} value={draft.address} onChange={(e) => update("address", e.target.value)} /></label>
          <label className="text-sm font-medium sm:col-span-2 lg:col-span-3">Notes<textarea maxLength={2000} rows={2} className={inputClass + " mt-1"} value={draft.notes} onChange={(e) => update("notes", e.target.value)} /></label>
        </div>
        <button type="submit" disabled={saving} className={buttonClass("primary")}>{saving ? "Saving…" : "Save supplier"}</button>
      </form>}
      <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-semibold text-ink">Supplier directory</h2><p className="text-sm text-ink-muted">{loading ? "Loading suppliers…" : `${filtered.length} active supplier${filtered.length === 1 ? "" : "s"}`}</p></div>
          <div className="flex gap-2">
            <label className="relative block"><span className="sr-only">Search suppliers</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" /><input className={inputClass + " pl-9 sm:w-72"} placeholder="Search name, code, contact…" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
            <button type="button" aria-label="Refresh suppliers" title="Refresh suppliers" disabled={loading} onClick={() => void load()} className={buttonClass("secondary")}><RefreshCw className="h-4 w-4" /></button>
          </div>
        </div>
        {loading ? <div className="p-10 text-center text-sm text-ink-muted">Loading supplier records from the API…</div> : filtered.length === 0 ? <div className="p-10 text-center"><Truck className="mx-auto h-8 w-8 text-ink-subtle" /><p className="mt-3 font-medium text-ink">{query ? "No suppliers match your search" : "No active suppliers yet"}</p><p className="mt-1 text-sm text-ink-muted">{query ? "Try a different name, code, or contact." : "Add your first supplier to start creating purchase orders."}</p></div> :
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-canvas text-xs uppercase tracking-wide text-ink-muted"><tr><th className="px-4 py-3 font-medium">Supplier</th><th className="px-4 py-3 font-medium">Contact</th><th className="px-4 py-3 font-medium">Phone</th><th className="px-4 py-3 font-medium">Payment terms</th><th className="px-4 py-3 font-medium">Actions</th></tr></thead><tbody className="divide-y divide-line">{filtered.map((supplier) => <tr key={supplier.id} className="hover:bg-canvas/60"><td className="px-4 py-3"><p className="font-medium text-ink">{supplier.name}</p><p className="mt-0.5 font-mono text-xs text-ink-muted">{supplier.code}</p></td><td className="px-4 py-3"><p className="text-ink">{supplier.contact_name || "—"}</p><p className="text-xs text-ink-muted">{supplier.email || "—"}</p></td><td className="px-4 py-3 text-ink">{supplier.phone || "—"}</td><td className="px-4 py-3 text-ink">{supplier.payment_terms || "—"}</td><td className="px-4 py-3"><button type="button" onClick={() => void deactivate(supplier)} className="font-medium text-danger hover:underline">Deactivate</button></td></tr>)}</tbody></table></div>}
      </section>
      <p className="flex items-center gap-2 text-xs text-ink-muted"><UserRound className="h-3.5 w-3.5" /> Access to supplier records is enforced by the backend role permissions.</p>
    </div>
  );
}
