'use client';

import React, { useState } from 'react';
import { Phone, MapPin, Clock, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/storefront/Navbar';
import { Footer } from '@/components/storefront/Footer';
import { INITIAL_BRANCHES } from '@/lib/data/mock-data';
import { RESTAURANT_PHONE, getClickToCallUrl, RESTAURANT_WHATSAPP } from '@/lib/whatsapp';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setName('');
      setPhone('');
      setSubject('');
      setMessage('');
      setSent(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-warm-cream">
      <Navbar />

      <main className="flex-1 pb-20">
        
        {/* Header */}
        <div className="bg-forest text-warm-cream py-10 sm:py-14 border-b border-primary-green/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider block mb-2">
              We're Here in Mathura
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white font-serif">
              Contact & Outlets
            </h1>
            <p className="text-xs sm:text-sm text-warm-cream/80 mt-2 max-w-xl">
              Reach our kitchen hotlines, visit our dining sections in Pali Khera and GLA University, or send us a message.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Outlets Cards */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-xl font-black text-forest font-serif">
                Our Restaurant Locations
              </h2>

              <div className="space-y-6">
                {INITIAL_BRANCHES.map((branch) => (
                  <div
                    key={branch.id}
                    className="bg-white rounded-3xl p-6 border border-border-warm shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-block bg-primary-green/10 text-primary-green text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full mb-1">
                          {branch.id === 'pali_khera' ? 'Main Family Dining' : 'GLA Campus Outlet'}
                        </span>
                        <h3 className="text-lg font-black text-forest font-serif">{branch.name}</h3>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        Open Daily
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-charcoal">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-tomato shrink-0 mt-0.5" />
                        <span>{branch.address}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-accent-green shrink-0" />
                        <span>Service Timings: <strong>{branch.opens_at} to {branch.closes_at}</strong></span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-forest shrink-0" />
                        <span>Hotline: <strong className="text-primary-green">+91 {RESTAURANT_PHONE}</strong></span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border-warm flex items-center gap-3">
                      <a
                        href={getClickToCallUrl()}
                        className="bg-forest hover:bg-primary-green text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                      >
                        Call Hotline
                      </a>
                      <a
                        href={`https://wa.me/${RESTAURANT_WHATSAPP}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                      >
                        WhatsApp
                      </a>
                      <a
                        href={branch.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-forest underline hover:text-primary-green"
                      >
                        Google Maps Directions →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inquiry Form */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-warm shadow-md space-y-4">
                <h3 className="text-lg font-black text-forest font-serif">
                  Send us a Message
                </h3>
                <p className="text-xs text-muted-gray">
                  Have an event catering inquiry, feedback, or party question? Drop us a note.
                </p>

                {sent ? (
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h4 className="text-sm font-bold text-emerald-900">Message Received!</h4>
                    <p className="text-xs text-emerald-700">
                      Thank you for contacting Pizza Harrison. We will respond promptly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-charcoal block mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ankit Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xs p-3 border border-border-warm rounded-xl focus:outline-hidden focus:border-primary-green"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-charcoal block mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-xs p-3 border border-border-warm rounded-xl focus:outline-hidden focus:border-primary-green"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-charcoal block mb-1">Subject</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Birthday Party Catering at GLA"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full text-xs p-3 border border-border-warm rounded-xl focus:outline-hidden focus:border-primary-green"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-charcoal block mb-1">Message</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="How can we assist you?"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full text-xs p-3 border border-border-warm rounded-xl focus:outline-hidden focus:border-primary-green"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary-green hover:bg-forest text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
