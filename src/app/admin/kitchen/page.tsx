'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  Clock,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  RefreshCw,
  ChefHat,
  ArrowRight,
  Check,
  Bike,
  Store,
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<'all' | 'pali_khera' | 'gla_university'>('all');

  const fetchKitchenOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders?limit=100');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.warn('Failed to fetch kitchen orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvanceStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          status: nextStatus,
          changedBy: 'Kitchen Staff',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchKitchenOrders();
        if (soundEnabled && typeof Audio !== 'undefined') {
          try {
            const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            chime.volume = 0.3;
            chime.play().catch(() => {});
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter orders by branch if selected
  const branchFiltered = selectedBranch === 'all'
    ? orders
    : orders.filter((o) => o.branch === selectedBranch);

  // Kitchen Display Categories (Strictly NO prices or financials displayed)
  const incomingConfirmed = branchFiltered.filter(
    (o) => o.status === 'placed' || o.status === 'confirmed'
  );
  const preparingOven = branchFiltered.filter((o) => o.status === 'preparing');
  const readyHandoff = branchFiltered.filter(
    (o) => o.status === 'out_for_delivery' || o.status === 'ready_for_pickup'
  );

  const getElapsedMinutes = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diffMs / (60 * 1000)));
  };

  return (
    <div className="min-h-screen bg-[#141814] text-[#F3EFE6] p-4 sm:p-6 space-y-6">
      
      {/* KDS Header (High contrast tablet interface) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1E241E] p-4 sm:p-5 rounded-3xl border border-[#2F3A2F] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-green flex items-center justify-center text-white text-2xl shadow-md">
            👨‍🍳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-black font-serif tracking-tight text-white">
                Kitchen Display System (KDS)
              </h1>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live oven pipeline. Touch card buttons to advance orders.
            </p>
          </div>
        </div>

        {/* Branch Selector & Sound */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value as any)}
            className="text-xs p-2.5 rounded-xl bg-[#283228] border border-[#3E4D3E] text-white font-bold focus:outline-hidden"
          >
            <option value="all">Both Outlets (Pali Khera & GLA)</option>
            <option value="pali_khera">Pali Khera Main Kitchen</option>
            <option value="gla_university">GLA Campus Kitchen</option>
          </select>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          <button
            type="button"
            onClick={fetchKitchenOrders}
            className="p-2.5 bg-[#283228] hover:bg-[#344234] text-white rounded-xl border border-[#3E4D3E] transition cursor-pointer"
            title="Refresh KDS"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Kanban 3-Stage Large Tablet Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Column 1: New / Confirmed Orders */}
        <div className="bg-[#1C221C] rounded-3xl p-4 sm:p-5 border border-[#2D382D] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2D382D]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-amber-300">
                1. New / Confirmed ({incomingConfirmed.length})
              </h2>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">WAITING OVEN</span>
          </div>

          <div className="space-y-4">
            {incomingConfirmed.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 rounded-2xl border border-dashed border-[#2D382D]">
                No orders waiting to bake.
              </div>
            ) : (
              incomingConfirmed.map((ord) => {
                const mins = getElapsedMinutes(ord.created_at);
                const isUrgent = mins > 15;

                return (
                  <div
                    key={ord.id}
                    className={`p-4 rounded-2xl border shadow-md space-y-3 transition ${
                      isUrgent
                        ? 'bg-[#2A1E1E] border-red-500/60 ring-1 ring-red-500/50'
                        : 'bg-[#242C24] border-[#364436]'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-base text-white">
                          #{ord.order_number.slice(-4)}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-black/40 text-neutral-300">
                          {ord.order_type}
                        </span>
                      </div>
                      <div
                        className={`text-xs font-mono font-bold flex items-center gap-1 ${
                          isUrgent ? 'text-red-400 font-black animate-pulse' : 'text-amber-400'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{mins}m ago</span>
                      </div>
                    </div>

                    {/* Outlet & Customer name */}
                    <div className="text-xs text-neutral-300 flex justify-between pb-2 border-b border-white/10">
                      <span className="font-bold text-white">{ord.customer_name}</span>
                      <span className="text-[11px] text-neutral-400 capitalize">
                        {ord.branch === 'gla_university' ? 'GLA Campus' : 'Pali Khera'}
                      </span>
                    </div>

                    {/* Ordered Items with large readable typography */}
                    <div className="space-y-2 pt-1">
                      {ord.items?.map((item, idx) => (
                        <div key={idx} className="bg-black/20 p-2.5 rounded-xl border border-white/5 space-y-1">
                          <div className="flex items-center gap-2 text-sm font-black text-white">
                            <span className="w-6 h-6 rounded-lg bg-primary-green flex items-center justify-center text-xs shrink-0">
                              {item.quantity}x
                            </span>
                            <span>{item.product_name}</span>
                          </div>
                          {(item.variant_name || item.crust_name) && (
                            <div className="text-xs text-neutral-300 pl-8">
                              {item.variant_name && <span className="mr-2 font-bold text-amber-300">{item.variant_name}</span>}
                              {item.crust_name && <span className="text-neutral-400">({item.crust_name})</span>}
                            </div>
                          )}
                          {item.addons_json && item.addons_json.length > 0 && (
                            <div className="text-[11px] text-emerald-300 pl-8 font-semibold">
                              + {item.addons_json.map((a) => a.name).join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Cooking Notes */}
                    {ord.delivery_instructions && (
                      <div className="text-xs bg-amber-950/60 text-amber-200 p-2.5 rounded-xl border border-amber-800/40">
                        <span className="font-bold">Instructions: </span>
                        {ord.delivery_instructions}
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      type="button"
                      disabled={updatingId === ord.id}
                      onClick={() => handleAdvanceStatus(ord.id, 'preparing')}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-charcoal font-black py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      <Flame className="w-4 h-4 text-charcoal" />
                      <span>Start Baking / Prep</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: In Oven / Baking */}
        <div className="bg-[#1C221C] rounded-3xl p-4 sm:p-5 border border-[#2D382D] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2D382D]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-400 animate-pulse" />
              <h2 className="text-sm font-black uppercase tracking-wider text-purple-300">
                2. In Oven / Baking ({preparingOven.length})
              </h2>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">BAKING</span>
          </div>

          <div className="space-y-4">
            {preparingOven.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 rounded-2xl border border-dashed border-[#2D382D]">
                No orders currently in the oven.
              </div>
            ) : (
              preparingOven.map((ord) => {
                const mins = getElapsedMinutes(ord.created_at);
                const isUrgent = mins > 25;

                return (
                  <div
                    key={ord.id}
                    className={`p-4 rounded-2xl border shadow-md space-y-3 transition ${
                      isUrgent
                        ? 'bg-[#2A1E1E] border-red-500 ring-1 ring-red-500'
                        : 'bg-[#26212D] border-[#43364F]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-base text-white">
                          #{ord.order_number.slice(-4)}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200">
                          {ord.order_type}
                        </span>
                      </div>
                      <div
                        className={`text-xs font-mono font-bold flex items-center gap-1 ${
                          isUrgent ? 'text-red-400 font-black animate-pulse' : 'text-purple-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{mins}m total</span>
                      </div>
                    </div>

                    <div className="text-xs text-neutral-300 flex justify-between pb-2 border-b border-white/10">
                      <span className="font-bold text-white">{ord.customer_name}</span>
                      <span className="text-[11px] text-neutral-400 capitalize">
                        {ord.branch === 'gla_university' ? 'GLA Campus' : 'Pali Khera'}
                      </span>
                    </div>

                    <div className="space-y-2 pt-1">
                      {ord.items?.map((item, idx) => (
                        <div key={idx} className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1">
                          <div className="flex items-center gap-2 text-sm font-black text-white">
                            <span className="w-6 h-6 rounded-lg bg-purple-700 flex items-center justify-center text-xs shrink-0">
                              {item.quantity}x
                            </span>
                            <span>{item.product_name}</span>
                          </div>
                          {(item.variant_name || item.crust_name) && (
                            <div className="text-xs text-neutral-300 pl-8">
                              {item.variant_name && <span className="mr-2 font-bold text-purple-200">{item.variant_name}</span>}
                              {item.crust_name && <span className="text-neutral-400">({item.crust_name})</span>}
                            </div>
                          )}
                          {item.addons_json && item.addons_json.length > 0 && (
                            <div className="text-[11px] text-emerald-300 pl-8 font-semibold">
                              + {item.addons_json.map((a) => a.name).join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={updatingId === ord.id}
                      onClick={() =>
                        handleAdvanceStatus(
                          ord.id,
                          ord.order_type === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup'
                        )
                      }
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {ord.order_type === 'delivery' ? 'Ready for Dispatch 🛵' : 'Ready for Counter Pickup 🥡'}
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Ready for Handoff / Dispatch */}
        <div className="bg-[#1C221C] rounded-3xl p-4 sm:p-5 border border-[#2D382D] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2D382D]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <h2 className="text-sm font-black uppercase tracking-wider text-emerald-300">
                3. Ready for Handoff ({readyHandoff.length})
              </h2>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">DISPATCH</span>
          </div>

          <div className="space-y-4">
            {readyHandoff.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 rounded-2xl border border-dashed border-[#2D382D]">
                No orders waiting for pickup or delivery handoff.
              </div>
            ) : (
              readyHandoff.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-2xl bg-[#1F2B1F] border border-[#2F452F] shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-base text-white">
                        #{ord.order_number.slice(-4)}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-200">
                        {ord.order_type}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-300">
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-neutral-300 flex justify-between">
                    <span className="font-bold text-white">{ord.customer_name}</span>
                    <span className="text-neutral-400">{ord.customer_phone}</span>
                  </div>

                  <div className="text-xs text-neutral-400">
                    {ord.items?.map((it) => `${it.quantity}x ${it.product_name}`).join(', ')}
                  </div>

                  <button
                    type="button"
                    disabled={updatingId === ord.id}
                    onClick={() => handleAdvanceStatus(ord.id, 'completed')}
                    className="w-full bg-[#2A3B2A] hover:bg-neutral-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Mark Handed Over / Complete</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
