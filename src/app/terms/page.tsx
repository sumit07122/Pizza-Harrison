'use client';

import React from 'react';
import { Navbar } from '@/components/storefront/Navbar';
import { Footer } from '@/components/storefront/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-warm-cream">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <h1 className="text-3xl font-black text-forest font-serif">Terms of Service</h1>
        <p className="text-xs text-muted-gray">Last Updated: October 2026</p>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-border-warm shadow-xs space-y-4 text-xs sm:text-sm text-charcoal/90 leading-relaxed">
          <h2 className="text-base font-bold text-forest">1. Ordering & Acceptance</h2>
          <p>
            Submission of an order through pizzaharrison.com creates an active kitchen request. Official order confirmation occurs when our kitchen accepts the order into the preparation queue. Sharing an order on WhatsApp is a communication convenience and does not substitute for database registration.
          </p>

          <h2 className="text-base font-bold text-forest">2. Pricing & Taxes</h2>
          <p>
            All prices are denominated in Indian Rupees (INR) and calculated exact to the paise on our secure servers. Standard Restaurant Goods & Services Tax (GST 5%) is computed on taxable subtotals.
          </p>

          <h2 className="text-base font-bold text-forest">3. Table Reservations</h2>
          <p>
            Online reservation requests submitted via our website are subject to restaurant staff approval based on real-time table availability at our Pali Khera and GLA University branches.
          </p>

          <h2 className="text-base font-bold text-forest">4. Delivery Standards</h2>
          <p>
            We target 30-minute delivery to Mathura localities and GLA campus gates under normal operating conditions. Peak rush, severe monsoon downpours, or highway traffic may alter delivery estimates.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
