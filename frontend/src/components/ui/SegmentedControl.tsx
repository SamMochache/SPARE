import React from "react";
import { BoxIcon } from "lucide-react";
interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: BoxIcon;
}
interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  iconOnly?: boolean;
}
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  iconOnly = false
}: SegmentedControlProps<T>) {
  return <div role="radiogroup" aria-label={ariaLabel} className="inline-flex p-0.5 bg-canvas border border-line rounded-lg">
      {options.map((option) => {
      const active = option.value === value;
      const Icon = option.icon;
      return <button key={option.value} type="button" role="radio" aria-checked={active} aria-label={iconOnly ? option.label : undefined} title={iconOnly ? option.label : undefined} onClick={() => onChange(option.value)} className={`inline-flex items-center gap-1.5 rounded-md h-8 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${iconOnly ? 'px-2' : 'px-3'} ${active ? 'bg-white text-ink shadow-card' : 'text-ink-muted hover:text-ink'}`}>
            {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
            {!iconOnly && option.label}
          </button>;
    })}
    </div>;
}