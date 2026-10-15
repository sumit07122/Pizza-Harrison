'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  History,
  TrendingUp,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  X,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { InventoryItem, StockMovement, InventoryItemCategory } from '@/lib/types';
import { formatINR } from '@/lib/pricing';
import { useAdmin } from '@/lib/store/admin-context';

export default function AdminInventoryPage() {
  const { currentRole } = useAdmin();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'movements'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Purchase Form State
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchaseCostRupees, setPurchaseCostRupees] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [purchaseReason, setPurchaseReason] = useState('');

  // Adjustment Form State
  const [adjustQtyDelta, setAdjustQtyDelta] = useState('');
  const [movementType, setMovementType] = useState<'adjustment' | 'wastage' | 'manual_count'>('adjustment');
  const [adjustReason, setAdjustReason] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/inventory');
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setMovements(data.movements);
      }
    } catch (e) {
      console.error('Error loading inventory:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const lowStockItems = items.filter((i) => i.current_quantity <= i.low_stock_threshold);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.supplier_name && item.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesLowStock = !onlyLowStock || item.current_quantity <= item.low_stock_threshold;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const handleOpenPurchase = (item: InventoryItem) => {
    setSelectedItem(item);
    setPurchaseQty('');
    setPurchaseCostRupees(((item.purchase_cost_paise || 0) / 100).toString());
    setSupplierName(item.supplier_name || '');
    setPurchaseReason('');
    setFormError(null);
    setFormSuccess(null);
    setShowPurchaseModal(true);
  };

  const handleOpenAdjust = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustQtyDelta('');
    setMovementType('adjustment');
    setAdjustReason('');
    setFormError(null);
    setFormSuccess(null);
    setShowAdjustModal(true);
  };

  const handleQuickDelta = async (item: InventoryItem, delta: number) => {
    const newQty = Math.max(0, item.current_quantity + delta);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, current_quantity: newQty } : i))
    );

    try {
      await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjustment',
          item_id: item.id,
          quantity_delta: delta,
          movement_type: delta < 0 ? 'wastage' : 'manual_count',
          reason: `1-Click quick ${delta > 0 ? '+' : ''}${delta} stock adjustment`,
          recorded_by: 'Admin',
        }),
      });
    } catch (e) {
      console.error(e);
      loadData();
    }
  };

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const qty = parseFloat(purchaseQty);
    const cost = parseFloat(purchaseCostRupees);

    if (isNaN(qty) || qty <= 0) {
      setFormError('Please enter a valid purchase quantity greater than 0.');
      return;
    }
    if (isNaN(cost) || cost < 0) {
      setFormError('Please enter a valid total cost.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase',
          item_id: selectedItem.id,
          quantity: qty,
          purchase_cost_paise: Math.round(cost * 100),
          supplier_name: supplierName.trim() || undefined,
          recorded_by: currentRole === 'owner' ? 'Harrison Sharma (Owner)' : 'Staff Member',
          reason: purchaseReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      setSubmitting(false);

      if (data.success) {
        setFormSuccess(`Recorded purchase of +${qty} ${selectedItem.unit}. Stock updated!`);
        await loadData();
        setTimeout(() => setShowPurchaseModal(false), 1200);
      } else {
        setFormError(data.error || 'Failed to record purchase.');
      }
    } catch (err: any) {
      setSubmitting(false);
      setFormError('Network error recording purchase.');
    }
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const delta = parseFloat(adjustQtyDelta);

    if (isNaN(delta)) {
      setFormError('Please enter a valid quantity adjustment.');
      return;
    }
    if (!adjustReason.trim() || adjustReason.trim().length < 4) {
      setFormError('A mandatory reason (minimum 4 characters) is required for stock adjustments.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjustment',
          item_id: selectedItem.id,
          quantity_delta: delta,
          movement_type: movementType,
          reason: adjustReason.trim(),
          recorded_by: currentRole === 'owner' ? 'Harrison Sharma (Owner)' : 'Staff Member',
        }),
      });
      const data = await res.json();
      setSubmitting(false);

      if (data.success) {
        setFormSuccess(`Stock adjusted successfully for ${selectedItem.name}!`);
        await loadData();
        setTimeout(() => setShowAdjustModal(false), 1200);
      } else {
        setFormError(data.error || 'Failed to adjust stock.');
      }
    } catch (err: any) {
      setSubmitting(false);
      setFormError('Network error adjusting stock.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-warm pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-primary-green" />
            <h1 className="text-2xl font-black font-serif text-charcoal">Inventory & Stock</h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Manual stock management, low-stock threshold alerts, and verified supply purchase records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'items'
                ? 'bg-primary-green text-white shadow-xs'
                : 'bg-white text-charcoal border border-border-warm hover:bg-[#F7F2EA]'
            }`}
          >
            Current Inventory ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'movements'
                ? 'bg-primary-green text-white shadow-xs'
                : 'bg-white text-charcoal border border-border-warm hover:bg-[#F7F2EA]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Stock Movements ({movements.length})</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alerts Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-amber-900">
                Low Stock Warning: {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} at or below threshold
              </h2>
              <p className="text-xs text-amber-700 mt-0.5">
                {lowStockItems.map((i) => `${i.name} (${i.current_quantity} ${i.unit})`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              onlyLowStock
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }`}
          >
            {onlyLowStock ? 'Show All Items' : 'Filter Low Stock Only'}
          </button>
        </div>
      )}

      {activeTab === 'items' ? (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search ingredients, supplies, or suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border-warm rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-green"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 bg-white border border-border-warm rounded-xl text-xs sm:text-sm text-charcoal focus:outline-none focus:border-primary-green font-medium cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="flour_dough">Flour & Dough</option>
              <option value="cheese_dairy">Cheese & Dairy</option>
              <option value="sauces">Sauces & Seasoning</option>
              <option value="vegetables">Fresh Vegetables</option>
              <option value="packaging">Packaging & Boxes</option>
              <option value="utilities">Kitchen Utilities</option>
            </select>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-2xl border border-border-warm overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#FAF7F0] border-b border-border-warm text-neutral-500 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Threshold</th>
                    <th className="py-3 px-4">Unit Cost</th>
                    <th className="py-3 px-4">Primary Supplier</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-400">
                        Loading inventory records...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-400">
                        No inventory items matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isLow = item.current_quantity <= item.low_stock_threshold;
                      return (
                        <tr key={item.id} className="hover:bg-[#FFFDF9] transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-charcoal">{item.name}</div>
                            <div className="text-[10px] text-neutral-400">
                              Updated {new Date(item.last_updated_at).toLocaleDateString('en-IN')}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px] font-semibold capitalize">
                              {item.category.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuickDelta(item, -1)}
                                className="w-6 h-6 rounded-md bg-neutral-100 hover:bg-red-100 hover:text-red-700 font-bold text-xs flex items-center justify-center transition cursor-pointer"
                                title="Decrease stock by 1"
                              >
                                -
                              </button>
                              <span
                                className={`font-black font-mono px-2 py-0.5 rounded-md min-w-[70px] text-center ${
                                  isLow
                                    ? 'text-amber-700 bg-amber-50 border border-amber-200'
                                    : 'text-charcoal bg-neutral-50'
                                }`}
                              >
                                {item.current_quantity} {item.unit}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuickDelta(item, 1)}
                                className="w-6 h-6 rounded-md bg-neutral-100 hover:bg-emerald-100 hover:text-emerald-700 font-bold text-xs flex items-center justify-center transition cursor-pointer"
                                title="Increase stock by 1"
                              >
                                +
                              </button>
                              {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-neutral-500">
                            {item.low_stock_threshold} {item.unit}
                          </td>
                          <td className="py-3 px-4 font-semibold text-charcoal">
                            {formatINR(item.purchase_cost_paise)} / {item.unit}
                          </td>
                          <td className="py-3 px-4 text-neutral-600">
                            {item.supplier_name || '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenPurchase(item)}
                                className="px-2.5 py-1.5 rounded-lg bg-primary-green/10 text-primary-green hover:bg-primary-green hover:text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Purchase</span>
                              </button>
                              <button
                                onClick={() => handleOpenAdjust(item)}
                                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Adjust</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Stock Movement History */
        <div className="bg-white rounded-2xl border border-border-warm overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border-warm bg-[#FAF7F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary-green" />
              <h2 className="text-sm font-bold text-charcoal">Verified Stock Movement Ledger</h2>
            </div>
            <span className="text-xs text-neutral-500">Immutable audit log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#FAF7F0]/60 border-b border-border-warm text-neutral-500 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Qty Change</th>
                  <th className="py-3 px-4">Stock Level</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-400">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-[#FFFDF9] transition">
                      <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-charcoal">{m.item_name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                            m.movement_type === 'purchase'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.movement_type === 'wastage'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {m.movement_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black">
                        <span className={m.quantity_delta >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                          {m.quantity_delta >= 0 ? `+${m.quantity_delta}` : m.quantity_delta}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        {m.previous_quantity} &rarr; <strong>{m.new_quantity}</strong>
                      </td>
                      <td className="py-3 px-4 text-neutral-700 max-w-xs">{m.reason}</td>
                      <td className="py-3 px-4 text-neutral-500">{m.recorded_by}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-warm space-y-4">
            <div className="flex items-center justify-between border-b border-border-warm pb-3">
              <div>
                <h3 className="font-black text-base text-charcoal">Record Stock Purchase</h3>
                <p className="text-xs text-neutral-500 mt-0.5">{selectedItem.name}</p>
              </div>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Quantity to Add ({selectedItem.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder={`e.g. 10`}
                  value={purchaseQty}
                  onChange={(e) => setPurchaseQty(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  Total Purchase Cost (₹) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="e.g. 1500"
                  value={purchaseCostRupees}
                  onChange={(e) => setPurchaseCostRupees(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Supplier Name</label>
                <input
                  type="text"
                  placeholder="e.g. Braj Agro Mills, Mathura"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Notes / Invoice Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Invoice #9822 delivered to kitchen"
                  value={purchaseReason}
                  onChange={(e) => setPurchaseReason(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green"
                />
              </div>

              {formError && <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">{formError}</div>}
              {formSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary-green hover:bg-emerald-800 text-white font-bold text-xs shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Confirm Stock Addition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjustModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-warm space-y-4">
            <div className="flex items-center justify-between border-b border-border-warm pb-3">
              <div>
                <h3 className="font-black text-base text-charcoal">Adjust Stock Quantity</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {selectedItem.name} (Current: {selectedItem.current_quantity} {selectedItem.unit})
                </p>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdjustment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Adjustment Type *</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green cursor-pointer font-medium"
                >
                  <option value="adjustment">Correction (+ / - change)</option>
                  <option value="wastage">Wastage / Spoiled Ingredient (- change)</option>
                  <option value="manual_count">Set Absolute Count (Replaces current qty)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  {movementType === 'manual_count'
                    ? `New Absolute Quantity (${selectedItem.unit}) *`
                    : `Quantity Delta (+ or - in ${selectedItem.unit}) *`}
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder={movementType === 'manual_count' ? 'e.g. 25' : 'e.g. -2 or 5'}
                  value={adjustQtyDelta}
                  onChange={(e) => setAdjustQtyDelta(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Reason for Adjustment *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Broken seal during delivery, evening stock count discrepancy, etc."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green"
                />
              </div>

              {formError && <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">{formError}</div>}
              {formSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{formSuccess}</span>
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
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary-green hover:bg-emerald-800 text-white font-bold text-xs shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Record Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
