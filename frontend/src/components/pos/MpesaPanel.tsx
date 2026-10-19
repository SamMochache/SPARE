import React, { useState } from 'react';
import { CheckCircle2Icon, FlaskConicalIcon, Loader2Icon, SmartphoneIcon, XCircleIcon } from 'lucide-react';
import { formatKES } from '../../utils/currency';
import { normalizeKenyanPhone } from '../../utils/phone';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { inputClass, inputErrorClass } from '../ui/formStyles';
import type { MpesaState } from './useCheckout';

interface MpesaPanelProps {
  state: MpesaState;
  onChange: (state: MpesaState) => void;
  total: number;
}

function demoReference(): string {
  return `DEMO${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function MpesaPanel({ state, onChange, total }: MpesaPanelProps) {
  const [touched, setTouched] = useState(false);
  const normalized = normalizeKenyanPhone(state.phone);
  const phoneError = touched && !normalized ? 'Enter a valid Safaricom number, e.g. 0712 345 678' : undefined;
  const locked = state.status === 'pending' || state.status === 'confirmed';

  function send() {
    setTouched(true);
    if (!normalized) return;
    onChange({ ...state, status: 'pending', reference: '' });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-line-strong bg-canvas px-3 py-2.5 text-[13px] text-ink-muted">
        <FlaskConicalIcon className="w-4 h-4 mt-0.5 shrink-0 text-ink" aria-hidden="true" />
        <p>
          <span className="font-medium text-ink">Demonstration only.</span> No payment request is sent and no money moves. Live M-Pesa confirmation will come from the backend once it's connected.
        </p>
      </div>

      <div className="flex items-end gap-2">
        <FormField label="Customer M-Pesa number" htmlFor="mpesa-phone" required error={phoneError} className="flex-1">
          <input
            id="mpesa-phone"
            inputMode="tel"
            value={state.phone}
            disabled={locked}
            onChange={(e) => onChange({ ...state, phone: e.target.value })}
            onBlur={() => setTouched(true)}
            placeholder="+254 712 345 678"
            className={`${inputClass} ${phoneError ? inputErrorClass : ''}`} />
          
        </FormField>
        <div className={phoneError ? 'mb-6' : ''}>
          {state.status === 'idle' || state.status === 'failed' ?
          <Button variant="navy" icon={SmartphoneIcon} onClick={send}>
              {state.status === 'failed' ? 'Retry request' : 'Send request'}
            </Button> :

          <Button onClick={() => onChange({ ...state, status: 'idle', reference: '' })}>Change number</Button>
          }
        </div>
      </div>

      {state.status === 'pending' &&
      <div className="rounded-lg border border-warning/30 bg-warning-soft p-4" role="status">
          <div className="flex items-center gap-2.5">
            <Loader2Icon className="w-4 h-4 text-warning animate-spin" aria-hidden="true" />
            <p className="text-sm font-medium text-ink">Pending — waiting for customer to enter their M-Pesa PIN</p>
          </div>
          <p className="text-[13px] text-ink-muted mt-1 ml-[26px]">Request for {formatKES(total)} (simulated).</p>
          <div className="mt-3 ml-[26px] flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-muted">Demo controls:</span>
            <Button size="sm" onClick={() => onChange({ ...state, status: 'confirmed', reference: demoReference() })}>
              Mark as confirmed
            </Button>
            <Button size="sm" onClick={() => onChange({ ...state, status: 'failed', reference: '' })}>
              Mark as failed
            </Button>
          </div>
        </div>
      }

      {state.status === 'confirmed' &&
      <div className="rounded-lg border border-success/30 bg-success-soft p-4 flex items-start gap-2.5" role="status">
          <CheckCircle2Icon className="w-4 h-4 text-success mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-ink">Confirmed (demonstration)</p>
            <p className="text-[13px] text-ink-muted">
              Reference <span className="font-mono">{state.reference}</span> · {formatKES(total)}
            </p>
          </div>
        </div>
      }

      {state.status === 'failed' &&
      <div className="rounded-lg border border-danger/30 bg-danger-soft p-4 flex items-start gap-2.5" role="alert">
          <XCircleIcon className="w-4 h-4 text-danger mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-ink">Failed (demonstration)</p>
            <p className="text-[13px] text-ink-muted">The customer cancelled or had insufficient funds. Retry or choose another method.</p>
          </div>
        </div>
      }
    </div>);

}