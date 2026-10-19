import React from 'react';
import { PackageIcon } from 'lucide-react';
import { categories } from '../../data/catalog';
import type { Product } from '../../types/product';

interface ProductThumbProps {
  product: Pick<Product, 'name' | 'category' | 'imageUrl'>;
  size?: 'sm' | 'md' | 'lg';
}

const boxSizes = { sm: 'w-8 h-8 rounded-md', md: 'w-10 h-10 rounded-lg', lg: 'w-16 h-16 rounded-xl' };
const iconSizes = { sm: 'w-4 h-4', md: 'w-[18px] h-[18px]', lg: 'w-7 h-7' };

export function ProductThumb({ product, size = 'md' }: ProductThumbProps) {
  if (product.imageUrl) {
    return <img src={product.imageUrl} alt={product.name} className={`${boxSizes[size]} object-cover border border-line shrink-0 bg-white`} />;
  }
  const Icon = categories.find((c) => c.name === product.category)?.icon ?? PackageIcon;
  return (
    <span className={`${boxSizes[size]} bg-canvas border border-line text-navy-700 grid place-items-center shrink-0`} aria-hidden="true">
      <Icon className={iconSizes[size]} />
    </span>);

}