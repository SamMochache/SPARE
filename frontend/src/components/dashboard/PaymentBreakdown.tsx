import React from 'react';
import { paymentBreakdown } from '../../data/dashboard';
import { formatKES } from '../../utils/currency';
import { Panel } from '../ui/Panel';

const methodColor: Record<string, string> = {
  mpesa: 'bg-success',
  cash: 'bg-navy',
  card: 'bg-accent',
  bank: 'bg-info'
};

export function PaymentBreakdown({ className = '' }: {className?: string;}) {
  const total = paymentBreakdown.reduce((s, p) => s + p.amount, 0);

  return (
    <Panel className={className} title="Payment methods" description="Today, all transactions" bodyClassName="px-5 pb-5">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5" role="img" aria-label="Share of revenue by payment method">
        {paymentBreakdown.map((p) =>
        <div key={p.method} className={methodColor[p.method]} style={{ width: `${p.amount / total * 100}%` }} />
        )}
      </div>
      <ul className="mt-5 divide-y divide-line">
        {paymentBreakdown.map((p) => {
          const share = p.amount / total * 100;
          return (
            <li key={p.method} className="flex items-center gap-3 py-3 first:pt-0">
              <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${methodColor[p.method]}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink">{p.label}</p>
                <p className="text-xs text-ink-muted">{p.transactions} transactions</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium tabular-nums text-ink">{formatKES(p.amount)}</p>
                <p className="text-xs text-ink-muted tabular-nums">{share.toFixed(1)}%</p>
              </div>
            </li>);

        })}
      </ul>
    </Panel>);

}