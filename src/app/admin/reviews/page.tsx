'use client';

import React, { useState } from 'react';
import { Star, Check, X, ShieldAlert, Quote } from 'lucide-react';
import { INITIAL_REVIEWS } from '@/lib/data/mock-data';
import { Review } from '@/lib/types';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([
    ...INITIAL_REVIEWS,
    {
      id: 'rev-pending-1',
      customer_name: 'Gaurav Khandelwal',
      rating: 5,
      comment: 'Ordered Peppy Paneer Burst to GLA Gate 1. Delivered piping hot in 20 minutes! Dough quality is outstanding.',
      branch: 'gla_university',
      is_approved: false, // Pending moderation demo
      created_at: new Date().toISOString(),
    },
  ]);

  const handleApprove = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_approved: true } : r))
    );
  };

  const handleReject = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const pendingCount = reviews.filter((r) => !r.is_approved).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-border-warm shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-forest font-serif">
            Review Moderation & Feedback
          </h1>
          <p className="text-xs text-muted-gray mt-0.5">
            Safeguard public reputation against spam while publishing verified diner ratings.
          </p>
        </div>

        {pendingCount > 0 && (
          <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <span>{pendingCount} Pending Moderation</span>
          </span>
        )}
      </div>

      {/* Reviews Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className={`bg-white rounded-3xl p-5 border transition flex flex-col justify-between space-y-4 ${
              !rev.is_approved
                ? 'border-2 border-amber-300 shadow-sm'
                : 'border-border-warm shadow-xs'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-sm text-charcoal">{rev.customer_name}</div>
                  <div className="text-[10px] text-muted-gray capitalize">
                    {rev.branch === 'gla_university' ? 'GLA Campus Outlet' : 'Pali Khera Outlet'}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    rev.is_approved
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {rev.is_approved ? 'Published Publicly' : 'Awaiting Approval'}
                </span>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-200'
                    }`}
                  />
                ))}
              </div>

              <p className="text-xs text-charcoal/90 italic leading-relaxed">
                "{rev.comment}"
              </p>
            </div>

            {/* Moderation Actions */}
            <div className="pt-3 border-t border-border-warm flex items-center justify-between text-xs">
              <span className="text-[11px] text-muted-gray">
                {new Date(rev.created_at).toLocaleDateString('en-IN')}
              </span>

              <div className="flex items-center gap-2">
                {!rev.is_approved ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReject(rev.id)}
                      className="px-3 py-1.5 rounded-lg text-tomato hover:bg-red-50 font-bold transition cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(rev.id)}
                      className="px-4 py-1.5 rounded-lg bg-primary-green hover:bg-forest text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve & Publish
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleReject(rev.id)}
                    className="text-tomato hover:bg-red-50 px-2 py-1 rounded text-[11px] font-bold"
                  >
                    Delete Review
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
