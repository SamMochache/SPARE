import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CheckoutModal } from '../components/pos/CheckoutModal';
import { DiscountModal } from '../components/pos/DiscountModal';
import { HeldSalesModal } from '../components/pos/HeldSalesModal';
import { POSProductCatalog } from '../components/pos/POSProductCatalog';
import { ShoppingCart } from '../components/pos/ShoppingCart';
import { usePointOfSale } from '../components/pos/usePointOfSale';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { formatKES } from '../utils/currency';

export function PointOfSale() {
  const pos = usePointOfSale();
  const searchRef = useRef<HTMLInputElement>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [heldOpen, setHeldOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const anyModalOpen = checkoutOpen || discountOpen || heldOpen || clearOpen;

  function openCheckout() {
    if (pos.items.length === 0) {
      toast.info('Add at least one part before checking out');
      return;
    }
    setCheckoutOpen(true);
  }

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (anyModalOpen) return;
      if (e.key === 'F2') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (e.key === 'F8') {
        e.preventDefault();
        pos.hold();
      } else if (e.key === 'F9') {
        e.preventDefault();
        openCheckout();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return (
    <div className="flex flex-col lg:flex-row lg:h-full lg:min-h-0">
      <section className="flex-1 min-w-0 flex flex-col lg:min-h-0" aria-label="Product catalog">
        <POSProductCatalog products={pos.products} cartQuantities={pos.cartQuantities} onAdd={pos.addToCart} searchRef={searchRef} />
      </section>

      <aside id="pos-cart" className="lg:w-[400px] xl:w-[440px] shrink-0 border-t lg:border-t-0 lg:border-l border-line bg-white flex flex-col lg:min-h-0" aria-label="Current sale">
        <ShoppingCart
          items={pos.items}
          totals={pos.totals}
          customer={pos.customer}
          customers={pos.customers}
          discount={pos.discount}
          note={pos.note}
          heldCount={pos.heldSales.length}
          onSetQuantity={pos.setQuantity}
          onRemove={pos.removeLine}
          onSelectCustomer={pos.selectCustomer}
          onCreateCustomer={pos.createCustomer}
          onOpenDiscount={() => setDiscountOpen(true)}
          onRemoveDiscount={() => pos.setDiscount(null)}
          onNoteChange={pos.setNote}
          onHold={() => pos.hold()}
          onClear={() => setClearOpen(true)}
          onCheckout={openCheckout}
          onOpenHeld={() => setHeldOpen(true)} />
        
      </aside>

      {pos.items.length > 0 &&
      <a
        href="#pos-cart"
        className="lg:hidden fixed bottom-4 inset-x-4 z-20 h-12 rounded-xl bg-navy text-white shadow-pop flex items-center justify-between px-4 text-sm font-medium">
        
          <span>View cart · {pos.totals.itemCount} items</span>
          <span className="tabular-nums font-semibold">{formatKES(pos.totals.total)}</span>
        </a>
      }

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => {
          setCheckoutOpen(false);
          window.setTimeout(() => searchRef.current?.focus(), 0);
        }}
        totals={pos.totals}
        customer={pos.customer}
        onComplete={pos.completeSale} />
      
      <DiscountModal
        open={discountOpen}
        onClose={() => setDiscountOpen(false)}
        subtotal={pos.totals.subtotal}
        current={pos.discount}
        onApply={(d) => {
          pos.setDiscount(d);
          toast.success('Discount applied', { description: `${d.type === 'percent' ? `${d.value}%` : formatKES(d.value)} · ${d.reason}` });
        }} />
      
      <HeldSalesModal
        open={heldOpen}
        onClose={() => setHeldOpen(false)}
        heldSales={pos.heldSales}
        products={pos.products}
        customers={pos.customers}
        cartHasItems={pos.items.length > 0}
        onResume={pos.resume}
        onDiscard={(id) => {
          pos.removeHeldSale(id);
          toast('Held sale discarded');
        }} />
      
      <ConfirmationDialog
        open={clearOpen}
        title="Clear this sale?"
        description={`All ${pos.totals.itemCount} items, the selected customer, discount and note will be removed. This can't be undone.`}
        confirmLabel="Clear sale"
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          pos.resetSale();
          setClearOpen(false);
          searchRef.current?.focus();
        }} />
      
    </div>);

}