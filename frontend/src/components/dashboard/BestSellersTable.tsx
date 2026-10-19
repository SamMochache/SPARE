import React from 'react';
import { bestSellers } from '../../data/dashboard';
import { formatKES, formatNumber } from '../../utils/currency';
import { Panel } from '../ui/Panel';

export function BestSellersTable({ className = '' }: {className?: string;}) {
  const maxUnits = Math.max(...bestSellers.map((b) => b.units));

  return (
    <Panel className={className} title="Best-selling parts" description="Last 30 days, ranked by units sold" bodyClassName="">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-muted border-y border-line bg-canvas/60">
              <th scope="col" className="font-medium px-5 py-2.5 w-10">#</th>
              <th scope="col" className="font-medium px-3 py-2.5">Part</th>
              <th scope="col" className="font-medium px-3 py-2.5 w-[34%]">Units sold</th>
              <th scope="col" className="font-medium px-5 py-2.5 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {bestSellers.map((b, i) =>
            <tr key={b.sku}>
                <td className="px-5 py-3 text-ink-subtle tabular-nums">{i + 1}</td>
                <td className="px-3 py-3 min-w-[200px]">
                  <p className="font-medium text-ink">{b.name}</p>
                  <p className="text-xs text-ink-muted font-mono">{b.sku}</p>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-canvas overflow-hidden min-w-[60px]">
                      <div className="h-full rounded-full bg-navy" style={{ width: `${b.units / maxUnits * 100}%` }} />
                    </div>
                    <span className="tabular-nums text-ink w-9 text-right">{formatNumber(b.units)}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-medium whitespace-nowrap">{formatKES(b.revenue)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>);

}