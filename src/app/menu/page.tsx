'use client';

import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Filter, SlidersHorizontal, ChefHat } from 'lucide-react';
import { Navbar } from '@/components/storefront/Navbar';
import { Footer } from '@/components/storefront/Footer';
import { ProductCard } from '@/components/storefront/ProductCard';
import { PizzaCustomizerModal } from '@/components/storefront/PizzaCustomizerModal';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '@/lib/data/mock-data';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/store/cart-context';
import { formatINR } from '@/lib/pricing';

export default function MenuPage() {
  const { openCartDrawer, itemCount, totalPaise } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [bestsellersOnly, setBestsellersOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filter products reactively
  const filteredProducts = useMemo(() => {
    return INITIAL_PRODUCTS.filter((prod) => {
      // Category filter
      if (selectedCategory !== 'all' && prod.category_id !== selectedCategory) {
        return false;
      }
      // Veg filter
      if (vegOnly && !prod.is_veg) {
        return false;
      }
      // Bestseller filter
      if (bestsellersOnly && !prod.is_bestseller) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = prod.name.toLowerCase().includes(q);
        const matchDesc = prod.description.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [selectedCategory, searchQuery, vegOnly, bestsellersOnly]);

  return (
    <div className="min-h-screen flex flex-col bg-warm-cream">
      <Navbar />

      <main className="flex-1 pb-20">
        
        {/* Page Hero Header */}
        <div className="bg-forest text-warm-cream py-10 sm:py-14 border-b border-primary-green/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-yellow-400 font-bold text-xs uppercase tracking-wider mb-2">
              <ChefHat className="w-4 h-4" />
              <span>Artisan Pizzeria Menu</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white font-serif">
              Our Handcrafted Menu
            </h1>
            <p className="text-xs sm:text-sm text-warm-cream/80 mt-2 max-w-xl">
              Stone-baked pizzas with 100% vegetarian cheese, stuffed garlic breads, burgers, pastas, and rich shakes. Made fresh per order in Mathura.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="sticky top-[72px] sm:top-20 z-30 bg-[#FFFDF9] border-b border-border-warm shadow-xs py-3 sm:py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
            
            {/* Search Input & Quick Toggles */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-muted-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search pizzas, burgers, shakes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-border-warm rounded-full pl-10 pr-4 py-2 text-xs font-medium focus:outline-hidden focus:border-primary-green shadow-2xs"
                />
              </div>

              {/* Dietary Toggles */}
              <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
                <button
                  type="button"
                  onClick={() => setVegOnly(!vegOnly)}
                  className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 font-bold transition cursor-pointer ${
                    vegOnly
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white text-charcoal border-border-warm hover:border-neutral-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300" />
                  <span>100% Veg Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBestsellersOnly(!bestsellersOnly)}
                  className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 font-bold transition cursor-pointer ${
                    bestsellersOnly
                      ? 'bg-yellow-500 text-charcoal border-yellow-500 shadow-2xs'
                      : 'bg-white text-charcoal border-border-warm hover:border-neutral-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                  <span>Bestsellers</span>
                </button>
              </div>

            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-forest text-white shadow-xs'
                    : 'bg-white text-charcoal hover:bg-neutral-100 border border-border-warm'
                }`}
              >
                All Menu ({INITIAL_PRODUCTS.length})
              </button>

              {INITIAL_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
                      isSelected
                        ? 'bg-forest text-white shadow-xs'
                        : 'bg-white text-charcoal hover:bg-neutral-100 border border-border-warm'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Product Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs font-semibold text-muted-gray">
              Showing <strong className="text-forest">{filteredProducts.length}</strong> delicious items
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-border-warm p-8">
              <div className="text-4xl">🔍</div>
              <h3 className="text-base font-bold text-forest">No menu items match your search</h3>
              <p className="text-xs text-muted-gray max-w-sm mx-auto">
                Try searching for "paneer", "margherita", "garlic bread", or clear your active filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setVegOnly(false);
                  setBestsellersOnly(false);
                }}
                className="bg-primary-green text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-forest transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onCustomize={(prod) => setSelectedProduct(prod)}
                />
              ))}
            </div>
          )}

        </div>

      </main>

      <Footer />

      {/* Floating Bottom Cart Bar for Mobile */}
      {itemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
          <button
            onClick={openCartDrawer}
            className="w-full bg-forest text-white py-3.5 px-5 rounded-2xl shadow-2xl flex items-center justify-between font-bold text-xs border border-primary-green"
          >
            <div className="flex items-center gap-2">
              <span className="bg-tomato px-2 py-0.5 rounded-full font-black text-[11px]">
                {itemCount}
              </span>
              <span>View Cart Order</span>
            </div>
            <span className="font-extrabold text-yellow-300">
              {formatINR(totalPaise)} →
            </span>
          </button>
        </div>
      )}

      {/* Customizer Modal */}
      {selectedProduct && (
        <PizzaCustomizerModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
