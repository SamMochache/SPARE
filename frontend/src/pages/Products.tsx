import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DownloadIcon, PackagePlusIcon, SearchXIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ProductDetails } from '../components/products/ProductDetails';
import { ProductFilters, type ProductView } from '../components/products/ProductFilters';
import { ProductForm } from '../components/products/ProductForm';
import { ProductGrid } from '../components/products/ProductGrid';
import { ProductTable } from '../components/products/ProductTable';
import { useProductList } from '../components/products/useProductList';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { useAppData } from '../contexts/AppDataContext';
import type { Product, ProductInput } from '../types/product';
import { downloadFile, toCSV } from '../utils/files';
import { getStockStatus, stockStatusLabel } from '../utils/stock';

export function Products() {
  const { products, addProduct, updateProduct } = useAppData();
  const list = useProductList(products);
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<ProductView>('table');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const editing = products.find((p) => p.id === editingId) ?? null;
  const detail = products.find((p) => p.id === detailId) ?? null;
  const skuIndex = useMemo(() => products.map((p) => ({ id: p.id, sku: p.sku })), [products]);
  const alertCount = products.filter((p) => ['low_stock', 'out_of_stock'].includes(getStockStatus(p))).length;

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 300);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditingId(null);
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(p: Product) {
    setDetailId(null);
    setEditingId(p.id);
    setFormOpen(true);
  }

  function handleSave(input: ProductInput) {
    if (editing) {
      updateProduct(editing.id, input);
      toast.success('Product updated', { description: `${input.name} · saved in this browser only, not yet synced to a server.` });
    } else {
      const created = addProduct(input);
      toast.success('Product added', { description: `${created.name} · saved in this browser only, not yet synced to a server.` });
    }
    setFormOpen(false);
  }

  function exportCSV() {
    const header = ['Name', 'SKU', 'Barcode', 'Manufacturer Part No', 'Category', 'Brand', 'Vehicle Make', 'Compatible Models', 'Year From', 'Year To', 'Engine', 'Cost Price (KES)', 'Selling Price (KES)', 'VAT Rate', 'Quantity', 'Reorder Level', 'Stock Status', 'Supplier', 'Bin Location', 'Status'];
    const rows = list.filtered.map((p) => [
    p.name, p.sku, p.barcode, p.mpn, p.category, p.brand, p.vehicleMake, p.compatibleModels.join('; '), p.yearFrom ?? '', p.yearTo ?? '', p.engine,
    p.costPrice.toFixed(2), p.sellingPrice.toFixed(2), p.taxRate, p.quantity, p.reorderLevel, stockStatusLabel[getStockStatus(p)], p.supplier, p.binLocation, p.status]
    );
    downloadFile(`autoparts-products-${new Date().toISOString().slice(0, 10)}.csv`, toCSV([header, ...rows]), 'text/csv');
    toast.success(`Exported ${rows.length} products to CSV`);
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="Products & Spare Parts"
        description={`${products.length} parts in catalog · ${alertCount} need reordering`}
        actions={
        <>
            <Button icon={DownloadIcon} onClick={exportCSV} disabled={list.filtered.length === 0}>
              Export CSV
            </Button>
            <Button variant="primary" icon={PackagePlusIcon} onClick={openCreate}>
              Add product
            </Button>
          </>
        } />
      

      <section className="bg-white border border-line rounded-xl shadow-card overflow-hidden" aria-label="Product list">
        <ProductFilters
          filters={list.filters}
          onChange={list.updateFilter}
          onReset={list.resetFilters}
          activeCount={list.activeFilterCount}
          view={view}
          onViewChange={(next) => {
            setView(next);
            list.setPageSize(next === 'grid' ? 12 : 10);
          }} />
        

        {loading ?
        <div className="divide-y divide-line" aria-busy="true" aria-label="Loading products">
            {Array.from({ length: 6 }).map((_, i) =>
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                <div className="w-10 h-10 rounded-lg bg-canvas animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-canvas animate-pulse" />
                  <div className="h-2.5 w-1/5 rounded bg-canvas animate-pulse" />
                </div>
                <div className="h-3 w-20 rounded bg-canvas animate-pulse" />
              </div>
          )}
          </div> :
        list.filtered.length === 0 ?
        <div className="py-16 px-6 text-center">
            <SearchXIcon className="w-7 h-7 text-ink-subtle mx-auto" aria-hidden="true" />
            <p className="text-sm font-medium text-ink mt-3">No products match these filters</p>
            <p className="text-[13px] text-ink-muted mt-1">Try a different search term or clear filters to see the full catalog.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button size="sm" onClick={list.resetFilters}>
                Clear filters
              </Button>
              <Button size="sm" variant="navy" icon={PackagePlusIcon} onClick={openCreate}>
                Add product
              </Button>
            </div>
          </div> :

        <>
            {view === 'table' ?
          <ProductTable items={list.pageItems} sort={list.sort} onSort={list.toggleSort} onView={(p) => setDetailId(p.id)} onEdit={openEdit} /> :

          <ProductGrid items={list.pageItems} onView={(p) => setDetailId(p.id)} />
          }
            <Pagination
            page={list.page}
            totalPages={list.totalPages}
            pageSize={list.pageSize}
            totalItems={list.filtered.length}
            onPageChange={list.setPage}
            onPageSizeChange={list.setPageSize}
            pageSizeOptions={view === 'grid' ? [12, 24, 48] : [10, 25, 50]} />
          
          </>
        }
      </section>

      <ProductDetails product={detail} onClose={() => setDetailId(null)} onEdit={openEdit} />
      <ProductForm open={formOpen} product={editing} existing={skuIndex} onClose={() => setFormOpen(false)} onSave={handleSave} />
    </div>);

}