'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Heart, Sparkles, Flame } from 'lucide-react';

export function StorySection() {
  const pillars = [
    {
      icon: Sparkles,
      title: '24-Hour Fermented Dough',
      desc: 'Never frozen. Hand-kneaded fresh daily using unbleached wheat flour and fermented for 24 hours for exceptional lightness and crunch.',
    },
    {
      icon: ShieldCheck,
      title: '100% Pure Dairy Mozzarella',
      desc: 'Free from animal rennet and artificial oils. We partner with local Braj dairy producers for pure milk cheese that pulls flawlessly.',
    },
    {
      icon: Heart,
      title: 'San Marzano Style Sauce',
      desc: 'Sun-ripened tomatoes crushed with extra virgin olive oil, sweet basil, and mountain oregano. Zero added preservatives.',
    },
    {
      icon: Flame,
      title: 'Stone Oven Blistered at 350°C',
      desc: 'Baked on heated ceramic stone tiles to seal in the moisture while creating the signature leopard-spotted Italian crust.',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-forest text-warm-cream relative overflow-hidden border-b border-primary-green/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text & Pillars */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary-green/40 border border-accent-green/40 px-3 py-1 rounded-full text-xs font-semibold">
              <span>Handcrafted with Devotion in Mathura</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-serif leading-tight">
              True Italian Passion, Rooted in the Heart of Braj
            </h2>

            <p className="text-sm sm:text-base text-warm-cream/90 leading-relaxed font-normal">
              Pizza Harrison began with a simple mission: bring genuine, uncompromising pizzeria standards to Mathura without the synthetic cheeses and frozen doughs of mass-market chains. Today, we proudly serve families at Pali Khera and students across the GLA University campus.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {pillars.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-primary-green/20 border border-primary-green/40 space-y-1.5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-green/60 flex items-center justify-center text-yellow-300 mb-2">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-white">{item.title}</h3>
                    <p className="text-xs text-warm-cream/80 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-bold text-sm group"
              >
                <span>Read our full story and kitchen standards</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Image Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative h-96 sm:h-[480px] w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-primary-green/40">
              <Image
                src="https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=800&q=80"
                alt="Pizza Harrison dough preparation"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 500px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white">
                <div className="text-xs uppercase font-bold tracking-widest text-yellow-400">Our Hygiene Guarantee</div>
                <div className="text-sm font-semibold mt-0.5">Open kitchen, 100% pure veg prep, and sanitized temperature-controlled delivery.</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
