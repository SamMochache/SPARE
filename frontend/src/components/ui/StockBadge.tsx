import React from 'react';
import type { Product } from '../../types/product';
import { getStockStatus, stockStatusLabel, stockStatusTone } from '../../utils/stock';
import { StatusBadge } from './StatusBadge';

interface StockBadgeProps {
  product: Pick<Product, 'quantity' | 'reorderLevel' | 'status'>;
}

export function StockBadge({ product }: StockBadgeProps) {
  const status = getStockStatus(product);
  return <StatusBadge tone={stockStatusTone[status]}>{stockStatusLabel[status]}</StatusBadge>;
}