import React, { useEffect, useState } from "react";
import { BanknoteIcon, CreditCardIcon, DownloadIcon, InfoIcon, LandmarkIcon, PlusIcon, PrinterIcon, SmartphoneIcon, BoxIcon } from "lucide-react";
import { toast } from "sonner";
import { Customer } from "../../types/customer";
import { CheckoutMethod, CompletedSale, SaleTotals } from "../../types/sales";
import { formatKES } from "../../utils/currency";
import { downloadFile } from "../../utils/files";
import { buildReceiptText } from "../../utils/receipt";
import { Button } from "../ui/Button";
import { FormField } from "../ui/FormField";
import { inputClass } from "../ui/formStyles";
import { Modal } from "../ui/Modal";
import { MpesaPanel } from "./MpesaPanel";
import { ReceiptPreview } from "./ReceiptPreview";
import { useCheckout } from "./useCheckout";
import { CheckoutResult } from "./usePointOfSale";
interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  totals: SaleTotals;
  customer: Customer;
  branchId: number | null;
  onComplete: (result: CheckoutResult, branchId: number | null, checkoutKey: string) => Promise<CompletedSale>;
}
const methods: {
  id: Exclude<CheckoutMethod, "split">;
  label: string;
  icon: BoxIcon;
}[] = [{
  id: 'cash',
  label: 'Cash',
  icon: BanknoteIcon
}, {
  id: 'mpesa',
  label: 'M-Pesa',
  icon: SmartphoneIcon
}, {
  id: 'card',
  label: 'Card',
  icon: CreditCardIcon
}, {
  id: 'bank',
  label: 'Bank',
  icon: LandmarkIcon
}];
export function CheckoutModal({
  open,
  onClose,
  totals,
  customer,
  branchId,
  onComplete
}: CheckoutModalProps) {
  const checkout = useCheckout(open, totals.total, customer);
  const {
    evaluation,
    method
  } = checkout;
  const [processing, setProcessing] = useState(false);
  const [sale, setSale] = useState<CompletedSale | null>(null);
  const [checkoutKey, setCheckoutKey] = useState("");
  useEffect(() => {
    if (open) {
      setSale(null);
      setProcessing(false);
      setCheckoutKey(`POS-${Date.now().toString(36).toUpperCase()}`);
    }
  }, [open]);
  async function confirm() {
    if (!evaluation.valid || processing) return;
    if (!branchId) {
      toast.error("Select an active branch before checking out.");
      return;
    }
    setProcessing(true);
    try {
      const completed = await onComplete({
        payments: evaluation.payments,
        amountPaid: evaluation.amountPaid,
        change: evaluation.change,
        balanceDue: evaluation.balanceDue
      }, branchId, checkoutKey);
      setSale(completed);
      toast.success("Sale recorded", {
        description: `Receipt ${completed.receiptNo} saved by Django. Payment-provider verification is not connected.`
      });
    } catch (cause) {
      toast.error("Checkout failed", {
        description: cause instanceof Error ? cause.message : "The sale was not confirmed. Check the API and try again."
      });
    } finally {
      setProcessing(false);
    }
  }
  const footer = sale ? <>
      <Button icon={PrinterIcon} onClick={() => {
      window.print();
    }}>
        Print receipt
      </Button>
      <Button icon={DownloadIcon} onClick={() => downloadFile(`${sale.receiptNo}.txt`, buildReceiptText(sale))}>
        Download
      </Button>
      <Button variant="primary" icon={PlusIcon} onClick={onClose}>
        New sale
      </Button>
    </> : <>
      <Button onClick={onClose} disabled={processing}>
        Cancel
      </Button>
      <Button variant="primary" onClick={confirm} disabled={!evaluation.valid} loading={processing}>
        Confirm payment · {formatKES(totals.total)}
      </Button>
    </>;
  return <Modal open={open} onClose={onClose} dismissible={!processing} size="lg" title={sale ? 'Sale complete' : 'Checkout'} description={sale ? `Receipt ${sale.receiptNo} · recorded in Django` : `${totals.itemCount} items · ${customer.name}`} footer={footer}>
      {sale ? <div className="bg-canvas -mx-5 -my-5 px-5 py-6">
          {sale.change > 0 && <p className="text-center text-sm text-ink-muted mb-4">
              Give change: <span className="text-lg font-semibold text-success tabular-nums">{formatKES(sale.change)}</span>
            </p>}
          <ReceiptPreview sale={sale} />
        </div> : <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg bg-canvas px-4 py-3">
            <div>
              <p className="text-xs text-ink-muted">Amount due</p>
              <p className="text-[28px] leading-9 font-semibold tabular-nums tracking-tight text-ink">{formatKES(totals.total)}</p>
            </div>
            <dl className="text-xs text-ink-muted space-y-0.5 text-right tabular-nums">
              <div>Subtotal {formatKES(totals.subtotal)}</div>
              {totals.discount > 0 && <div className="text-success">Discount −{formatKES(totals.discount)}</div>}
              <div>{totals.tax > 0 && <>Tax {formatKES(totals.tax)}</>}</div>
            </dl>
          </div>

          <div>
            <p id="payment-method-label" className="text-[13px] font-medium text-ink mb-2">
              Payment method
            </p>
            <div role="radiogroup" aria-labelledby="payment-method-label" className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {methods.map((m) => {
            const active = method === m.id;
            return <button key={m.id} type="button" role="radio" aria-checked={active} onClick={() => checkout.setMethod(m.id)} className={`h-16 rounded-lg border flex flex-col items-center justify-center gap-1 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${active ? 'border-accent bg-accent-soft text-ink' : 'border-line text-ink-muted hover:text-ink hover:border-line-strong'}`}>
                    <m.icon className={`w-5 h-5 ${active ? 'text-accent-strong' : ''}`} aria-hidden="true" />
                    {m.label}
                  </button>;
          })}
            </div>
          </div>

          {method === 'cash' && <div className="space-y-2.5">
              <FormField label="Cash received" htmlFor="cash-tendered" required>
                <input id="cash-tendered" autoFocus inputMode="decimal" value={checkout.cashTendered} onChange={(e) => checkout.setCashTendered(e.target.value)} onKeyDown={(e) => {
            if (e.key === 'Enter') confirm();
          }} placeholder="0.00" className={`${inputClass} h-12 text-lg font-semibold tabular-nums`} />
              </FormField>
              <div className="flex flex-wrap gap-2">
                {checkout.quickCash.map((amount, i) => <button key={amount} type="button" onClick={() => checkout.setCashTendered(String(amount))} className="h-8 px-3 rounded-lg border border-line text-[13px] font-medium tabular-nums text-ink hover:border-line-strong hover:bg-canvas transition-colors duration-150">
                    {i === 0 ? 'Exact' : formatKES(amount)}
                  </button>)}
              </div>
            </div>}

          {method === 'mpesa' && <MpesaPanel state={checkout.mpesa} onChange={checkout.setMpesa} total={totals.total} />}

          {method === 'card' && <FormField label="Terminal approval code" htmlFor="card-ref" required hint="Process the card on the PDQ terminal first, then enter the approval code from its slip.">
              <input id="card-ref" autoFocus value={checkout.cardRef} onChange={(e) => checkout.setCardRef(e.target.value.toUpperCase())} placeholder="e.g. 084512" className={`${inputClass} font-mono`} />
            </FormField>}

          {method === 'bank' && <FormField label="Bank transfer reference" htmlFor="bank-ref" required hint="Confirm the transfer has reflected in the shop account before completing.">
              <input id="bank-ref" autoFocus value={checkout.bankRef} onChange={(e) => checkout.setBankRef(e.target.value.toUpperCase())} placeholder="e.g. FT26292XK8Q1" className={`${inputClass} font-mono`} />
            </FormField>}

          <p className="text-xs text-ink-muted">Checkout records one payment method in the API. Split payments and customer credit are not enabled for live checkout yet.</p>



          <div className="min-h-[24px]" aria-live="polite">
            {!evaluation.valid ? <p className="text-[13px] text-ink-muted flex items-center gap-2">
                <InfoIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {evaluation.message}
              </p> : evaluation.change > 0 ? <p className="text-sm text-ink-muted">
                Change due: <span className="font-semibold text-success tabular-nums">{formatKES(evaluation.change)}</span>
              </p> : evaluation.balanceDue > 0 ? <p className="text-sm text-ink-muted">
                Balance to customer account: <span className="font-semibold text-warning tabular-nums">{formatKES(evaluation.balanceDue)}</span>
              </p> : <p className="text-sm text-success font-medium">Ready to complete.</p>}
          </div>
        </div>}
    </Modal>;
}