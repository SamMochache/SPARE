import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import { buttonClass } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import type { NavItem } from '../data/navigation';

interface ModulePlaceholderProps {
  item: NavItem;
}

export function ModulePlaceholder({ item }: ModulePlaceholderProps) {
  const Icon = item.icon;
  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader title={item.label} description={item.description} />
      <section className="bg-white border border-line rounded-xl shadow-card p-6 sm:p-10">
        <div className="max-w-xl">
          <span className="w-11 h-11 rounded-xl bg-canvas text-navy grid place-items-center">
            <Icon className="w-5 h-5" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-ink mt-4">Coming in the next build phase</h2>
          <p className="text-sm text-ink-muted mt-1.5 leading-relaxed">
            This module isn't built yet in the prototype. Overview, Point of Sale and Products are ready to use now. Here's what this screen will cover:
          </p>
          <ul className="mt-5 space-y-2.5">
            {item.planned.map((feature) =>
            <li key={feature} className="flex gap-3 text-sm text-ink">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
                {feature}
              </li>
            )}
          </ul>
          <div className="mt-7 flex flex-wrap gap-2">
            <Link to="/pos" className={buttonClass('primary')}>
              Open Point of Sale
            </Link>
            <Link to="/" className={buttonClass('secondary')}>
              <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
              Back to overview
            </Link>
          </div>
        </div>
      </section>
    </div>);

}