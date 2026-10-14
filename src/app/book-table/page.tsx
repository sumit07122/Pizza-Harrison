'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Utensils,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/storefront/Navbar';
import { Footer } from '@/components/storefront/Footer';
import { Booking } from '@/lib/types';
import { generateWhatsAppBookingUrl, getClickToCallUrl, RESTAURANT_PHONE } from '@/lib/whatsapp';

export default function BookTablePage() {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [branch, setBranch] = useState<'pali_khera' | 'gla_university'>('pali_khera');
  const [guestCount, setGuestCount] = useState(4);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('19:30');
  const [seatingPreference, setSeatingPreference] = useState('Indoor AC Family Section');
  const [specialRequests, setSpecialRequests] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tomorrow as default min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_phone: cleanPhone,
          customer_email: customerEmail.trim() || undefined,
          branch,
          guest_count: Number(guestCount),
          booking_date: bookingDate || minDateStr,
          booking_time: bookingTime,
          seating_preference: seatingPreference,
          special_requests: specialRequests.trim() || undefined,
        }),
      });

      const data = await res.json();
      setSubmitting(false);

      if (data.success && data.booking) {
        setConfirmedBooking(data.booking);
      } else {
        setErrorMsg(data.error || 'Failed to submit reservation request.');
      }
    } catch (e: any) {
      setSubmitting(false);
      setErrorMsg('Network error submitting reservation. Please retry or call directly.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-warm-cream">
      <Navbar />

      <main className="flex-1 pb-20">
        
        {/* Header */}
        <div className="bg-forest text-warm-cream py-10 sm:py-14 border-b border-primary-green/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-yellow-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Calendar className="w-4 h-4" />
              <span>Dine-In Reservations</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white font-serif">
              Book a Table at Pizza Harrison
            </h1>
            <p className="text-xs sm:text-sm text-warm-cream/80 mt-2 max-w-xl">
              Reserve your party at our Pali Khera family restaurant or GLA Campus branch. Enjoy hot stone-baked pizzas straight from our kitchen ovens.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          
          {confirmedBooking ? (
            /* Confirmation Success Card */
            <div className="bg-white rounded-3xl p-8 border border-border-warm shadow-xl text-center space-y-6 max-w-xl mx-auto animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Status: Pending Staff Confirmation
                </span>
                <h2 className="text-2xl font-black text-forest font-serif pt-2">
                  Table Request Received!
                </h2>
                <p className="text-xs text-muted-gray">
                  Booking Reference: <strong className="font-mono text-forest">{confirmedBooking.booking_reference}</strong>
                </p>
              </div>

              <div className="bg-warm-cream rounded-2xl p-4 text-xs space-y-2 border border-border-warm text-left">
                <div className="flex justify-between">
                  <span className="text-muted-gray">Guest:</span>
                  <span className="font-bold text-charcoal">{confirmedBooking.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-gray">Party Size:</span>
                  <span className="font-bold text-charcoal">{confirmedBooking.guest_count} Persons</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-gray">Date & Time:</span>
                  <span className="font-bold text-charcoal">
                    {confirmedBooking.booking_date} at {confirmedBooking.booking_time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-gray">Branch:</span>
                  <span className="font-bold text-charcoal capitalize">
                    {confirmedBooking.branch === 'gla_university' ? 'GLA Campus Branch' : 'Pali Khera (Main Outlet)'}
                  </span>
                </div>
                {confirmedBooking.special_requests && (
                  <div className="pt-2 border-t border-border-warm text-[11px] text-amber-800">
                    Note: "{confirmedBooking.special_requests}"
                  </div>
                )}
              </div>

              <p className="text-[11px] text-muted-gray leading-relaxed">
                Our restaurant manager will review table capacity and call you shortly. You may also follow up instantly on WhatsApp with one click.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={generateWhatsAppBookingUrl(confirmedBooking)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Reservation Confirmation</span>
                </a>

                <Link
                  href="/menu"
                  className="w-full sm:w-auto bg-warm-cream hover:bg-neutral-100 text-forest border border-border-warm text-xs font-bold px-6 py-3 rounded-xl transition"
                >
                  Browse Menu In Advance →
                </Link>
              </div>
            </div>
          ) : (
            /* Booking Submission Form */
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-border-warm shadow-md">
              
              <div className="border-b border-border-warm pb-6 mb-6">
                <h2 className="text-xl font-black text-forest font-serif">
                  Reservation Details
                </h2>
                <p className="text-xs text-muted-gray mt-1">
                  Please book at least 2 hours in advance. Table requests are verified by our staff.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-6 p-3 bg-red-50 text-tomato text-xs rounded-xl flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Branch Selector */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-forest block mb-2">
                    1. Select Branch Location
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label
                      onClick={() => setBranch('pali_khera')}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                        branch === 'pali_khera'
                          ? 'border-primary-green bg-emerald-50 text-forest font-bold shadow-xs'
                          : 'border-border-warm bg-white hover:border-neutral-300'
                      }`}
                    >
                      <MapPin className="w-5 h-5 text-tomato shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-black">Pali Khera (Main Outlet)</div>
                        <div className="text-[11px] text-muted-gray font-normal mt-0.5">
                          Sonkh Road, Opp. Indian Oil Petrol Pump. Spacious AC Family Lounge.
                        </div>
                      </div>
                    </label>

                    <label
                      onClick={() => setBranch('gla_university')}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                        branch === 'gla_university'
                          ? 'border-primary-green bg-emerald-50 text-forest font-bold shadow-xs'
                          : 'border-border-warm bg-white hover:border-neutral-300'
                      }`}
                    >
                      <MapPin className="w-5 h-5 text-primary-green shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-black">GLA University Campus</div>
                        <div className="text-[11px] text-muted-gray font-normal mt-0.5">
                          Near Gate No. 1, NH-19 Chaumuhan. Student study booths & celebrations.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 2. Contact Details */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-forest block mb-2">
                    2. Guest Information
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-charcoal block mb-1">
                        Full Name <span className="text-tomato">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Priyanshu Bansal"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full text-xs p-3 border border-border-warm rounded-xl focus:outline-hidden focus:border-primary-green"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-charcoal block mb-1">
                        10-Digit Mobile Number <span className="text-tomato">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="9876543210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full text-xs p-3 border border-border-warm rounded-xl focus:outline-hidden focus:border-primary-green"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-charcoal block mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="priyanshu@gmail.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full text-xs p-3 border border-border-warm rounded-xl focus:outline-hidden focus:border-primary-green"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Date, Time & Guests */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-forest block mb-2">
                    3. Date, Time & Group Size
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-charcoal block mb-1">
                        Reservation Date <span className="text-tomato">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={minDateStr}
                        value={bookingDate || minDateStr}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full text-xs p-3 border border-border-warm rounded-xl bg-white focus:outline-hidden focus:border-primary-green"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-charcoal block mb-1">
                        Time Slot <span className="text-tomato">*</span>
                      </label>
                      <select
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full text-xs p-3 border border-border-warm rounded-xl bg-white font-bold text-forest focus:outline-hidden"
                      >
                        <optgroup label="Lunch Slots">
                          <option value="12:00">12:00 PM</option>
                          <option value="12:30">12:30 PM</option>
                          <option value="13:00">01:00 PM</option>
                          <option value="13:30">01:30 PM</option>
                          <option value="14:00">02:00 PM</option>
                        </optgroup>
                        <optgroup label="Dinner Slots">
                          <option value="18:30">06:30 PM</option>
                          <option value="19:00">07:00 PM</option>
                          <option value="19:30">07:30 PM</option>
                          <option value="20:00">08:00 PM</option>
                          <option value="20:30">08:30 PM</option>
                          <option value="21:00">09:00 PM</option>
                          <option value="21:30">09:30 PM</option>
                          <option value="22:00">10:00 PM</option>
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-charcoal block mb-1">
                        Number of Guests <span className="text-tomato">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        required
                        value={guestCount}
                        onChange={(e) => setGuestCount(Number(e.target.value))}
                        className="w-full text-xs p-3 border border-border-warm rounded-xl font-bold text-forest focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Seating & Requests */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-charcoal block mb-1">
                      Seating Preference
                    </label>
                    <select
                      value={seatingPreference}
                      onChange={(e) => setSeatingPreference(e.target.value)}
                      className="w-full text-xs p-3 border border-border-warm rounded-xl bg-white focus:outline-hidden"
                    >
                      <option value="Indoor AC Family Section">Indoor AC Family Section</option>
                      <option value="Cozy Corner Table">Cozy Corner Table</option>
                      <option value="Group Celebration Long Table">Group Celebration Long Table</option>
                      <option value="Outdoor / Balcony Seating">Outdoor / Balcony Seating</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-charcoal block mb-1">
                      Occasion / Special Request
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Birthday celebration, Farewell, High chair needed"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className="w-full text-xs p-3 border border-border-warm rounded-xl focus:outline-hidden focus:border-primary-green"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-border-warm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-[11px] text-muted-gray text-center sm:text-left">
                    Prefer direct booking by phone? Call{' '}
                    <a href={getClickToCallUrl()} className="font-bold text-forest underline">
                      +91 {RESTAURANT_PHONE}
                    </a>
                  </p>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto bg-primary-green hover:bg-forest text-white py-3.5 px-8 rounded-xl font-black text-xs sm:text-sm shadow-md transition transform active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Submitting Reservation...' : 'Request Table Reservation'}
                  </button>
                </div>

              </form>

            </div>
          )}

        </div>

      </main>

      <Footer />
    </div>
  );
}
