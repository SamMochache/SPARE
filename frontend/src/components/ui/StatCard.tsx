import React from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon, BoxIcon } from "lucide-react";
interface StatCardProps {
  label: string;
  value: string;
  icon: BoxIcon;
  meta?: string;
  tone?: 'default' | 'danger' | 'warning';
  to?: string;
}
const iconTone = {
  default: 'bg-canvas text-navy',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning'
};
export function StatCard({
  label,
  value,
  icon: Icon,
  meta,
  tone = 'default',
  to
}: StatCardProps) {
  const content = <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-muted">{label}</p>
        <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${iconTone[tone]}`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold text-ink tabular-nums tracking-tight">{value}</p>
      {meta && <p className="mt-auto pt-1.5 text-xs text-ink-muted flex items-center gap-1">
          {meta}
          {to && <ChevronRightIcon className="w-3.5 h-3.5 text-ink-subtle" aria-hidden="true" />}
        </p>}
    </>;
  const base = 'bg-white border border-line rounded-xl shadow-card p-4 flex flex-col min-h-[124px]';
  if (to) {
    return <Link to={to} className={`${base} hover:border-line-strong transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50`}>
        {content}
      </Link>;
  }
  return <div className={base}>{content}</div>;
}