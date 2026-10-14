'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Hero3D() {
  return (
    <section className="relative bg-[#123F30] text-[#FAF7F0] overflow-hidden border-b border-[#1E5240]">
      {/* Subtle, restrained ambient warmth in background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 mix-blend-soft-light"
        style={{
          backgroundImage:
            'radial-gradient(circle at 80% 20%, rgba(232, 73, 61, 0.15), transparent 50%), radial-gradient(circle at 20% 80%, rgba(46, 157, 99, 0.15), transparent 50%)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-22 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Brand Storytelling & Clear CTAs */}
          <div className="lg:col-span-6 space-y-6 lg:space-y-7 text-left">
            
            {/* Understated Eyebrow */}
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-[#A8BEB2] uppercase">
              PIZZA HARRISON · MATHURA
            </p>

            {/* Editorial Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-bold text-[#FAF7F0] leading-[1.12] tracking-tight">
              Good pizza.<br />
              <span className="text-[#F2E8D5]">Made for sharing.</span>
            </h1>

            {/* Believable Description */}
            <p className="text-base sm:text-lg text-[#E3DED4] leading-relaxed max-w-xl font-normal">
              Thoughtfully made pizzas, satisfying combos and fresh favourites — ready for your next meal in Mathura.
            </p>

            {/* Actions: Primary and Quieter Secondary */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg bg-[#E8493D] hover:bg-[#D63E32] active:bg-[#C2352A] text-white font-medium text-base transition-colors duration-200 shadow-sm cursor-pointer"
              >
                Order Now
              </Link>
              
              <Link
                href="/menu"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg border border-[#FAF7F0]/30 hover:border-[#FAF7F0] text-[#FAF7F0] hover:bg-[#FAF7F0]/10 active:bg-[#FAF7F0]/15 font-medium text-base transition-colors duration-200 cursor-pointer"
              >
                Explore the Menu
              </Link>
            </div>

            {/* Honest, Real Service Note */}
            <div className="pt-2 flex items-center gap-2 text-xs sm:text-sm text-[#9BB3A5]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#7DA28C]" aria-hidden="true" />
              <span>Pali Khera & GLA University · Fresh in Mathura</span>
            </div>

          </div>

          {/* Right Column: Editorial Food Photography Centerpiece */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] lg:aspect-[5/4] xl:aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0D2F23]">
              <Image
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=85"
                alt="Freshly baked artisan pizza at Pizza Harrison Mathura"
                fill
                priority
                className="object-cover object-center transition-transform duration-700 ease-out hover:scale-103"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 560px"
              />

              {/* Single Restrained Supporting Detail */}
              <div className="absolute bottom-4 right-4 bg-[#123F30]/85 backdrop-blur-sm border border-white/15 px-3.5 py-1.5 rounded-md text-xs font-medium text-[#FAF7F0]/90 shadow-sm pointer-events-none">
                Stone-baked daily in Mathura
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
