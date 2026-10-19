import React from 'react';
import { formatKES, formatNumber } from '../../utils/currency';

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: {value: number;payload: {transactions?: number;};}[];
  dark?: boolean;
}

export function ChartTooltip({ active, label, payload, dark = false }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0];
  return (
    <div className={`rounded-lg px-3 py-2 shadow-pop text-xs ${dark ? 'bg-white text-ink' : 'bg-navy text-white'}`}>
      <p className={dark ? 'text-ink-muted' : 'text-white/65'}>{label}</p>
      <p className="font-semibold tabular-nums text-[13px] mt-0.5">{formatKES(point.value)}</p>
      {point.payload.transactions !== undefined &&
      <p className={`tabular-nums ${dark ? 'text-ink-muted' : 'text-white/65'}`}>{formatNumber(point.payload.transactions)} transactions</p>
      }
    </div>);

}