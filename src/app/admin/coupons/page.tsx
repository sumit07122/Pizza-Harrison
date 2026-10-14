'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Check,
  X,
  Clock,
  AlertCircle,
  Percent,
  DollarSign,
  Gift,
  Users,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { Coupon, DiscountType, Category, Product } from '@/lib/types';
import { formatINR } from '@/lib/pricing';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('flat');
  const [discountValue, setDiscountValue] = useState('100'); // rupees or %
  const [minOrderRupees, setMinOrderRupees] = useState('499');
  const [maxDiscountRupees, setMaxDiscountRupees] = useState('150');
  const [maxUses, setMaxUses] = useState('1000');
  const [validUntil, setValidUntil] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [terms, setTerms] = useState('Valid once per user. Cannot be clubbed with other deals.');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const [cpRes, catRes] = await Promise.all([
        fetch('/api/admin/coupons'),
        fetch('/api/admin/categories'),
      ]);
      const cpData = await cpRes.json();
      const catData = await catRes.json();

      if (cpData.coupons) setCoupons(cpData.coupons);
      if (catData.categories) setCategories(catData.categories);
    } catch (e) {
      console.warn('Error loading coupons', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const toggleCouponStatus = async (couponId: string, currentActive: boolean) => {
    const nextStatus = !currentActive;
    setCoupons((prev) =>
      prev.map((c) => (c.id === couponId ? { ...c, is_active: nextStatus } : c))
    );

    try {
      await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: couponId,
          action: 'toggle-active',
          isActive: nextStatus,
        }),
      });
    } catch (e) {
      console.error(e);
      loadCoupons();
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!code.trim() || !description.trim()) {
      setFormError('Coupon code and description are required.');
      return;
    }
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      setFormError('Please enter a valid discount value.');
      return;
    }

    const minOrderPaise = Math.round((parseFloat(minOrderRupees) || 0) * 100);
    const maxDiscountPaise = maxDiscountRupees ? Math.round(parseFloat(maxDiscountRupees) * 100) : null;
    const finalDiscountValue = discountType === 'flat' ? Math.round(val * 100) : Math.round(val);

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          description: description.trim(),
          discount_type: discountType,
          discount_value: finalDiscountValue,
          min_order_paise: minOrderPaise,
          max_discount_paise: discountType === 'percentage' ? maxDiscountPaise : null,
          eligible_categories: selectedCategory !== 'all' ? [selectedCategory] : [],
          max_uses: maxUses ? parseInt(maxUses, 10) : null,
          valid_until: validUntil ? new Date(validUntil).toISOString() : null,
          terms_conditions: terms.trim(),
          is_active: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setCode('');
        setDescription('');
        loadCoupons();
      } else {
        setFormError(data.error || 'Failed to create coupon.');
      }
    } catch (e: any) {
      setFormError(e.message || 'Server error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-border-warm shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary-green" />
            <h1 className="text-xl sm:text-2xl font-black text-forest font-serif">
              Promotions & Coupon Management
            </h1>
          </div>
          <p className="text-xs text-muted-gray mt-1">
            Create percentage discounts, flat cash off, BOGO deals, student bundles, and cart thresholds.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-primary-green hover:bg-forest text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Promotion</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-3xl border border-border-warm shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6EE] text-muted-gray uppercase font-bold text-[10px] tracking-wider border-b border-border-warm">
              <tr>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Discount Details</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Min Order</th>
                <th className="px-5 py-3">Usage / Cap</th>
                <th className="px-5 py-3">Validity</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Toggle Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm font-medium text-charcoal">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50/80 transition">
                  <td className="px-5 py-4 font-mono font-black text-sm text-forest">
                    {c.code}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-charcoal">{c.description}</div>
                    {c.terms_conditions && (
                      <div className="text-[11px] text-muted-gray line-clamp-1">{c.terms_conditions}</div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-charcoal">
                      {c.discount_type}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-forest">
                    {c.min_order_paise > 0 ? formatINR(c.min_order_paise) : 'No min'}
                  </td>
                  <td className="px-5 py-4 text-xs font-mono">
                    <span>{c.current_uses}</span>
                    <span className="text-muted-gray"> / {c.max_uses ? `${c.max_uses} max` : '∞'}</span>
                  </td>
                  <td className="px-5 py-4 text-[11px] text-muted-gray font-mono">
                    {c.valid_until ? new Date(c.valid_until).toLocaleDateString('en-IN') : 'Ongoing'}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        c.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {c.is_active ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => toggleCouponStatus(c.id, c.is_active)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        c.is_active
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {c.is_active ? 'Pause' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CREATE COUPON MODAL WITH LIVE PREVIEW */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-border-warm space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-border-warm">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary-green" />
                <h2 className="text-base sm:text-lg font-black font-serif text-forest">
                  Configure Promotional Campaign
                </h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-muted-gray hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              
              {/* Code & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-charcoal block mb-1">Coupon Promo Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HARRISON25"
                    className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-charcoal block mb-1">Customer Description *</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 25% Off on All Artisan Pizzas"
                    className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Discount Type Selector */}
              <div className="space-y-1">
                <label className="font-bold text-charcoal block">Promotion Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: 'flat', label: 'Flat Cash Off (₹)' },
                    { type: 'percentage', label: 'Percentage Off (%)' },
                    { type: 'bogo', label: 'Buy 1 Get 1 (BOGO)' },
                    { type: 'combo', label: 'Family Combo Special' },
                  ].map((it) => (
                    <button
                      key={it.type}
                      type="button"
                      onClick={() => setDiscountType(it.type as any)}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                        discountType === it.type
                          ? 'bg-primary-green text-white border-primary-green shadow-xs'
                          : 'bg-[#FAF7F0] border-border-warm text-charcoal hover:bg-neutral-100'
                      }`}
                    >
                      {it.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Values & Caps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-charcoal block mb-1">
                    {discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Value (₹)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '20' : '100'}
                    className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-charcoal block mb-1">Minimum Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderRupees}
                    onChange={(e) => setMinOrderRupees(e.target.value)}
                    placeholder="499"
                    className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-mono font-bold"
                  />
                </div>

                {discountType === 'percentage' && (
                  <div>
                    <label className="font-bold text-charcoal block mb-1">Max Discount Cap (₹)</label>
                    <input
                      type="number"
                      min="1"
                      value={maxDiscountRupees}
                      onChange={(e) => setMaxDiscountRupees(e.target.value)}
                      placeholder="150"
                      className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Category Eligibility & Validity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-charcoal block mb-1">Eligible Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-semibold"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-charcoal block mb-1">Total Uses Cap</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="1000"
                    className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-charcoal block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Terms & Conditions</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Terms and conditions for this offer..."
                  className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0]"
                />
              </div>

              {/* LIVE PROMOTION PREVIEW BOX (Requirement from prompt) */}
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-900">
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Live Promotion Preview (Customer View)</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between shadow-xs">
                  <div>
                    <div className="font-mono font-black text-sm text-forest">
                      {code.trim().toUpperCase() || 'PROMOCODE'}
                    </div>
                    <div className="font-bold text-xs text-charcoal">
                      {description || 'Discount details description preview'}
                    </div>
                    <div className="text-[10px] text-muted-gray mt-0.5">
                      Min order: ₹{minOrderRupees || '0'} | {terms}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-primary-green text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      {discountType === 'percentage'
                        ? `${discountValue || 0}% OFF`
                        : discountType === 'bogo'
                        ? 'BUY 1 GET 1'
                        : `₹${discountValue || 0} OFF`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-warm">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-muted-gray hover:text-charcoal cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-black bg-primary-green hover:bg-forest text-white rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Publishing...' : 'Launch Promotion'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
