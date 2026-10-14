'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';
import { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';

interface BestsellersCarouselProps {
  products: Product[];
  onCustomize: (product: Product) => void;
}

export function BestsellersCarousel({ products, onCustomize }: BestsellersCarouselProps) {
  const bestsellers = products.filter((p) => p.is_bestseller).slice(0, 4);

  return (
    <section className="py-14 sm:py-20 bg-white border-b border-border-warm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-1.5 text-tomato font-bold text-xs uppercase tracking-wider mb-1">
              <Flame className="w-4 h-4" />
              <span>Mathura’s Most Loved</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-forest font-serif">
              Signature Bestsellers
            </h2>
            <p className="text-xs sm:text-sm text-muted-gray mt-1">
              Hand-stretched crusts topped with 100% vegetarian cheese and signature Italian sauces.
            </p>
          </div>

          <Link
            href="/menu"
            className="inline-flex items-center gap-1 text-sm font-bold text-primary-green hover:text-forest transition"
          >
            <span>Explore Full 20+ Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestsellers.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onCustomize={onCustomize}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
