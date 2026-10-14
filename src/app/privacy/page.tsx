'use client';

import React from 'react';
import { Navbar } from '@/components/storefront/Navbar';
import { Footer } from '@/components/storefront/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-warm-cream">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <h1 className="text-3xl font-black text-forest font-serif">Privacy Policy</h1>
        <p className="text-xs text-muted-gray">Last Updated: October 2026</p>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-border-warm shadow-xs space-y-4 text-xs sm:text-sm text-charcoal/90 leading-relaxed">
          <h2 className="text-base font-bold text-forest">1. Information We Collect</h2>
          <p>
            When you place an order or book a table with Pizza Harrison in Mathura, we collect your name, contact phone number, delivery address, and optional email address exclusively for the fulfillment of your food order and reservation confirmation.
          </p>

          <h2 className="text-base font-bold text-forest">2. How We Use Your Data</h2>
          <p>
            Your information is used strictly to dispatch delivery riders, generate immutable purchase receipts, update kitchen order status, and enable optional customer WhatsApp communication. We do not sell or lease customer contact lists to third-party telemarketers.
          </p>

          <h2 className="text-base font-bold text-forest">3. Payment Security</h2>
          <p>
            Pizza Harrison does not store raw credit card numbers or UPI PINs on its servers. Direct Cash on Delivery and verified UPI payments are handled with bank-level encryption.
          </p>

          <h2 className="text-base font-bold text-forest">4. Contacting Us</h2>
          <p>
            For privacy inquiries, please contact our restaurant management at <strong>hello@pizzaharrison.com</strong> or phone <strong>+91 7451800502</strong>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
