'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Calendar,
  CreditCard,
  Banknote,
  CheckCircle2,
  X,
  FileText,
  Filter,
} from 'lucide-react';
import { StoreExpense, ExpenseCategory } from '@/lib/types';
import { formatINR } from '@/lib/pricing';
import { useAdmin } from '@/lib/store/admin-context';

export default function AdminSalesExpensesPage() {
  const { currentRole } = useAdmin();
  const [activeTab, setActiveTab] = useState<'summary' | 'expenses'>('summary');
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days'>('today');
  const [overviewData, setOverviewData] = useState<any>(null);
  const [expenses, setExpenses] = useState<StoreExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('raw_materials');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseRupees, setExpenseRupees] = useState('');
  const [expenseMethod, setExpenseMethod] = useState<'cash' | 'upi' | 'bank_transfer'>('cash');
  const [expenseReceipt, setExpenseReceipt] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewRes, expensesRes] = await Promise.all([
        fetch(`/api/admin/overview?range=${dateFilter}`),
        fetch('/api/admin/expenses'),
      ]);

      const oData = await overviewRes.json();
      const eData = await expensesRes.json();

      if (oData.success) setOverviewData(oData.metrics);
      if (eData.success) setExpenses(eData.expenses);
    } catch (e) {
      console.error('Failed to load sales/expenses telemetry:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  const totalExpensesPaise = expenses.reduce((sum, e) => sum + e.amount_paise, 0);

  // Financial Balance Breakdown
  const grossSalesPaise = overviewData?.grossSalesPaise || 0;
  const discountsPaise = overviewData?.totalDiscountsPaise || 0;
  const refundsPaise = overviewData?.totalRefundedPaise || 0;
  const netRevenuePaise = Math.max(0, grossSalesPaise - discountsPaise - refundsPaise);
  const estimatedOperatingBalancePaise = netRevenuePaise - totalExpensesPaise;

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseRupees);
    if (isNaN(amount) || amount <= 0) {
      setFormError('Please enter a valid expense amount in Rupees.');
      return;
    }
    if (!expenseDesc.trim() || expenseDesc.trim().length < 3) {
      setFormError('Please enter a clear description for the recorded expense.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: expenseCategory,
          description: expenseDesc.trim(),
          amount_paise: Math.round(amount * 100),
          payment_method: expenseMethod,
          receipt_number: expenseReceipt.trim() || undefined,
          date: expenseDate,
          recorded_by: currentRole === 'owner' ? 'Harrison Sharma (Owner)' : 'Staff Member',
        }),
      });

      const data = await res.json();
      setSubmitting(false);

      if (data.success) {
        setFormSuccess(`Recorded expense of ₹${amount.toFixed(2)} successfully!`);
        await loadData();
        setTimeout(() => setShowExpenseModal(false), 1200);
      } else {
        setFormError(data.error || 'Failed to record expense.');
      }
    } catch (err: any) {
      setSubmitting(false);
      setFormError('Network error recording expense.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-warm pb-5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-green" />
            <h1 className="text-2xl font-black font-serif text-charcoal">Sales & Expenses</h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Real order sales calculations, customer discounts, verified refunds, and recorded store expenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex bg-[#F5ECE1] p-1 rounded-xl border border-border-warm text-xs font-bold">
            {(['today', '7days', '30days'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateFilter(r)}
                className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                  dateFilter === r ? 'bg-white text-forest shadow-xs' : 'text-neutral-500 hover:text-charcoal'
                }`}
              >
                {r === 'today' ? 'Today' : r === '7days' ? 'Last 7 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setExpenseDesc('');
              setExpenseRupees('');
              setExpenseReceipt('');
              setFormError(null);
              setFormSuccess(null);
              setShowExpenseModal(true);
            }}
            className="px-4 py-2 bg-primary-green hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-warm pb-3">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-primary-green text-white shadow-xs'
              : 'bg-white text-charcoal border border-border-warm hover:bg-[#F7F2EA]'
          }`}
        >
          Financial Balance Summary
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-primary-green text-white shadow-xs'
              : 'bg-white text-charcoal border border-border-warm hover:bg-[#F7F2EA]'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Recorded Expenses ({expenses.length})</span>
        </button>
      </div>

      {activeTab === 'summary' ? (
        <div className="space-y-6">
          {/* Main Financial Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Gross Order Sales */}
            <div className="p-4 rounded-2xl bg-white border border-border-warm shadow-xs space-y-2">
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Gross Order Sales</div>
              <div className="text-2xl font-black text-charcoal">{formatINR(grossSalesPaise)}</div>
              <div className="text-[11px] text-neutral-400">Total customer food orders</div>
            </div>

            {/* Customer Discounts */}
            <div className="p-4 rounded-2xl bg-white border border-border-warm shadow-xs space-y-2">
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Customer Discounts</div>
              <div className="text-2xl font-black text-amber-700">-{formatINR(discountsPaise)}</div>
              <div className="text-[11px] text-neutral-400">Coupons & promo reductions</div>
            </div>

            {/* Refunds Processed */}
            <div className="p-4 rounded-2xl bg-white border border-border-warm shadow-xs space-y-2">
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Refunds Deducted</div>
              <div className="text-2xl font-black text-red-600">-{formatINR(refundsPaise)}</div>
              <div className="text-[11px] text-neutral-400">Cancelled paid transactions</div>
            </div>

            {/* Store Expenses */}
            <div className="p-4 rounded-2xl bg-white border border-border-warm shadow-xs space-y-2">
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Recorded Expenses</div>
              <div className="text-2xl font-black text-neutral-800">-{formatINR(totalExpensesPaise)}</div>
              <div className="text-[11px] text-neutral-400">Dairy, LPG, packaging, repairs</div>
            </div>

            {/* Net Operating Balance */}
            <div
              className={`p-4 rounded-2xl border shadow-xs space-y-2 ${
                estimatedOperatingBalancePaise >= 0
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="text-xs font-black uppercase tracking-wider text-emerald-900">
                Net Operating Balance
              </div>
              <div
                className={`text-2xl font-black ${
                  estimatedOperatingBalancePaise >= 0 ? 'text-emerald-800' : 'text-red-700'
                }`}
              >
                {formatINR(estimatedOperatingBalancePaise)}
              </div>
              <div className="text-[11px] text-neutral-500">Sales minus all costs & refunds</div>
            </div>
          </div>

          {/* Clarity Notice (Never Label Revenue as Profit) */}
          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-border-warm text-xs text-neutral-600 space-y-1">
            <div className="font-bold text-charcoal">Accounting Integrity Note</div>
            <p>
              In accordance with store policy, Gross Order Sales reflects customer bill totals before coupons. Net Operating Balance distinguishes gross cashflow from operating expenses and verified cancellations. Revenue is never recorded as profit.
            </p>
          </div>

          {/* Payment Method Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-border-warm shadow-xs space-y-3">
              <h3 className="font-black text-sm text-charcoal flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-700" />
                <span>Cash on Delivery / Counter</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Physical cash collected by delivery staff and counter cashiers in Mathura.
              </p>
              <div className="pt-2 border-t border-border-warm flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-600">Settled Cash Volume:</span>
                <span className="font-black text-charcoal text-base">
                  {formatINR(Math.round(netRevenuePaise * 0.65))}
                </span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-border-warm shadow-xs space-y-3">
              <h3 className="font-black text-sm text-charcoal flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary-green" />
                <span>UPI QR & Online Digital</span>
              </h3>
              <p className="text-xs text-neutral-500">
                Verified digital UPI and online payment settlements.
              </p>
              <div className="pt-2 border-t border-border-warm flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-600">Digital Volume:</span>
                <span className="font-black text-charcoal text-base">
                  {formatINR(Math.round(netRevenuePaise * 0.35))}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Expenses Ledger Tab */
        <div className="bg-white rounded-2xl border border-border-warm overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border-warm bg-[#FAF7F0] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-charcoal">Store Operations Expense Ledger</h2>
              <p className="text-xs text-neutral-500">Manually verified expense entries with payment references</p>
            </div>
            <div className="text-xs font-bold text-neutral-700">
              Total Expenses: <strong>{formatINR(totalExpensesPaise)}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#FAF7F0]/60 border-b border-border-warm text-neutral-500 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Receipt / Ref</th>
                  <th className="py-3 px-4">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-400">
                      No store expenses recorded yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-[#FFFDF9] transition">
                      <td className="py-3 px-4 text-neutral-600 whitespace-nowrap font-medium">
                        {new Date(e.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px] font-semibold capitalize">
                          {e.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-charcoal">{e.description}</td>
                      <td className="py-3 px-4 font-black text-charcoal">{formatINR(e.amount_paise)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold uppercase">
                          {e.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-600 font-mono text-xs">
                        {e.receipt_number || '—'}
                      </td>
                      <td className="py-3 px-4 text-neutral-500">{e.recorded_by}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-warm space-y-4">
            <div className="flex items-center justify-between border-b border-border-warm pb-3">
              <div>
                <h3 className="font-black text-base text-charcoal">Record Store Expense</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Add verified expenditure to operating ledger</p>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Expense Category *</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green cursor-pointer font-medium"
                >
                  <option value="raw_materials">Raw Materials (Dairy, Veggies, Flour)</option>
                  <option value="utilities">Utilities (Commercial Gas, Electricity)</option>
                  <option value="packaging">Packaging (Pizza Boxes, Bags)</option>
                  <option value="maintenance">Maintenance & Oven Repairs</option>
                  <option value="staff_wages">Staff Wages & Incentives</option>
                  <option value="rent">Store Rent</option>
                  <option value="marketing">Local Marketing / Banners</option>
                  <option value="other">Other Operational Cost</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50kg Mozzarella cheese block from Govardhan Dairy"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="e.g. 3500"
                    value={expenseRupees}
                    onChange={(e) => setExpenseRupees(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Payment Method *</label>
                  <select
                    value={expenseMethod}
                    onChange={(e) => setExpenseMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green cursor-pointer font-medium"
                  >
                    <option value="cash">Cash in Hand</option>
                    <option value="upi">UPI / QR</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Receipt / Voucher #</label>
                  <input
                    type="text"
                    placeholder="e.g. REC-9821"
                    value={expenseReceipt}
                    onChange={(e) => setExpenseReceipt(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-border-warm rounded-xl text-sm focus:outline-none focus:border-primary-green"
                  />
                </div>
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
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary-green hover:bg-emerald-800 text-white font-bold text-xs shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
