import React from 'react';
import { AlertCircleIcon } from 'lucide-react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, required = false, error, hint, className = '', children }: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink mb-1.5">
        {label}
        {required &&
        <span className="text-danger ml-0.5" aria-hidden="true">
            *
          </span>
        }
      </label>
      {children}
      {error ?
      <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-danger flex items-center gap-1" role="alert">
          <AlertCircleIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p> :

      hint && <p className="mt-1.5 text-xs text-ink-subtle">{hint}</p>
      }
    </div>);

}