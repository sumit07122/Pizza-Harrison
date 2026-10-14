'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ArrowRight, Clock, Award } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatINR } from '@/lib/pricing';

interface PizzaManiaSectionProps {
  comboProducts: Product[];
  onCustomize: (product: Product) => void;
}

export function PizzaManiaSection({ comboProducts, onCustomize }: PizzaManiaSectionProps) {
  return (
    <section className="py-14 sm:py-20 bg-[#FFF9F0] border-b border-border-warm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-1.5 text-tomato font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Campus Specials & Value Combos</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-forest font-serif">
              Pizza Mania & Student Deals
            </h2>
            <p className="text-xs sm:text-sm text-muted-gray mt-1 max-w-xl">
              Curated for late night hostel binges, group study sessions, and family weekend lunches across Mathura.
            </p>
          </div>

          <Link
            href="/offers"
            className="inline-flex items-center gap-1 text-sm font-bold text-primary-green hover:text-forest transition"
          >
            <span>View All Deals & Coupons</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Featured Combos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {comboProducts.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-border-warm p-4 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-44 rounded-xl overflow-hidden mb-3 bg-neutral-100">
                  {item.image_url && (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  )}
                  <span className="absolute top-2 left-2 bg-tomato text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs">
                    Popular Value Deal
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mb-1">
                  <span className="veg-badge">
                    <span className="veg-dot" />
                  </span>
                  <h3 className="font-bold text-base text-charcoal">{item.name}</h3>
                </div>

                <p className="text-xs text-muted-gray leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border-warm">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-gray block">Deal Price</span>
                  <span className="text-lg font-black text-forest">
                    {formatINR(item.base_price_paise)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onCustomize(item)}
                  className="bg-primary-green hover:bg-forest text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs hover:shadow transition transform active:scale-95 cursor-pointer"
                >
                  Customize & Add
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
