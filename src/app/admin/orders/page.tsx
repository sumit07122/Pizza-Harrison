'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Search,
  Filter,
  Download,
  Eye,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  FileText,
  MapPin,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Flame,
  ArrowRight,
  DollarSign,
  Send,
  Ban,
  Check,
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';
import { formatINR } from '@/lib/pricing';
import { getClickToCallUrl } from '@/lib/whatsapp';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Order for Drawer
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Modals
  const [showKOTModal, setShowKOTModal] = useState<Order | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<Order | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<Order | null>(null);
  const [cancellationReason, setCancellationReason] = useState('Customer requested cancellation');

  // Internal note input
  const [newNote, setNewNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        dateRange: dateFilter,
      });
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (branchFilter !== 'all') params.set('branch', branchFilter);
      if (typeFilter !== 'all') params.set('orderType', typeFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);

        // Keep selected order updated if open
        if (selectedOrder) {
          const fresh = data.orders.find((o: Order) => o.id === selectedOrder.id);
          if (fresh) setSelectedOrder(fresh);
        }
      }
    } catch (e) {
      console.warn('Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 12000);
    return () => clearInterval(interval);
  }, [search, statusFilter, branchFilter, typeFilter, dateFilter, page]);

  // Status progression action
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', status: newStatus, changedBy: 'Staff Operator' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
      } else {
        alert(data.error || 'Failed to update order status.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Cancellation action with confirmation
  const handleConfirmCancel = async () => {
    if (!showCancelModal) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${showCancelModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          reason: cancellationReason,
          cancelledBy: 'Manager',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCancelModal(null);
        setCancellationReason('Customer requested cancellation');
        fetchOrders();
        if (selectedOrder?.id === showCancelModal.id) {
          setSelectedOrder(data.order);
        }
      } else {
        alert(data.error || 'Failed to cancel order.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Add internal note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newNote.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'note',
          note: newNote.trim(),
          updatedBy: 'Staff',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedOrder(data.order);
        setNewNote('');
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const downloadCSV = () => {
    const params = new URLSearchParams({
      format: 'csv',
      dateRange: dateFilter,
    });
    if (search.trim()) params.set('search', search.trim());
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (branchFilter !== 'all') params.set('branch', branchFilter);
    if (typeFilter !== 'all') params.set('orderType', typeFilter);

    window.open(`/api/admin/orders?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl">
      
      {/* Top Banner & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-border-warm shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-forest font-serif">
              Orders & Kitchen Operations
            </h1>
          </div>
          <p className="text-xs text-muted-gray mt-1">
            Real-time order processing, kitchen prep stages, KOT tickets, and verified customer delivery dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/kitchen"
            className="bg-primary-green hover:bg-forest text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition"
          >
            <Flame className="w-4 h-4 text-amber-300" />
            <span>Open Tablet KDS View &rarr;</span>
          </Link>

          <button
            type="button"
            onClick={downloadCSV}
            className="bg-neutral-100 hover:bg-neutral-200 text-charcoal text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            title="Export CSV of filtered orders"
          >
            <Download className="w-4 h-4 text-primary-green" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-border-warm shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-muted-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order ref (PH-...), name, or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs pl-10 pr-3 py-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden focus:border-primary-green font-medium"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-semibold text-charcoal focus:bg-white focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="placed">New Placed</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">In Oven / Preparing</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Fulfillment Type */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-semibold text-charcoal focus:bg-white focus:outline-hidden"
            >
              <option value="all">All Types</option>
              <option value="delivery">Delivery</option>
              <option value="pickup">Takeaway / Pickup</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-semibold text-charcoal focus:bg-white focus:outline-hidden"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-border-warm shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6EE] text-muted-gray uppercase font-bold text-[10px] tracking-wider border-b border-border-warm">
              <tr>
                <th className="px-5 py-3">Order Ref</th>
                <th className="px-5 py-3">Time (IST)</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Type & Branch</th>
                <th className="px-5 py-3">Items Summary</th>
                <th className="px-5 py-3">Total (INR)</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm font-medium text-charcoal">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-muted-gray">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-green" />
                    <p className="text-xs font-semibold">Loading orders from database...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <UtensilsCrossed className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-forest">No orders matched your criteria</h3>
                    <p className="text-xs text-muted-gray mt-1">Try clearing search terms or changing filters.</p>
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className="hover:bg-neutral-50/80 transition cursor-pointer"
                  >
                    <td className="px-5 py-4 font-mono font-black text-forest">
                      {ord.order_number}
                    </td>
                    <td className="px-5 py-4 text-muted-gray font-mono text-[11px] whitespace-nowrap">
                      {new Date(ord.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold">{ord.customer_name}</div>
                      <div className="text-[11px] text-muted-gray">+91 {ord.customer_phone}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="capitalize font-bold text-forest text-[11px] block">
                        {ord.order_type}
                      </span>
                      <span className="text-[10px] text-muted-gray">
                        {ord.branch === 'gla_university' ? 'GLA Campus' : 'Pali Khera'}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xs truncate text-[11px]">
                      {ord.items?.map((it) => `${it.product_name} (${it.quantity})`).join(', ') || 'Custom pizza items'}
                    </td>
                    <td className="px-5 py-4 font-black font-mono text-forest">
                      {formatINR(ord.total_paise)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider block">
                        {ord.payment_method.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          ord.payment_status === 'completed'
                            ? 'text-emerald-700'
                            : ord.payment_status === 'refunded'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }`}
                      >
                        ● {ord.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
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
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-charcoal transition"
                          title="Open Order Details Drawer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowKOTModal(ord)}
                          className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-charcoal transition"
                          title="Print Kitchen Ticket (KOT)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-border-warm flex items-center justify-between text-xs text-muted-gray">
          <div>
            Showing {orders.length} of {totalCount} orders (Page {page} of {totalPages})
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-border-warm hover:bg-neutral-50 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-charcoal px-2">{page}</span>
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
      </div>

      {/* ======================================================== */}
      {/* ORDER DETAILS DRAWER */}
      {/* ======================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-border-warm flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-lg text-forest">
                    {selectedOrder.order_number}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      selectedOrder.status === 'placed'
                        ? 'bg-amber-100 text-amber-800'
                        : selectedOrder.status === 'confirmed'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedOrder.status === 'preparing'
                        ? 'bg-purple-100 text-purple-800'
                        : selectedOrder.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : selectedOrder.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-[11px] text-muted-gray mt-0.5">
                  Placed at {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(selectedOrder)}
                  className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-charcoal text-xs font-bold flex items-center gap-1 transition"
                  title="Print Customer Receipt"
                >
                  <FileText className="w-3.5 h-3.5 text-primary-green" />
                  <span>Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowKOTModal(selectedOrder)}
                  className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-charcoal text-xs font-bold flex items-center gap-1 transition"
                  title="Print Kitchen Ticket"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-600" />
                  <span>KOT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-neutral-400 hover:text-charcoal rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              
              {/* Status Transition Control Buttons */}
              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-border-warm space-y-3">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-forest">
                  <span>Advance Order Status</span>
                  {actionLoading && <span className="text-[10px] text-muted-gray animate-pulse">Updating...</span>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {selectedOrder.status === 'placed' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleStatusChange(selectedOrder.id, 'confirmed')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Order</span>
                    </button>
                  )}

                  {(selectedOrder.status === 'placed' || selectedOrder.status === 'confirmed') && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleStatusChange(selectedOrder.id, 'preparing')}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Start Baking</span>
                    </button>
                  )}

                  {selectedOrder.status === 'preparing' && selectedOrder.order_type === 'delivery' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleStatusChange(selectedOrder.id, 'out_for_delivery')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Dispatch (Out for Delivery)</span>
                    </button>
                  )}

                  {selectedOrder.status === 'preparing' && selectedOrder.order_type === 'pickup' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleStatusChange(selectedOrder.id, 'ready_for_pickup')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Ready for Counter Pickup</span>
                    </button>
                  )}

                  {(selectedOrder.status === 'out_for_delivery' || selectedOrder.status === 'ready_for_pickup') && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleStatusChange(selectedOrder.id, 'completed')}
                      className="bg-green-700 hover:bg-green-800 text-white font-bold p-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark Delivered / Completed</span>
                    </button>
                  )}

                  {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setShowCancelModal(selectedOrder)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 font-bold p-2.5 rounded-xl border border-red-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Ban className="w-4 h-4" />
                      <span>Cancel Order...</span>
                    </button>
                  )}
                </div>

                {selectedOrder.status === 'cancelled' && (
                  <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs">
                    <span className="font-bold">Cancellation Reason: </span>
                    {selectedOrder.cancellation_reason || 'No reason provided'}
                    <div className="text-[10px] text-red-600 mt-1">
                      Refund status: {selectedOrder.payment_status} ({formatINR(selectedOrder.refunded_paise || selectedOrder.total_paise)})
                    </div>
                  </div>
                )}
              </div>

              {/* Customer & Delivery Information (Restricted to Authorized Staff) */}
              <div className="border border-border-warm rounded-2xl p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-forest uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span>Customer & Delivery Details</span>
                    <span className="bg-emerald-50 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full border border-emerald-200">
                      Staff Privileged
                    </span>
                  </h3>

                  <a
                    href={getClickToCallUrl(selectedOrder.customer_phone)}
                    className="text-xs font-bold text-primary-green hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Customer
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-gray text-[10px] block">Customer Name</span>
                    <span className="font-bold text-charcoal">{selectedOrder.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-gray text-[10px] block">Contact Mobile</span>
                    <span className="font-bold font-mono text-forest">+91 {selectedOrder.customer_phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-gray text-[10px] block">Branch Outlet</span>
                    <span className="font-bold capitalize text-charcoal">
                      {selectedOrder.branch === 'gla_university' ? 'GLA Campus Outlet' : 'Pali Khera (Main)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-gray text-[10px] block">Fulfillment Type</span>
                    <span className="font-bold capitalize text-charcoal">{selectedOrder.order_type}</span>
                  </div>
                </div>

                {selectedOrder.order_type === 'delivery' && (
                  <div className="pt-2 border-t border-border-warm text-xs space-y-1">
                    <span className="text-muted-gray text-[10px] block flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" />
                      <span>Delivery Address</span>
                    </span>
                    <p className="font-medium text-charcoal bg-[#FAF7F0] p-2.5 rounded-xl border border-border-warm">
                      {selectedOrder.delivery_address}
                      {selectedOrder.delivery_landmark && (
                        <span className="block text-[11px] text-muted-gray mt-1 font-normal">
                          Landmark: {selectedOrder.delivery_landmark}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Items & Customizations Breakdown */}
              <div className="border border-border-warm rounded-2xl p-4 space-y-3 bg-white">
                <h3 className="font-black text-forest uppercase tracking-wider text-[11px]">
                  Ordered Items & Customizations
                </h3>

                <div className="divide-y divide-border-warm">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-charcoal">
                          {item.quantity}x {item.product_name}
                        </div>
                        <div className="text-[11px] text-muted-gray space-x-2">
                          {item.variant_name && <span>Size: {item.variant_name}</span>}
                          {item.crust_name && <span>Crust: {item.crust_name}</span>}
                        </div>
                        {item.addons_json && item.addons_json.length > 0 && (
                          <div className="text-[10px] text-accent-green font-medium mt-0.5">
                            + {item.addons_json.map((a) => a.name).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="font-bold font-mono text-forest">
                        {formatINR(item.item_total_paise)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown Snapshot */}
              <div className="border border-border-warm rounded-2xl p-4 space-y-2 bg-white">
                <h3 className="font-black text-forest uppercase tracking-wider text-[11px]">
                  Price Snapshot & Verification
                </h3>

                <div className="space-y-1 text-xs text-neutral-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatINR(selectedOrder.subtotal_paise)}</span>
                  </div>
                  {selectedOrder.discount_paise > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Discount ({selectedOrder.applied_coupon_code || 'Promo'})</span>
                      <span className="font-mono">-{formatINR(selectedOrder.discount_paise)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-mono">{formatINR(selectedOrder.delivery_fee_paise)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes (5% GST)</span>
                    <span className="font-mono">{formatINR(selectedOrder.tax_paise)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Packaging Fee</span>
                    <span className="font-mono">{formatINR(selectedOrder.packaging_fee_paise)}</span>
                  </div>
                  <div className="pt-2 border-t border-border-warm flex justify-between font-black text-sm text-forest">
                    <span>Total Amount</span>
                    <span className="font-mono">{formatINR(selectedOrder.total_paise)}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] bg-[#FAF7F0] p-2.5 rounded-xl border border-border-warm">
                  <div>
                    <span className="text-muted-gray block text-[10px]">Payment Method</span>
                    <span className="font-bold uppercase text-charcoal">{selectedOrder.payment_method}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-gray block text-[10px]">Payment Status</span>
                    <span className="font-black uppercase text-emerald-700">{selectedOrder.payment_status}</span>
                  </div>
                </div>
              </div>

              {/* Internal Staff Notes */}
              <div className="border border-border-warm rounded-2xl p-4 space-y-3 bg-white">
                <h3 className="font-black text-forest uppercase tracking-wider text-[11px]">
                  Internal Staff Notes & Coordination
                </h3>

                {selectedOrder.internal_notes ? (
                  <pre className="p-3 rounded-xl bg-neutral-50 text-[11px] text-charcoal font-sans whitespace-pre-wrap border border-border-warm">
                    {selectedOrder.internal_notes}
                  </pre>
                ) : (
                  <p className="text-[11px] text-muted-gray italic">No staff notes recorded yet.</p>
                )}

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an internal note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 text-xs p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !newNote.trim()}
                    className="bg-primary-green hover:bg-forest text-white px-3 py-2.5 rounded-xl font-bold transition disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CANCELLATION CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-border-warm space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black font-serif text-forest">
                Confirm Order Cancellation
              </h3>
            </div>

            <p className="text-xs text-muted-gray">
              Are you sure you want to cancel order <span className="font-bold text-forest">{showCancelModal.order_number}</span>? 
              This will update the customer tracking status and record a refund for any paid balances.
            </p>

            <div>
              <label className="text-[11px] font-bold text-charcoal block mb-1">
                Reason for Cancellation (Required)
              </label>
              <textarea
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Customer cancelled via call, ingredients out of stock..."
                className="w-full text-xs p-3 border border-border-warm rounded-xl focus:outline-hidden focus:border-red-500 bg-[#FAF7F0]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(null)}
                className="px-4 py-2 text-xs font-bold text-muted-gray hover:text-charcoal rounded-xl cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={actionLoading || !cancellationReason.trim()}
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-black bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PRINTABLE KITCHEN TICKET (KOT) MODAL */}
      {/* ======================================================== */}
      {showKOTModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-border-warm space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border-warm">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black font-serif text-forest">Kitchen Order Ticket (KOT)</h3>
              </div>
              <button onClick={() => setShowKOTModal(null)} className="p-1 text-muted-gray hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ticket Preview */}
            <div className="p-5 bg-neutral-50 rounded-2xl border border-border-warm font-mono text-xs space-y-3">
              <div className="text-center pb-2 border-b border-dashed border-neutral-300">
                <div className="font-black text-sm">PIZZA HARRISON - MATHURA</div>
                <div className="text-[10px] uppercase font-bold text-muted-gray">
                  KOT Ticket #{showKOTModal.order_number.slice(-4)}
                </div>
                <div className="text-[10px] text-muted-gray">
                  {new Date(showKOTModal.created_at).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="flex justify-between text-[11px] font-bold">
                <span>Type: {showKOTModal.order_type.toUpperCase()}</span>
                <span>Branch: {showKOTModal.branch.toUpperCase()}</span>
              </div>

              <div className="border-t border-b border-dashed border-neutral-300 py-2 space-y-2">
                {showKOTModal.items?.map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-black text-xs">
                      {it.quantity} x {it.product_name}
                    </div>
                    {it.variant_name && <div className="text-[10px] text-neutral-600">Size: {it.variant_name}</div>}
                    {it.crust_name && <div className="text-[10px] text-neutral-600">Crust: {it.crust_name}</div>}
                    {it.addons_json && it.addons_json.length > 0 && (
                      <div className="text-[10px] text-emerald-800 font-bold">
                        Addons: {it.addons_json.map((a) => a.name).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {showKOTModal.delivery_instructions && (
                <div className="text-[10px] text-amber-900 bg-amber-50 p-2 rounded">
                  <span className="font-bold">Cooking Notes: </span>
                  {showKOTModal.delivery_instructions}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowKOTModal(null)}
                className="px-4 py-2 text-xs font-bold text-muted-gray hover:text-charcoal cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PRINTABLE CUSTOMER RECEIPT MODAL */}
      {/* ======================================================== */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-border-warm space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border-warm">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-green" />
                <h3 className="text-base font-black font-serif text-forest">Tax Invoice & Receipt</h3>
              </div>
              <button onClick={() => setShowReceiptModal(null)} className="p-1 text-muted-gray hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Preview */}
            <div className="p-5 bg-neutral-50 rounded-2xl border border-border-warm font-sans text-xs space-y-3">
              <div className="text-center pb-2 border-b border-dashed border-neutral-300">
                <div className="font-serif font-black text-base text-forest">PIZZA HARRISON</div>
                <div className="text-[10px] text-muted-gray">Sonkh Road, Pali Khera & GLA University, Mathura</div>
                <div className="text-[10px] font-mono mt-0.5 text-muted-gray">GSTIN: 09AAECP1234F1Z8</div>
                <div className="text-[10px] font-mono font-bold text-forest mt-1">
                  Invoice Ref: {showReceiptModal.order_number}
                </div>
              </div>

              <div className="flex justify-between text-[11px]">
                <div>
                  <span className="text-muted-gray block text-[10px]">Customer</span>
                  <span className="font-bold">{showReceiptModal.customer_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-gray block text-[10px]">Date</span>
                  <span className="font-mono">{new Date(showReceiptModal.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-neutral-300 py-2 space-y-1.5 font-mono text-xs">
                {showReceiptModal.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {it.quantity}x {it.product_name}
                    </span>
                    <span>{formatINR(it.item_total_paise)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-xs text-neutral-600 font-mono">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatINR(showReceiptModal.subtotal_paise)}</span>
                </div>
                {showReceiptModal.discount_paise > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>-{formatINR(showReceiptModal.discount_paise)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{formatINR(showReceiptModal.delivery_fee_paise)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5% Included)</span>
                  <span>{formatINR(showReceiptModal.tax_paise)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Packaging Fee</span>
                  <span>{formatINR(showReceiptModal.packaging_fee_paise)}</span>
                </div>
                <div className="pt-2 border-t border-neutral-300 flex justify-between font-black text-sm text-forest">
                  <span>TOTAL PAID</span>
                  <span>{formatINR(showReceiptModal.total_paise)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-muted-gray pt-2 border-t border-dashed border-neutral-300">
                Thank you for ordering with Pizza Harrison Mathura!
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReceiptModal(null)}
                className="px-4 py-2 text-xs font-bold text-muted-gray hover:text-charcoal cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-bold bg-primary-green hover:bg-forest text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
