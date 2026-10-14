'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Tag,
  CheckCircle2,
  AlertCircle,
  Bike,
  Store,
} from 'lucide-react';
import { useCart } from '@/lib/store/cart-context';
import { formatINR } from '@/lib/pricing';

export function CartDrawer() {
  const {
    items,
    isCartDrawerOpen,
    closeCartDrawer,
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

  if (!isCartDrawerOpen) return null;

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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed Backdrop */}
      <div
        onClick={closeCartDrawer}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FFFDF9] shadow-2xl flex flex-col border-l border-border-warm animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border-warm flex items-center justify-between bg-warm-cream">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-black text-forest font-serif">Your Order</h2>
                <p className="text-xs text-muted-gray">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
                </p>
              </div>
            </div>
            <button
              onClick={closeCartDrawer}
              className="p-2 rounded-full hover:bg-black/5 text-charcoal transition cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Fulfillment Toggle */}
          <div className="px-4 py-3 bg-[#F7F0E5] border-b border-border-warm">
            <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-lg border border-border-warm text-xs font-bold">
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  orderType === 'delivery'
                    ? 'bg-primary-green text-white shadow-xs'
                    : 'text-charcoal hover:bg-neutral-50'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Delivery (Mathura)</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                className={`py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  orderType === 'pickup'
                    ? 'bg-primary-green text-white shadow-xs'
                    : 'text-charcoal hover:bg-neutral-50'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Takeaway Pickup</span>
              </button>
            </div>

            {/* Branch Outlet */}
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-muted-gray font-medium">Preparing at:</span>
              <select
                aria-label="Cart Outlet Selector"
                value={branch}
                onChange={(e) => setBranch(e.target.value as any)}
                className="bg-white border border-border-warm rounded px-2 py-1 font-semibold text-forest text-xs outline-hidden"
              >
                <option value="pali_khera">Pali Khera (Main Outlet)</option>
                <option value="gla_university">GLA Campus (Gate 1)</option>
              </select>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-20 h-20 bg-warm-cream rounded-full mx-auto flex items-center justify-center text-4xl border border-border-warm shadow-xs">
                  🍕
                </div>
                <div>
                  <h3 className="text-base font-bold text-forest">Your cart is feeling empty</h3>
                  <p className="text-xs text-muted-gray mt-1 max-w-xs mx-auto">
                    Explore our oven-hot signature pizzas, stuffed garlic breads, and thick shakes.
                  </p>
                </div>
                <Link
                  href="/menu"
                  onClick={closeCartDrawer}
                  className="inline-flex items-center gap-2 bg-primary-green text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-forest transition"
                >
                  Explore Delicious Menu <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-3 border border-border-warm shadow-xs hover:border-primary-green/40 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="veg-badge">
                          <span className="veg-dot" />
                        </span>
                        <h4 className="font-bold text-sm text-charcoal">{item.product.name}</h4>
                      </div>

                      {/* Customization Details */}
                      <div className="text-[11px] text-muted-gray mt-1 space-y-0.5">
                        {item.selectedVariant && (
                          <div>Size: <strong className="text-forest">{item.selectedVariant.size_name}</strong></div>
                        )}
                        {item.selectedCrust && item.selectedCrust.name !== 'New Hand Tossed' && (
                          <div>Crust: <strong className="text-forest">{item.selectedCrust.name}</strong> (+{formatINR(item.selectedCrust.price_paise)})</div>
                        )}
                        {item.selectedAddons.length > 0 && (
                          <div>
                            Extras: {item.selectedAddons.map((a) => a.name).join(', ')}
                          </div>
                        )}
                        {item.specialInstructions && (
                          <div className="italic text-amber-700">Note: {item.specialInstructions}</div>
                        )}
                      </div>

                      <div className="text-xs font-bold text-primary-green mt-1.5">
                        {formatINR(item.unitPricePaise)} each
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-sm text-forest">
                        {formatINR(item.totalPricePaise)}
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 bg-warm-cream border border-border-warm rounded-lg p-1 mt-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-charcoal transition cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-tomato" /> : <Minus className="w-3 h-3" />}
                        </button>
                        <span className="text-xs font-bold text-charcoal w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-charcoal transition cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Bill Breakdown (only shown when cart has items) */}
          {items.length > 0 && (
            <div className="border-t border-border-warm bg-white p-4 space-y-3">
              
              {/* Coupon Box */}
              <div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{appliedCoupon.code} applied (-{formatINR(discountPaise)})</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-tomato font-bold hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Promo Code (e.g. GLA100)"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 border border-border-warm rounded-lg px-3 py-2 text-xs font-medium uppercase outline-hidden focus:border-primary-green"
                    />
                    <button
                      type="submit"
                      disabled={isApplying || !couponCodeInput.trim()}
                      className="bg-forest text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary-green transition disabled:opacity-50 cursor-pointer"
                    >
                      {isApplying ? 'Checking...' : 'Apply'}
                    </button>
                  </form>
                )}

                {couponError && (
                  <p className="text-xs text-tomato mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {couponError}
                  </p>
                )}
                {couponSuccessMsg && (
                  <p className="text-xs text-emerald-700 mt-1.5 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> {couponSuccessMsg}
                  </p>
                )}
              </div>

              {/* Bill Details */}
              <div className="bg-[#FAF5EC] rounded-lg p-3 text-xs space-y-1.5 border border-border-warm">
                <div className="flex justify-between text-charcoal">
                  <span>Item Subtotal</span>
                  <span className="font-semibold">{formatINR(subtotalPaise)}</span>
                </div>
                {discountPaise > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Promo Discount</span>
                    <span>-{formatINR(discountPaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-charcoal">
                  <span>Delivery Fee ({orderType === 'delivery' ? 'Mathura City' : 'Pickup'})</span>
                  <span className="font-semibold">
                    {deliveryFeePaise === 0 ? (
                      <span className="text-emerald-700 font-bold uppercase">FREE</span>
                    ) : (
                      formatINR(deliveryFeePaise)
                    )}
                  </span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-muted-gray">
                    <span>Eco Pizza Box Packaging</span>
                    <span>{formatINR(packagingFeePaise)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-gray">
                  <span>Restaurant GST (5%)</span>
                  <span>{formatINR(taxPaise)}</span>
                </div>
                <div className="pt-2 border-t border-border-warm flex justify-between text-sm font-extrabold text-forest">
                  <span>Total Amount</span>
                  <span>{formatINR(totalPaise)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                href="/checkout"
                onClick={closeCartDrawer}
                className="w-full bg-primary-green hover:bg-forest text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition transform active:scale-98"
              >
                Proceed to Checkout ({formatINR(totalPaise)}) <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
