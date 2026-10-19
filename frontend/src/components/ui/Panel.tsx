import React from 'react';

interface PanelProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Panel({ title, description, actions, children, className = '', bodyClassName = 'p-5' }: PanelProps) {
  return (
    <section className={`bg-white border border-line rounded-xl shadow-card flex flex-col min-w-0 ${className}`}>
      {(title || actions) &&
      <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold text-ink">{title}</h2>}
            {description && <p className="text-[13px] text-ink-muted mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      }
      <div className={`flex-1 min-h-0 ${bodyClassName}`}>{children}</div>
    </section>);

}