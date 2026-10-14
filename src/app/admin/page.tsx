'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  UtensilsCrossed,
  CalendarCheck,
  DollarSign,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Plus,
  Flame,
  Filter,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  RotateCcw,
  ClipboardCheck,
} from 'lucide-react';
import { Order } from '@/lib/types';
import { formatINR } from '@/lib/pricing';

export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'custom'>('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [checklistStats, setChecklistStats] = useState<{
    openingDone: number;
    openingTotal: number;
    closingDone: number;
    closingTotal: number;
  }>({ openingDone: 0, openingTotal: 6, closingDone: 0, closingTotal: 6 });
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/overview?dateRange=${dateRange}`;
      if (dateRange === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const [ovRes, invRes, chkRes] = await Promise.all([
        fetch(url),
        fetch('/api/admin/inventory').catch(() => null),
        fetch('/api/admin/checklists').catch(() => null),
      ]);
      const data = await ovRes.json();
      if (data.success) {
        setAnalytics(data.analytics);
        setRecentOrders(data.recentOrders || []);
      }
      if (invRes) {
        const invData = await invRes.json();
        if (invData.success && invData.items) {
          const low = invData.items.filter((it: any) => it.current_stock <= it.min_threshold);
          setLowStockCount(low.length);
        }
      }
      if (chkRes) {
        const chkData = await chkRes.json();
        if (chkData.success && chkData.checklists) {
          const opening = chkData.checklists.find((c: any) => c.checklist_type === 'opening');
          const closing = chkData.checklists.find((c: any) => c.checklist_type === 'closing');
          setChecklistStats({
            openingDone: opening ? opening.items.filter((i: any) => i.is_completed).length : 0,
            openingTotal: opening?.items?.length || 6,
            closingDone: closing ? closing.items.filter((i: any) => i.is_completed).length : 0,
            closingTotal: closing?.items?.length || 6,
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load overview data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 15000);
    return () => clearInterval(interval);
  }, [dateRange, startDate, endDate]);

  const activePreparingCount = analytics?.statusDistribution?.preparing || 0;
  const pendingPlacedCount = analytics?.statusDistribution?.placed || 0;

  return (
    <div className="space-y-8 max-w-7xl">
      
      {/* Top Banner & Date Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-border-warm shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-forest font-serif">
              Operations & Business Dashboard
            </h1>
          </div>
          <p className="text-xs text-muted-gray mt-1">
            Real-time financial telemetry, kitchen throughput, and order metrics across Mathura.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#FAF7F0] p-1 rounded-xl border border-border-warm flex items-center text-xs font-bold text-charcoal">
            <button
              type="button"
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                dateRange === 'today'
                  ? 'bg-primary-green text-white shadow-xs'
                  : 'hover:text-primary-green'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateRange('7days')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                dateRange === '7days'
                  ? 'bg-primary-green text-white shadow-xs'
                  : 'hover:text-primary-green'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('30days')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                dateRange === '30days'
                  ? 'bg-primary-green text-white shadow-xs'
                  : 'hover:text-primary-green'
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('custom')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                dateRange === 'custom'
                  ? 'bg-primary-green text-white shadow-xs'
                  : 'hover:text-primary-green'
              }`}
            >
              Custom Range
            </button>
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-1.5 bg-[#FAF7F0] p-1 rounded-xl border border-border-warm text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-border-warm rounded-lg px-2 py-1 text-xs font-medium"
              />
              <span className="text-muted-gray">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-border-warm rounded-lg px-2 py-1 text-xs font-medium"
              />
            </div>
          )}

          <button
            type="button"
            onClick={fetchOverview}
            className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-charcoal rounded-xl transition cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Low Stock Operational Warning */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <span className="font-black text-amber-900 block">
                {lowStockCount} Inventory {lowStockCount === 1 ? 'Item is' : 'Items are'} Below Safety Reorder Threshold
              </span>
              <span className="text-amber-700">
                Key kitchen ingredients require purchasing to prevent stockouts during peak shifts.
              </span>
            </div>
          </div>
          <Link
            href="/admin/inventory"
            className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition self-start sm:self-auto shrink-0"
          >
            Manage Inventory &rarr;
          </Link>
        </div>
      )}

      {/* Daily SOP Checklist Status (Improvement #11) */}
      <div className="bg-white rounded-3xl p-5 border border-border-warm shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-primary-green flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-forest font-serif">Today's Daily SOP Checklists</h3>
              <span className="text-[10px] bg-[#FAF7F0] border border-border-warm text-charcoal px-2.5 py-0.5 rounded-full font-bold">
                Operational Routine
              </span>
            </div>
            <p className="text-xs text-muted-gray mt-0.5">
              Opening checklist: <strong className="text-charcoal">{checklistStats.openingDone}/{checklistStats.openingTotal}</strong> completed &bull; Closing handover: <strong className="text-charcoal">{checklistStats.closingDone}/{checklistStats.closingTotal}</strong> completed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2.5 py-1 rounded-lg font-bold ${
              checklistStats.openingDone === checklistStats.openingTotal
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-900'
            }`}>
              Opening: {checklistStats.openingDone}/{checklistStats.openingTotal}
            </span>
            <span className={`px-2.5 py-1 rounded-lg font-bold ${
              checklistStats.closingDone === checklistStats.closingTotal
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-neutral-100 text-neutral-600'
            }`}>
              Closing: {checklistStats.closingDone}/{checklistStats.closingTotal}
            </span>
          </div>

          <Link
            href="/admin/settings?tab=checklists"
            className="px-3.5 py-2 rounded-xl bg-forest hover:bg-primary-green text-white font-bold text-xs shadow-xs transition"
          >
            Open Checklists &rarr;
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Sales (Excluded Cancelled) */}
        <div className="bg-white rounded-3xl p-5 border border-border-warm shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-gray text-xs font-bold uppercase tracking-wider">
            <span>Net Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-forest">
            {formatINR(analytics?.netRevenuePaise || 0)}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <span>Gross: {formatINR(analytics?.grossSalesPaise || 0)}</span>
            <span className="text-muted-gray">| Excl. cancelled</span>
          </p>
        </div>

        {/* Order Volume */}
        <div className="bg-white rounded-3xl p-5 border border-border-warm shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-gray text-xs font-bold uppercase tracking-wider">
            <span>Orders Count</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-forest">
            {analytics?.totalOrders || 0}
          </div>
          <p className="text-[11px] text-blue-700 font-medium">
            {analytics?.completedCount || 0} completed & delivered
          </p>
        </div>

        {/* Kitchen Throughput */}
        <div className="bg-white rounded-3xl p-5 border border-border-warm shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-gray text-xs font-bold uppercase tracking-wider">
            <span>Kitchen Active</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-forest">
            {pendingPlacedCount + activePreparingCount}
          </div>
          <p className="text-[11px] text-amber-700 font-medium">
            {pendingPlacedCount} waiting, {activePreparingCount} baking
          </p>
        </div>

        {/* Average Order Value */}
        <div className="bg-white rounded-3xl p-5 border border-border-warm shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-gray text-xs font-bold uppercase tracking-wider">
            <span>Avg Order Value (AOV)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-forest">
            {formatINR(analytics?.avgOrderValuePaise || 0)}
          </div>
          <p className="text-[11px] text-purple-700 font-medium">
            Discounts given: {formatINR(analytics?.totalDiscountsPaise || 0)}
          </p>
        </div>

      </div>

      {/* Financial Health & Transparency Notice */}
      <div className="bg-gradient-to-r from-emerald-900 via-forest to-emerald-950 text-white rounded-3xl p-6 shadow-md border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider bg-accent-green/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Financial Rule Transparency
            </span>
          </div>
          <p className="text-xs text-emerald-100 max-w-xl">
            Revenue represents total cash collected. Food & packaging cost is estimated at ~38%. 
            Refunds on cancelled orders are strictly excluded from net sales figures.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs shrink-0">
          <div>
            <div className="text-emerald-300 text-[10px] font-bold uppercase">Estimated Gross Profit</div>
            <div className="text-xl font-black font-mono text-white">
              {formatINR(analytics?.estimatedGrossProfitPaise || 0)}
            </div>
          </div>
          <div className="border-l border-emerald-700/60 pl-6">
            <div className="text-red-300 text-[10px] font-bold uppercase">Refunds Processed</div>
            <div className="text-xl font-black font-mono text-red-200">
              {formatINR(analytics?.totalRefundedPaise || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row: Sales Trend + Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Trend Chart (Visual SVG Bars) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-border-warm shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-forest font-serif">
                Sales Trend ({dateRange === 'today' ? 'Hourly Activity' : 'Daily Sales'})
              </h2>
              <p className="text-xs text-muted-gray">Net verified sales over the selected window</p>
            </div>
            <Link
              href="/admin/analytics"
              className="text-xs font-bold text-primary-green hover:underline flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {analytics?.salesTrend && analytics.salesTrend.length > 0 ? (
            <div className="space-y-3 pt-2">
              <div className="h-44 flex items-end gap-3 pt-4 border-b border-border-warm pb-2 overflow-x-auto">
                {analytics.salesTrend.map((pt: any, idx: number) => {
                  const maxSale = Math.max(...analytics.salesTrend.map((s: any) => s.salesPaise || 1));
                  const heightPercent = Math.max(12, Math.round((pt.salesPaise / maxSale) * 100));

                  return (
                    <div key={idx} className="flex-1 min-w-[48px] flex flex-col items-center gap-1.5 group">
                      <div className="text-[10px] font-bold text-forest opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        {formatINR(pt.salesPaise)}
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-emerald-700 to-primary-green rounded-t-lg transition-all group-hover:from-emerald-600 group-hover:to-accent-green"
                      />
                      <span className="text-[10px] text-muted-gray font-medium truncate w-full text-center">
                        {pt.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] text-muted-gray">
                <span>Start: {analytics.salesTrend[0]?.date}</span>
                <span>Latest: {analytics.salesTrend[analytics.salesTrend.length - 1]?.date}</span>
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 bg-[#FAF7F0] rounded-2xl border border-dashed border-border-warm">
              <ShoppingBag className="w-8 h-8 text-neutral-300 mb-2" />
              <p className="text-xs font-bold text-charcoal">No sales recorded for this date window</p>
              <p className="text-[11px] text-muted-gray mt-0.5">Switch filter to "30 Days" or "All" to inspect historical trends.</p>
            </div>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-border-warm shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-black text-forest font-serif">
              Status Breakdown
            </h2>
            <p className="text-xs text-muted-gray">Order progression distribution</p>
          </div>

          <div className="space-y-2.5 pt-1">
            {[
              { label: 'New Confirmed', key: 'placed', color: 'bg-amber-500', count: pendingPlacedCount },
              { label: 'Baking / Preparing', key: 'preparing', color: 'bg-purple-500', count: activePreparingCount },
              {
                label: 'Out / Ready',
                key: 'dispatch',
                color: 'bg-blue-500',
                count: (analytics?.statusDistribution?.out_for_delivery || 0) + (analytics?.statusDistribution?.ready_for_pickup || 0),
              },
              { label: 'Delivered', key: 'completed', color: 'bg-emerald-500', count: analytics?.completedCount || 0 },
              { label: 'Cancelled', key: 'cancelled', color: 'bg-red-500', count: analytics?.cancelledCount || 0 },
            ].map((item, i) => {
              const total = Math.max(1, analytics?.totalOrders || 1);
              const pct = Math.round((item.count / total) * 100);

              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-charcoal">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${item.color}`} />
                      {item.label}
                    </span>
                    <span>{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${pct}%` }} className={`h-full ${item.color} rounded-full transition-all`} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border-warm">
            <Link
              href="/admin/orders"
              className="text-xs font-black text-primary-green hover:underline flex items-center justify-between"
            >
              <span>Manage all active orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Top Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top-Selling Products */}
        <div className="bg-white rounded-3xl p-6 border border-border-warm shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-forest font-serif">
                Top Bestsellers
              </h2>
              <p className="text-xs text-muted-gray">Top items ordered in this timeframe</p>
            </div>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>

          {analytics?.topSellingProducts && analytics.topSellingProducts.length > 0 ? (
            <div className="space-y-3">
              {analytics.topSellingProducts.map((p: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F0] border border-border-warm text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white text-forest font-bold text-[10px] flex items-center justify-center border border-border-warm">
                      #{i + 1}
                    </span>
                    <div>
                      <div className="font-bold text-charcoal line-clamp-1">{p.name}</div>
                      <div className="text-[11px] text-muted-gray">{p.quantity} orders fulfilled</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-forest font-mono">{formatINR(p.revenuePaise)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-muted-gray bg-[#FAF7F0] rounded-2xl border border-dashed border-border-warm">
              No product sales data available for this range.
            </div>
          )}
        </div>

        {/* Recent Orders Stream */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-border-warm shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-forest font-serif">
                Recent Customer Orders
              </h2>
              <p className="text-xs text-muted-gray">Latest orders placed via storefront & desk</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-primary-green hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6EE] text-muted-gray uppercase font-bold text-[10px] tracking-wider border-b border-border-warm">
                <tr>
                  <th className="px-4 py-2.5">Ref</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Branch</th>
                  <th className="px-4 py-2.5">Total</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm font-medium text-charcoal">
                {recentOrders.slice(0, 6).map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-forest">
                      {ord.order_number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold">{ord.customer_name}</div>
                      <div className="text-[11px] text-muted-gray">+91 {ord.customer_phone}</div>
                    </td>
                    <td className="px-4 py-3 capitalize text-[11px]">
                      {ord.branch === 'gla_university' ? 'GLA Campus' : 'Pali Khera'}
                    </td>
                    <td className="px-4 py-3 font-black text-forest font-mono">
                      {formatINR(ord.total_paise)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          ord.status === 'placed'
                            ? 'bg-amber-100 text-amber-800'
                            : ord.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : ord.status === 'preparing'
                            ? 'bg-purple-100 text-purple-800'
                            : ord.status === 'out_for_delivery' || ord.status === 'ready_for_pickup'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/order-tracking/${ord.order_number}`}
                        target="_blank"
                        className="text-xs font-bold text-primary-green hover:underline inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
