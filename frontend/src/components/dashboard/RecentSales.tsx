import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAppData } from '../../contexts/AppDataContext';
import { recentSales } from '../../data/dashboard';
import type { RecentSaleRow, SaleStatus } from '../../types/sales';
import { formatKES } from '../../utils/currency';
import { paymentMethodLabel } from '../../utils/sales';
import { Panel } from '../ui/Panel';
import { StatusBadge, type BadgeTone } from '../ui/StatusBadge';

const statusTone: Record<SaleStatus, BadgeTone> = { completed: 'success', credit: 'warning', refunded: 'neutral' };
const statusLabel: Record<SaleStatus, string> = { completed: 'Paid', credit: 'On credit', refunded: 'Refunded' };

export function RecentSales({ className = '' }: {className?: string;}) {
  const { sales } = useAppData();

  const rows = useMemo<RecentSaleRow[]>(() => {
    const live: RecentSaleRow[] = sales.map((s) => ({
      receiptNo: s.receiptNo,
      time: format(new Date(s.createdAt), 'HH:mm'),
      customer: s.customer.name,
      items: s.lines.reduce((n, l) => n + l.quantity, 0),
      total: s.totals.total,
      method: s.payments.length > 1 ? 'split' : s.payments[0]?.method ?? 'credit',
      status: s.balanceDue > 0 ? 'credit' : 'completed',
      fromPrototype: true
    }));
    return [...live, ...recentSales].slice(0, 7);
  }, [sales]);

  return (
    <Panel
      className={className}
      title="Recent sales"
      description="Latest transactions at this branch"
      actions={
      <Link to="/sales" className="text-[13px] font-medium text-accent-strong hover:underline">
          View all
        </Link>
      }
      bodyClassName="">
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-muted border-y border-line bg-canvas/60">
              <th scope="col" className="font-medium px-5 py-2.5">Receipt</th>
              <th scope="col" className="font-medium px-3 py-2.5">Customer</th>
              <th scope="col" className="font-medium px-3 py-2.5 text-right">Items</th>
              <th scope="col" className="font-medium px-3 py-2.5">Payment</th>
              <th scope="col" className="font-medium px-3 py-2.5 text-right">Total</th>
              <th scope="col" className="font-medium px-5 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) =>
            <tr key={r.receiptNo} className={r.fromPrototype ? 'bg-accent-soft/40' : ''}>
                <td className="px-5 py-3 whitespace-nowrap">
                  <p className="font-mono text-[13px] text-ink">{r.receiptNo}</p>
                  <p className="text-xs text-ink-muted">
                    {r.time}
                    {r.fromPrototype && ' · recorded in prototype'}
                  </p>
                </td>
                <td className="px-3 py-3 text-ink whitespace-nowrap">{r.customer}</td>
                <td className="px-3 py-3 text-right tabular-nums text-ink-muted">{r.items}</td>
                <td className="px-3 py-3 text-ink-muted whitespace-nowrap">{paymentMethodLabel[r.method]}</td>
                <td className="px-3 py-3 text-right font-medium tabular-nums whitespace-nowrap">{formatKES(r.total)}</td>
                <td className="px-5 py-3">
                  <StatusBadge tone={statusTone[r.status]}>{statusLabel[r.status]}</StatusBadge>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>);

}