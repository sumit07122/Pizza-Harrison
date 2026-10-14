'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Phone,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { CustomerSummary } from '@/lib/types';
import { formatINR } from '@/lib/pricing';
import { getClickToCallUrl } from '@/lib/whatsapp';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (e) {
      console.warn('Error loading customers', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(customers.length / limit));
  const paginated = customers.slice((page - 1) * limit, page * limit);
  const repeatCount = customers.filter((c) => c.is_repeat).length;

  return (
    <div className="space-y-6 max-w-7xl">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-border-warm shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-green" />
            <h1 className="text-xl sm:text-2xl font-black text-forest font-serif">
              Customer Directory
            </h1>
          </div>
          <p className="text-xs text-muted-gray mt-1">
            Privacy-conscious customer records aggregated from verified order history.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#FAF7F0] px-4 py-2 rounded-2xl border border-border-warm text-xs">
          <div>
            <span className="text-[10px] text-muted-gray uppercase block font-bold">Total Patrons</span>
            <span className="font-black text-forest text-sm font-mono">{customers.length}</span>
          </div>
          <div className="border-l border-border-warm pl-3">
            <span className="text-[10px] text-muted-gray uppercase block font-bold">Repeat Customers</span>
            <span className="font-black text-emerald-700 text-sm font-mono">
              {repeatCount} ({customers.length > 0 ? Math.round((repeatCount / customers.length) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
        <span>
          <strong>Privacy Policy Compliance:</strong> Customer records are strictly assembled from authentic checkout and reservation activities. Contact numbers are restricted to authorized operational communication.
        </span>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-3xl border border-border-warm shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-muted-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patron by name or mobile number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs pl-10 pr-3 py-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden font-medium"
          />
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && customers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-gray">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-green" />
            <p className="text-xs font-semibold">Loading patron profiles...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-border-warm">
            <Users className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-forest">No customers found</h3>
            <p className="text-xs text-muted-gray mt-0.5">Try refining your search keyword.</p>
          </div>
        ) : (
          paginated.map((c) => {
            const waLink = `https://wa.me/91${c.phone}?text=${encodeURIComponent(
              `Hello ${c.name}, greetings from Pizza Harrison Mathura!`
            )}`;

            return (
              <div
                key={c.phone}
                className="bg-white p-5 rounded-3xl border border-border-warm shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border-warm">
                    <span className="font-bold text-charcoal text-sm">{c.name}</span>
                    {c.is_repeat && (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Repeat Guest</span>
                      </span>
                    )}
                  </div>

                  <div className="pt-2 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-gray text-[11px]">Mobile</span>
                      <span className="font-mono font-bold text-forest">+91 {c.phone}</span>
                    </div>
                    {c.email && (
                      <div className="flex justify-between">
                        <span className="text-muted-gray text-[11px]">Email</span>
                        <span className="text-neutral-600 truncate max-w-[180px]">{c.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-gray text-[11px]">Total Orders</span>
                      <span className="font-bold text-charcoal">{c.total_orders} Orders</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-gray text-[11px]">Lifetime Spend</span>
                      <span className="font-black font-mono text-forest">
                        {formatINR(c.total_spent_paise)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-gray">Last Active</span>
                      <span className="text-muted-gray font-mono">
                        {new Date(c.last_order_date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="pt-3 border-t border-border-warm flex items-center justify-between gap-2">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={getClickToCallUrl(c.phone)}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-charcoal text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 bg-white rounded-2xl border border-border-warm flex items-center justify-between text-xs text-muted-gray">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-border-warm hover:bg-neutral-50 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg border border-border-warm hover:bg-neutral-50 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
