'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowRight, ShieldCheck, Phone } from 'lucide-react';
import { Navbar } from '@/components/storefront/Navbar';
import { Footer } from '@/components/storefront/Footer';

export default function OrderTrackingSearchPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setError('Please enter your order reference number.');
      return;
    }
    const cleanNum = orderNumber.trim().toUpperCase();
    const cleanPhone = phone.replace(/\D/g, '');
    let url = `/order-tracking/${encodeURIComponent(cleanNum)}`;
    if (cleanPhone) url += `?phone=${cleanPhone}`;
    router.push(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-warm-cream">
      <Navbar />

      <main className="flex-1 pb-20 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 border border-border-warm shadow-xl max-w-md w-full space-y-6 my-12">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-forest text-white rounded-full flex items-center justify-center text-2xl mx-auto shadow-md">
              🔍
            </div>
            <h1 className="text-2xl font-black text-forest font-serif">
              Track Your Pizza Order
            </h1>
            <p className="text-xs text-muted-gray">
              Enter your tracking reference provided during checkout (e.g. <strong>PH-20261014-XXXX</strong>).
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-tomato text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">
                Order Reference Number <span className="text-tomato">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="PH-20261014-8841"
                value={orderNumber}
                onChange={(e) => {
                  setOrderNumber(e.target.value.toUpperCase());
                  setError('');
                }}
                className="w-full text-xs font-mono font-bold uppercase p-3 border border-border-warm rounded-xl focus:outline-hidden focus:border-primary-green"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-charcoal block mb-1">
                Registered 10-Digit Mobile (Optional)
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs p-3 border border-border-warm rounded-xl focus:outline-hidden focus:border-primary-green"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary-green hover:bg-forest text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <span>Track Live Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-border-warm text-center space-y-2">
            <p className="text-[11px] text-muted-gray">
              Need assistance with an existing order?
            </p>
            <a
              href="tel:7451800502"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:text-primary-green"
            >
              <Phone className="w-3.5 h-3.5 text-primary-green" />
              <span>Call Kitchen: 7451800502</span>
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
