'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Bike,
  Store,
  CreditCard,
  QrCode,
  Banknote,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Navbar } from '@/components/storefront/Navbar';
import { Footer } from '@/components/storefront/Footer';
import { useCart } from '@/lib/store/cart-context';
import { formatINR } from '@/lib/pricing';
import { PaymentMethod } from '@/lib/types';
import { RESTAURANT_PHONE } from '@/lib/whatsapp';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    orderType,
    setOrderType,
    branch,
    setBranch,
    appliedCoupon,
    subtotalPaise,
    discountPaise,
    deliveryFeePaise,
    packagingFeePaise,
    taxPaise,
    totalPaise,
    clearCart,
  } = useCart();

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLandmark, setDeliveryLandmark] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  // UPI UTR reference (only when paymentMethod is upi_qr)
  const [upiRef, setUpiRef] = useState('');

  // Field Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      errs.customerName = 'Please enter your full name.';
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      errs.customerPhone = 'Enter a valid 10-digit Indian phone number.';
    }

    if (orderType === 'delivery') {
      if (!deliveryAddress.trim() || deliveryAddress.trim().length < 8) {
        errs.deliveryAddress = 'Please enter complete house/flat no., street, or hostel room.';
      }
    }

    if (paymentMethod === 'upi_qr' && (!upiRef.trim() || upiRef.trim().length < 6)) {
      errs.upiRef = 'Please enter your 12-digit UPI Transaction ID / UTR reference after paying.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;
    if (items.length === 0) {
      setServerError('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const payload = {
      customer_name: customerName.trim(),
      customer_phone: customerPhone.replace(/\D/g, ''),
      customer_email: customerEmail.trim() || undefined,
      order_type: orderType,
      branch: branch,
      delivery_address: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
      delivery_landmark: orderType === 'delivery' ? deliveryLandmark.trim() : undefined,
      payment_method: paymentMethod,
      applied_coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
      notes: notes.trim()
        ? paymentMethod === 'upi_qr'
          ? `${notes.trim()} | UPI UTR: ${upiRef.trim()}`
          : notes.trim()
        : paymentMethod === 'upi_qr'
        ? `UPI UTR: ${upiRef.trim()}`
        : undefined,
      items: items.map((it) => ({
        product_id: it.product.id,
        variant_size_name: it.selectedVariant?.size_name,
        crust_name: it.selectedCrust?.name,
        addon_ids: it.selectedAddons.map((a) => a.id),
        quantity: it.quantity,
        special_instructions: it.specialInstructions,
      })),
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success && data.order) {
        clearCart();
        router.push(`/order-tracking/${data.order.order_number}?phone=${payload.customer_phone}`);
      } else {
        setServerError(data.error || 'Failed to place order. Please review your details.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setServerError('Network error contacting Pizza Harrison server. Please retry.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-warm-cream">
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto py-24 px-4 text-center space-y-4">
          <div className="text-5xl">🛍️</div>
          <h2 className="text-xl font-bold text-forest">Cannot proceed with empty cart</h2>
          <p className="text-xs text-muted-gray">
            Please add your favorite artisan pizzas before checking out.
          </p>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 bg-primary-green text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-forest transition"
          >
            Explore Menu <ArrowRight className="w-4 h-4" />
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-warm-cream">
      <Navbar />

      <main className="flex-1 pb-20">
        
        {/* Header */}
        <div className="bg-forest text-warm-cream py-8 border-b border-primary-green/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl sm:text-4xl font-black text-white font-serif">
              Finalize Your Order
            </h1>
            <p className="text-xs text-warm-cream/80 mt-1">
              Provide delivery address and payment choice. All prices are verified authoritatively by our server.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 text-tomato text-xs sm:text-sm rounded-2xl flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Contact & Address Details */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* 1. Customer Contact */}
              <div className="bg-white rounded-2xl p-6 border border-border-warm shadow-xs space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-forest">
                  1. Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-charcoal block mb-1">
                      Full Name <span className="text-tomato">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikas Upadhyay"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (errors.customerName) setErrors({ ...errors, customerName: '' });
                      }}
                      className={`w-full text-xs p-3 border rounded-xl bg-white focus:outline-hidden ${
                        errors.customerName ? 'border-tomato bg-red-50' : 'border-border-warm focus:border-primary-green'
                      }`}
                    />
                    {errors.customerName && (
                      <p className="text-[11px] text-tomato mt-1">{errors.customerName}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-charcoal block mb-1">
                      10-Digit Mobile Number <span className="text-tomato">*</span>
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-xs font-bold bg-[#FAF4EB] border border-r-0 border-border-warm rounded-l-xl text-charcoal">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9876543210"
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value);
                          if (errors.customerPhone) setErrors({ ...errors, customerPhone: '' });
                        }}
                        className={`w-full text-xs p-3 border rounded-r-xl bg-white focus:outline-hidden ${
                          errors.customerPhone ? 'border-tomato bg-red-50' : 'border-border-warm focus:border-primary-green'
                        }`}
                      />
                    </div>
                    {errors.customerPhone && (
                      <p className="text-[11px] text-tomato mt-1">{errors.customerPhone}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-charcoal block mb-1">
                      Email Address (Optional for e-bill)
                    </label>
                    <input
                      type="email"
                      placeholder="vikas@gla.ac.in"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full text-xs p-3 border border-border-warm rounded-xl bg-white focus:outline-hidden focus:border-primary-green"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Fulfillment & Address */}
              <div className="bg-white rounded-2xl p-6 border border-border-warm shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-forest">
                    2. Delivery / Pickup Details
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderType('delivery')}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                        orderType === 'delivery' ? 'bg-primary-green text-white' : 'bg-neutral-100 text-charcoal'
                      }`}
                    >
                      Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('pickup')}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                        orderType === 'pickup' ? 'bg-primary-green text-white' : 'bg-neutral-100 text-charcoal'
                      }`}
                    >
                      Pickup
                    </button>
                  </div>
                </div>

                {/* Outlet selection */}
                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1">
                    Kitchen Outlet in Mathura
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value as any)}
                    className="w-full text-xs p-3 border border-border-warm rounded-xl bg-white font-bold text-forest focus:outline-hidden"
                  >
                    <option value="pali_khera">Pali Khera (Main Outlet - Sonkh Road)</option>
                    <option value="gla_university">GLA Campus Branch (Near Gate No. 1)</option>
                  </select>
                </div>

                {orderType === 'delivery' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-charcoal block mb-1">
                        Delivery Address in Mathura / GLA Campus <span className="text-tomato">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="House/Flat No., Street, Society, or GLA Hostel Block & Room No."
                        value={deliveryAddress}
                        onChange={(e) => {
                          setDeliveryAddress(e.target.value);
                          if (errors.deliveryAddress) setErrors({ ...errors, deliveryAddress: '' });
                        }}
                        className={`w-full text-xs p-3 border rounded-xl bg-white focus:outline-hidden ${
                          errors.deliveryAddress ? 'border-tomato bg-red-50' : 'border-border-warm focus:border-primary-green'
                        }`}
                      />
                      {errors.deliveryAddress && (
                        <p className="text-[11px] text-tomato mt-1">{errors.deliveryAddress}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-charcoal block mb-1">
                        Notable Landmark (e.g. Near Gate 1, Krishna Mandir, Petrol Pump)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Opposite Boys Hostel 3 / Near Indian Oil Pump"
                        value={deliveryLandmark}
                        onChange={(e) => setDeliveryLandmark(e.target.value)}
                        className="w-full text-xs p-3 border border-border-warm rounded-xl bg-white focus:outline-hidden focus:border-primary-green"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-primary-green" />
                      Takeaway Pickup Selected
                    </div>
                    <p className="text-emerald-800">
                      Your order will be packed fresh at the counter of your chosen branch. Delivery charge is ₹0.
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1">
                    Kitchen / Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Please do not ring bell / Keep extra oregano sachets"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs p-3 border border-border-warm rounded-xl bg-white focus:outline-hidden focus:border-primary-green"
                  />
                </div>
              </div>

              {/* 3. Payment Method */}
              <div className="bg-white rounded-2xl p-6 border border-border-warm shadow-xs space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-forest">
                  3. Select Verified Payment Mode
                </h3>

                <div className="space-y-3">
                  
                  {/* Option 1: Cash on Delivery / Pay on Pickup */}
                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'cod'
                        ? 'border-primary-green bg-emerald-50/60'
                        : 'border-border-warm hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-1 text-primary-green"
                    />
                    <div>
                      <div className="font-bold text-xs text-charcoal flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-primary-green" />
                        <span>{orderType === 'delivery' ? 'Cash on Delivery (COD)' : 'Pay at Counter on Pickup'}</span>
                      </div>
                      <p className="text-[11px] text-muted-gray mt-0.5">
                        Pay with cash or scan our delivery rider's UPI QR upon receiving your hot pizza box.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Direct UPI QR Scan */}
                  <label
                    onClick={() => setPaymentMethod('upi_qr')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      paymentMethod === 'upi_qr'
                        ? 'border-primary-green bg-emerald-50/60'
                        : 'border-border-warm hover:border-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'upi_qr'}
                      onChange={() => setPaymentMethod('upi_qr')}
                      className="mt-1 text-primary-green"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-xs text-charcoal flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-primary-green" />
                        <span>Instant UPI QR Scan (PhonePe, Google Pay, Paytm)</span>
                      </div>
                      <p className="text-[11px] text-muted-gray mt-0.5">
                        Scan our official UPI QR code directly on screen and enter your 12-digit UTR reference.
                      </p>

                      {paymentMethod === 'upi_qr' && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-border-warm space-y-2">
                          <div className="text-[11px] text-forest font-bold">
                            Official Merchant UPI ID: <span className="font-mono bg-yellow-100 px-1 py-0.5 rounded">pizzaharrison@upi</span>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-charcoal block mb-1">
                              Enter 12-Digit UTR / Transaction Ref <span className="text-tomato">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 428819208311"
                              value={upiRef}
                              onChange={(e) => {
                                setUpiRef(e.target.value);
                                if (errors.upiRef) setErrors({ ...errors, upiRef: '' });
                              }}
                              className="w-full text-xs p-2 border border-border-warm rounded focus:outline-hidden"
                            />
                            {errors.upiRef && (
                              <p className="text-[11px] text-tomato mt-1">{errors.upiRef}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Option 3: Online Gateway (Status Clearly Indicated) */}
                  <div className="p-3.5 rounded-xl border border-dashed border-border-warm bg-neutral-50/70 text-xs space-y-1 opacity-80">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-muted-gray flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4" />
                        <span>Online Cards / NetBanking Gateway</span>
                      </div>
                      <span className="text-[10px] bg-neutral-200 text-charcoal px-2 py-0.5 rounded font-bold uppercase">
                        Integration Pending
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-gray">
                      Online payment gateway credentials are not yet configured. Please select <strong>Cash on Delivery</strong> or <strong>Direct UPI QR</strong> above.
                    </p>
                  </div>

                </div>
              </div>

            </div>

            {/* Right Column: Order Summary & Place Order Action */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white rounded-2xl p-6 border border-border-warm shadow-xs space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-forest">
                  Order Summary
                </h3>

                {/* Compact Items List */}
                <div className="max-h-48 overflow-y-auto space-y-2 border-b border-border-warm pb-3">
                  {items.map((it) => (
                    <div key={it.id} className="flex justify-between text-xs">
                      <div>
                        <span className="font-bold text-charcoal">{it.product.name}</span>
                        <span className="text-muted-gray ml-1">x{it.quantity}</span>
                        {it.selectedVariant && (
                          <div className="text-[10px] text-muted-gray">{it.selectedVariant.size_name}</div>
                        )}
                      </div>
                      <span className="font-bold text-forest">{formatINR(it.totalPricePaise)}</span>
                    </div>
                  ))}
                </div>

                {/* Final Bill Breakdown */}
                <div className="space-y-2 text-xs text-charcoal">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold">{formatINR(subtotalPaise)}</span>
                  </div>

                  {discountPaise > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Promo Discount ({appliedCoupon?.code})</span>
                      <span>-{formatINR(discountPaise)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Delivery Charge ({orderType === 'delivery' ? 'Mathura' : 'Pickup'})</span>
                    <span className="font-bold">
                      {deliveryFeePaise === 0 ? <span className="text-emerald-700">FREE</span> : formatINR(deliveryFeePaise)}
                    </span>
                  </div>

                  {orderType === 'delivery' && (
                    <div className="flex justify-between text-muted-gray">
                      <span>Eco Packaging</span>
                      <span>{formatINR(packagingFeePaise)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-gray">
                    <span>Restaurant GST (5%)</span>
                    <span>{formatINR(taxPaise)}</span>
                  </div>

                  <div className="pt-3 border-t border-border-warm flex justify-between text-base font-black text-forest">
                    <span>Total Payable</span>
                    <span>{formatINR(totalPaise)}</span>
                  </div>
                </div>

                {/* Place Order CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary-green hover:bg-forest text-white py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition transform active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verifying & Placing Order...' : `Confirm & Place Order (${formatINR(totalPaise)})`}</span>
                </button>

                <p className="text-[10px] text-center text-muted-gray leading-relaxed">
                  By clicking Place Order, your order is submitted to Pizza Harrison's kitchen. You will receive an official tracking reference and can track preparation in real time.
                </p>
              </div>

            </div>

          </form>

        </div>

      </main>

      <Footer />
    </div>
  );
}
