import React, { useEffect, useState } from 'react';
import type { Product, ProductInput, ProductStatus } from '../../types/product';

export interface ProductFormValues {
  name: string;
  category: string;
  brand: string;
  status: ProductStatus;
  imageUrl: string;
  sku: string;
  barcode: string;
  mpn: string;
  vehicleMake: string;
  compatibleModels: string[];
  yearFrom: string;
  yearTo: string;
  engine: string;
  costPrice: string;
  sellingPrice: string;
  taxRate: string;
  quantity: string;
  reorderLevel: string;
  binLocation: string;
  supplier: string;
}

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

const fieldOrder: (keyof ProductFormValues)[] = ['name', 'category', 'brand', 'sku', 'barcode', 'vehicleMake', 'yearFrom', 'yearTo', 'costPrice', 'sellingPrice', 'quantity', 'reorderLevel', 'supplier'];

function toValues(p: Product | null): ProductFormValues {
  return {
    name: p?.name ?? '',
    category: p?.category ?? '',
    brand: p?.brand ?? '',
    status: p?.status ?? 'active',
    imageUrl: p?.imageUrl ?? '',
    sku: p?.sku ?? '',
    barcode: p?.barcode ?? '',
    mpn: p?.mpn ?? '',
    vehicleMake: p?.vehicleMake ?? '',
    compatibleModels: p?.compatibleModels ?? [],
    yearFrom: p?.yearFrom ? String(p.yearFrom) : '',
    yearTo: p?.yearTo ? String(p.yearTo) : '',
    engine: p?.engine ?? '',
    costPrice: p ? String(p.costPrice) : '',
    sellingPrice: p ? String(p.sellingPrice) : '',
    taxRate: p ? String(p.taxRate) : '0.16',
    quantity: p ? String(p.quantity) : '',
    reorderLevel: p ? String(p.reorderLevel) : '',
    binLocation: p?.binLocation ?? '',
    supplier: p?.supplier ?? ''
  };
}

function isWholeNumber(v: string): boolean {
  return v.trim() !== '' && /^\d+$/.test(v.trim());
}

export function validateProduct(v: ProductFormValues, others: {id: number;sku: string;}[], editingId: number | null): ProductFormErrors {
  const e: ProductFormErrors = {};
  if (v.name.trim().length < 3) e.name = 'Enter a product name (at least 3 characters)';
  if (!v.category) e.category = 'Select a category';
  if (!v.brand) e.brand = 'Select a brand or manufacturer';

  const sku = v.sku.trim().toUpperCase();
  if (!sku) e.sku = 'SKU is required';else
  if (!/^[A-Z0-9-]{4,20}$/.test(sku)) e.sku = 'Use 4–20 letters, numbers or dashes';else
  if (others.some((o) => o.sku.toUpperCase() === sku && o.id !== editingId)) e.sku = 'Another product already uses this SKU';

  if (v.barcode.trim() && !/^\d{8,14}$/.test(v.barcode.trim())) e.barcode = 'Barcode must be 8–14 digits';
  if (!v.vehicleMake) e.vehicleMake = 'Select a vehicle make';

  const yf = v.yearFrom.trim() ? Number(v.yearFrom) : null;
  const yt = v.yearTo.trim() ? Number(v.yearTo) : null;
  if (yf !== null && (!Number.isInteger(yf) || yf < 1970 || yf > 2027)) e.yearFrom = 'Enter a year between 1970 and 2027';
  if (yt !== null && (!Number.isInteger(yt) || yt < 1970 || yt > 2027)) e.yearTo = 'Enter a year between 1970 and 2027';
  if (yf !== null && yt !== null && !e.yearFrom && !e.yearTo && yf > yt) e.yearTo = 'Must be the same as or after the start year';

  if (!(Number(v.costPrice) > 0)) e.costPrice = 'Enter a cost price above zero';
  if (!(Number(v.sellingPrice) > 0)) e.sellingPrice = 'Enter a selling price above zero';
  if (!isWholeNumber(v.quantity)) e.quantity = 'Enter a whole number, 0 or more';
  if (!isWholeNumber(v.reorderLevel)) e.reorderLevel = 'Enter a whole number, 0 or more';
  if (!v.supplier) e.supplier = 'Select a supplier';
  return e;
}

function toInput(v: ProductFormValues): ProductInput {
  return {
    name: v.name.trim(),
    category: v.category,
    brand: v.brand,
    status: v.status,
    imageUrl: v.imageUrl,
    sku: v.sku.trim().toUpperCase(),
    barcode: v.barcode.trim(),
    mpn: v.mpn.trim(),
    vehicleMake: v.vehicleMake,
    compatibleModels: v.compatibleModels,
    yearFrom: v.yearFrom ? Number(v.yearFrom) : null,
    yearTo: v.yearTo ? Number(v.yearTo) : null,
    engine: v.engine.trim(),
    costPrice: Number(v.costPrice),
    sellingPrice: Number(v.sellingPrice),
    taxRate: Number(v.taxRate),
    quantity: Number(v.quantity),
    reorderLevel: Number(v.reorderLevel),
    binLocation: v.binLocation.trim().toUpperCase(),
    supplier: v.supplier
  };
}

export function useProductForm(open: boolean, product: Product | null, others: {id: number;sku: string;}[]) {
  const [values, setValues] = useState<ProductFormValues>(() => toValues(product));
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const editingId = product?.id ?? null;

  useEffect(() => {
    if (!open) return;
    setValues(toValues(product));
    setErrors({});
    setSubmitted(false);
    setSaving(false);
  }, [open, product]);

  function setField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    const next = { ...values, [key]: value };
    setValues(next);
    if (submitted) setErrors(validateProduct(next, others, editingId));
  }

  function generateSku() {
    const cat = (values.category || 'GEN').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
    const make = (values.vehicleMake || 'UNI').slice(0, 3).toUpperCase();
    let sku = '';
    do {
      sku = `${cat}-${make}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    } while (others.some((o) => o.sku === sku));
    setField('sku', sku);
  }

  function handleSubmit(e: React.FormEvent, onSave: (input: ProductInput) => void) {
    e.preventDefault();
    setSubmitted(true);
    const found = validateProduct(values, others, editingId);
    setErrors(found);
    const firstInvalid = fieldOrder.find((k) => found[k]);
    if (firstInvalid) {
      document.getElementById(`pf-${firstInvalid}`)?.focus();
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      onSave(toInput(values));
      setSaving(false);
    }, 400);
  }

  const cost = Number(values.costPrice);
  const sell = Number(values.sellingPrice);
  const margin = cost > 0 && sell > 0 ? (sell - cost) / sell * 100 : null;

  return { values, errors, submitted, saving, setField, generateSku, handleSubmit, margin, errorCount: Object.keys(errors).length };
}