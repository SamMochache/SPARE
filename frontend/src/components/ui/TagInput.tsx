import React, { useState } from 'react';
import { XIcon } from 'lucide-react';

interface TagInputProps {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
}

export function TagInput({ id, value, onChange, placeholder, invalid = false }: TagInputProps) {
  const [draft, setDraft] = useState('');

  function commit() {
    const parts = draft.
    split(',').
    map((s) => s.trim()).
    filter(Boolean).
    filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));
    if (parts.length) onChange([...value, ...parts]);
    setDraft('');
  }

  return (
    <div
      className={`min-h-10 w-full rounded-lg border bg-white px-2 py-1.5 flex flex-wrap items-center gap-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 ${
      invalid ? 'border-danger' : 'border-line'}`
      }>
      
      {value.map((tag) =>
      <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-canvas border border-line pl-2 pr-1 h-7 text-[13px] text-ink">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((v) => v !== tag))} aria-label={`Remove ${tag}`} className="w-5 h-5 rounded grid place-items-center text-ink-subtle hover:text-danger">
            <XIcon className="w-3 h-3" />
          </button>
        </span>
      )}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={value.length ? '' : placeholder}
        className="flex-1 min-w-[120px] h-7 px-1 text-sm text-ink placeholder:text-ink-subtle focus:outline-none" />
      
    </div>);

}