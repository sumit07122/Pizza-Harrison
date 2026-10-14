'use client';

import React from 'react';
import { Navbar } from '@/components/storefront/Navbar';
import { Footer } from '@/components/storefront/Footer';
import { CustomerReviews } from '@/components/storefront/CustomerReviews';
import { INITIAL_REVIEWS } from '@/lib/data/mock-data';

export default function ReviewsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-warm-cream">
      <Navbar />

      <main className="flex-1 pb-20">
        <div className="bg-forest text-warm-cream py-10 sm:py-14 border-b border-primary-green/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider block mb-2">
              Mathura Foodies Speak
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white font-serif">
              Customer Reviews & Ratings
            </h1>
            <p className="text-xs sm:text-sm text-warm-cream/80 mt-2 max-w-xl">
              100% verified experiences from hostellers, families, and highway travelers who love Pizza Harrison.
            </p>
          </div>
        </div>

        <CustomerReviews initialReviews={INITIAL_REVIEWS} />
      </main>

      <Footer />
    </div>
  );
}
