import React from 'react';
import { FlaskConicalIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  demo?: boolean;
}

export function PageHeader({ title, description, actions, demo = false }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl font-semibold text-ink tracking-tight">{title}</h1>
          {demo &&
          <span className="inline-flex items-center gap-1 rounded-md bg-white border border-line px-1.5 py-0.5 text-[11px] font-medium text-ink-muted" title="Figures on this page are sample data for demonstration">
              <FlaskConicalIcon className="w-3 h-3" aria-hidden="true" />
              Demo data
            </span>
          }
        </div>
        {description && <p className="text-sm text-ink-muted mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>);

}