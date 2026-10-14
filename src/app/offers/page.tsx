'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tag, CheckCircle2, Sparkles, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/storefront/Navbar';
import { Footer } from '@/components/storefront/Footer';
import { INITIAL_COUPONS } from '@/lib/data/mock-data';
import { useCart } from '@/lib/store/cart-context';
import { formatINR } from '@/lib/pricing';

export default function OffersPage() {
  const { applyCoupon, openCartDrawer } = useCart();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyAndApply = async (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    await applyCoupon(code);
    setTimeout(() => {
      setCopiedCode(null);
      openCartDrawer();
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-warm-cream">
      <Navbar />

      <main className="flex-1 pb-20">
        
        {/* Hero Banner */}
        <div className="bg-forest text-warm-cream py-12 sm:py-16 border-b border-primary-green/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-yellow-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Campus Specials & Festive Promos</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white font-serif">
              Deals, Offers & Promo Codes
            </h1>
            <p className="text-xs sm:text-sm text-warm-cream/80 mt-2 max-w-xl">
              Exclusive discount promo codes for GLA University students, Pali Khera residents, and late-night hostellers across Mathura.
            </p>
          </div>
        </div>

        {/* Coupons List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <h2 className="text-xl sm:text-2xl font-black text-forest font-serif mb-6 flex items-center gap-2">
            <Tag className="w-5 h-5 text-tomato" />
            <span>Active Discount Coupons</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {INITIAL_COUPONS.map((coupon) => {
              const isCopied = copiedCode === coupon.code;
              return (
                <div
                  key={coupon.id}
                  className="bg-white rounded-2xl p-6 border-2 border-dashed border-border-warm shadow-xs hover:border-primary-green transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="inline-block bg-primary-green/10 text-primary-green text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg">
                        {coupon.discount_type === 'flat'
                          ? `Flat ${formatINR(coupon.discount_value)} OFF`
                          : `${coupon.discount_value}% OFF (Max ${formatINR(coupon.max_discount_paise || 0)})`}
                      </div>
                      <span className="text-[11px] text-muted-gray flex items-center gap-1">
                        <Clock className="w-3 h-3 text-accent-green" /> Valid till Dec 2026
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-charcoal">
                      {coupon.description}
                    </h3>

                    <div className="text-xs text-muted-gray space-y-1">
                      <div>• Minimum cart value: <strong>{formatINR(coupon.min_order_paise)}</strong></div>
                      {coupon.max_discount_paise && (
                        <div>• Maximum discount cap: <strong>{formatINR(coupon.max_discount_paise)}</strong></div>
                      )}
                      <div>• Valid for both Delivery & Takeaway pickup in Mathura</div>
                    </div>
                  </div>

                  {/* Copy & Apply Button */}
                  <div className="pt-5 mt-5 border-t border-border-warm flex items-center justify-between">
                    <div className="bg-[#FAF4EB] border border-border-warm px-3.5 py-1.5 rounded-xl font-mono font-black text-sm text-forest tracking-wider">
                      {coupon.code}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyAndApply(coupon.code)}
                      className={`text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-primary-green hover:bg-forest text-white'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Applied to Cart!</span>
                        </>
                      ) : (
                        <>
                          <span>Apply Code</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Student Combos Callout */}
          <div className="mt-12 bg-gradient-to-r from-forest to-primary-green text-warm-cream rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="bg-yellow-400 text-charcoal text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Hostel Binge Pack
              </span>
              <h3 className="text-2xl font-black text-white font-serif">
                GLA Late Night Study Combos from ₹119
              </h3>
              <p className="text-xs sm:text-sm text-warm-cream/90 max-w-lg">
                Personal pan pizzas, stuffed garlic breads, crinkle fries, and dips bundled at discounted prices for students. Delivered right to Gate 1.
              </p>
            </div>

            <Link
              href="/menu"
              className="bg-tomato hover:bg-red-600 text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-full shadow-lg transition whitespace-nowrap"
            >
              Order Student Combos →
            </Link>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
