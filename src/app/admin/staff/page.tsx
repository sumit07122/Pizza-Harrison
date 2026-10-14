'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCog,
  ShieldCheck,
  Plus,
  Edit,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  X,
  Phone,
  Mail,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { Profile, StaffRole } from '@/lib/types';

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatedRole, setSimulatedRole] = useState<StaffRole>('owner');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Profile | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<StaffRole>('order_staff');

  // Add form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('order_staff');

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      if (data.staff) setStaffList(data.staff);
    } catch (e) {
      console.warn('Error loading staff list', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('Staff name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          role,
          requesterRole: simulatedRole, // Pass active role for RBAC check
          requesterName: simulatedRole === 'owner' ? 'Harrison Sharma (Owner)' : 'Staff Member',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setFullName('');
        setPhone('');
        setEmail('');
        loadStaff();
      } else {
        setFormError(data.error || 'Failed to create staff member.');
      }
    } catch (e: any) {
      setFormError(e.message || 'Server error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setFormError('');

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: editingStaff.id,
          newRole: selectedNewRole,
          requesterRole: simulatedRole, // Server verifies this must be owner
          requesterName: simulatedRole === 'owner' ? 'Harrison Sharma (Owner)' : 'Staff Member',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditingStaff(null);
        loadStaff();
      } else {
        setFormError(data.error || 'Failed to update role.');
      }
    } catch (e: any) {
      setFormError(e.message || 'Server error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-border-warm shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary-green" />
            <h1 className="text-xl sm:text-2xl font-black text-forest font-serif">
              Staff & Role-Based Access Control (RBAC)
            </h1>
          </div>
          <p className="text-xs text-muted-gray mt-1">
            Enforce server-side permissions across Owner, Outlet Manager, Order Staff, and Kitchen Staff.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError('');
            setShowAddModal(true);
          }}
          className="bg-primary-green hover:bg-forest text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* RBAC Testing & Simulator Ribbon */}
      <div className="bg-[#FAF7F0] p-5 rounded-3xl border border-border-warm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-forest block">
              Active Security Role Simulator
            </span>
            <p className="text-xs text-muted-gray">
              Switch roles to verify server-side authorization enforcement. Only Owner can modify staff roles.
            </p>
          </div>

          {/* Role selector */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-border-warm text-xs font-bold">
            {(['owner', 'manager', 'order_staff', 'kitchen_staff'] as StaffRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSimulatedRole(r)}
                className={`px-3 py-1.5 rounded-lg transition capitalize cursor-pointer ${
                  simulatedRole === r
                    ? 'bg-primary-green text-white shadow-xs'
                    : 'text-charcoal hover:bg-neutral-100'
                }`}
              >
                {r.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {simulatedRole !== 'owner' && (
          <div className="p-3 bg-amber-50 text-amber-900 rounded-xl text-xs border border-amber-200 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Simulating <strong>{simulatedRole.replace(/_/g, ' ')}</strong> role. Attempting to add staff or modify permissions will be strictly denied by the backend authorization guard.
            </span>
          </div>
        )}
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white rounded-3xl border border-border-warm shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6EE] text-muted-gray uppercase font-bold text-[10px] tracking-wider border-b border-border-warm">
              <tr>
                <th className="px-5 py-3">Staff Name</th>
                <th className="px-5 py-3">Phone & Email</th>
                <th className="px-5 py-3">Operational Role</th>
                <th className="px-5 py-3">Permitted Capabilities</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm font-medium text-charcoal">
              {staffList.map((st) => (
                <tr key={st.id} className="hover:bg-neutral-50/80 transition">
                  <td className="px-5 py-4">
                    <div className="font-bold text-forest text-sm">{st.full_name}</div>
                    <div className="text-[10px] text-muted-gray font-mono">ID: {st.id}</div>
                  </td>

                  <td className="px-5 py-4 text-xs">
                    <div className="font-mono text-forest font-bold">+91 {st.phone || '—'}</div>
                    <div className="text-[11px] text-muted-gray">{st.email || '—'}</div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        st.role === 'owner'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : st.role === 'manager'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : st.role === 'order_staff'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {st.role.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-[11px] text-muted-gray max-w-xs">
                    {st.role === 'owner' && 'Full Business Administration & Role Governance'}
                    {st.role === 'manager' && 'Orders, Table Bookings, Menu Editing, Offers & Reports'}
                    {st.role === 'order_staff' && 'Order Status & Customer Table Requests Operations'}
                    {st.role === 'kitchen_staff' && 'Kitchen KDS Display & Baking Status Transitions Only'}
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStaff(st);
                        setSelectedNewRole(st.role as StaffRole);
                        setFormError('');
                      }}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-charcoal rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Change Role</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix Reference Table */}
      <div className="bg-white rounded-3xl p-6 border border-border-warm shadow-xs space-y-4">
        <h2 className="text-base font-black text-forest font-serif">
          Server-Side RBAC Permission Matrix
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-border-warm rounded-2xl overflow-hidden">
            <thead className="bg-[#FAF6EE] text-muted-gray uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3">Capability / Screen</th>
                <th className="p-3 text-center">Owner</th>
                <th className="p-3 text-center">Manager</th>
                <th className="p-3 text-center">Order Staff</th>
                <th className="p-3 text-center">Kitchen Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm font-medium">
              {[
                { label: 'View Revenue & Financial Telemetry', o: true, m: true, ord: false, k: false },
                { label: 'Manage Staff Roles & Privileges', o: true, m: false, ord: false, k: false },
                { label: 'Menu Recipe & Price Editing', o: true, m: true, ord: false, k: false },
                { label: 'Launch Promotional Coupons', o: true, m: true, ord: false, k: false },
                { label: 'Customer Directory & Phone Calling', o: true, m: true, ord: true, k: false },
                { label: 'Kitchen KDS Baking & Handoff Actions', o: true, m: true, ord: true, k: true },
                { label: 'Modify Restaurant Store Settings', o: true, m: true, ord: false, k: false },
                { label: 'View Immutable Audit Trail', o: true, m: true, ord: false, k: false },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-neutral-50/50">
                  <td className="p-3 font-semibold text-charcoal">{row.label}</td>
                  <td className="p-3 text-center">{row.o ? '✅ Allowed' : '❌ Denied'}</td>
                  <td className="p-3 text-center">{row.m ? '✅ Allowed' : '❌ Denied'}</td>
                  <td className="p-3 text-center">{row.ord ? '✅ Allowed' : '❌ Denied'}</td>
                  <td className="p-3 text-center">{row.k ? '✅ Allowed' : '❌ Denied'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Change Staff Role */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-border-warm space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border-warm">
              <h3 className="font-serif font-black text-forest">Change Role for {editingStaff.full_name}</h3>
              <button onClick={() => setEditingStaff(null)} className="p-1 text-muted-gray">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateRole} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-charcoal block mb-1">Select New Operational Role</label>
                <select
                  value={selectedNewRole}
                  onChange={(e) => setSelectedNewRole(e.target.value as StaffRole)}
                  className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-bold text-forest"
                >
                  <option value="owner">Owner (Full Business Administration)</option>
                  <option value="manager">Manager (Orders, Menu, Promos, Reports)</option>
                  <option value="order_staff">Order Staff (Customer Desk & Delivery)</option>
                  <option value="kitchen_staff">Kitchen Staff (KDS Preparation Only)</option>
                </select>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl text-[11px] text-muted-gray border border-border-warm">
                Note: Role changes will be permanently recorded in the system audit trail along with your identity.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 font-bold text-muted-gray hover:text-charcoal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-primary-green hover:bg-forest text-white font-black rounded-xl shadow-xs transition"
                >
                  {submitting ? 'Updating...' : 'Save Role Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Staff Member */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-border-warm space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border-warm">
              <h3 className="font-serif font-black text-forest">Add New Staff Member</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-muted-gray">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-charcoal block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9897000000"
                  className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ramesh@pizzaharrison.com"
                  className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal block mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-bold text-forest"
                >
                  <option value="order_staff">Order Staff</option>
                  <option value="kitchen_staff">Kitchen Staff</option>
                  <option value="manager">Outlet Manager</option>
                  <option value="owner">Restaurant Owner</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border-warm">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-muted-gray hover:text-charcoal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-primary-green hover:bg-forest text-white font-black rounded-xl shadow-xs transition"
                >
                  {submitting ? 'Creating...' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
