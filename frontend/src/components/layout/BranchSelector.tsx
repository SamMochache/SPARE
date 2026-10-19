import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, ChevronDownIcon, StoreIcon } from 'lucide-react';
import { useAppData } from '../../contexts/AppDataContext';
import { branches } from '../../data/shop';
import { useClickOutside } from '../../hooks/useClickOutside';

export function BranchSelector() {
  const { branch, setBranchId } = useAppData();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="h-10 flex items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm text-ink hover:border-line-strong transition-colors duration-150">
        
        <StoreIcon className="w-4 h-4 text-ink-muted" aria-hidden="true" />
        <span className="font-medium whitespace-nowrap">{branch.name}</span>
        <ChevronDownIcon className="w-4 h-4 text-ink-subtle" aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open &&
        <motion.ul
          role="listbox"
          aria-label="Select branch"
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="absolute right-0 top-12 z-40 w-64 bg-white border border-line rounded-xl shadow-pop py-1.5 origin-top-right">
          
            {branches.map((b) =>
          <li key={b.id}>
                <button
              type="button"
              role="option"
              aria-selected={b.id === branch.id}
              onClick={() => {
                setBranchId(b.id);
                setOpen(false);
              }}
              className="w-full px-3.5 py-2 text-left flex items-center gap-3 hover:bg-canvas transition-colors duration-150">
              
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{b.name}</p>
                    <p className="text-xs text-ink-muted">{b.location}</p>
                  </div>
                  {b.id === branch.id && <CheckIcon className="w-4 h-4 text-accent" aria-hidden="true" />}
                </button>
              </li>
          )}
          </motion.ul>
        }
      </AnimatePresence>
    </div>);

}