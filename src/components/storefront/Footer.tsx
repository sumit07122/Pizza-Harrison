'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, MapPin, Clock, MessageCircle, Heart, ShieldCheck } from 'lucide-react';
import { RESTAURANT_PHONE, getClickToCallUrl, RESTAURANT_WHATSAPP } from '@/lib/whatsapp';

export function Footer() {
  return (
    <footer className="bg-forest text-warm-cream border-t border-primary-green/40 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-primary-green/30">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-green flex items-center justify-center text-xl text-white shadow-md">
                🍕
              </div>
              <span className="text-2xl font-black font-serif text-white tracking-tight">
                Pizza Harrison
              </span>
            </div>
            <p className="text-xs text-warm-cream/80 leading-relaxed">
              Mathura’s premier artisanal pizzeria. Fresh 24-hr proofed dough, 100% pure vegetarian mozzarella, and farm fresh toppings baked in stone ovens.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href={getClickToCallUrl()}
                className="inline-flex items-center gap-1.5 bg-primary-green/50 hover:bg-primary-green text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-primary-green transition"
              >
                <Phone className="w-3.5 h-3.5" /> +91 {RESTAURANT_PHONE}
              </a>
              <a
                href={`https://wa.me/${RESTAURANT_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#25D366]/30 hover:bg-[#25D366] text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-[#25D366]/50 transition"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-yellow-400 font-serif">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs font-medium text-warm-cream/80">
              <li>
                <Link href="/menu" className="hover:text-yellow-300 transition">Complete Food Menu</Link>
              </li>
              <li>
                <Link href="/offers" className="hover:text-yellow-300 transition">GLA Student Deals & Coupons</Link>
              </li>
              <li>
                <Link href="/book-table" className="hover:text-yellow-300 transition">Reserve a Table (Pali Khera)</Link>
              </li>
              <li>
                <Link href="/order-tracking/search" className="hover:text-yellow-300 transition">Track Your Active Order</Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-yellow-300 transition">Customer Reviews Wall</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-yellow-300 transition">Our Story & Hygiene Guarantee</Link>
              </li>
            </ul>
          </div>

          {/* Outlets in Mathura */}
          <div className="space-y-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-yellow-400 font-serif">
              Mathura Outlets
            </h4>
            <div className="space-y-3 text-xs text-warm-cream/80">
              <div>
                <strong className="text-white block font-bold">1. Pali Khera (Main Outlet)</strong>
                <p className="text-[11px] text-warm-cream/70">
                  Sonkh Road, Opp. Indian Oil Petrol Pump, Pali Khera, Mathura, UP 281004
                </p>
                <span className="text-[10px] text-accent-green font-semibold">Open: 11:00 AM – 11:30 PM</span>
              </div>

              <div>
                <strong className="text-white block font-bold">2. GLA Campus Branch</strong>
                <p className="text-[11px] text-warm-cream/70">
                  Near Gate No. 1, GLA University, NH-19, Chaumuhan, Mathura, UP 281406
                </p>
                <span className="text-[10px] text-accent-green font-semibold">Open: 10:30 AM – 01:00 AM</span>
              </div>
            </div>
          </div>

          {/* Operational Standards */}
          <div className="space-y-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-yellow-400 font-serif">
              Our Promise
            </h4>
            <div className="space-y-2 text-xs text-warm-cream/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent-green shrink-0" />
                <span>100% Pure Vegetarian Mozzarella</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent-green shrink-0" />
                <span>30-Minute Rush Kitchen Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-tomato shrink-0" />
                <span>Prepared with Braj Hospitality</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/admin"
                className="text-[11px] text-warm-cream/60 hover:text-white underline"
              >
                Restaurant Administration & Kitchen KDS Portal →
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-warm-cream/70 gap-4">
          <div>
            © {new Date().getFullYear()} Pizza Harrison, Mathura. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <Link href="/contact" className="hover:text-white transition">Contact Us</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
