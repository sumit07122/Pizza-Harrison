'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  Search,
  CheckCircle2,
  AlertCircle,
  Gift,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  ArrowRight,
  Pizza,
} from 'lucide-react';
import { formatINR } from '@/lib/pricing';
import { Navbar } from '@/components/storefront/Navbar';
import { Footer } from '@/components/storefront/Footer';

interface PublicLoyaltyConfig {
  is_active: boolean;
  min_order_paise: number;
  stamps_required: number;
  reward_pizza_name: string;
  terms: string;
}

interface SanitizedLoyaltyAccount {
  customer_name: string;
  stamps_count: number;
  total_stamps_earned: number;
  available_rewards_count: number;
  rewards_redeemed_count: number;
}

interface SanitizedLedgerEntry {
  id: string;
  event_type: string;
  stamps_delta: number;
  order_number_masked?: string;
  order_subtotal_paise?: number;
  reason: string;
  created_at: string;
}

export default function RewardsPage() {
  const [config, setConfig] = useState<PublicLoyaltyConfig>({
    is_active: true,
    min_order_paise: 29900,
    stamps_required: 6,
    reward_pizza_name: 'Regular Margherita or Farmhouse Pizza',
    terms: '1 stamp per qualifying order of ₹299+ (food subtotal). 6 stamps unlock 1 free pizza.',
  });

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [account, setAccount] = useState<SanitizedLoyaltyAccount | null>(null);
  const [ledger, setLedger] = useState<SanitizedLedgerEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Load public rules on mount
  useEffect(() => {
    fetch('/api/loyalty/check')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setConfig(data.config);
        }
      })
      .catch((err) => console.warn('Could not load loyalty config', err));
  }, []);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setAccount(null);
    setLedger([]);

    try {
      const res = await fetch(`/api/loyalty/check?phone=${clean}`);
      const data = await res.json();
      setLoading(false);
      setSearched(true);

      if (data.success) {
        if (data.config) setConfig(data.config);
        if (data.found && data.account) {
          setAccount(data.account);
          setLedger(data.ledger || []);
        } else {
          setAccount(null);
        }
      } else {
        setErrorMsg(data.error || 'Failed to check loyalty balance.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('Network error. Please try again in a moment.');
    }
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const minSpendRupees = Math.round((config.min_order_paise || 29900) / 100);
  const stampsRequired = config.stamps_required || 6;
  const stampsRemaining = account ? Math.max(0, stampsRequired - account.stamps_count) : stampsRequired;

  return (
    <div className="min-h-screen bg-[#F6F4F0] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
          
          {/* Hero Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-forest text-xs font-bold border border-emerald-200 shadow-2xs">
              <Sparkles className="w-4 h-4 text-primary-green" />
              <span>Pizza Harrison Customer Rewards</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-forest font-serif tracking-tight">
              Simple Pizza Stamps. Free Pizzas.
            </h1>

            <p className="text-sm sm:text-base text-muted-gray max-w-xl mx-auto leading-relaxed">
              Order your favorite hand-tossed pizzas in Mathura, collect 6 stamps, and enjoy a delicious free pizza on us. No hidden points or complicated conversions.
            </p>

            {!config.is_active && (
              <div className="inline-block p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold max-w-md mx-auto">
                <AlertCircle className="w-4 h-4 inline-block mr-1.5" />
                The rewards program is currently undergoing seasonal maintenance. Check back shortly!
              </div>
            )}
          </div>

          {/* 4-Step How It Works Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-border-warm shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-forest font-black flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="font-black text-forest text-sm font-serif">Order ₹{minSpendRupees}+</h3>
              <p className="text-xs text-muted-gray leading-relaxed">
                Order online or at our Pali Khera store with a minimum food subtotal of ₹{minSpendRupees}.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-border-warm shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-forest font-black flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="font-black text-forest text-sm font-serif">Delivery Excluded</h3>
              <p className="text-xs text-muted-gray leading-relaxed">
                The ₹{minSpendRupees} threshold applies strictly to food items, excluding delivery and packing fees.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-border-warm shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-forest font-black flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="font-black text-forest text-sm font-serif">1 Order = 1 Stamp</h3>
              <p className="text-xs text-muted-gray leading-relaxed">
                Receive 1 stamp automatically once your order is safely delivered and completed.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-border-warm shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-black flex items-center justify-center text-sm">
                🎁
              </div>
              <h3 className="font-black text-forest text-sm font-serif">Free Pizza Reward</h3>
              <p className="text-xs text-muted-gray leading-relaxed">
                6 stamps unlock 1 free {config.reward_pizza_name || 'Regular Pizza'}.
              </p>
            </div>
          </div>

          {/* Interactive Check Balance Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-warm shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-warm pb-4">
              <div>
                <h2 className="text-xl font-black text-forest font-serif flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary-green" />
                  <span>Check Your Reward Stamps</span>
                </h2>
                <p className="text-xs text-muted-gray mt-1">
                  Enter the 10-digit mobile number used when ordering. No account password required.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/80 self-start sm:self-auto">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Privacy Guaranteed</span>
              </div>
            </div>

            {/* Phone Lookup Form */}
            <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-gray">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="Enter 10-digit mobile number..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-16 pr-4 py-3 bg-[#FAF7F0] border border-border-warm rounded-2xl text-sm font-bold text-charcoal focus:bg-white focus:outline-hidden focus:border-primary-green"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary-green hover:bg-forest text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Checking...</span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Check Progress</span>
                  </>
                )}
              </button>
            </form>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Results: Existing Account Found */}
            {searched && account && (
              <div className="p-6 rounded-3xl bg-[#FAF7F0] border border-border-warm space-y-6">
                
                {/* Greeting & Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-warm pb-4">
                  <div>
                    <span className="text-[11px] font-bold text-muted-gray uppercase tracking-wider">
                      Verified Member
                    </span>
                    <h3 className="text-xl font-black text-forest font-serif">
                      Welcome, {account.customer_name}! 🍕
                    </h3>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[11px] font-bold text-muted-gray uppercase tracking-wider">
                      Lifetime Stamps
                    </span>
                    <div className="text-lg font-black text-forest font-mono">
                      {account.total_stamps_earned} Earned
                    </div>
                  </div>
                </div>

                {/* Digital Stamp Card Visual */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-charcoal">Digital Stamp Card:</span>
                    <span className="text-primary-green font-black">
                      {account.stamps_count} of {stampsRequired} Stamps Collected
                    </span>
                  </div>

                  {/* Stamp Card Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {Array.from({ length: stampsRequired }).map((_, idx) => {
                      const isStamped = idx < account.stamps_count;
                      const isFinal = idx === stampsRequired - 1;
                      return (
                        <div
                          key={idx}
                          className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center transition-all ${
                            isStamped
                              ? 'bg-primary-green text-white shadow-xs border-2 border-emerald-700'
                              : 'bg-white text-muted-gray border-2 border-dashed border-border-warm'
                          }`}
                        >
                          {isStamped ? (
                            <>
                              <span className="text-2xl animate-in zoom-in-50">🍕</span>
                              <span className="text-[10px] font-black uppercase mt-1">
                                Stamp #{idx + 1}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-xl text-neutral-300">
                                {isFinal ? '🎁' : '○'}
                              </span>
                              <span className="text-[10px] font-bold text-neutral-400 mt-1">
                                {isFinal ? 'Free Pizza' : `Slot #${idx + 1}`}
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-xs text-muted-gray text-center pt-1 font-medium">
                    {stampsRemaining > 0 ? (
                      <span>
                        Collect <strong>{stampsRemaining} more qualifying order{stampsRemaining > 1 ? 's' : ''}</strong> (₹{minSpendRupees}+ each) to unlock your free pizza!
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold">
                        🎉 Stamp card complete! You have an unlocked free pizza reward waiting!
                      </span>
                    )}
                  </div>
                </div>

                {/* Available Rewards Voucher */}
                {account.available_rewards_count > 0 ? (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-forest text-white shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="w-6 h-6 text-yellow-300 animate-bounce" />
                        <div>
                          <h4 className="font-black text-base text-yellow-300 font-serif">
                            {account.available_rewards_count} Free Pizza Reward Unlocked!
                          </h4>
                          <p className="text-xs text-emerald-100">
                            Valid for 1 free {config.reward_pizza_name || 'Regular Pizza'}.
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
                        Ready to Claim
                      </span>
                    </div>

                    <div className="pt-2 border-t border-emerald-700/60 text-xs text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span>To redeem: Mention your mobile number when calling, or inform staff at the counter.</span>
                      <Link
                        href="/menu"
                        className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-forest font-black rounded-xl text-xs shadow-xs transition self-start sm:self-auto text-center"
                      >
                        Browse Menu &rarr;
                      </Link>
                    </div>
                  </div>
                ) : null}

                {/* Activity History Log */}
                {ledger.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black text-forest uppercase tracking-wider">
                      Recent Loyalty Activity
                    </h4>
                    <div className="space-y-2">
                      {ledger.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-3 bg-white rounded-2xl border border-border-warm flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-charcoal">{entry.reason}</div>
                            <div className="text-[10px] text-muted-gray flex items-center gap-2 mt-0.5">
                              <span>
                                {new Date(entry.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              {entry.order_number_masked && (
                                <span>· Order: {entry.order_number_masked}</span>
                              )}
                              {entry.order_subtotal_paise && (
                                <span>· Subtotal: {formatINR(entry.order_subtotal_paise)}</span>
                              )}
                            </div>
                          </div>

                          <span
                            className={`font-black text-xs px-2.5 py-1 rounded-full ${
                              entry.stamps_delta > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : entry.stamps_delta < 0
                                ? 'bg-red-100 text-red-800'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {entry.stamps_delta > 0
                              ? `+${entry.stamps_delta} Stamp`
                              : entry.stamps_delta < 0
                              ? `${entry.stamps_delta} Stamp`
                              : 'Redeemed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Results: No Account Yet */}
            {searched && !account && !errorMsg && (
              <div className="p-6 rounded-3xl bg-[#FAF7F0] border border-border-warm text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-primary-green flex items-center justify-center mx-auto text-xl">
                  🍕
                </div>
                <h3 className="font-black text-forest font-serif text-base">
                  No Stamps Recorded Yet
                </h3>
                <p className="text-xs text-muted-gray max-w-sm mx-auto leading-relaxed">
                  We haven't recorded any completed orders for this phone number yet. Order delicious pizzas with a food subtotal of ₹{minSpendRupees} or more to earn your very first stamp!
                </p>
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary-green hover:bg-forest text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs transition"
                >
                  <span>Order Now & Start Earning</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Transparent Explainer & Qualification FAQs */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-warm shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border-warm pb-3">
              <HelpCircle className="w-5 h-5 text-primary-green" />
              <h2 className="text-lg font-black text-forest font-serif">
                Rules & Eligibility FAQ
              </h2>
            </div>

            <div className="divide-y divide-border-warm text-xs">
              
              {/* Question 1 */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleFaq(1)}
                  className="w-full flex items-center justify-between text-left font-bold text-forest cursor-pointer"
                >
                  <span>What is the minimum spend required to earn a stamp?</span>
                  {openFaq === 1 ? <ChevronUp className="w-4 h-4 text-muted-gray" /> : <ChevronDown className="w-4 h-4 text-muted-gray" />}
                </button>
                {openFaq === 1 && (
                  <p className="mt-2 text-muted-gray leading-relaxed pr-6">
                    A minimum qualifying food subtotal of <strong>₹{minSpendRupees}</strong> is required per transaction. Delivery fees (₹40) and packaging charges (₹15) are strictly excluded from this threshold.
                  </p>
                )}
              </div>

              {/* Question 2 */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleFaq(2)}
                  className="w-full flex items-center justify-between text-left font-bold text-forest cursor-pointer"
                >
                  <span>Why didn't my recent order qualify for a stamp?</span>
                  {openFaq === 2 ? <ChevronUp className="w-4 h-4 text-muted-gray" /> : <ChevronDown className="w-4 h-4 text-muted-gray" />}
                </button>
                {openFaq === 2 && (
                  <div className="mt-2 text-muted-gray leading-relaxed space-y-1.5 pr-6">
                    <p>Common reasons an order may not qualify include:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Food subtotal was less than ₹{minSpendRupees} after deducting delivery and discounts.</li>
                      <li>The order was cancelled or refunded.</li>
                      <li>A promotional coupon code (e.g. GLA100) was applied. Loyalty stamps cannot be stacked with promotional coupons unless explicitly enabled by the store.</li>
                      <li>The order is still being prepared or out for delivery. Stamps are automatically credited once the order status is marked "Delivered / Completed".</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Question 3 */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleFaq(3)}
                  className="w-full flex items-center justify-between text-left font-bold text-forest cursor-pointer"
                >
                  <span>Which free pizza can I claim with 6 stamps?</span>
                  {openFaq === 3 ? <ChevronUp className="w-4 h-4 text-muted-gray" /> : <ChevronDown className="w-4 h-4 text-muted-gray" />}
                </button>
                {openFaq === 3 && (
                  <p className="mt-2 text-muted-gray leading-relaxed pr-6">
                    Once you collect 6 valid stamps, you unlock 1 free <strong>{config.reward_pizza_name || 'Regular Margherita or Farmhouse Pizza'}</strong>. Free reward items do not earn additional stamps.
                  </p>
                )}
              </div>

              {/* Question 4 */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => toggleFaq(4)}
                  className="w-full flex items-center justify-between text-left font-bold text-forest cursor-pointer"
                >
                  <span>How is my personal privacy protected?</span>
                  {openFaq === 4 ? <ChevronUp className="w-4 h-4 text-muted-gray" /> : <ChevronDown className="w-4 h-4 text-muted-gray" />}
                </button>
                {openFaq === 4 && (
                  <p className="mt-2 text-muted-gray leading-relaxed pr-6">
                    We strictly safeguard your privacy. When checking stamps by phone number, we only display your first name and stamp count. Order IDs are securely masked (e.g., <code>PH-20261014-****</code>), and your delivery address, payment details, or itemized cart contents are never exposed.
                  </p>
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
