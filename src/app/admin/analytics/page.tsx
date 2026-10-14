'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Percent,
  RotateCcw,
  Users,
  Calendar,
  RefreshCw,
  Sparkles,
  PieChart,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { formatINR } from '@/lib/pricing';

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'custom'>('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/analytics?dateRange=${dateRange}`;
      if (dateRange === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (e) {
      console.warn('Error fetching analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, startDate, endDate]);

  return (
    <div className="space-y-8 max-w-7xl">
      
      {/* Top Banner & Date Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-border-warm shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-green" />
            <h1 className="text-xl sm:text-2xl font-black text-forest font-serif">
              Financial & Operational Analytics
            </h1>
          </div>
          <p className="text-xs text-muted-gray mt-1">
            Exact monetary telemetry, sales velocity, discount absorption, and repeat patron dynamics.
          </p>
        </div>

        {/* Date Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#FAF7F0] p-1 rounded-xl border border-border-warm flex items-center text-xs font-bold text-charcoal">
            <button
              type="button"
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                dateRange === 'today' ? 'bg-primary-green text-white shadow-xs' : 'hover:text-primary-green'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateRange('7days')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                dateRange === '7days' ? 'bg-primary-green text-white shadow-xs' : 'hover:text-primary-green'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('30days')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                dateRange === '30days' ? 'bg-primary-green text-white shadow-xs' : 'hover:text-primary-green'
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('custom')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                dateRange === 'custom' ? 'bg-primary-green text-white shadow-xs' : 'hover:text-primary-green'
              }`}
            >
              Custom
            </button>
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-1.5 bg-[#FAF7F0] p-1 rounded-xl border border-border-warm text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-border-warm rounded-lg px-2 py-1 text-xs"
              />
              <span className="text-muted-gray">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-border-warm rounded-lg px-2 py-1 text-xs"
              />
            </div>
          )}

          <button
            type="button"
            onClick={fetchAnalytics}
            className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-charcoal rounded-xl transition cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Financial Health Matrix (Strict Distinction: Revenue vs Discounts vs Refunds vs Profit) */}
      <div className="bg-white rounded-3xl p-6 border border-border-warm shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-warm">
          <div>
            <h2 className="text-base font-black text-forest font-serif">
              Financial Breakdown & Transparency Matrix
            </h2>
            <p className="text-xs text-muted-gray">
              Strict accounting separation: Gross sales, customer discounts, refunds, cost basis, and gross operating profit.
            </p>
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Audit Reconciled
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* 1. Gross Food Sales */}
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-border-warm space-y-1">
            <span className="text-[10px] text-muted-gray uppercase font-bold tracking-wider">
              1. Gross Sales
            </span>
            <div className="text-xl font-black font-mono text-charcoal">
              {formatINR(analytics?.grossSalesPaise || 0)}
            </div>
            <p className="text-[11px] text-muted-gray">Subtotals + Packaging + Delivery</p>
          </div>

          {/* 2. Discounts Absorbed */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1">
            <span className="text-[10px] text-amber-800 uppercase font-bold tracking-wider flex items-center gap-1">
              <Percent className="w-3 h-3 text-amber-600" />
              <span>2. Discounts Absorbed</span>
            </span>
            <div className="text-xl font-black font-mono text-amber-900">
              -{formatINR(analytics?.totalDiscountsPaise || 0)}
            </div>
            <p className="text-[11px] text-amber-700">Coupons & promo deductions</p>
          </div>

          {/* 3. Net Cash Revenue */}
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-1">
            <span className="text-[10px] text-blue-800 uppercase font-bold tracking-wider flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-blue-600" />
              <span>3. Net Cash Revenue</span>
            </span>
            <div className="text-xl font-black font-mono text-blue-900">
              {formatINR(analytics?.netRevenuePaise || 0)}
            </div>
            <p className="text-[11px] text-blue-700">Actual collections on valid orders</p>
          </div>

          {/* 4. Refunds Processed */}
          <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200 space-y-1">
            <span className="text-[10px] text-red-800 uppercase font-bold tracking-wider flex items-center gap-1">
              <RotateCcw className="w-3 h-3 text-red-600" />
              <span>4. Refunds Processed</span>
            </span>
            <div className="text-xl font-black font-mono text-red-900">
              {formatINR(analytics?.totalRefundedPaise || 0)}
            </div>
            <p className="text-[11px] text-red-700">On {analytics?.cancelledCount || 0} cancelled orders</p>
          </div>

          {/* 5. Estimated Gross Profit */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1">
            <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>5. Est. Gross Profit</span>
            </span>
            <div className="text-xl font-black font-mono text-emerald-900">
              {formatINR(analytics?.estimatedGrossProfitPaise || 0)}
            </div>
            <p className="text-[11px] text-emerald-700">Net revenue minus ~38% food/pack cost</p>
          </div>

        </div>
      </div>

      {/* Charts & Metric Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-border-warm shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-forest font-serif">Daily Sales Trend</h3>
              <p className="text-xs text-muted-gray">Daily revenue trajectory over selected window</p>
            </div>
            <span className="text-xs font-mono font-bold text-forest">
              AOV: {formatINR(analytics?.avgOrderValuePaise || 0)}
            </span>
          </div>

          {analytics?.salesTrend && analytics.salesTrend.length > 0 ? (
            <div className="space-y-4 pt-2">
              <div className="h-52 flex items-end gap-3 pt-6 border-b border-border-warm pb-2 overflow-x-auto">
                {analytics.salesTrend.map((pt: any, idx: number) => {
                  const maxSale = Math.max(...analytics.salesTrend.map((s: any) => s.salesPaise || 1));
                  const heightPercent = Math.max(12, Math.round((pt.salesPaise / maxSale) * 100));

                  return (
                    <div key={idx} className="flex-1 min-w-[50px] flex flex-col items-center gap-1.5 group">
                      <div className="text-[10px] font-bold text-forest opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        {formatINR(pt.salesPaise)}
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-emerald-800 to-primary-green rounded-t-xl transition-all group-hover:from-emerald-600 group-hover:to-accent-green"
                      />
                      <span className="text-[10px] text-muted-gray font-medium truncate w-full text-center">
                        {pt.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between text-xs text-muted-gray font-mono">
                <span>Start: {analytics.salesTrend[0]?.date}</span>
                <span>End: {analytics.salesTrend[analytics.salesTrend.length - 1]?.date}</span>
              </div>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-xs text-muted-gray bg-[#FAF7F0] rounded-2xl">
              No sales recorded for this date range.
            </div>
          )}
        </div>

        {/* Customer Retention & Order Volume Metrics */}
        <div className="bg-white rounded-3xl p-6 border border-border-warm shadow-xs space-y-4">
          <h3 className="text-base font-black text-forest font-serif">Customer Dynamics</h3>

          <div className="space-y-4 pt-1">
            <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-border-warm space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-charcoal">Repeat Customer Rate</span>
                <span className="font-black text-emerald-700 text-sm">{analytics?.repeatCustomerRate || 0}%</span>
              </div>
              <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${analytics?.repeatCustomerRate || 0}%` }}
                  className="h-full bg-primary-green rounded-full transition-all"
                />
              </div>
              <p className="text-[11px] text-muted-gray">
                Patrons placing 2 or more orders with Pizza Harrison.
              </p>
            </div>

            <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-border-warm space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-charcoal">Order Fulfillment Rate</span>
                <span className="font-black text-blue-700 text-sm">
                  {analytics?.totalOrders > 0
                    ? Math.round(((analytics?.completedCount || 0) / analytics?.totalOrders) * 100)
                    : 100}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${
                      analytics?.totalOrders > 0
                        ? Math.round(((analytics?.completedCount || 0) / analytics?.totalOrders) * 100)
                        : 100
                    }%`,
                  }}
                  className="h-full bg-blue-600 rounded-full transition-all"
                />
              </div>
              <p className="text-[11px] text-muted-gray">
                Completed & dispatched orders vs total incoming demand.
              </p>
            </div>

            <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-border-warm space-y-1 text-xs">
              <span className="text-muted-gray text-[11px] block">Cancellation Rate</span>
              <div className="text-lg font-black text-red-600">
                {analytics?.totalOrders > 0
                  ? Math.round(((analytics?.cancelledCount || 0) / analytics?.totalOrders) * 100)
                  : 0}%
              </div>
              <p className="text-[11px] text-muted-gray">
                {analytics?.cancelledCount || 0} cancellations recorded.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Top Bestselling Products Leaderboard */}
      <div className="bg-white rounded-3xl p-6 border border-border-warm shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-warm">
          <div>
            <h3 className="text-base font-black text-forest font-serif">Bestselling Recipes Leaderboard</h3>
            <p className="text-xs text-muted-gray">Top revenue-generating pizzas, pastas, and sides</p>
          </div>
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6EE] text-muted-gray uppercase font-bold text-[10px] tracking-wider border-b border-border-warm">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Dish / Recipe</th>
                <th className="px-5 py-3">Units Sold</th>
                <th className="px-5 py-3">Gross Sales Generated</th>
                <th className="px-5 py-3 text-right">Avg Unit Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm font-medium text-charcoal">
              {analytics?.topSellingProducts && analytics.topSellingProducts.length > 0 ? (
                analytics.topSellingProducts.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-neutral-50/80 transition">
                    <td className="px-5 py-4 font-bold text-forest">#{idx + 1}</td>
                    <td className="px-5 py-4 font-bold text-forest text-sm">{p.name}</td>
                    <td className="px-5 py-4 font-mono font-bold text-charcoal">{p.quantity} units</td>
                    <td className="px-5 py-4 font-mono font-black text-forest text-sm">
                      {formatINR(p.revenuePaise)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-muted-gray">
                      {formatINR(Math.round(p.revenuePaise / Math.max(1, p.quantity)))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-gray">
                    No sales data available for this date filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
