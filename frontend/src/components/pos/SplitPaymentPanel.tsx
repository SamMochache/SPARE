import React from 'react';
import { PlusIcon, XIcon } from 'lucide-react';
import type { PaymentMethod } from '../../types/sales';
import { formatKES, parseAmount, roundMoney } from '../../utils/currency';
import { paymentMethodLabel } from '../../utils/sales';
import { inputClass } from '../ui/formStyles';
import type { SplitRow } from './useCheckout';

interface SplitPaymentPanelProps {
  rows: SplitRow[];
  onChange: (rows: SplitRow[]) => void;
  total: number;
}

const methods: PaymentMethod[] = ['cash', 'mpesa', 'card', 'bank'];
const referencePlaceholder: Record<PaymentMethod, string> = {
  cash: 'Not required',
  mpesa: 'M-Pesa code',
  card: 'Approval code',
  bank: 'Bank reference'
};

export function SplitPaymentPanel({ rows, onChange, total }: SplitPaymentPanelProps) {
  const allocated = roundMoney(rows.reduce((s, r) => s + parseAmount(r.amount), 0));
  const remaining = roundMoney(total - allocated);

  function update(id: string, patch: Partial<SplitRow>) {
    onChange(rows.map((r) => r.id === id ? { ...r, ...patch } : r));
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {rows.map((row, index) =>
        <li key={row.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-center">
            <select
            value={row.method}
            onChange={(e) => update(row.id, { method: e.target.value as PaymentMethod, reference: '' })}
            aria-label={`Payment ${index + 1} method`}
            className={`${inputClass} pr-8`}>
            
              {methods.map((m) =>
            <option key={m} value={m}>
                  {paymentMethodLabel[m]}
                </option>
            )}
            </select>
            <div className="relative">
              <input
              inputMode="decimal"
              value={row.amount}
              onChange={(e) => update(row.id, { amount: e.target.value })}
              placeholder="0.00"
              aria-label={`Payment ${index + 1} amount`}
              className={`${inputClass} tabular-nums pr-14`} />
            
              {remaining > 0 &&
            <button
              type="button"
              onClick={() => update(row.id, { amount: String(roundMoney(parseAmount(row.amount) + remaining)) })}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-2 rounded-md text-[11px] font-semibold text-accent-strong hover:bg-accent-soft">
              
                  Fill
                </button>
            }
            </div>
            <input
            value={row.reference}
            onChange={(e) => update(row.id, { reference: e.target.value })}
            disabled={row.method === 'cash'}
            placeholder={referencePlaceholder[row.method]}
            aria-label={`Payment ${index + 1} reference`}
            className={`${inputClass} col-span-2 sm:col-span-1 row-start-2 sm:row-start-auto`} />
          
            <button
            type="button"
            onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
            disabled={rows.length <= 2}
            aria-label={`Remove payment ${index + 1}`}
            className="w-9 h-10 rounded-lg grid place-items-center text-ink-subtle hover:text-danger hover:bg-danger-soft disabled:opacity-30 disabled:pointer-events-none">
            
              <XIcon className="w-4 h-4" />
            </button>
          </li>
        )}
      </ul>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={rows.length >= 4}
          onClick={() => onChange([...rows, { id: `r${Date.now()}`, method: 'card', amount: '', reference: '' }])}
          className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[13px] font-medium text-accent-strong hover:bg-accent-soft disabled:opacity-40 disabled:pointer-events-none">
          
          <PlusIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Add method
        </button>
        <p className="text-[13px] tabular-nums">
          <span className="text-ink-muted">{remaining >= 0 ? 'Remaining: ' : 'Over by: '}</span>
          <span className={`font-semibold ${Math.abs(remaining) < 0.01 ? 'text-success' : remaining < 0 ? 'text-danger' : 'text-ink'}`}>{formatKES(Math.abs(remaining))}</span>
        </p>
      </div>
    </div>);

}