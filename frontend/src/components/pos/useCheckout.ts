import { useEffect, useMemo, useState } from 'react';
import { WALK_IN_CUSTOMER_ID } from '../../data/customers';
import type { Customer } from '../../types/customer';
import type { CheckoutMethod, PaymentMethod, PaymentRecord } from '../../types/sales';
import { formatKES, parseAmount, roundMoney } from '../../utils/currency';
import { paymentMethodLabel } from '../../utils/sales';

export type MpesaStatus = 'idle' | 'pending' | 'confirmed' | 'failed';

export interface MpesaState {
  phone: string;
  status: MpesaStatus;
  reference: string;
}

export interface SplitRow {
  id: string;
  method: PaymentMethod;
  amount: string;
  reference: string;
}

export interface CheckoutEvaluation {
  valid: boolean;
  message: string;
  payments: PaymentRecord[];
  amountPaid: number;
  change: number;
  balanceDue: number;
}

function ok(payments: PaymentRecord[], amountPaid: number, change: number, balanceDue: number): CheckoutEvaluation {
  return { valid: true, message: '', payments, amountPaid: roundMoney(amountPaid), change: roundMoney(change), balanceDue: roundMoney(balanceDue) };
}

function fail(message: string): CheckoutEvaluation {
  return { valid: false, message, payments: [], amountPaid: 0, change: 0, balanceDue: 0 };
}

interface EvaluateInput {
  method: CheckoutMethod;
  total: number;
  canCredit: boolean;
  cashTendered: string;
  mpesa: MpesaState;
  cardRef: string;
  bankRef: string;
  splitRows: SplitRow[];
}

function evaluate({ method, total, canCredit, cashTendered, mpesa, cardRef, bankRef, splitRows }: EvaluateInput): CheckoutEvaluation {
  switch (method) {
    case 'cash':{
        const tendered = parseAmount(cashTendered);
        if (tendered >= total - 0.001) return ok([{ method: 'cash', amount: total, reference: '' }], tendered, tendered - total, 0);
        if (canCredit) return ok(tendered > 0 ? [{ method: 'cash', amount: tendered, reference: '' }] : [], tendered, 0, total - tendered);
        return fail(tendered === 0 ? 'Enter the cash amount received.' : `Short by ${formatKES(total - tendered)}.`);
      }
    case 'mpesa':
      if (mpesa.status === 'confirmed') return ok([{ method: 'mpesa', amount: total, reference: mpesa.reference }], total, 0, 0);
      if (mpesa.status === 'pending') return fail('Waiting for M-Pesa confirmation.');
      if (mpesa.status === 'failed') return fail('M-Pesa payment failed. Retry or choose another method.');
      return fail('Send a payment request to the customer’s phone.');
    case 'card':
      return cardRef.trim().length >= 4 ? ok([{ method: 'card', amount: total, reference: cardRef.trim() }], total, 0, 0) : fail('Enter the approval code from the card terminal.');
    case 'bank':
      return bankRef.trim().length >= 4 ? ok([{ method: 'bank', amount: total, reference: bankRef.trim() }], total, 0, 0) : fail('Enter the bank transfer reference.');
    case 'split':{
        const rows = splitRows.filter((r) => parseAmount(r.amount) > 0);
        if (rows.length < 2) return fail('Enter amounts for at least two payment methods.');
        const missingRef = rows.find((r) => r.method !== 'cash' && r.reference.trim().length < 4);
        if (missingRef) return fail(`Add a reference for the ${paymentMethodLabel[missingRef.method]} payment.`);
        const sum = roundMoney(rows.reduce((s, r) => s + parseAmount(r.amount), 0));
        const payments = rows.map((r) => ({ method: r.method, amount: parseAmount(r.amount), reference: r.reference.trim() }));
        if (sum > total + 0.001) return fail(`Payments exceed the total by ${formatKES(sum - total)}.`);
        if (Math.abs(sum - total) < 0.01) return ok(payments, sum, 0, 0);
        if (canCredit) return ok(payments, sum, 0, total - sum);
        return fail(`${formatKES(total - sum)} still to allocate.`);
      }
    default:
      return fail('Select a payment method.');
  }
}

export function useCheckout(open: boolean, total: number, customer: Customer) {
  const isWalkIn = customer.id === WALK_IN_CUSTOMER_ID;
  const availableCredit = Math.max(0, customer.creditLimit - customer.balance);
  const creditEligible = !isWalkIn && customer.creditLimit > 0;

  const [method, setMethod] = useState<CheckoutMethod>('cash');
  const [cashTendered, setCashTendered] = useState('');
  const [mpesa, setMpesa] = useState<MpesaState>({ phone: '', status: 'idle', reference: '' });
  const [cardRef, setCardRef] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [splitRows, setSplitRows] = useState<SplitRow[]>([]);
  const [allowCredit, setAllowCredit] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMethod('cash');
    setCashTendered('');
    setMpesa({ phone: customer.phone, status: 'idle', reference: '' });
    setCardRef('');
    setBankRef('');
    setSplitRows([
    { id: 'r1', method: 'cash', amount: '', reference: '' },
    { id: 'r2', method: 'mpesa', amount: '', reference: '' }]
    );
    setAllowCredit(false);
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const evaluation = useMemo(() => {
    const result = evaluate({ method, total, canCredit: allowCredit && creditEligible, cashTendered, mpesa, cardRef, bankRef, splitRows });
    if (result.valid && result.balanceDue > availableCredit + 0.001) return fail(`Unpaid amount exceeds available credit of ${formatKES(availableCredit)}.`);
    return result;
  }, [method, total, allowCredit, creditEligible, cashTendered, mpesa, cardRef, bankRef, splitRows, availableCredit]);

  const quickCash = useMemo(
    () => Array.from(new Set([total, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000, Math.ceil(total / 5000) * 5000].map(roundMoney))).slice(0, 4),
    [total]
  );

  return {
    method,
    setMethod,
    cashTendered,
    setCashTendered,
    mpesa,
    setMpesa,
    cardRef,
    setCardRef,
    bankRef,
    setBankRef,
    splitRows,
    setSplitRows,
    allowCredit,
    setAllowCredit,
    creditEligible,
    availableCredit,
    evaluation,
    quickCash
  };
}