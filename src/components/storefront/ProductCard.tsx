'use client';

import React from 'react';
import Image from 'next/image';
import { Plus, Sparkles, Flame, SlidersHorizontal } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatINR } from '@/lib/pricing';

interface ProductCardProps {
  product: Product;
  onCustomize: (product: Product) => void;
}

export function ProductCard({ product, onCustomize }: ProductCardProps) {
  const hasCustomizations = Boolean(product.variants && product.variants.length > 0);
  const startingPrice = product.variants && product.variants.length > 0
    ? Math.min(...product.variants.map((v) => v.price_paise))
    : product.base_price_paise;

  return (
    <div className="group bg-white rounded-2xl border border-border-warm overflow-hidden shadow-xs hover:shadow-lg hover:border-primary-green/40 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Product Image */}
        <div
          onClick={() => onCustomize(product)}
          className="relative h-44 sm:h-48 w-full bg-neutral-100 overflow-hidden cursor-pointer"
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🍕</div>
          )}

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
            <span className={product.is_veg ? 'veg-badge bg-white shadow-xs' : 'non-veg-badge bg-white shadow-xs'}>
              <span className={product.is_veg ? 'veg-dot' : 'non-veg-dot'} />
            </span>
            {product.is_bestseller && (
              <span className="bg-yellow-400 text-charcoal text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Bestseller
              </span>
            )}
            {product.is_spicy && (
              <span className="bg-tomato text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                <Flame className="w-3 h-3" /> Spicy
              </span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-1 mb-1">
            <h3
              onClick={() => onCustomize(product)}
              className="text-base font-black text-forest font-serif hover:text-primary-green transition cursor-pointer line-clamp-1"
            >
              {product.name}
            </h3>
          </div>
          <p className="text-xs text-muted-gray line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Pricing & Add Button Footer */}
      <div className="p-4 pt-0 flex items-center justify-between border-t border-dashed border-border-warm mt-2">
        <div>
          <span className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block">
            {hasCustomizations ? 'Starting from' : 'Price'}
          </span>
          <span className="text-base font-black text-primary-green">
            {formatINR(startingPrice)}
          </span>
        </div>

        <button
          onClick={() => onCustomize(product)}
          className="inline-flex items-center gap-1.5 bg-warm-cream hover:bg-primary-green hover:text-white text-forest border border-primary-green/40 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-2xs hover:shadow transition-all transform active:scale-95 cursor-pointer"
        >
          {hasCustomizations ? (
            <>
              <SlidersHorizontal className="w-3 h-3" /> Customize
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" /> Add
            </>
          )}
        </button>
      </div>
    </div>
  );
}
