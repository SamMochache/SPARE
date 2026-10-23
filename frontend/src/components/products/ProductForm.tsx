import React, { useRef } from 'react';
import { AlertCircleIcon, ImagePlusIcon, SparklesIcon, Trash2Icon } from 'lucide-react';
import { brands, categories, suppliers, vehicleMakes } from '../../data/catalog';
import type { Product, ProductInput } from '../../types/product';
import { formatKES } from '../../utils/currency';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { inputClass, inputErrorClass, selectClass } from '../ui/formStyles';
import { Modal } from '../ui/Modal';
import { TagInput } from '../ui/TagInput';
import { FormSection } from './FormSection';
import { ProductThumb } from './ProductThumb';
import { useProductForm, type ProductFormValues } from './useProductForm';

interface ProductFormProps {
  open: boolean;
  product: Product | null;
  existing: {id: number;sku: string;}[];
  onClose: () => void;
  onSave: (input: ProductInput) => void;
}

export function ProductForm({ open, product, existing, onClose, onSave }: ProductFormProps) {
  const form = useProductForm(open, product, existing);
  const { values, errors, setField } = form;
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = React.useState('');
  const isEdit = product !== null;

  const cls = (key: keyof ProductFormValues, base = inputClass) => `${base} ${errors[key] ? inputErrorClass : ''}`;
  const aria = (key: keyof ProductFormValues) => ({ 'aria-invalid': Boolean(errors[key]) || undefined, 'aria-describedby': errors[key] ? `pf-${key}-error` : undefined });

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return setImageError('Choose a JPG, PNG or WebP image');
    if (file.size > 1024 * 1024) return setImageError('Image must be under 1 MB');
    setImageError('');
    const reader = new FileReader();
    reader.onload = () => setField('imageUrl', String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <Modal
      open={open}
      onClose={form.saving ? () => undefined : onClose}
      size="xl"
      title={isEdit ? `Edit ${product.name}` : 'Add product'}
      description={
      <>
          Fields marked <span className="text-danger">*</span> are required.
        </>
      }
      footer={
      <>
          <Button onClick={onClose} disabled={form.saving}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="product-form" loading={form.saving}>
            {isEdit ? 'Save changes' : 'Add product'}
          </Button>
        </>
      }>
      
      <form id="product-form" onSubmit={(e) => form.handleSubmit(e, onSave)} noValidate className="space-y-6">
        {form.submitted && form.errorCount > 0 &&
        <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger flex items-center gap-2">
            <AlertCircleIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            Fix {form.errorCount} {form.errorCount === 1 ? 'field' : 'fields'} before saving.
          </div>
        }

        <FormSection title="Basic information" description="How the part appears in search, at the POS and on receipts.">
          <FormField label="Product name" htmlFor="pf-name" required error={errors.name} className="sm:col-span-2">
            <input id="pf-name" value={values.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. Toyota Hilux Oil Filter" className={cls('name')} {...aria('name')} />
          </FormField>
          <FormField label="Category" htmlFor="pf-category" required error={errors.category}>
            <select id="pf-category" value={values.category} onChange={(e) => setField('category', e.target.value)} className={cls('category', selectClass)} {...aria('category')}>
              <option value="">Select category</option>
              {categories.map((c) =>
              <option key={c.name}>{c.name}</option>
              )}
            </select>
          </FormField>
          <FormField label="Brand / manufacturer" htmlFor="pf-brand" required error={errors.brand}>
            <select id="pf-brand" value={values.brand} onChange={(e) => setField('brand', e.target.value)} className={cls('brand', selectClass)} {...aria('brand')}>
              <option value="">Select brand</option>
              {brands.map((b) =>
              <option key={b}>{b}</option>
              )}
            </select>
          </FormField>
          <FormField label="Status" htmlFor="pf-status">
            <select id="pf-status" value={values.status} onChange={(e) => setField('status', e.target.value as ProductFormValues['status'])} className={selectClass}>
              <option value="active">Active — available for sale</option>
              <option value="inactive">Inactive — hidden from POS</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </FormField>
          <div>
            <span className="block text-[13px] font-medium text-ink mb-1.5">Product image</span>
            <div className="flex items-center gap-3">
              <ProductThumb product={{ name: values.name || 'Product', category: values.category, imageUrl: values.imageUrl }} size="md" />
              <Button size="sm" icon={ImagePlusIcon} onClick={() => fileRef.current?.click()}>
                {values.imageUrl ? 'Replace' : 'Upload'}
              </Button>
              {values.imageUrl &&
              <Button size="sm" variant="ghost" icon={Trash2Icon} onClick={() => setField('imageUrl', '')}>
                  Remove
                </Button>
              }
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleImage} aria-label="Upload product image" />
            </div>
            <p className={`mt-1.5 text-xs ${imageError ? 'text-danger' : 'text-ink-subtle'}`}>{imageError || 'Optional. JPG or PNG under 1 MB.'}</p>
          </div>
        </FormSection>

        <FormSection title="Part identification" description="Codes used for barcode scanning and supplier matching.">
          <FormField label="SKU / internal code" htmlFor="pf-sku" required error={errors.sku} hint="Letters, numbers and dashes.">
            <div className="flex gap-2">
              <input id="pf-sku" value={values.sku} onChange={(e) => setField('sku', e.target.value.toUpperCase())} placeholder="FLT-TOY-0001" className={`${cls('sku')} font-mono`} {...aria('sku')} />
              <Button icon={SparklesIcon} onClick={form.generateSku} title="Generate SKU from category and make">
                Generate
              </Button>
            </div>
          </FormField>
          <FormField label="Barcode" htmlFor="pf-barcode" error={errors.barcode} hint="EAN-13 or UPC from the packaging.">
            <input id="pf-barcode" inputMode="numeric" value={values.barcode} onChange={(e) => setField('barcode', e.target.value.replace(/\D/g, ''))} placeholder="6161100230011" className={`${cls('barcode')} font-mono`} {...aria('barcode')} />
          </FormField>
          <FormField label="Manufacturer part number" htmlFor="pf-mpn" className="sm:col-span-2" hint="OEM number, e.g. 90915-YZZD4.">
            <input id="pf-mpn" value={values.mpn} onChange={(e) => setField('mpn', e.target.value)} placeholder="90915-YZZD4" className={`${inputClass} font-mono`} />
          </FormField>
        </FormSection>

        <FormSection title="Vehicle compatibility" description="Helps staff find the right part when a customer names their vehicle.">
          <FormField label="Vehicle make" htmlFor="pf-vehicleMake" required error={errors.vehicleMake}>
            <select id="pf-vehicleMake" value={values.vehicleMake} onChange={(e) => setField('vehicleMake', e.target.value)} className={cls('vehicleMake', selectClass)} {...aria('vehicleMake')}>
              <option value="">Select make</option>
              {vehicleMakes.map((m) =>
              <option key={m}>{m}</option>
              )}
            </select>
          </FormField>
          <FormField label="Engine type / specification" htmlFor="pf-engine">
            <input id="pf-engine" value={values.engine} onChange={(e) => setField('engine', e.target.value)} placeholder="e.g. 2KD-FTV 2.5L Diesel" className={inputClass} />
          </FormField>
          <FormField label="Compatible models" htmlFor="pf-models" className="sm:col-span-2" hint="Press Enter or comma after each model.">
            <TagInput id="pf-models" value={values.compatibleModels} onChange={(v) => setField('compatibleModels', v)} placeholder="e.g. Hilux, Fortuner" />
          </FormField>
          <FormField label="Year from" htmlFor="pf-yearFrom" error={errors.yearFrom}>
            <input id="pf-yearFrom" inputMode="numeric" maxLength={4} value={values.yearFrom} onChange={(e) => setField('yearFrom', e.target.value.replace(/\D/g, ''))} placeholder="2005" className={cls('yearFrom')} {...aria('yearFrom')} />
          </FormField>
          <FormField label="Year to" htmlFor="pf-yearTo" error={errors.yearTo}>
            <input id="pf-yearTo" inputMode="numeric" maxLength={4} value={values.yearTo} onChange={(e) => setField('yearTo', e.target.value.replace(/\D/g, ''))} placeholder="2023" className={cls('yearTo')} {...aria('yearTo')} />
          </FormField>
        </FormSection>

        <FormSection title="Pricing & tax" description="Selling prices exclude VAT. VAT is added at checkout.">
          <FormField label="Cost price (KES)" htmlFor="pf-costPrice" required error={errors.costPrice}>
            <input id="pf-costPrice" inputMode="decimal" value={values.costPrice} onChange={(e) => setField('costPrice', e.target.value.replace(/[^\d.]/g, ''))} placeholder="650.00" className={`${cls('costPrice')} tabular-nums`} {...aria('costPrice')} />
          </FormField>
          <FormField label="Selling price (KES)" htmlFor="pf-sellingPrice" required error={errors.sellingPrice}>
            <input id="pf-sellingPrice" inputMode="decimal" value={values.sellingPrice} onChange={(e) => setField('sellingPrice', e.target.value.replace(/[^\d.]/g, ''))} placeholder="950.00" className={`${cls('sellingPrice')} tabular-nums`} {...aria('sellingPrice')} />
          </FormField>
          <FormField label="VAT" htmlFor="pf-taxRate">
            <select id="pf-taxRate" value={values.taxRate} onChange={(e) => setField('taxRate', e.target.value)} className={selectClass}>
              <option value="0.16">16% — Standard rate</option>
              <option value="0">0% — Zero-rated / exempt</option>
            </select>
          </FormField>
          <div className="rounded-lg bg-canvas px-3 py-2.5 self-end">
            <p className="text-xs text-ink-muted">Gross margin</p>
            {form.margin === null ?
            <p className="text-sm text-ink-subtle">Enter both prices</p> :

            <p className={`text-sm font-semibold tabular-nums ${form.margin < 0 ? 'text-danger' : form.margin < 15 ? 'text-warning' : 'text-success'}`}>
                {form.margin.toFixed(1)}% · {formatKES(Number(values.sellingPrice) - Number(values.costPrice))} per unit
                {form.margin < 0 && ' — below cost'}
              </p>
            }
          </div>
        </FormSection>

        <FormSection title="Inventory settings" description="Where the part lives and when to reorder.">
          <FormField
            label={isEdit ? 'Quantity on hand' : 'Opening stock (record separately)'}
            htmlFor="pf-quantity"
            required
            error={errors.quantity}
            hint={isEdit ? 'Stock is read from backend balances. Change it through Inventory → Stock adjustment so it is audited.' : 'This catalogue form does not create stock balances yet. Save the product, then receive stock through Inventory.'}>
            
            <input id="pf-quantity" inputMode="numeric" disabled={isEdit} value={values.quantity} onChange={(e) => setField('quantity', e.target.value.replace(/\D/g, ''))} placeholder="0" className={`${cls('quantity')} tabular-nums`} {...aria('quantity')} />
          </FormField>
          <FormField label="Reorder level" htmlFor="pf-reorderLevel" required error={errors.reorderLevel} hint="Low-stock alert triggers at or below this.">
            <input id="pf-reorderLevel" inputMode="numeric" value={values.reorderLevel} onChange={(e) => setField('reorderLevel', e.target.value.replace(/\D/g, ''))} placeholder="10" className={`${cls('reorderLevel')} tabular-nums`} {...aria('reorderLevel')} />
          </FormField>
          <FormField label="Shelf / bin location" htmlFor="pf-binLocation" hint="Aisle-Shelf-Bin, e.g. A-01-03.">
            <input id="pf-binLocation" value={values.binLocation} onChange={(e) => setField('binLocation', e.target.value.toUpperCase())} placeholder="A-01-03" className={`${inputClass} font-mono`} />
          </FormField>
        </FormSection>

        <FormSection title="Supplier information" description="Default supplier used for purchase orders and reorder suggestions.">
          <FormField label="Preferred supplier" htmlFor="pf-supplier" required error={errors.supplier} className="sm:col-span-2">
            <select id="pf-supplier" value={values.supplier} onChange={(e) => setField('supplier', e.target.value)} className={cls('supplier', selectClass)} {...aria('supplier')}>
              <option value="">Select supplier</option>
              {suppliers.map((s) =>
              <option key={s}>{s}</option>
              )}
            </select>
          </FormField>
        </FormSection>
      </form>
    </Modal>);

}