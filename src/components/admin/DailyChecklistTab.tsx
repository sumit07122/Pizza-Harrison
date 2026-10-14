'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sun,
  Moon,
  RefreshCw,
  ShieldCheck,
  Calendar,
  Check,
} from 'lucide-react';
import { DailyChecklistRecord, DailyChecklistItem } from '@/lib/types';
import { useAdmin } from '@/lib/store/admin-context';

export function DailyChecklistTab() {
  const { currentRole, staffName } = useAdmin();
  const [checklists, setChecklists] = useState<DailyChecklistRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadChecklists = async (dateStr?: string) => {
    setLoading(true);
    try {
      const d = dateStr || selectedDate;
      const res = await fetch(`/api/admin/checklists?date=${d}`);
      const data = await res.json();
      if (data.success) {
        setChecklists(data.checklists || []);
      }
    } catch (e) {
      console.warn('Failed to load checklists', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChecklists(selectedDate);
  }, [selectedDate]);

  const handleToggleItem = async (checklistId: string, itemId: string) => {
    setActionLoading(itemId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_item',
          checklistId,
          itemId,
          staffName: staffName || 'Manager',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChecklists((prev) =>
          prev.map((c) => (c.id === checklistId ? data.record : c))
        );
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update item.' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: 'Network error updating checklist task.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitChecklist = async (checklistId: string, type: 'opening' | 'closing') => {
    if (!confirm(`Submit and finalize today's ${type} checklist?`)) return;
    setActionLoading(checklistId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_checklist',
          checklistId,
          staffName: staffName || 'Manager',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChecklists((prev) =>
          prev.map((c) => (c.id === checklistId ? data.record : c))
        );
        setMessage({
          type: 'success',
          text: `Successfully finalized ${type} checklist for ${selectedDate}!`,
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit checklist.' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: 'Network error submitting checklist.' });
    } finally {
      setActionLoading(null);
    }
  };

  const openingRecord = checklists.find((c) => c.type === 'opening');
  const closingRecord = checklists.find((c) => c.type === 'closing');

  const renderChecklistCard = (record?: DailyChecklistRecord, type: 'opening' | 'closing' = 'opening') => {
    if (!record) return null;
    const isOpening = type === 'opening';
    const completedCount = record.items.filter((i) => i.completed).length;
    const totalCount = record.items.length;
    const progressPercent = Math.round((completedCount / totalCount) * 100);

    return (
      <div className="bg-white rounded-3xl p-6 border border-border-warm shadow-xs space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border-warm pb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isOpening ? 'bg-amber-100 text-amber-900' : 'bg-indigo-100 text-indigo-900'
                }`}
              >
                {isOpening ? <Sun className="w-5 h-5 text-amber-700" /> : <Moon className="w-5 h-5 text-indigo-700" />}
              </div>
              <div>
                <h3 className="font-black text-forest font-serif text-base">
                  {isOpening ? 'Morning Opening Shift' : 'Evening Closing Shift'}
                </h3>
                <span className="text-[11px] text-muted-gray">
                  {isOpening ? 'Prep & Operations Calibration' : 'Cash & Facility Settlement'}
                </span>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                record.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : record.status === 'in_progress'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {record.status === 'completed'
                ? 'Completed'
                : record.status === 'in_progress'
                ? 'In Progress'
                : 'Pending'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-charcoal">
              <span>Shift Task Completion:</span>
              <span className="font-mono text-primary-green">
                {completedCount} of {totalCount} Tasks ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${progressPercent}%` }}
                className={`h-full transition-all duration-300 ${
                  progressPercent === 100 ? 'bg-primary-green' : 'bg-amber-500'
                }`}
              />
            </div>
          </div>

          {/* Task Checklist Items */}
          <div className="space-y-2 pt-1">
            {record.items.map((item) => (
              <label
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                  item.completed
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-[#FAF7F0] border-border-warm hover:border-neutral-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  disabled={actionLoading === item.id}
                  onChange={() => handleToggleItem(record.id, item.id)}
                  className="mt-0.5 accent-primary-green w-4 h-4 cursor-pointer"
                />
                <div className="flex-1 text-xs">
                  <span
                    className={`font-semibold block ${
                      item.completed ? 'text-forest line-through opacity-80' : 'text-charcoal'
                    }`}
                  >
                    {item.task}
                  </span>
                  {item.completed && item.completed_by && (
                    <span className="text-[10px] text-emerald-700 block mt-0.5">
                      ✓ Done by {item.completed_by} at{' '}
                      {new Date(item.completed_at || '').toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Card Footer / Submission */}
        <div className="pt-4 border-t border-border-warm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-muted-gray">
            {record.submitted_by ? (
              <span>Finalized by {record.submitted_by}</span>
            ) : (
              <span>Unsaved tasks persist automatically</span>
            )}
          </div>

          <button
            type="button"
            disabled={actionLoading === record.id || record.status === 'completed'}
            onClick={() => handleSubmitChecklist(record.id, type)}
            className="px-4 py-2 bg-primary-green hover:bg-forest text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{record.status === 'completed' ? 'Finalized' : 'Finalize Checklist'}</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-3xl border border-border-warm shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary-green" />
            <h2 className="text-xl font-black text-forest font-serif">
              Store Opening & Closing Checklists
            </h2>
          </div>
          <p className="text-xs text-muted-gray mt-1">
            Standard Operating Procedures (SOPs) for daily kitchen calibration, cash settlement, and safety verification in Mathura.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-[#FAF7F0] p-1.5 rounded-xl border border-border-warm text-xs font-bold">
            <Calendar className="w-4 h-4 text-muted-gray" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-charcoal focus:outline-hidden font-medium"
            />
          </div>

          <button
            type="button"
            onClick={() => loadChecklists(selectedDate)}
            className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-charcoal rounded-xl transition cursor-pointer"
            title="Refresh checklists"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid: Opening & Closing Shifts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderChecklistCard(openingRecord, 'opening')}
        {renderChecklistCard(closingRecord, 'closing')}
      </div>
    </div>
  );
}
