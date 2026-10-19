import React from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ArrowUpRightIcon, TrendingUpIcon } from 'lucide-react';
import { hourlySales, todaySummary } from '../../data/dashboard';
import { formatKES, formatNumber } from '../../utils/currency';
import { ChartTooltip } from './ChartTooltip';

export function TodaySalesPanel({ className = '' }: {className?: string;}) {
  const s = todaySummary;
  const delta = (s.sales - s.comparisonSales) / s.comparisonSales * 100;
  const metrics = [
  { label: 'Transactions', value: formatNumber(s.transactions) },
  { label: 'Average sale', value: formatKES(s.sales / s.transactions) },
  { label: 'Items sold', value: formatNumber(s.itemsSold) }];


  return (
    <section className={`bg-navy text-white rounded-xl p-5 flex flex-col shadow-card ${className}`} aria-labelledby="today-sales-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="today-sales-heading" className="text-sm font-medium text-white/70">
            Today's sales
          </h2>
          <p className="mt-1 text-[28px] leading-9 font-semibold tabular-nums tracking-tight">{formatKES(s.sales)}</p>
          <p className="mt-1 text-[13px] text-white/65 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 font-medium text-success-light">
              <TrendingUpIcon className="w-3.5 h-3.5" aria-hidden="true" />+{delta.toFixed(1)}%
            </span>
            vs {s.comparisonLabel}
          </p>
        </div>
        <Link to="/sales" className="inline-flex items-center gap-1 text-xs font-medium text-white/70 hover:text-white rounded px-1.5 py-1 hover:bg-white/10 transition-colors duration-150">
          Sales history <ArrowUpRightIcon className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="h-24 mt-4 -mx-1" aria-label="Sales by hour today" role="img">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlySales} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} interval={1} />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.06)' }} content={<ChartTooltip dark />} />
            <Bar dataKey="revenue" fill="#F97316" radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <dl className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-3">
        {metrics.map((m) =>
        <div key={m.label} className="min-w-0">
            <dt className="text-xs text-white/55">{m.label}</dt>
            <dd className="text-sm font-semibold tabular-nums mt-0.5 truncate">{m.value}</dd>
          </div>
        )}
      </dl>
    </section>);

}