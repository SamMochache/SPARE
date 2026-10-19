import React from 'react';

interface FormSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="grid md:grid-cols-[200px_minmax(0,1fr)] gap-4 md:gap-8 pt-6 first:pt-0 border-t border-line first:border-t-0">
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="text-[13px] text-ink-muted mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 content-start">{children}</div>
    </section>);

}