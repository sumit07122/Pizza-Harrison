'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, MapPin, Star, ShieldCheck, Flame } from 'lucide-react';
import { RESTAURANT_PHONE, getClickToCallUrl } from '@/lib/whatsapp';

export function Hero3D() {
  const [canRender3D, setCanRender3D] = useState(false);

  useEffect(() => {
    // Detect WebGL capability safely in browser
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        setCanRender3D(true);
      }
    } catch (e) {
      setCanRender3D(false);
    }
  }, []);

  return (
    <section className="relative overflow-hidden bg-forest text-warm-cream py-14 sm:py-20 lg:py-24 border-b border-primary-green/30">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-green/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-tomato/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Live Outlet Status Pill */}
            <div className="inline-flex items-center gap-2 bg-primary-green/40 border border-accent-green/40 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-ping" />
              <span className="w-2 h-2 rounded-full bg-accent-green -ml-4" />
              <span>Accepting Orders • Pali Khera & GLA University</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-serif leading-[1.15]">
              Artisan Pizzas, Hand-Tossed in{' '}
              <span className="text-yellow-400 underline decoration-tomato decoration-wavy underline-offset-8">
                Mathura
              </span>
            </h1>

            <p className="text-sm sm:text-base text-warm-cream/90 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Slow-fermented dough proofed for 24 hours, rich 100% pure vegetarian mozzarella, and farm-fresh Braj dairy ingredients. Delivered piping hot to your doorstep or campus hostel in 30 minutes.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <Link
                href="/menu"
                className="w-full sm:w-auto bg-tomato hover:bg-red-600 text-white font-black text-sm px-7 py-3.5 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Order Online Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/offers"
                className="w-full sm:w-auto bg-warm-cream/10 hover:bg-warm-cream/20 text-white border border-warm-cream/30 font-bold text-sm px-6 py-3.5 rounded-full backdrop-blur-xs transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Student Combos & Offers</span>
              </Link>
            </div>

            {/* Quality & Social Proof Badges */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-3 gap-3 text-left">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-green/60 flex items-center justify-center text-yellow-300">
                  <Star className="w-4 h-4 fill-yellow-300" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">4.8 / 5.0</div>
                  <div className="text-[10px] text-warm-cream/70">2,400+ Mathura Reviews</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-green/60 flex items-center justify-center text-accent-green">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">100% Pure Veg</div>
                  <div className="text-[10px] text-warm-cream/70">Pure Dairy Cheese</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-green/60 flex items-center justify-center text-tomato">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">30 Min Rush</div>
                  <div className="text-[10px] text-warm-cream/70">Hot Oven Delivery</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            
            {/* Floating Offer Callout Pill */}
            <div className="absolute -top-3 -left-3 sm:-left-6 z-20 bg-white text-forest px-4 py-2.5 rounded-2xl shadow-xl border border-border-warm flex items-center gap-2.5 animate-bounce">
              <span className="text-xl">🏷️</span>
              <div>
                <div className="text-[10px] uppercase font-bold text-tomato tracking-wider">Campus Deal</div>
                <div className="text-xs font-extrabold text-charcoal">Use Code: <strong>GLA100</strong></div>
              </div>
            </div>

            {/* Hero Main Pizza Container with Interactive Hover & Ambient Glow */}
            <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full p-2 bg-gradient-to-tr from-tomato/40 via-yellow-500/30 to-accent-green/40 shadow-2xl flex items-center justify-center">
              
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-warm-cream/40 shadow-inner group">
                <Image
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=85"
                  alt="Pizza Harrison Hand-tossed Signature Pizza"
                  fill
                  priority
                  className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  sizes="(max-width: 640px) 280px, 400px"
                />
              </div>

              {/* Orbiting Ingredient Badges */}
              <div className="absolute -bottom-2 -right-2 bg-[#FFFDF9] text-charcoal px-3.5 py-2 rounded-xl shadow-lg border border-border-warm flex items-center gap-2">
                <span className="text-lg">🌿</span>
                <span className="text-xs font-bold">Stone Oven Baked</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
