'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Clock, Utensils, MessageCircle, ExternalLink, Calendar } from 'lucide-react';
import { INITIAL_BRANCHES } from '@/lib/data/mock-data';
import { RESTAURANT_PHONE, getClickToCallUrl, RESTAURANT_WHATSAPP } from '@/lib/whatsapp';

export function LocationsSection() {
  return (
    <section className="py-14 sm:py-20 bg-[#FFFDF9] border-b border-border-warm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-tomato font-bold text-xs uppercase tracking-wider mb-2">
            <MapPin className="w-4 h-4" />
            <span>Serving Mathura & GLA University</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-forest font-serif">
            Visit Our Outlets in Mathura
          </h2>
          <p className="text-xs sm:text-sm text-muted-gray mt-2">
            Dine in our family section, pick up on your highway drive, or get it delivered to your doorstep in 30 minutes.
          </p>
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {INITIAL_BRANCHES.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-3xl border border-border-warm p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block bg-primary-green/10 text-primary-green text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full mb-1">
                      {branch.id === 'pali_khera' ? 'Main Family Outlet' : 'Campus Hub (Gate 1)'}
                    </span>
                    <h3 className="text-xl font-black text-forest font-serif">{branch.name}</h3>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Open Now
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-charcoal">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-tomato shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{branch.address}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-accent-green shrink-0" />
                    <span>Operating Hours: <strong>{branch.opens_at} to {branch.closes_at}</strong></span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Utensils className="w-4 h-4 text-primary-green shrink-0" />
                    <span>Dine-In • Takeaway Pickup • 30-Min Fast Delivery</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-forest shrink-0" />
                    <span>Hotline: <strong className="text-primary-green">+91 {RESTAURANT_PHONE}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-border-warm grid grid-cols-2 sm:grid-cols-3 gap-2 mt-6">
                <a
                  href={getClickToCallUrl()}
                  className="bg-forest hover:bg-primary-green text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Now
                </a>

                <a
                  href={`https://wa.me/${RESTAURANT_WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>

                <Link
                  href="/book-table"
                  className="col-span-2 sm:col-span-1 bg-warm-cream hover:bg-neutral-100 text-forest border border-border-warm text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Calendar className="w-3.5 h-3.5" /> Book Table
                </Link>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
