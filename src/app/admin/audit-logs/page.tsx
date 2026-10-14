'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  ShieldCheck,
  UserCheck,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Lock,
} from 'lucide-react';
import { AuditLog } from '@/lib/types';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityFilter !== 'all') params.set('entityType', entityFilter);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (data.auditLogs) setLogs(data.auditLogs);
    } catch (e) {
      console.warn('Error loading audit logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [entityFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.entity_id?.toLowerCase().includes(q) ||
      log.user_name?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-border-warm shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary-green" />
            <h1 className="text-xl sm:text-2xl font-black text-forest font-serif">
              Immutable System Audit Trail
            </h1>
          </div>
          <p className="text-xs text-muted-gray mt-1">
            Tamper-evident operational log recording price revisions, coupon grants, order cancellations, and staff privilege changes.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-charcoal rounded-xl transition cursor-pointer self-start sm:self-auto"
          title="Refresh Audit Trail"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-3xl border border-border-warm shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, operator, or ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-10 pr-3 py-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden font-medium"
          />
        </div>

        <div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full text-xs p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-semibold text-charcoal focus:bg-white focus:outline-hidden"
          >
            <option value="all">All Entity Changes ({logs.length})</option>
            <option value="product">Product & Price Changes</option>
            <option value="coupon">Coupons & Promotions</option>
            <option value="order">Order Actions & Cancellations</option>
            <option value="booking">Table Booking Decisions</option>
            <option value="staff">Staff Roles & Permissions</option>
            <option value="settings">Restaurant Settings</option>
            <option value="category">Menu Categories</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-border-warm shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6EE] text-muted-gray uppercase font-bold text-[10px] tracking-wider border-b border-border-warm">
              <tr>
                <th className="px-5 py-3">Timestamp (IST)</th>
                <th className="px-5 py-3">Action Event</th>
                <th className="px-5 py-3">Entity Type</th>
                <th className="px-5 py-3">Target Ref</th>
                <th className="px-5 py-3">Operator</th>
                <th className="px-5 py-3">Details / Audit Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm font-medium text-charcoal">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-gray">
                    No audit records match your query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/80 transition">
                    <td className="px-5 py-4 text-muted-gray font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-[10px] bg-neutral-100 text-neutral-800 font-bold px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 uppercase font-bold text-[10px] text-muted-gray">
                      {log.entity_type}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-forest text-[11px]">
                      {log.entity_id || '—'}
                    </td>
                    <td className="px-5 py-4 font-bold text-charcoal text-xs">
                      {log.user_name || 'System / Staff'}
                    </td>
                    <td className="px-5 py-4 text-neutral-600 max-w-md text-xs">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
