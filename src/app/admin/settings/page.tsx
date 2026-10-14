'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  CreditCard,
  Calendar,
  Lock,
  Plus,
  Trash2,
  Phone,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { RestaurantSettings, HolidayClosure } from '@/lib/types';
import { formatINR } from '@/lib/pricing';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Local Form State
  const [businessName, setBusinessName] = useState('Pizza Harrison');
  const [tagline, setTagline] = useState('Artisan Pizzas, Hand-Tossed in Mathura');
  const [phone, setPhone] = useState('7451800502');
  const [whatsapp, setWhatsapp] = useState('7451800502');
  const [email, setEmail] = useState('hello@pizzaharrison.com');
  const [freeDeliveryThresholdRupees, setFreeDeliveryThresholdRupees] = useState('499');
  const [baseDeliveryFeeRupees, setBaseDeliveryFeeRupees] = useState('40');
  const [packagingFeeRupees, setPackagingFeeRupees] = useState('15');
  const [gstPercentage, setGstPercentage] = useState('5');
  const [estimatedPrepTime, setEstimatedPrepTime] = useState('25');
  const [isOnlineOrderingEnabled, setIsOnlineOrderingEnabled] = useState(true);
  const [isTableBookingEnabled, setIsTableBookingEnabled] = useState(true);
  const [retentionDays, setRetentionDays] = useState('365');

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState({
    cod: true,
    pay_at_counter: true,
    upi_qr: true,
    online_gateway: false,
  });

  // Holiday Closures
  const [holidayClosures, setHolidayClosures] = useState<HolidayClosure[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayReason, setNewHolidayReason] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.settings) {
        const s: RestaurantSettings = data.settings;
        setSettings(s);
        setBusinessName(s.business_name);
        setTagline(s.tagline);
        setPhone(s.primary_phone);
        setWhatsapp(s.whatsapp_number);
        setEmail(s.support_email);
        setFreeDeliveryThresholdRupees((s.free_delivery_threshold_paise / 100).toString());
        setBaseDeliveryFeeRupees((s.base_delivery_fee_paise / 100).toString());
        setPackagingFeeRupees((s.packaging_fee_paise / 100).toString());
        setGstPercentage(s.gst_percentage.toString());
        setEstimatedPrepTime(s.estimated_prep_time_minutes.toString());
        setIsOnlineOrderingEnabled(s.is_online_ordering_enabled);
        setIsTableBookingEnabled(s.is_table_booking_enabled);
        setPaymentMethods(s.enabled_payment_methods);
        setHolidayClosures(s.holiday_closures || []);
        setRetentionDays(s.privacy_data_retention_days.toString());
      }
    } catch (e) {
      console.warn('Error fetching settings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleAddHoliday = () => {
    if (!newHolidayDate || !newHolidayReason.trim()) return;
    const newHol: HolidayClosure = {
      id: `hol-${Date.now()}`,
      date: newHolidayDate,
      reason: newHolidayReason.trim(),
      branch: 'all',
    };
    setHolidayClosures([...holidayClosures, newHol]);
    setNewHolidayDate('');
    setNewHolidayReason('');
  };

  const handleRemoveHoliday = (id: string) => {
    setHolidayClosures(holidayClosures.filter((h) => h.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: {
            business_name: businessName.trim(),
            tagline: tagline.trim(),
            primary_phone: phone.trim(),
            whatsapp_number: whatsapp.trim(),
            support_email: email.trim(),
            free_delivery_threshold_paise: Math.round(parseFloat(freeDeliveryThresholdRupees) * 100),
            base_delivery_fee_paise: Math.round(parseFloat(baseDeliveryFeeRupees) * 100),
            packaging_fee_paise: Math.round(parseFloat(packagingFeeRupees) * 100),
            gst_percentage: parseFloat(gstPercentage),
            estimated_prep_time_minutes: parseInt(estimatedPrepTime, 10),
            is_online_ordering_enabled: isOnlineOrderingEnabled,
            is_table_booking_enabled: isTableBookingEnabled,
            enabled_payment_methods: paymentMethods,
            holiday_closures: holidayClosures,
            privacy_data_retention_days: parseInt(retentionDays, 10),
          },
          requesterRole: 'owner',
          requesterName: 'Harrison Sharma (Owner)',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        setErrorMsg(data.error || 'Failed to update settings.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Server error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-border-warm shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-green" />
            <h1 className="text-xl sm:text-2xl font-black text-forest font-serif">
              Restaurant Operational Settings
            </h1>
          </div>
          <p className="text-xs text-muted-gray mt-1">
            Configure contact coordinates, operating hours, delivery fee thresholds, payment methods, and retention rules.
          </p>
        </div>

        {savedSuccess && (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved to Backend!</span>
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 rounded-2xl text-xs flex items-center gap-2 border border-red-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        
        {/* Emergency Master Toggles */}
        <div className="bg-white rounded-3xl p-6 border border-border-warm shadow-xs space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-forest">
            Master Service Availability
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-border-warm flex items-center justify-between">
              <div>
                <span className="font-bold text-charcoal block">Online Food Ordering</span>
                <span className="text-[11px] text-muted-gray">Accept orders on public storefront</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOnlineOrderingEnabled(!isOnlineOrderingEnabled)}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] transition cursor-pointer ${
                  isOnlineOrderingEnabled
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-red-600 text-white shadow-xs'
                }`}
              >
                {isOnlineOrderingEnabled ? '🟢 Active' : '🔴 Paused'}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-border-warm flex items-center justify-between">
              <div>
                <span className="font-bold text-charcoal block">Table Reservations</span>
                <span className="text-[11px] text-muted-gray">Accept table requests via book-table</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTableBookingEnabled(!isTableBookingEnabled)}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[10px] transition cursor-pointer ${
                  isTableBookingEnabled
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-red-600 text-white shadow-xs'
                }`}
              >
                {isTableBookingEnabled ? '🟢 Active' : '🔴 Paused'}
              </button>
            </div>
          </div>
        </div>

        {/* Business Coordinates */}
        <div className="bg-white rounded-3xl p-6 border border-border-warm shadow-xs space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-forest">
            Business Details & Customer Support
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-charcoal block mb-1">Brand Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-charcoal block mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0]"
              />
            </div>
            <div>
              <label className="font-bold text-charcoal block mb-1">Primary Hotline Mobile</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-charcoal block mb-1">Official WhatsApp Number</label>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-mono font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-charcoal block mb-1">Customer Support Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0]"
              />
            </div>
          </div>
        </div>

        {/* Financial Rules & Delivery Fees */}
        <div className="bg-white rounded-3xl p-6 border border-border-warm shadow-xs space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-forest">
            Financial & Delivery Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-charcoal block mb-1">Free Delivery Min (₹)</label>
              <input
                type="number"
                min="0"
                value={freeDeliveryThresholdRupees}
                onChange={(e) => setFreeDeliveryThresholdRupees(e.target.value)}
                className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-charcoal block mb-1">Base Delivery Fee (₹)</label>
              <input
                type="number"
                min="0"
                value={baseDeliveryFeeRupees}
                onChange={(e) => setBaseDeliveryFeeRupees(e.target.value)}
                className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-charcoal block mb-1">Packaging Fee (₹)</label>
              <input
                type="number"
                min="0"
                value={packagingFeeRupees}
                onChange={(e) => setPackagingFeeRupees(e.target.value)}
                className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-charcoal block mb-1">GST Percentage (%)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={gstPercentage}
                onChange={(e) => setGstPercentage(e.target.value)}
                className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-charcoal block mb-1">Est. Kitchen Prep (Mins)</label>
              <input
                type="number"
                min="5"
                value={estimatedPrepTime}
                onChange={(e) => setEstimatedPrepTime(e.target.value)}
                className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-charcoal block mb-1">Data Retention (Days)</label>
              <input
                type="number"
                min="30"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Enabled Payment Gateways */}
        <div className="bg-white rounded-3xl p-6 border border-border-warm shadow-xs space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-forest">
            Enabled Payment Methods
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'cod', label: 'Cash on Delivery (COD)' },
              { key: 'pay_at_counter', label: 'Pay at Counter' },
              { key: 'upi_qr', label: 'UPI Dynamic QR Code' },
              { key: 'online_gateway', label: 'Online Card / Netbanking' },
            ].map((pm) => (
              <label
                key={pm.key}
                className="flex items-center gap-2 p-3 rounded-2xl bg-[#FAF7F0] border border-border-warm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={(paymentMethods as any)[pm.key]}
                  onChange={(e) =>
                    setPaymentMethods({ ...paymentMethods, [pm.key]: e.target.checked })
                  }
                  className="accent-primary-green w-4 h-4"
                />
                <span className="font-bold text-charcoal">{pm.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Holiday Closures */}
        <div className="bg-white rounded-3xl p-6 border border-border-warm shadow-xs space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-forest">
            Holiday Closures & Emergency Blackout Dates
          </h2>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={newHolidayDate}
              onChange={(e) => setNewHolidayDate(e.target.value)}
              className="p-2 border border-border-warm rounded-xl bg-[#FAF7F0]"
            />
            <input
              type="text"
              placeholder="Reason for closure (e.g. Diwali Main Evening Closure)"
              value={newHolidayReason}
              onChange={(e) => setNewHolidayReason(e.target.value)}
              className="flex-1 p-2 border border-border-warm rounded-xl bg-[#FAF7F0]"
            />
            <button
              type="button"
              onClick={handleAddHoliday}
              className="bg-primary-green hover:bg-forest text-white px-4 py-2 rounded-xl font-bold cursor-pointer"
            >
              Add Closure
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {holidayClosures.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F0] border border-border-warm"
              >
                <div>
                  <span className="font-mono font-bold text-forest mr-2">{h.date}</span>
                  <span className="text-charcoal font-medium">{h.reason}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveHoliday(h.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary-green hover:bg-forest text-white rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving to Database...' : 'Save All Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
