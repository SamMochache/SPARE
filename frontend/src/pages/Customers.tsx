import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArchiveIcon, SearchIcon, UserPlusIcon, UsersIcon } from "lucide-react";
import { archiveCustomer, createCustomer, fetchCustomerSalesHistory, fetchCustomers, updateCustomer, fetchCustomerStatement, recordCustomerPayment, type CustomerInput, type CustomerRecord, type CustomerType, type CustomerSalesSummary, type CustomerStatement } from "../api/customers";
import { buttonClass } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { inputClass } from "../components/ui/formStyles";
import { useAuth } from "../contexts/AuthContext";

const emptyForm: CustomerInput = { name: "", phone: "", email: "", type: "retail", kraPin: "", discountRate: "0", creditLimit: "0" };
const money = (value: string) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 2 }).format(Number(value || 0));

export function Customers() {
  const { user } = useAuth();
  const canManage = Boolean(user?.is_superuser || ["owner", "manager", "cashier"].includes(user?.role ?? ""));
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CustomerInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [historyCustomerId, setHistoryCustomerId] = useState<number | null>(null);
  const [history, setHistory] = useState<CustomerSalesSummary | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [accountCustomerId, setAccountCustomerId] = useState<number | null>(null);
  const [statement, setStatement] = useState<CustomerStatement | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementError, setStatementError] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchCustomers(search);
      setCustomers(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load customers.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { void load(); }, [load]);

  function beginCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function beginEdit(customer: CustomerRecord) {
    setEditingId(customer.id);
    setForm({ name: customer.name, phone: customer.phone, email: customer.email, type: customer.type, kraPin: customer.kraPin, discountRate: customer.discountRate, creditLimit: customer.creditLimit });
    setShowForm(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId !== null) await updateCustomer(editingId, form);
      else await createCustomer(form);
      toast.success(editingId !== null ? "Customer updated" : "Customer created");
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save customer.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleHistory(customer: CustomerRecord) {
    if (historyCustomerId === customer.id) { setHistoryCustomerId(null); setHistory(null); return; }
    setHistoryCustomerId(customer.id); setHistory(null); setHistoryError(""); setHistoryLoading(true);
    try { setHistory(await fetchCustomerSalesHistory(customer.id)); }
    catch (err) { setHistoryError(err instanceof Error ? err.message : "Could not load customer purchase history."); }
    finally { setHistoryLoading(false); }
  }

  async function toggleAccount(customer: CustomerRecord) {
    if (accountCustomerId === customer.id) {
      setAccountCustomerId(null);
      setStatement(null);
      setStatementError("");
      return;
    }
    setAccountCustomerId(customer.id);
    setStatement(null);
    setStatementError("");
    setStatementLoading(true);
    try {
      setStatement(await fetchCustomerStatement(customer.id));
    } catch (err) {
      setStatementError(err instanceof Error ? err.message : "Could not load customer account statement.");
    } finally {
      setStatementLoading(false);
    }
  }

  async function submitPayment(event: React.FormEvent) {
    event.preventDefault();
    if (accountCustomerId === null) return;
    setPaymentSaving(true);
    try {
      await recordCustomerPayment(accountCustomerId, {
        amount: paymentAmount,
        reference: paymentReference.trim(),
        notes: paymentNotes.trim(),
      });
      toast.success("Customer payment recorded");
      setPaymentAmount("");
      setPaymentReference("");
      setPaymentNotes("");
      setStatement(await fetchCustomerStatement(accountCustomerId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record payment.");
    } finally {
      setPaymentSaving(false);
    }
  }

  async function archive(customer: CustomerRecord) {
    if (!window.confirm(`Archive ${customer.name}? It will no longer appear in active customer searches.`)) return;
    try {
      await archiveCustomer(customer.id);
      toast.success("Customer archived");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not archive customer.");
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader title="Customers" description="Customer contacts and retail/wholesale profiles stored in Django." actions={canManage ? <button type="button" onClick={beginCreate} className={buttonClass("primary")}><UserPlusIcon className="w-4 h-4" aria-hidden="true" />Add customer</button> : undefined} />
      <div className="rounded-xl border border-line bg-white p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone, email or KRA PIN" aria-label="Search customers" className={`${inputClass} pl-9`} /></div>
        <button type="button" onClick={() => void load()} disabled={loading} className={buttonClass("secondary")}>{loading ? "Loading…" : "Refresh"}</button>
      </div>

      {showForm && <form onSubmit={submit} className="rounded-xl border border-line bg-white p-5 space-y-4">
        <h2 className="font-semibold text-ink">{editingId !== null ? "Edit customer" : "New customer"}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm text-ink-muted">Customer name *<input required minLength={2} maxLength={180} value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={`${inputClass} mt-1`} /></label>
          <label className="text-sm text-ink-muted">Phone<input value={form.phone ?? ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={`${inputClass} mt-1`} placeholder="+254 712 345 678" /></label>
          <label className="text-sm text-ink-muted">Email<input type="email" value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={`${inputClass} mt-1`} /></label>
          <label className="text-sm text-ink-muted">Customer type<select value={form.type ?? "retail"} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CustomerType }))} className={`${inputClass} mt-1`}><option value="retail">Retail</option><option value="wholesale">Wholesale</option></select></label>
          <label className="text-sm text-ink-muted">KRA PIN<input maxLength={20} value={form.kraPin ?? ""} onChange={(e) => setForm((f) => ({ ...f, kraPin: e.target.value.toUpperCase() }))} className={`${inputClass} mt-1`} /></label>
          <label className="text-sm text-ink-muted">Profile discount (%)<input type="number" min="0" max="100" step="0.01" value={form.discountRate ?? "0"} onChange={(e) => setForm((f) => ({ ...f, discountRate: e.target.value }))} className={`${inputClass} mt-1`} /></label>
          <label className="text-sm text-ink-muted">Credit limit (KES)<input type="number" min="0" step="0.01" value={form.creditLimit ?? "0"} onChange={(e) => setForm((f) => ({ ...f, creditLimit: e.target.value }))} className={`${inputClass} mt-1`} /><span className="mt-1 block text-xs">Limit is stored for reference; credit checkout and outstanding balances are not enabled.</span></label>
        </div>
        <div className="flex flex-wrap justify-end gap-2"><button type="button" className={buttonClass("secondary")} onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button><button type="submit" disabled={saving} className={buttonClass("primary")}>{saving ? "Saving…" : editingId !== null ? "Save changes" : "Create customer"}</button></div>
      </form>}

      {error && <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm text-ink"><p className="font-medium">Customer records could not be loaded.</p><p className="mt-1">{error}</p><button type="button" onClick={() => void load()} className="mt-2 underline font-semibold">Try again</button></div>}

      <section className="rounded-xl border border-line bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-line p-4"><div><h2 className="font-semibold text-ink">Customer directory</h2><p className="text-xs text-ink-muted mt-1">{customers.length} result(s) on this page · active records</p></div><UsersIcon className="w-5 h-5 text-ink-subtle" aria-hidden="true" /></div>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-ink-muted border-b border-line bg-canvas/60"><th className="px-5 py-3 font-medium">Customer</th><th className="px-3 py-3 font-medium">Contact</th><th className="px-3 py-3 font-medium">Type</th><th className="px-3 py-3 font-medium text-right">Discount</th><th className="px-3 py-3 font-medium text-right">Credit limit</th><th className="px-3 py-3 font-medium">Purchase history</th><th className="px-3 py-3 font-medium">Account</th>{canManage && <th className="px-5 py-3 font-medium text-right">Actions</th>}</tr></thead>
          <tbody className="divide-y divide-line">
            {customers.map((customer) => <tr key={customer.id}>
              <td className="px-5 py-3"><p className="font-medium text-ink">{customer.name}</p>{customer.kraPin && <p className="text-xs text-ink-muted">KRA PIN: {customer.kraPin}</p>}</td>
              <td className="px-3 py-3"><p className="text-ink">{customer.phone || "—"}</p><p className="text-xs text-ink-muted">{customer.email || "No email"}</p></td>
              <td className="px-3 py-3"><span className="rounded-full bg-canvas px-2 py-1 text-xs capitalize">{customer.type}</span></td>
              <td className="px-3 py-3 text-right tabular-nums">{Number(customer.discountRate)}%</td>
              <td className="px-3 py-3 text-right tabular-nums">{money(customer.creditLimit)}</td>
              <td className="px-3 py-3"><button type="button" onClick={() => void toggleHistory(customer)} className="text-accent-strong hover:underline">{historyCustomerId === customer.id ? "Hide history" : "View history"}</button></td>
              <td className="px-3 py-3"><button type="button" onClick={() => void toggleAccount(customer)} className="text-accent-strong hover:underline">{accountCustomerId === customer.id ? "Hide statement" : "Statement"}</button></td>
              {canManage && <td className="px-5 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={() => beginEdit(customer)} className="text-accent-strong hover:underline">Edit</button><button type="button" onClick={() => void archive(customer)} className="inline-flex items-center gap-1 text-danger hover:underline"><ArchiveIcon className="w-3.5 h-3.5" aria-hidden="true" />Archive</button></div></td>}
            </tr>)}
            {!customers.length && <tr><td colSpan={canManage ? 8 : 7} className="px-5 py-10 text-center text-ink-muted">{loading ? "Loading customer records…" : "No active customers found. Add a customer or change your search."}</td></tr>}
            {historyCustomerId !== null && <tr><td colSpan={canManage ? 8 : 7} className="bg-canvas/60 px-5 py-4"><h3 className="font-semibold text-ink">Purchase history: {customers.find((item) => item.id === historyCustomerId)?.name ?? "Customer"}</h3>{historyLoading ? <p className="mt-2 text-sm text-ink-muted">Loading linked sales…</p> : historyError ? <p role="alert" className="mt-2 text-sm text-danger">{historyError}</p> : history ? <><p className="mt-2 text-sm text-ink-muted">{history.count ?? history.results.length} linked sale(s) · Gross sales {money(history.total_sales)} · Refunded {money(history.total_refunded)}</p>{history.results.length ? <div className="mt-3 overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left text-ink-muted"><th className="py-2">Receipt</th><th className="py-2">Date</th><th className="py-2">Branch</th><th className="py-2">Status</th><th className="py-2 text-right">Total</th></tr></thead><tbody>{history.results.map((sale) => <tr key={sale.id} className="border-t border-line"><td className="py-2 font-medium">{sale.sale_number}</td><td className="py-2">{new Date(sale.created_at).toLocaleString()}</td><td className="py-2">{sale.branch_name}</td><td className="py-2 capitalize">{sale.status.replaceAll("_", " ")}</td><td className="py-2 text-right">{money(sale.total)}</td></tr>)}</tbody></table></div> : <p className="mt-3 text-sm text-ink-muted">No sales have been linked to this customer yet. Older sales remain searchable by their recorded customer name.</p>}</> : null}</td></tr>} 
            {accountCustomerId !== null && <tr><td colSpan={canManage ? 8 : 7} className="bg-canvas/60 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="font-semibold text-ink">Account statement: {customers.find((item) => item.id === accountCustomerId)?.name ?? "Customer"}</h3><p className="mt-1 text-xs text-ink-muted">Ledger balance is calculated from recorded credit sales, payments, and credit notes. Historical transactions are not backfilled.</p></div>
                <button type="button" onClick={() => { setStatementLoading(true); void fetchCustomerStatement(accountCustomerId).then(setStatement).catch((err) => setStatementError(err instanceof Error ? err.message : "Could not refresh statement.")).finally(() => setStatementLoading(false)); }} className={buttonClass("secondary")} disabled={statementLoading}>Refresh statement</button>
              </div>
              {statementLoading ? <p className="mt-3 text-sm text-ink-muted">Loading account statement…</p> : statementError ? <p role="alert" className="mt-3 text-sm text-danger">{statementError}</p> : statement ? <>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-line bg-white p-3"><p className="text-xs text-ink-muted">Outstanding balance</p><p className="mt-1 text-lg font-semibold tabular-nums">{money(statement.balance)}</p></div>
                  <div className="rounded-lg border border-line bg-white p-3"><p className="text-xs text-ink-muted">Credit limit</p><p className="mt-1 text-lg font-semibold tabular-nums">{money(statement.credit_limit)}</p></div>
                  <div className="rounded-lg border border-line bg-white p-3"><p className="text-xs text-ink-muted">Available credit (indicative)</p><p className="mt-1 text-lg font-semibold tabular-nums">{money(String(Math.max(0, Number(statement.credit_limit) - Number(statement.balance))))}</p></div>
                </div>
                {canManage && Number(statement.balance) > 0 && <form onSubmit={submitPayment} className="mt-4 rounded-lg border border-line bg-white p-4">
                  <h4 className="font-semibold text-ink">Record customer payment</h4>
                  <p className="mt-1 text-xs text-ink-muted">Records a payment against the account balance; it does not initiate an M-Pesa or bank transfer.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <label className="text-xs text-ink-muted">Amount (KES) *<input required type="number" min="0.01" max={statement.balance} step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className={`${inputClass} mt-1`} /></label>
                    <label className="text-xs text-ink-muted">Receipt/reference<input maxLength={80} value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className={`${inputClass} mt-1`} placeholder="Receipt number" /></label>
                    <label className="text-xs text-ink-muted">Notes<input maxLength={255} value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} className={`${inputClass} mt-1`} placeholder="Optional note" /></label>
                  </div>
                  <div className="mt-3 flex justify-end"><button type="submit" disabled={paymentSaving || !paymentAmount || Number(paymentAmount) <= 0 || Number(paymentAmount) > Number(statement.balance)} className={buttonClass("primary")}>{paymentSaving ? "Recording…" : "Record payment"}</button></div>
                </form>}
                <div className="mt-4 overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left text-ink-muted"><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Entry</th><th className="py-2 pr-3">Reference</th><th className="py-2 pr-3">Notes</th><th className="py-2 pr-3 text-right">Amount</th><th className="py-2 text-right">Running balance</th></tr></thead><tbody>{statement.entries.map((entry) => <tr key={entry.id} className="border-t border-line"><td className="py-2 pr-3">{new Date(entry.created_at).toLocaleString()}</td><td className="py-2 pr-3 capitalize">{entry.entry_type.replaceAll("_", " ")}</td><td className="py-2 pr-3">{entry.reference || "—"}</td><td className="py-2 pr-3">{entry.notes || "—"}</td><td className="py-2 pr-3 text-right tabular-nums">{money(entry.amount)}</td><td className="py-2 text-right tabular-nums">{money(entry.running_balance)}</td></tr>)}</tbody></table></div>
                {!statement.entries.length && <p className="mt-3 text-sm text-ink-muted">No ledger entries yet. Credit sales created after the ledger was introduced will appear here.</p>}
              </> : null}
            </td></tr>}
          </tbody>
        </table></div>
      </section>
      <p className="text-xs text-ink-muted">Customer directory and linked purchase history are live. Historical sales recorded before customer linking remain unlinked. Credit sales, payments, and statements use the customer account ledger. Historical account activity is not backfilled automatically.</p>
    </div>
  );
}
