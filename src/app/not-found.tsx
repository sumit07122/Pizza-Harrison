'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, Utensils } from 'lucide-react';
import { Navbar } from '@/components/storefront/Navbar';
import { Footer } from '@/components/storefront/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-warm-cream">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-border-warm shadow-xl text-center max-w-md w-full space-y-5 my-12">
          <div className="w-20 h-20 bg-warm-cream rounded-full mx-auto flex items-center justify-center text-5xl border border-border-warm">
            🍕
          </div>
          <div className="space-y-1">
            <span className="text-tomato font-mono font-black text-xs uppercase tracking-widest">
              404 Page Not Found
            </span>
            <h1 className="text-2xl font-black text-forest font-serif">
              Lost in the Pizzeria?
            </h1>
            <p className="text-xs text-muted-gray leading-relaxed">
              The page you are looking for doesn't exist or has moved. Let's get you back to the fresh pizzas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto bg-primary-green hover:bg-forest text-white text-xs font-bold px-6 py-3 rounded-full flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Home className="w-4 h-4" />
              <span>Back Home</span>
            </Link>

            <Link
              href="/menu"
              className="w-full sm:w-auto bg-warm-cream hover:bg-neutral-100 text-forest border border-border-warm text-xs font-bold px-6 py-3 rounded-full flex items-center justify-center gap-1.5 transition"
            >
              <Utensils className="w-4 h-4" />
              <span>Explore Menu</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
