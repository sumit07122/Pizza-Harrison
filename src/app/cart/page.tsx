'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Tag,
  Bike,
  Store,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Navbar } from '@/components/storefront/Navbar';
import { Footer } from '@/components/storefront/Footer';
import { useCart } from '@/lib/store/cart-context';
import { formatINR } from '@/lib/pricing';

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    orderType,
    setOrderType,
    branch,
    setBranch,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponError,
    subtotalPaise,
    discountPaise,
    deliveryFeePaise,
    packagingFeePaise,
    taxPaise,
    totalPaise,
    itemCount,
  } = useCart();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState<string | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setIsApplying(true);
    setCouponSuccessMsg(null);

    const res = await applyCoupon(couponCodeInput);
    setIsApplying(false);

    if (res.success) {
      setCouponSuccessMsg(res.message);
      setCouponCodeInput('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-warm-cream">
      <Navbar />

      <main className="flex-1 pb-20">
        
        {/* Header */}
        <div className="bg-forest text-warm-cream py-8 border-b border-primary-green/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl sm:text-4xl font-black text-white font-serif">
              Shopping Cart & Order Summary
            </h1>
            <p className="text-xs text-warm-cream/80 mt-1">
              Review your pizza selections, apply student coupons, and select delivery or takeaway.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {items.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-border-warm p-8 max-w-lg mx-auto">
              <div className="text-5xl">🍕</div>
              <h2 className="text-xl font-bold text-forest">Your cart is currently empty</h2>
              <p className="text-xs text-muted-gray">
                You haven't added any delicious pizzas, sides, or thick shakes yet.
              </p>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 bg-primary-green text-white text-xs font-bold px-6 py-3 rounded-full hover:bg-forest transition shadow-md"
              >
                <span>Browse Full Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Cart Items List & Fulfillment Toggle */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Fulfillment Method Selector */}
                <div className="bg-white rounded-2xl p-5 border border-border-warm shadow-xs space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-forest">
                    1. Choose Fulfillment Method
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setOrderType('delivery')}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer ${
                        orderType === 'delivery'
                          ? 'border-primary-green bg-emerald-50 text-forest shadow-xs'
                          : 'border-border-warm bg-white text-charcoal hover:bg-neutral-50'
                      }`}
                    >
                      <Bike className="w-4 h-4 text-primary-green" />
                      <span>🛵 Home / Hostel Delivery</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderType('pickup')}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer ${
                        orderType === 'pickup'
                          ? 'border-primary-green bg-emerald-50 text-forest shadow-xs'
                          : 'border-border-warm bg-white text-charcoal hover:bg-neutral-50'
                      }`}
                    >
                      <Store className="w-4 h-4 text-primary-green" />
                      <span>🛍️ Counter Takeaway Pickup</span>
                    </button>
                  </div>

                  {/* Branch selector */}
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-gray font-medium">Preparing Kitchen Outlet:</span>
                    <select
                      aria-label="Dedicated Cart Page Outlet Selector"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value as any)}
                      className="bg-warm-cream border border-border-warm rounded-lg px-3 py-1.5 font-bold text-forest text-xs outline-hidden"
                    >
                      <option value="pali_khera">Pali Khera (Main Outlet - Sonkh Road)</option>
                      <option value="gla_university">GLA University Campus (Gate 1)</option>
                    </select>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-forest">
                    2. Configured Items ({itemCount})
                  </h3>

                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-4 border border-border-warm shadow-xs hover:border-primary-green/40 transition flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="veg-badge">
                            <span className="veg-dot" />
                          </span>
                          <h4 className="font-bold text-sm text-charcoal">{item.product.name}</h4>
                        </div>

                        <div className="text-xs text-muted-gray space-y-0.5">
                          {item.selectedVariant && (
                            <div>Size: <strong className="text-forest">{item.selectedVariant.size_name}</strong></div>
                          )}
                          {item.selectedCrust && item.selectedCrust.name !== 'New Hand Tossed' && (
                            <div>Crust: <strong className="text-forest">{item.selectedCrust.name}</strong> (+{formatINR(item.selectedCrust.price_paise)})</div>
                          )}
                          {item.selectedAddons.length > 0 && (
                            <div>Extras: {item.selectedAddons.map((a) => a.name).join(', ')}</div>
                          )}
                          {item.specialInstructions && (
                            <div className="italic text-amber-700">Note: {item.specialInstructions}</div>
                          )}
                        </div>

                        <div className="text-xs font-extrabold text-primary-green pt-1">
                          {formatINR(item.unitPricePaise)} each
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end justify-between self-stretch">
                        <span className="font-black text-sm text-forest">
                          {formatINR(item.totalPricePaise)}
                        </span>

                        {/* Stepper */}
                        <div className="flex items-center gap-2 bg-warm-cream border border-border-warm rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-charcoal transition cursor-pointer"
                          >
                            {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-tomato" /> : <Minus className="w-3.5 h-3.5" />}
                          </button>
                          <span className="text-xs font-bold text-charcoal w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-charcoal transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Right Column: Order Summary & Coupon Card */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Coupon Box */}
                <div className="bg-white rounded-2xl p-5 border border-border-warm shadow-xs space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-forest flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-tomato" />
                    <span>Apply Discount Coupon</span>
                  </h3>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
                      <div>
                        <div className="font-extrabold text-emerald-800">{appliedCoupon.code} Applied</div>
                        <div className="text-[11px] text-emerald-700">You saved {formatINR(discountPaise)}!</div>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-tomato font-bold hover:underline cursor-pointer text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon Code (e.g. GLA100)"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 border border-border-warm rounded-xl px-3 py-2 text-xs font-bold uppercase focus:outline-hidden focus:border-primary-green"
                      />
                      <button
                        type="submit"
                        disabled={isApplying || !couponCodeInput.trim()}
                        className="bg-forest hover:bg-primary-green text-white text-xs font-bold px-4 py-2 rounded-xl transition disabled:opacity-50 cursor-pointer"
                      >
                        {isApplying ? '...' : 'Apply'}
                      </button>
                    </form>
                  )}

                  {couponError && (
                    <p className="text-xs text-tomato flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {couponError}
                    </p>
                  )}
                  {couponSuccessMsg && (
                    <p className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {couponSuccessMsg}
                    </p>
                  )}
                </div>

                {/* Final Bill Breakdown */}
                <div className="bg-white rounded-2xl p-5 border border-border-warm shadow-xs space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-forest">
                    Bill Breakdown
                  </h3>

                  <div className="space-y-2 text-xs text-charcoal">
                    <div className="flex justify-between">
                      <span>Items Subtotal</span>
                      <span className="font-bold">{formatINR(subtotalPaise)}</span>
                    </div>

                    {discountPaise > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Coupon Discount</span>
                        <span>-{formatINR(discountPaise)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Delivery Fee ({orderType === 'delivery' ? 'Mathura' : 'Pickup'})</span>
                      <span className="font-bold">
                        {deliveryFeePaise === 0 ? (
                          <span className="text-emerald-700 font-black">FREE</span>
                        ) : (
                          formatINR(deliveryFeePaise)
                        )}
                      </span>
                    </div>

                    {orderType === 'delivery' && (
                      <div className="flex justify-between text-muted-gray">
                        <span>Packaging Fee (Eco Box)</span>
                        <span>{formatINR(packagingFeePaise)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-muted-gray">
                      <span>Restaurant GST (5%)</span>
                      <span>{formatINR(taxPaise)}</span>
                    </div>

                    <div className="pt-3 border-t border-border-warm flex justify-between text-base font-black text-forest">
                      <span>Grand Total</span>
                      <span>{formatINR(totalPaise)}</span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="w-full bg-primary-green hover:bg-forest text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition transform active:scale-98 mt-4"
                  >
                    <span>Proceed to Delivery Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <p className="text-[10px] text-muted-gray text-center mt-2">
                    🔒 Prices are verified on our secure server. No hidden charges.
                  </p>
                </div>

              </div>

            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
