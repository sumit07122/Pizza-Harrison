'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Check,
  X,
  Clock,
  MapPin,
  Users,
  Search,
  MessageCircle,
  Phone,
  RefreshCw,
  Download,
  Calendar as CalendarIcon,
  List,
  AlertTriangle,
  Edit,
  CheckCircle2,
  Ban,
  Armchair,
} from 'lucide-react';
import { Booking, BookingStatus } from '@/lib/types';
import { getClickToCallUrl } from '@/lib/whatsapp';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Staff note editor modal
  const [editingNoteBooking, setEditingNoteBooking] = useState<Booking | null>(null);
  const [noteText, setNoteText] = useState('');

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (dateFilter) params.set('date', dateFilter);

      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      const data = await res.json();
      if (data.bookings) setBookings(data.bookings);
    } catch (e) {
      console.warn('Error loading bookings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [statusFilter, dateFilter]);

  const handleUpdateStatus = async (
    bookingId: string,
    newStatus: BookingStatus,
    staffNotes?: string
  ) => {
    setUpdatingId(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, staffNotes }),
      });
      const data = await res.json();
      if (data.success && data.booking) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId || b.booking_reference === bookingId ? data.booking : b))
        );
      }
    } catch (e) {
      console.error('Failed to update booking status', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNoteBooking) return;

    await handleUpdateStatus(editingNoteBooking.id, editingNoteBooking.status, noteText);
    setEditingNoteBooking(null);
  };

  const downloadCSV = () => {
    window.open('/api/admin/bookings?format=csv', '_blank');
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (dateFilter && b.booking_date !== dateFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.customer_name.toLowerCase().includes(q);
      const matchRef = b.booking_reference.toLowerCase().includes(q);
      const matchPhone = b.customer_phone.includes(q);
      if (!matchName && !matchRef && !matchPhone) return false;
    }
    return true;
  });

  // Calculate total guests booked for the selected date to verify seating capacity
  const totalGuestsOnDate = filteredBookings
    .filter((b) => b.status === 'confirmed' || b.status === 'seated')
    .reduce((sum, b) => sum + b.guest_count, 0);

  return (
    <div className="space-y-6 max-w-7xl">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-border-warm shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-primary-green" />
            <h1 className="text-xl sm:text-2xl font-black text-forest font-serif">
              Table Bookings & Reservations
            </h1>
          </div>
          <p className="text-xs text-muted-gray mt-1">
            Review guest requests, verify dining hall capacity, and confirm reservations via WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="bg-[#FAF7F0] p-1 rounded-xl border border-border-warm flex items-center text-xs font-bold text-charcoal">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'list'
                  ? 'bg-primary-green text-white shadow-xs'
                  : 'hover:text-primary-green'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'calendar'
                  ? 'bg-primary-green text-white shadow-xs'
                  : 'hover:text-primary-green'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Schedule Grid</span>
            </button>
          </div>

          <button
            type="button"
            onClick={downloadCSV}
            className="bg-neutral-100 hover:bg-neutral-200 text-charcoal text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            title="Download Bookings CSV"
          >
            <Download className="w-3.5 h-3.5 text-primary-green" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Capacity Warning Banner */}
      {dateFilter && totalGuestsOnDate >= 24 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">High Dining Hall Occupancy Warning: </span>
            {totalGuestsOnDate} confirmed guests currently booked for {dateFilter}. 
            Check table availability before confirming additional walk-in or group reservations.
          </div>
        </div>
      )}

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-3xl border border-border-warm shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, ref, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-3 py-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden font-medium"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-semibold text-charcoal focus:bg-white focus:outline-hidden"
          >
            <option value="all">All Statuses ({bookings.length})</option>
            <option value="requested">Pending Review (Requested)</option>
            <option value="confirmed">Confirmed</option>
            <option value="seated">Seated / Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full text-xs p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] font-medium focus:bg-white focus:outline-hidden"
            title="Filter by reservation date"
          />
        </div>
      </div>

      {/* Main Content: List View or Schedule Grid */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-3xl border border-border-warm shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6EE] text-muted-gray uppercase font-bold text-[10px] tracking-wider border-b border-border-warm">
                <tr>
                  <th className="px-5 py-3">Ref & Guest</th>
                  <th className="px-5 py-3">Reservation Slot</th>
                  <th className="px-5 py-3">Outlet</th>
                  <th className="px-5 py-3">Party Size</th>
                  <th className="px-5 py-3">Seating & Requests</th>
                  <th className="px-5 py-3">Staff Notes</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm font-medium text-charcoal">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-muted-gray">
                      No table reservations match your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => {
                    const waText = encodeURIComponent(
                      `Hello ${b.customer_name}, this is Pizza Harrison Mathura regarding your reservation (${b.booking_reference}) for ${b.guest_count} guests on ${b.booking_date} at ${b.booking_time}.`
                    );
                    const waLink = `https://wa.me/91${b.customer_phone.replace(/\D/g, '')}?text=${waText}`;

                    return (
                      <tr key={b.id} className="hover:bg-neutral-50/80 transition">
                        <td className="px-5 py-4">
                          <div className="font-mono font-bold text-forest">{b.booking_reference}</div>
                          <div className="font-bold text-charcoal text-xs">{b.customer_name}</div>
                          <div className="text-[11px] text-muted-gray font-mono">+91 {b.customer_phone}</div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-bold text-forest flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-primary-green" />
                            <span>{b.booking_time}</span>
                          </div>
                          <div className="text-[11px] text-muted-gray font-mono">{b.booking_date}</div>
                        </td>

                        <td className="px-5 py-4 capitalize text-[11px]">
                          {b.branch === 'gla_university' ? 'GLA Campus' : 'Pali Khera (Main)'}
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-black text-xs bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                            {b.guest_count} Guests
                          </span>
                        </td>

                        <td className="px-5 py-4 max-w-xs text-[11px]">
                          <span className="font-bold text-charcoal block">{b.seating_preference}</span>
                          {b.special_requests && (
                            <span className="text-muted-gray italic">"{b.special_requests}"</span>
                          )}
                        </td>

                        <td className="px-5 py-4 max-w-xs text-[11px]">
                          {b.staff_notes ? (
                            <span className="text-forest font-medium">{b.staff_notes}</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteBooking(b);
                                setNoteText(b.staff_notes || '');
                              }}
                              className="text-muted-gray hover:text-primary-green text-[10px] underline"
                            >
                              + Add Note
                            </button>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              b.status === 'requested'
                                ? 'bg-amber-100 text-amber-800'
                                : b.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-800'
                                : b.status === 'seated'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Follow-up */}
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                              title="Message Customer on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>

                            {/* Direct Call */}
                            <a
                              href={getClickToCallUrl(b.customer_phone)}
                              className="p-1.5 rounded-lg bg-neutral-100 text-charcoal hover:bg-neutral-200 transition"
                              title="Call Guest"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>

                            {b.status === 'requested' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                                  disabled={updatingId === b.id}
                                  className="p-1.5 rounded-lg bg-primary-green hover:bg-forest text-white transition cursor-pointer"
                                  title="Confirm Reservation"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(b.id, 'rejected')}
                                  disabled={updatingId === b.id}
                                  className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition cursor-pointer"
                                  title="Reject Reservation"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {b.status === 'confirmed' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(b.id, 'seated')}
                                disabled={updatingId === b.id}
                                className="px-2 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold transition cursor-pointer"
                                title="Mark Party Seated"
                              >
                                Mark Seated
                              </button>
                            )}
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
      ) : (
        /* Schedule Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white p-5 rounded-3xl border border-border-warm shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border-warm">
                <span className="font-mono font-bold text-xs text-forest">{b.booking_reference}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    b.status === 'requested'
                      ? 'bg-amber-100 text-amber-800'
                      : b.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {b.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-charcoal">{b.customer_name}</h3>
                  <div className="text-[11px] text-muted-gray">{b.customer_phone}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-black text-sm text-forest">{b.booking_time}</div>
                  <div className="text-[10px] text-muted-gray font-mono">{b.booking_date}</div>
                </div>
              </div>

              <div className="p-2.5 bg-[#FAF7F0] rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-charcoal">
                  <span>Party: {b.guest_count} Guests</span>
                  <span className="text-[11px] text-primary-green">{b.seating_preference}</span>
                </div>
                {b.special_requests && (
                  <p className="text-[11px] text-muted-gray italic">"{b.special_requests}"</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <a
                  href={`https://wa.me/91${b.customer_phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                {b.status === 'requested' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                    className="px-3 py-1 bg-primary-green text-white text-xs font-bold rounded-lg shadow-xs hover:bg-forest transition"
                  >
                    Confirm Table
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Staff Notes Editor Modal */}
      {editingNoteBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-border-warm space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border-warm">
              <h3 className="font-serif font-black text-forest">Edit Reservation Note</h3>
              <button onClick={() => setEditingNoteBooking(null)} className="p-1 text-muted-gray">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-3 text-xs">
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Table #4 reserved near window. High chair placed."
                className="w-full p-2.5 border border-border-warm rounded-xl bg-[#FAF7F0] focus:bg-white focus:outline-hidden"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNoteBooking(null)}
                  className="px-3 py-1.5 text-muted-gray hover:text-charcoal font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary-green hover:bg-forest text-white font-bold rounded-xl shadow-xs"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
