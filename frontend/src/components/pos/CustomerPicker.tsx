import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, ChevronDownIcon, SearchIcon, UserIcon, UserPlusIcon } from 'lucide-react';
import { WALK_IN_CUSTOMER_ID } from '../../data/customers';
import { useClickOutside } from '../../hooks/useClickOutside';
import type { Customer } from '../../types/customer';
import { formatKES } from '../../utils/currency';
import { formatKenyanPhone, normalizeKenyanPhone } from '../../utils/phone';
import { Button } from '../ui/Button';
import { inputClass, inputErrorClass } from '../ui/formStyles';
import { StatusBadge } from '../ui/StatusBadge';

interface CustomerPickerProps {
  customer: Customer;
  customers: Customer[];
  onSelect: (id: number) => void;
  onCreate: (input: {name: string;phone: string;}) => void;
}

export function CustomerPicker({ customer, customers, onSelect, onCreate }: CustomerPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{name?: string;phone?: string;}>({});

  function close() {
    setOpen(false);
    setCreating(false);
    setQuery('');
    setErrors({});
  }
  const ref = useClickOutside<HTMLDivElement>(close, open);

  const q = query.trim().toLowerCase();
  const filtered = customers.filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')));
  const isWalkIn = customer.id === WALK_IN_CUSTOMER_ID;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: {name?: string;phone?: string;} = {};
    if (name.trim().length < 2) next.name = 'Enter the customer name';
    const normalized = normalizeKenyanPhone(phone);
    if (!normalized) next.phone = 'Use a Kenyan number, e.g. 0712 345 678';
    setErrors(next);
    if (next.name || next.phone || !normalized) return;
    onCreate({ name: name.trim(), phone: formatKenyanPhone(normalized) });
    setName('');
    setPhone('');
    close();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="w-full flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-2 text-left hover:border-line-strong transition-colors duration-150">
        
        <span className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${isWalkIn ? 'bg-canvas text-ink-muted' : 'bg-navy text-white'}`}>
          <UserIcon className="w-4 h-4" aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">{customer.name}</p>
          <p className="text-xs text-ink-muted truncate">
            {isWalkIn ? 'Tap to select or add a customer' : customer.phone}
            {customer.balance > 0 && <span className="text-warning"> · Owes {formatKES(customer.balance)}</span>}
          </p>
        </div>
        {customer.type === 'wholesale' && <StatusBadge tone="info" dot={false}>Wholesale</StatusBadge>}
        <ChevronDownIcon className="w-4 h-4 text-ink-subtle shrink-0" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open &&
        <motion.div
          role="dialog"
          aria-label="Select customer"
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-line rounded-xl shadow-pop overflow-hidden origin-top">
          
            {creating ?
          <form onSubmit={submit} className="p-4 space-y-3" noValidate>
                <p className="text-sm font-semibold text-ink">New customer</p>
                <div>
                  <label htmlFor="new-cust-name" className="block text-[13px] font-medium text-ink mb-1">
                    Name<span className="text-danger">*</span>
                  </label>
                  <input id="new-cust-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Daniel Kiprop" className={`${inputClass} ${errors.name ? inputErrorClass : ''}`} />
                  {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="new-cust-phone" className="block text-[13px] font-medium text-ink mb-1">
                    Phone<span className="text-danger">*</span>
                  </label>
                  <input id="new-cust-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+254 712 345 678" className={`${inputClass} ${errors.phone ? inputErrorClass : ''}`} />
                  {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone}</p>}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" onClick={() => setCreating(false)}>
                    Back
                  </Button>
                  <Button size="sm" variant="navy" type="submit">
                    Add to sale
                  </Button>
                </div>
              </form> :

          <>
                <div className="p-2 border-b border-line relative">
                  <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" aria-hidden="true" />
                  <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or phone" aria-label="Search customers" className={`${inputClass} pl-9 h-9`} />
                </div>
                <ul className="max-h-64 overflow-y-auto py-1">
                  {filtered.length === 0 && <li className="px-4 py-4 text-[13px] text-ink-muted text-center">No customers match "{query}"</li>}
                  {filtered.map((c) =>
              <li key={c.id}>
                      <button
                  type="button"
                  onClick={() => {
                    onSelect(c.id);
                    close();
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-canvas transition-colors duration-150">
                  
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-ink truncate">{c.name}</p>
                          <p className="text-xs text-ink-muted truncate">
                            {c.phone || 'No details recorded'}
                            {c.discountRate > 0 && ` · ${c.discountRate}% pricing`}
                          </p>
                        </div>
                        {c.id === customer.id && <CheckIcon className="w-4 h-4 text-accent" aria-hidden="true" />}
                      </button>
                    </li>
              )}
                </ul>
                <button type="button" onClick={() => setCreating(true)} className="w-full border-t border-line px-4 py-2.5 flex items-center gap-2 text-[13px] font-medium text-accent-strong hover:bg-canvas">
                  <UserPlusIcon className="w-4 h-4" aria-hidden="true" />
                  New customer
                </button>
              </>
          }
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}