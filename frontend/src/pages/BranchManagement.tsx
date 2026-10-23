import React, { useCallback, useEffect, useState } from "react";
import { Building2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import { buttonClass } from "../components/ui/Button";

interface BranchRecord {
  id: number; code: string; name: string; address: string; phone: string; is_active: boolean; created_at: string;
}
const emptyDraft = { code: "", name: "", address: "", phone: "" };
const fieldClass = "mt-1 block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

export function BranchManagement() {
  const { user } = useAuth();
  const canCreate = Boolean(user?.is_superuser || user?.role === "owner" || user?.role === "manager");
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await apiRequest<BranchRecord[] | { results?: BranchRecord[] }>("/api/v1/auth/branches/");
      setBranches(Array.isArray(result) ? result : result.results ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load branches."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function createBranch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const created = await apiRequest<BranchRecord>("/api/v1/auth/branches/", { method: "POST", body: {
        code: draft.code.trim().toLowerCase().replace(/\s+/g, "-"), name: draft.name.trim(),
        address: draft.address.trim(), phone: draft.phone.trim()
      }});
      setBranches((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setDraft(emptyDraft); setShowForm(false); toast.success("Branch created");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not create branch.";
      setError(message); toast.error("Branch could not be created", { description: message });
    } finally { setSaving(false); }
  }

  return <div className="mx-auto max-w-[1200px] space-y-5 p-4 sm:p-6">
    <PageHeader title="Branch Management" description="Create and view shop locations. Inventory and transactions are tracked by branch." actions={<button type="button" onClick={() => setShowForm((value) => !value)} disabled={!canCreate} className={buttonClass("primary")}><Plus className="h-4 w-4" />{showForm ? "Cancel" : "Add branch"}</button>} />
    {!canCreate && <p className="rounded-lg border border-line bg-white p-3 text-sm text-ink-muted">Only an owner, manager or superuser can create branches.</p>}
    {error && <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm">{error}</div>}
    {showForm && canCreate && <section className="rounded-xl border border-line bg-white p-5 shadow-card">
      <h2 className="mb-4 font-semibold">New branch</h2>
      <form onSubmit={createBranch} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Branch name<input className={fieldClass} required maxLength={120} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Nairobi CBD" /></label>
        <label className="text-sm font-medium">Branch code<input className={fieldClass} required maxLength={40} pattern="[A-Za-z0-9 _-]+" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="e.g. nairobi-cbd" /><span className="mt-1 block text-xs text-ink-muted">Must be unique. Spaces become hyphens.</span></label>
        <label className="text-sm font-medium">Address<input className={fieldClass} maxLength={255} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Street, town or area" /></label>
        <label className="text-sm font-medium">Phone<input className={fieldClass} maxLength={32} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="+254…" /></label>
        <div className="sm:col-span-2"><button type="submit" disabled={saving} className={buttonClass("primary")}>{saving ? "Creating…" : "Create branch"}</button></div>
      </form>
    </section>}
    <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="font-semibold">Branches</h2><p className="text-sm text-ink-muted">{branches.length} active {branches.length === 1 ? "branch" : "branches"}</p></div><button type="button" onClick={() => void load()} disabled={loading} className={buttonClass("secondary")}><RefreshCw className="h-4 w-4" />Refresh</button></div>
      {loading ? <p className="p-6 text-sm text-ink-muted">Loading branches…</p> : branches.length === 0 ? <div className="p-8 text-center"><Building2 className="mx-auto mb-2 h-8 w-8 text-ink-muted" /><p className="font-medium">No active branches found</p><p className="mt-1 text-sm text-ink-muted">Create your first branch to begin organizing stock by location.</p></div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-canvas text-xs uppercase text-ink-muted"><tr><th className="px-5 py-3">Branch</th><th className="px-5 py-3">Code</th><th className="px-5 py-3">Address</th><th className="px-5 py-3">Phone</th></tr></thead><tbody className="divide-y divide-line">{branches.map((branch) => <tr key={branch.id}><td className="px-5 py-4 font-medium">{branch.name}</td><td className="px-5 py-4">{branch.code}</td><td className="px-5 py-4">{branch.address || "—"}</td><td className="px-5 py-4">{branch.phone || "—"}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
