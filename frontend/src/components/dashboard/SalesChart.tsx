import React, { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { revenueSeries, type RevenueRange } from '../../data/dashboard';
import { formatCompactKES, formatKES } from '../../utils/currency';
import { Panel } from '../ui/Panel';
import { SegmentedControl } from '../ui/SegmentedControl';
import { ChartTooltip } from './ChartTooltip';

const rangeOptions: {value: RevenueRange;label: string;}[] = [
{ value: 'daily', label: 'Daily' },
{ value: 'weekly', label: 'Weekly' },
{ value: 'monthly', label: 'Monthly' }];


const rangeCaption: Record<RevenueRange, string> = {
  daily: 'Last 14 days',
  weekly: 'Last 12 weeks',
  monthly: 'Last 12 months'
};

export function SalesChart({ className = '' }: {className?: string;}) {
  const [range, setRange] = useState<RevenueRange>('daily');
  const data = revenueSeries[range];
  const total = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <Panel
      className={className}
      title="Sales revenue"
      description={rangeCaption[range]}
      actions={<SegmentedControl ariaLabel="Revenue range" options={rangeOptions} value={range} onChange={setRange} />}
      bodyClassName="px-5 pb-5">
      
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-ink">{formatKES(total)}</p>
      <p className="text-xs text-ink-muted mt-0.5">Total revenue for the period, VAT inclusive</p>
      <div className="h-[260px] mt-4 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#E3E8EF" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#7D889A', fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={20} />
            <YAxis tickFormatter={(v: number) => formatCompactKES(v)} tick={{ fill: '#7D889A', fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#CBD3DE', strokeDasharray: '4 4' }} />
            <Line type="monotone" dataKey="revenue" stroke="#14243A" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#F97316', stroke: '#fff', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>);

}