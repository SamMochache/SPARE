import React, { useEffect, useState } from 'react';
import { ShieldCheckIcon } from 'lucide-react';
import { currentUser, DEMO_MANAGER_PIN, MAX_DISCOUNT_PERCENT } from '../../data/shop';
import type { Discount } from '../../types/sales';
import { formatKES, parseAmount } from '../../utils/currency';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { inputClass, inputErrorClass, selectClass } from '../ui/formStyles';
import { Modal } from '../ui/Modal';
import { SegmentedControl } from '../ui/SegmentedControl';

interface DiscountModalProps {
  open: boolean;
  onClose: () => void;
  subtotal: number;
  current: Discount | null;
  onApply: (discount: Discount) => void;
}

const reasons = ['Loyal customer', 'Bulk purchase', 'Price match', 'Mechanic / trade referral', 'Damaged packaging', 'Other'];

type Errors = {value?: string;reason?: string;pin?: string;};

export function DiscountModal({ open, onClose, subtotal, current, onApply }: DiscountModalProps) {
  const [type, setType] = useState<Discount['type']>('percent');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!open) return;
    setType(current?.type ?? 'percent');
    setValue(current ? String(current.value) : '');
    setReason(current && reasons.includes(current.reason) ? current.reason : '');
    setPin('');
    setErrors({});
  }, [open, current]);

  const numeric = parseAmount(value);
  const amount = Math.min(subtotal, type === 'percent' ? subtotal * numeric / 100 : numeric);
  const maxAmount = subtotal * MAX_DISCOUNT_PERCENT / 100;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (numeric <= 0) next.value = 'Enter a discount greater than zero';else
    if (type === 'percent' && numeric > MAX_DISCOUNT_PERCENT) next.value = `Maximum is ${MAX_DISCOUNT_PERCENT}% without owner approval`;else
    if (type === 'amount' && numeric > maxAmount) next.value = `Maximum is ${formatKES(maxAmount)} (${MAX_DISCOUNT_PERCENT}%) for this sale`;
    if (!reason) next.reason = 'Select a reason for the audit trail';
    if (!/^\d{4}$/.test(pin)) next.pin = 'Enter the 4-digit manager PIN';else
    if (pin !== DEMO_MANAGER_PIN) next.pin = 'Incorrect PIN';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onApply({ type, value: numeric, reason, authorizedBy: currentUser.name });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Apply discount"
      description="Discounts require a manager PIN and are recorded on the receipt."
      size="sm"
      footer={
      <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="navy" type="submit" form="discount-form" icon={ShieldCheckIcon}>
            Authorize discount
          </Button>
        </>
      }>
      
      <form id="discount-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="flex items-end gap-3">
          <FormField label="Discount" htmlFor="discount-value" required error={errors.value} className="flex-1">
            <div className="relative">
              <input
                id="discount-value"
                autoFocus
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === 'percent' ? '5' : '500'}
                className={`${inputClass} pr-12 tabular-nums ${errors.value ? inputErrorClass : ''}`} />
              
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-muted">{type === 'percent' ? '%' : 'KES'}</span>
            </div>
          </FormField>
          <div className={errors.value ? 'mb-6' : ''}>
            <SegmentedControl
              ariaLabel="Discount type"
              value={type}
              onChange={setType}
              options={[
              { value: 'percent', label: '%' },
              { value: 'amount', label: 'KES' }]
              } />
            
          </div>
        </div>

        <div className="rounded-lg bg-canvas px-3 py-2.5 flex justify-between text-sm">
          <span className="text-ink-muted">Discount on {formatKES(subtotal)}</span>
          <span className="font-semibold tabular-nums text-success">−{formatKES(amount)}</span>
        </div>

        <FormField label="Reason" htmlFor="discount-reason" required error={errors.reason}>
          <select id="discount-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={`${selectClass} ${errors.reason ? inputErrorClass : ''}`}>
            <option value="">Select a reason</option>
            {reasons.map((r) =>
            <option key={r} value={r}>
                {r}
              </option>
            )}
          </select>
        </FormField>

        <FormField label="Manager PIN" htmlFor="discount-pin" required error={errors.pin} hint="Demo PIN: 1234. Real PIN checks happen on the server.">
          <input
            id="discount-pin"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className={`${inputClass} tracking-[0.3em] ${errors.pin ? inputErrorClass : ''}`} />
          
        </FormField>
      </form>
    </Modal>);

}