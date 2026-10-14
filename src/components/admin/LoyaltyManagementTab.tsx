'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Gift,
  Plus,
  Minus,
  History,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';
import { LoyaltyProgramConfig, LoyaltyAccount, LoyaltyLedgerEntry } from '@/lib/types';
import { formatINR } from '@/lib/pricing';
import { useAdmin } from '@/lib/store/admin-context';

export function LoyaltyManagementTab() {
  const { currentRole } = useAdmin();
  const [config, setConfig] = useState<LoyaltyProgramConfig | null>(null);
  const [ledger, setLedger] = useState<LoyaltyLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Phone Lookup State
  const [searchPhone, setSearchPhone] = useState('');
  const [searchedAccount, setSearchedAccount] = useState<LoyaltyAccount | null>(null);
  const [searchedLedger, setSearchedLedger] = useState<LoyaltyLedgerEntry[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Config Form State
  const [minSpendRupees, setMinSpendRupees] = useState('');
  const [stampsRequired, setStampsRequired] = useState('');
  const [rewardPizzaName, setRewardPizzaName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMsg, setConfigMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [stampsDelta, setStampsDelta] = useState('1');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustMsg, setAdjustMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Redeem Action
  const [redeemLoading, setRedeemLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/loyalty');
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setLedger(data.ledger || []);
        setIsActive(data.config.is_active);
        setMinSpendRupees(((data.config.min_order_paise || 29900) / 100).toString());
        setStampsRequired((data.config.stamps_required || 6).toString());
        setRewardPizzaName(data.config.reward_pizza_name || '');
      }
    } catch (e) {
      console.error('Error loading loyalty data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchPhone.replace(/\D/g, '');
    if (clean.length < 10) {
      setLookupError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setSearchedAccount(null);
    setSearchedLedger([]);

    try {
      const res = await fetch(`/api/admin/loyalty?phone=${clean}`);
      const data = await res.json();
      setLookupLoading(false);

      if (data.success && data.account) {
        setSearchedAccount(data.account);
        setSearchedLedger(data.ledger || []);
      } else {
        setLookupError('No existing loyalty account found for this mobile number yet.');
      }
    } catch (err: any) {
      setLookupLoading(false);
      setLookupError('Error querying customer loyalty records.');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    setConfigMsg(null);

    const minSpend = parseFloat(minSpendRupees);
    const stamps = parseInt(stampsRequired, 10);

    if (isNaN(minSpend) || minSpend < 99) {
      setConfigMsg({ type: 'error', text: 'Minimum spend must be at least ₹99.' });
      setConfigSaving(false);
      return;
    }
    if (isNaN(stamps) || stamps < 3 || stamps > 20) {
      setConfigMsg({ type: 'error', text: 'Stamps required must be between 3 and 20.' });
      setConfigSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/loyalty', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            is_active: isActive,
            min_order_paise: Math.round(minSpend * 100),
            stamps_required: stamps,
            reward_pizza_name: rewardPizzaName.trim() || 'Regular Margherita or Farmhouse',
          },
          updatedBy: currentRole === 'owner' ? 'Harrison Sharma (Owner)' : 'Manager',
        }),
      });

      const data = await res.json();
      setConfigSaving(false);

      if (data.success) {
        setConfigMsg({ type: 'success', text: 'Loyalty program settings saved successfully!' });
        setConfig(data.config);
      } else {
        setConfigMsg({ type: 'error', text: data.error || 'Failed to save settings.' });
      }
    } catch (err: any) {
      setConfigSaving(false);
      setConfigMsg({ type: 'error', text: 'Network error saving settings.' });
    }
  };

  const handleRedeemReward = async () => {
    if (!searchedAccount || searchedAccount.available_rewards_count <= 0) return;
    if (!confirm(`Confirm redemption of 1 Free Pizza for customer ${searchedAccount.customer_phone}?`)) return;

    setRedeemLoading(true);
    try {
      const res = await fetch('/api/admin/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'redeem_reward',
          customer_phone: searchedAccount.customer_phone,
          staff_name: currentRole === 'owner' ? 'Harrison Sharma (Owner)' : 'Staff Member',
        }),
      });

      const data = await res.json();
      setRedeemLoading(false);

      if (data.success) {
        alert(`Successfully redeemed free reward pizza: ${data.rewardPizzaName}!`);
        // Refresh searched account
        const refRes = await fetch(`/api/admin/loyalty?phone=${searchedAccount.customer_phone}`);
        const refData = await refRes.json();
        if (refData.success) {
          setSearchedAccount(refData.account);
          setSearchedLedger(refData.ledger);
        }
        loadData();
      } else {
        alert(data.error || 'Failed to redeem reward.');
      }
    } catch (e) {
      setRedeemLoading(false);
      alert('Error redeeming reward.');
    }
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchedAccount) return;
    const delta = parseInt(stampsDelta, 10);
    if (isNaN(delta) || delta === 0) {
      setAdjustMsg({ type: 'error', text: 'Please enter a non-zero adjustment (+1, +2, -1).' });
      return;
    }
    if (!adjustReason.trim() || adjustReason.trim().length < 5) {
      setAdjustMsg({ type: 'error', text: 'A mandatory reason (min 5 chars) is required for audit logs.' });
      return;
    }

    setAdjustLoading(true);
    setAdjustMsg(null);

    try {
      const res = await fetch('/api/admin/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual_adjustment',
          customer_phone: searchedAccount.customer_phone,
          stamps_delta: delta,
          reason: adjustReason.trim(),
          recorded_by: currentRole === 'owner' ? 'Harrison Sharma (Owner)' : 'Staff Member',
        }),
      });

      const data = await res.json();
      setAdjustLoading(false);

      if (data.success) {
        setAdjustMsg({ type: 'success', text: `Adjusted stamps successfully (${delta >= 0 ? '+' : ''}${delta})!` });
        setSearchedAccount(data.account);
        loadData();
        setTimeout(() => setShowAdjustModal(false), 1200);
      } else {
        setAdjustMsg({ type: 'error', text: data.error || 'Failed to adjust stamps.' });
      }
    } catch (err: any) {
      setAdjustLoading(false);
      setAdjustMsg({ type: 'error', text: 'Network error performing adjustment.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Program Banner */}
      <div className="p-5 rounded-3xl bg-white border border-border-warm shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-green" />
            <h2 className="text-xl font-black font-serif text-charcoal">Pizza Harrison Rewards</h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {isActive ? 'Program Active' : 'Program Disabled'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Stamp-based customer loyalty: 1 stamp per qualifying order (₹{minSpendRupees}+). Collect {stampsRequired} stamps for a free pizza.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            isActive ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200' : 'bg-primary-green text-white shadow-xs'
          }`}
        >
          {isActive ? 'Deactivate Program' : 'Activate Program'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Customer Balance Lookup & Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Phone Lookup Box */}
          <div className="bg-white p-5 rounded-3xl border border-border-warm shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-charcoal flex items-center gap-2">
              <Search className="w-4 h-4 text-primary-green" />
              <span>Verify Customer Loyalty Balance</span>
            </h3>

            <form onSubmit={handleSearchPhone} className="flex gap-2">
              <input
                type="tel"
                placeholder="Enter 10-digit customer mobile number..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-5 py-2.5 bg-primary-green hover:bg-forest text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {lookupLoading ? 'Checking...' : 'Check Balance'}
              </button>
            </form>

            {lookupError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                {lookupError}
              </div>
            )}

            {/* Customer Account Card */}
            {searchedAccount && (
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-border-warm space-y-4">
                <div className="flex items-center justify-between border-b border-border-warm pb-3">
                  <div>
                    <div className="text-base font-black text-charcoal">{searchedAccount.customer_name}</div>
                    <div className="text-xs text-neutral-500 font-mono">+91 {searchedAccount.customer_phone}</div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase text-neutral-400">Total Lifetime Stamps</span>
                    <div className="text-lg font-black text-charcoal">{searchedAccount.total_stamps_earned}</div>
                  </div>
                </div>

                {/* Stamp Card Progress Visual */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-700">Stamp Progress to Free Pizza:</span>
                    <span className="font-black text-primary-green">
                      {searchedAccount.stamps_count} of {config?.stamps_required || 6} Stamps
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: config?.stamps_required || 6 }).map((_, idx) => {
                      const isStamped = idx < searchedAccount.stamps_count;
                      return (
                        <div
                          key={idx}
                          className={`aspect-square rounded-xl flex flex-col items-center justify-center border transition ${
                            isStamped
                              ? 'bg-primary-green text-white border-primary-green shadow-xs'
                              : 'bg-white text-neutral-300 border-border-warm'
                          }`}
                        >
                          <span className="text-base">{isStamped ? '🍕' : '○'}</span>
                          <span className="text-[9px] font-bold mt-0.5">{idx + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Available Rewards Alert */}
                {searchedAccount.available_rewards_count > 0 ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-emerald-700" />
                      <div>
                        <div className="text-xs font-black text-emerald-900">
                          {searchedAccount.available_rewards_count} Free Pizza Reward Unlocked!
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          Eligible: {config?.reward_pizza_name || 'Regular Pizza'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRedeemReward}
                      disabled={redeemLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {redeemLoading ? 'Redeeming...' : 'Redeem Now'}
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-neutral-400" />
                    <span>
                      Need {Math.max(0, (config?.stamps_required || 6) - searchedAccount.stamps_count)} more stamps to unlock next reward.
                    </span>
                  </div>
                )}

                {/* Staff Actions */}
                <div className="pt-2 border-t border-border-warm flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">Staff Management:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStampsDelta('1');
                      setAdjustReason('');
                      setAdjustMsg(null);
                      setShowAdjustModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs transition cursor-pointer"
                  >
                    Audited Adjustment
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Customer History Log */}
          {searchedAccount && searchedLedger.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-border-warm shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-charcoal">Customer Loyalty Activity Log</h3>
              <div className="space-y-2">
                {searchedLedger.map((l) => (
                  <div key={l.id} className="p-3 rounded-xl bg-[#FFFDF9] border border-border-warm flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-charcoal">{l.reason}</div>
                      <div className="text-[10px] text-neutral-400">
                        {new Date(l.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })} · By {l.recorded_by}
                      </div>
                    </div>
                    <span
                      className={`font-black text-sm ${
                        l.stamps_delta > 0
                          ? 'text-emerald-700'
                          : l.stamps_delta < 0
                          ? 'text-red-600'
                          : 'text-neutral-500'
                      }`}
                    >
                      {l.stamps_delta > 0 ? `+${l.stamps_delta}` : l.stamps_delta === 0 ? '—' : l.stamps_delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Program Rules Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-border-warm shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border-warm pb-3">
              <ShieldCheck className="w-4 h-4 text-primary-green" />
              <h3 className="text-sm font-black text-charcoal">Owner Program Rules</h3>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Minimum Food Spend to Earn 1 Stamp (₹) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="299"
                  value={minSpendRupees}
                  onChange={(e) => setMinSpendRupees(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green"
                />
                <p className="text-[10px] text-neutral-400 mt-1">Excludes delivery and packaging fees.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Stamps Required for Free Pizza *
                </label>
                <input
                  type="number"
                  required
                  min="3"
                  max="20"
                  value={stampsRequired}
                  onChange={(e) => setStampsRequired(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Reward Pizza Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Regular Margherita or Farmhouse"
                  value={rewardPizzaName}
                  onChange={(e) => setRewardPizzaName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green"
                />
              </div>

              {configMsg && (
                <div
                  className={`p-3 rounded-xl text-xs ${
                    configMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {configMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={configSaving}
                className="w-full py-2.5 bg-primary-green hover:bg-forest text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {configSaving ? 'Saving...' : 'Save Loyalty Rules'}
              </button>
            </form>
          </div>

          {/* Quick Explainer for Staff */}
          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-border-warm space-y-2 text-xs text-neutral-600">
            <div className="font-bold text-charcoal flex items-center gap-1.5">
              <span>Operational Integrity Guidelines</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-neutral-500">
              <li>Stamps are automatically awarded upon order completion when food subtotal &ge; ₹{minSpendRupees}.</li>
              <li>Cancelled or refunded orders automatically revoke any earned stamp.</li>
              <li>Free reward pizzas do not earn stamps.</li>
              <li>Loyalty rewards cannot be stacked with promotional coupon codes.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Staff Adjustment Modal */}
      {showAdjustModal && searchedAccount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-warm space-y-4">
            <div className="flex items-center justify-between border-b border-border-warm pb-3">
              <div>
                <h3 className="font-black text-base text-charcoal">Audited Loyalty Adjustment</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Customer: +91 {searchedAccount.customer_phone} (Current: {searchedAccount.stamps_count} stamps)
                </p>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-charcoal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Stamps Adjustment (+ / -) *
                </label>
                <select
                  value={stampsDelta}
                  onChange={(e) => setStampsDelta(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green cursor-pointer font-medium"
                >
                  <option value="1">+1 Stamp (Add customer compensation / offline visit)</option>
                  <option value="2">+2 Stamps (Goodwill / store anniversary)</option>
                  <option value="-1">-1 Stamp (Deduct correction)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Mandatory Audit Reason (min 5 chars) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. In-store dine-in order receipt #8812 verified by counter cashier"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green"
                />
              </div>

              {adjustMsg && (
                <div
                  className={`p-2.5 rounded-lg text-xs ${
                    adjustMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {adjustMsg.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-5 py-2 rounded-xl bg-primary-green hover:bg-emerald-800 text-white font-bold text-xs shadow-xs disabled:opacity-50"
                >
                  {adjustLoading ? 'Saving...' : 'Apply Audited Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
