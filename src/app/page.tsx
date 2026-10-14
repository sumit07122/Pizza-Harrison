'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ChefHat } from 'lucide-react';
import { Navbar } from '@/components/storefront/Navbar';
import { Hero3D } from '@/components/storefront/Hero3D';
import { BestsellersCarousel } from '@/components/storefront/BestsellersCarousel';
import { PizzaManiaSection } from '@/components/storefront/PizzaManiaSection';
import { StorySection } from '@/components/storefront/StorySection';
import { LocationsSection } from '@/components/storefront/LocationsSection';
import { CustomerReviews } from '@/components/storefront/CustomerReviews';
import { Footer } from '@/components/storefront/Footer';
import { PizzaCustomizerModal } from '@/components/storefront/PizzaCustomizerModal';
import { ProductCard } from '@/components/storefront/ProductCard';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_REVIEWS } from '@/lib/data/mock-data';
import { Product } from '@/lib/types';

export default function HomePage() {
  const [activeCategorySlug, setActiveCategorySlug] = useState('signature-pizzas');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  const activeCategory = INITIAL_CATEGORIES.find((c) => c.slug === activeCategorySlug) || INITIAL_CATEGORIES[0];
  const categoryProducts = INITIAL_PRODUCTS.filter((p) => p.category_id === activeCategory.id);
  const comboProducts = INITIAL_PRODUCTS.filter((p) => p.category_id === 'cat-3');

  return (
    <div className="min-h-screen flex flex-col bg-warm-cream">
      <Navbar />

      <main className="flex-1">
        {/* 1. Cinematic Hero with 3D Visual & Brand Badges */}
        <Hero3D />

        {/* 2. Category Quick Discovery Ribbon */}
        <div className="bg-[#FFFDF9] py-6 border-b border-border-warm shadow-2xs sticky top-20 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs sm:text-sm font-bold">
              {INITIAL_CATEGORIES.map((cat) => {
                const isSelected = cat.slug === activeCategorySlug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategorySlug(cat.slug)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-forest text-white shadow-xs'
                        : 'bg-warm-cream text-charcoal hover:bg-[#F2EAE0] border border-border-warm'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
              <Link
                href="/menu"
                className="px-4 py-2 rounded-full whitespace-nowrap bg-primary-green/10 text-primary-green hover:bg-primary-green hover:text-white border border-primary-green/30 transition flex items-center gap-1.5 ml-2"
              >
                <span>View Full Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Bestsellers Showcase */}
        <BestsellersCarousel
          products={INITIAL_PRODUCTS}
          onCustomize={(prod) => setSelectedProductForModal(prod)}
        />

        {/* 4. Pizza Mania & Student Combos */}
        <PizzaManiaSection
          comboProducts={comboProducts}
          onCustomize={(prod) => setSelectedProductForModal(prod)}
        />

        {/* 5. Food Menu Interactive Preview */}
        <section className="py-14 sm:py-20 bg-white border-b border-border-warm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-1.5 text-primary-green font-bold text-xs uppercase tracking-wider mb-1">
                  <ChefHat className="w-4 h-4" />
                  <span>Fresh From Our Stone Ovens</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-forest font-serif">
                  {activeCategory.name}
                </h2>
                {activeCategory.description && (
                  <p className="text-xs sm:text-sm text-muted-gray mt-1">
                    {activeCategory.description}
                  </p>
                )}
              </div>

              <Link
                href="/menu"
                className="inline-flex items-center gap-1 text-sm font-bold text-primary-green hover:text-forest transition"
              >
                <span>See All {categoryProducts.length} Items</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onCustomize={(prod) => setSelectedProductForModal(prod)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 6. Story & Handcrafted Standards */}
        <StorySection />

        {/* 7. Outlets & Direct Contacts in Mathura */}
        <LocationsSection />

        {/* 8. Genuine Customer Reviews */}
        <CustomerReviews initialReviews={INITIAL_REVIEWS} />
      </main>

      <Footer />

      {/* Global Product Customizer Modal */}
      {selectedProductForModal && (
        <PizzaCustomizerModal
          product={selectedProductForModal}
          onClose={() => setSelectedProductForModal(null)}
        />
      )}
    </div>
  );
}
