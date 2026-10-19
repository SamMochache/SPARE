import React from 'react';
import { ArrowDownLeftIcon, ArrowUpRightIcon } from 'lucide-react';
import { stockMovementSummary } from '../../data/dashboard';
import { formatNumber } from '../../utils/currency';
import { Panel } from '../ui/Panel';

export function StockMovementSummary({ className = '' }: {className?: string;}) {
  const net = stockMovementSummary.reduce((s, m) => s + m.quantity, 0);

  return (
    <Panel className={className} title="Stock movement" description="This week, units across all parts" bodyClassName="px-5 pb-5">
      <ul className="divide-y divide-line">
        {stockMovementSummary.map((m) => {
          const incoming = m.quantity > 0;
          return (
            <li key={m.type} className="flex items-center gap-3 py-3 first:pt-0">
              <span className={`w-7 h-7 rounded-md grid place-items-center shrink-0 ${incoming ? 'bg-success-soft text-success' : 'bg-canvas text-ink-muted'}`}>
                {incoming ? <ArrowDownLeftIcon className="w-3.5 h-3.5" aria-hidden="true" /> : <ArrowUpRightIcon className="w-3.5 h-3.5" aria-hidden="true" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink">{m.type}</p>
                <p className="text-xs text-ink-muted">{m.detail}</p>
              </div>
              <span className={`text-sm font-semibold tabular-nums ${incoming ? 'text-success' : 'text-ink'}`}>
                {incoming ? '+' : '−'}
                {formatNumber(Math.abs(m.quantity))}
              </span>
            </li>);

        })}
      </ul>
      <div className="mt-1 pt-3 border-t border-line flex items-center justify-between">
        <span className="text-sm font-medium text-ink">Net change</span>
        <span className="text-sm font-semibold tabular-nums text-ink">
          {net >= 0 ? '+' : '−'}
          {formatNumber(Math.abs(net))} units
        </span>
      </div>
    </Panel>);

}