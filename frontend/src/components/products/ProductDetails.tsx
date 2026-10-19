import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { PencilIcon, ShoppingCartIcon, XIcon } from 'lucide-react';
import type { Product } from '../../types/product';
import { formatKES } from '../../utils/currency';
import { getStockStatus } from '../../utils/stock';
import { Button, buttonClass } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { StockBadge } from '../ui/StockBadge';
import { ProductThumb } from './ProductThumb';

interface ProductDetailsProps {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
}

export function ProductDetails({ product, onClose, onEdit }: ProductDetailsProps) {
  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [product, onClose]);

  return (
    <AnimatePresence>
      {product &&
      <div className="fixed inset-0 z-[55]" role="dialog" aria-modal="true" aria-label={`${product.name} details`}>
          <motion.div className="absolute inset-0 bg-navy-950/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} />
          <motion.aside
          className="absolute right-0 inset-y-0 w-full max-w-md bg-white shadow-pop flex flex-col"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
          
            <DetailsBody product={product} onClose={onClose} onEdit={onEdit} />
          </motion.aside>
        </div>
      }
    </AnimatePresence>);

}

function DetailsBody({ product: p, onClose, onEdit }: {product: Product;onClose: () => void;onEdit: (product: Product) => void;}) {
  const status = getStockStatus(p);
  const margin = p.sellingPrice > 0 ? (p.sellingPrice - p.costPrice) / p.sellingPrice * 100 : 0;
  const years = p.yearFrom && p.yearTo ? `${p.yearFrom}–${p.yearTo}` : 'All years';

  const sections: {title: string;rows: [string, React.ReactNode][];}[] = [
  {
    title: 'Part identification',
    rows: [
    ['SKU', <span className="font-mono">{p.sku}</span>],
    ['Barcode', <span className="font-mono">{p.barcode || '—'}</span>],
    ['Manufacturer part no.', <span className="font-mono">{p.mpn || '—'}</span>],
    ['Category', p.category],
    ['Brand', p.brand]]

  },
  {
    title: 'Vehicle compatibility',
    rows: [
    ['Make', p.vehicleMake],
    [
    'Models',
    <span className="flex flex-wrap gap-1 justify-end">
            {p.compatibleModels.map((m) =>
      <span key={m} className="rounded bg-canvas border border-line px-1.5 py-0.5 text-xs">
                {m}
              </span>
      )}
          </span>],

    ['Years', years],
    ['Engine / spec', p.engine || '—']]

  },
  {
    title: 'Pricing & tax',
    rows: [
    ['Cost price', formatKES(p.costPrice)],
    ['Selling price (excl. VAT)', formatKES(p.sellingPrice)],
    ['Selling price (incl. VAT)', formatKES(p.sellingPrice * (1 + p.taxRate))],
    ['VAT rate', p.taxRate > 0 ? `${Math.round(p.taxRate * 100)}% standard` : 'Zero-rated'],
    ['Gross margin', <span className={margin < 0 ? 'text-danger' : ''}>{margin.toFixed(1)}%</span>]]

  },
  {
    title: 'Supplier',
    rows: [
    ['Preferred supplier', p.supplier],
    ['Last updated', format(new Date(p.updatedAt), 'dd MMM yyyy, HH:mm')]]

  }];


  return (
    <>
      <header className="flex items-start gap-3 px-5 py-4 border-b border-line">
        <ProductThumb product={p} size="lg" />
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-ink leading-snug">{p.name}</h2>
          <p className="font-mono text-xs text-ink-muted mt-0.5">{p.sku}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <StockBadge product={p} />
            {p.status === 'inactive' && <StatusBadge tone="neutral">Inactive</StatusBadge>}
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close details" className="w-8 h-8 rounded-lg grid place-items-center text-ink-subtle hover:text-ink hover:bg-canvas">
          <XIcon className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <dl className="grid grid-cols-3 rounded-lg border border-line divide-x divide-line">
          <div className="p-3">
            <dt className="text-xs text-ink-muted">On hand</dt>
            <dd className={`text-xl font-semibold tabular-nums mt-0.5 ${status === 'out_of_stock' ? 'text-danger' : status === 'low_stock' ? 'text-warning' : 'text-ink'}`}>{p.quantity}</dd>
          </div>
          <div className="p-3">
            <dt className="text-xs text-ink-muted">Reorder at</dt>
            <dd className="text-xl font-semibold tabular-nums mt-0.5 text-ink">{p.reorderLevel}</dd>
          </div>
          <div className="p-3">
            <dt className="text-xs text-ink-muted">Bin</dt>
            <dd className="text-xl font-semibold font-mono mt-0.5 text-ink truncate">{p.binLocation || '—'}</dd>
          </div>
        </dl>

        {sections.map((section) =>
        <section key={section.title}>
            <h3 className="text-xs font-semibold text-ink-muted mb-2">{section.title}</h3>
            <dl className="divide-y divide-line">
              {section.rows.map(([label, value]) =>
            <div key={label} className="flex justify-between gap-4 py-2 text-sm">
                  <dt className="text-ink-muted shrink-0">{label}</dt>
                  <dd className="text-ink text-right tabular-nums min-w-0">{value}</dd>
                </div>
            )}
            </dl>
          </section>
        )}
      </div>

      <footer className="px-5 py-3.5 border-t border-line flex gap-2">
        <Button variant="navy" icon={PencilIcon} onClick={() => onEdit(p)} className="flex-1">
          Edit product
        </Button>
        <Link to="/pos" className={`${buttonClass('secondary')} flex-1`}>
          <ShoppingCartIcon className="w-4 h-4" aria-hidden="true" />
          Open POS
        </Link>
      </footer>
    </>);

}