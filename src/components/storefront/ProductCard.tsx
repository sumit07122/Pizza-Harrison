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

  const isAvailable = product.is_available !== false;
  const isCombo = Boolean(product.combo_items && product.combo_items.length > 0);

  return (
    <div className={`group bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between ${
      isAvailable ? 'border-border-warm hover:border-primary-green/40' : 'border-neutral-200 opacity-80'
    }`}>
      <div>
        {/* Product Image */}
        <div
          onClick={() => isAvailable && onCustomize(product)}
          className={`relative h-44 sm:h-48 w-full bg-neutral-100 overflow-hidden ${
            isAvailable ? 'cursor-pointer' : 'cursor-not-allowed grayscale-[40%]'
          }`}
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className={`object-cover ${isAvailable ? 'group-hover:scale-105' : ''} transition-transform duration-500`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🍕</div>
          )}

          {/* Sold Out Overlay */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center z-20">
              <span className="bg-red-600 text-white font-black text-xs uppercase px-3 py-1.5 rounded-lg tracking-wider shadow-md">
                Sold Out
              </span>
            </div>
          )}

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10">
            <span className={product.is_veg ? 'veg-badge bg-white shadow-xs' : 'non-veg-badge bg-white shadow-xs'}>
              <span className={product.is_veg ? 'veg-dot' : 'non-veg-dot'} />
            </span>
            {isCombo && (
              <span className="bg-forest text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs">
                Combo Deal
              </span>
            )}
            {product.is_bestseller && (
              <span className="bg-yellow-400 text-charcoal text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Bestseller
              </span>
            )}
            {product.spice_level && (
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs flex items-center gap-0.5 ${
                product.spice_level === 'hot'
                  ? 'bg-tomato text-white'
                  : product.spice_level === 'medium'
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-700 text-white'
              }`}>
                {product.spice_level === 'hot' ? '🌶️ Hot' : product.spice_level === 'medium' ? '🌶️ Med' : '🌿 Mild'}
              </span>
            )}
          </div>

          {/* Savings Badge for Combos */}
          {isCombo && product.combo_savings_paise && (
            <div className="absolute bottom-2.5 right-2.5 z-10 bg-tomato text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
              Save {formatINR(product.combo_savings_paise)}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-1">
            <h3
              onClick={() => isAvailable && onCustomize(product)}
              className={`text-base font-black text-forest font-serif transition line-clamp-1 ${
                isAvailable ? 'hover:text-primary-green cursor-pointer' : 'cursor-not-allowed text-charcoal/70'
              }`}
            >
              {product.name}
            </h3>
          </div>
          
          <p className="text-xs text-muted-gray line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Combo items preview */}
          {isCombo && product.combo_items && product.combo_items.length > 0 && (
            <div className="pt-1 flex flex-wrap gap-1">
              {product.combo_items.slice(0, 3).map((item, i) => (
                <span
                  key={i}
                  className="bg-[#FAF7F0] border border-border-warm text-[10px] text-charcoal/80 font-medium px-2 py-0.5 rounded-md"
                >
                  ✓ {item}
                </span>
              ))}
              {product.combo_items.length > 3 && (
                <span className="text-[10px] text-muted-gray font-bold self-center">
                  +{product.combo_items.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Allergens warning if verified */}
          {product.allergens && product.allergens.length > 0 && (
            <div className="text-[10px] text-muted-gray font-medium">
              <span className="font-bold text-charcoal/70">Allergens:</span> {product.allergens.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Pricing & Add Button Footer */}
      <div className="p-4 pt-0 flex items-center justify-between border-t border-dashed border-border-warm mt-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black text-primary-green">
              {formatINR(startingPrice)}
            </span>
            {isCombo && product.original_price_paise && (
              <span className="text-xs text-muted-gray line-through font-semibold">
                {formatINR(product.original_price_paise)}
              </span>
            )}
          </div>
          <span className="text-[10px] uppercase font-bold text-muted-gray tracking-wider block">
            {hasCustomizations ? 'Starting from' : isCombo ? 'Combo price' : 'Price'}
          </span>
        </div>

        {isAvailable ? (
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
        ) : (
          <span className="inline-flex items-center text-xs font-bold text-neutral-400 bg-neutral-100 px-3 py-1.5 rounded-xl cursor-not-allowed">
            Sold Out
          </span>
        )}
      </div>
    </div>
  );
}
