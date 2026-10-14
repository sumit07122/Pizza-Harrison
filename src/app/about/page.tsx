'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Heart, Sparkles, Flame, MapPin, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/storefront/Navbar';
import { Footer } from '@/components/storefront/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-warm-cream">
      <Navbar />

      <main className="flex-1 pb-20">
        
        {/* Hero */}
        <div className="bg-forest text-warm-cream py-14 sm:py-20 border-b border-primary-green/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest block mb-2">
              Our Mathura Heritage
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white font-serif">
              Crafting Real Pizza in the City of Krishna
            </h1>
            <p className="text-sm sm:text-base text-warm-cream/80 mt-4 leading-relaxed font-normal">
              Pizza Harrison was born out of a desire to create a true pizzeria experience in Mathura—where pizza isn't treated as fast-food assembly line product, but as an artisanal craft built on slow fermentation, pure local dairy, and genuine Italian herbs.
            </p>
          </div>
        </div>

        {/* Narrative Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-tomato font-bold text-xs uppercase tracking-wider">The Philosophy</span>
              <h2 className="text-2xl sm:text-3xl font-black text-forest font-serif">
                No Artificial Cheese. No Frozen Dough.
              </h2>
              <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed">
                Many commercial pizza chains rely on analog or palm-oil processed cheeses and frozen dough discs that sit in warehouse trucks for weeks. At Pizza Harrison, we refuse shortcuts.
              </p>
              <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed">
                Every single morning at 6:00 AM, our pizzaiolos in Pali Khera knead high-protein unbleached flour, pure water, Himalayan rock salt, and live yeast. The dough balls undergo cold fermentation for 24 hours to break down complex starches, resulting in an airy crust that is extraordinarily light on the stomach and deliciously crisp.
              </p>
            </div>

            <div className="relative h-80 rounded-3xl overflow-hidden shadow-xl border border-border-warm">
              <Image
                src="https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=800&q=80"
                alt="Pizza dough kneading at Pizza Harrison"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
            <div className="relative h-80 rounded-3xl overflow-hidden shadow-xl border border-border-warm md:order-2">
              <Image
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80"
                alt="Fresh stone baked pizza in Mathura"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <div className="space-y-4 md:order-1">
              <span className="text-tomato font-bold text-xs uppercase tracking-wider">Local & Pure</span>
              <h2 className="text-2xl sm:text-3xl font-black text-forest font-serif">
                Braj Dairy Heritage Meets Italian Technique
              </h2>
              <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed">
                Mathura and the Braj region are historically renowned for exceptional dairy purity. We take pride in sourcing 100% vegetarian mozzarella cheese produced without animal enzymes or rennet, ensuring complete peace of mind for all our vegetarian and Jain patrons.
              </p>
              <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed">
                Paired with rich paneer, crunchy capsicum from regional farmers, and stone-oven baking at 350°C, every slice captures the soul of Italian baking adapted to Mathura's taste buds.
              </p>
            </div>
          </div>

          {/* Outlets CTA */}
          <div className="bg-forest text-warm-cream rounded-3xl p-8 sm:p-12 text-center space-y-4">
            <h3 className="text-2xl sm:text-3xl font-black text-white font-serif">
              Taste the Craft at Our Two Mathura Outlets
            </h3>
            <p className="text-xs sm:text-sm text-warm-cream/80 max-w-xl mx-auto">
              Visit our Pali Khera family dining restaurant on Sonkh Road, or grab late-night study slices near Gate 1 at GLA University.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/menu"
                className="bg-tomato hover:bg-red-600 text-white text-xs font-bold px-6 py-3 rounded-full transition shadow-md"
              >
                Order Online Now
              </Link>
              <Link
                href="/contact"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs font-bold px-6 py-3 rounded-full transition"
              >
                View Outlets & Directions
              </Link>
            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
