'use client';

import React, { useState } from 'react';
import { Star, MessageSquarePlus, CheckCircle2, AlertCircle, Quote } from 'lucide-react';
import { Review } from '@/lib/types';

interface CustomerReviewsProps {
  initialReviews: Review[];
}

export function CustomerReviews({ initialReviews }: CustomerReviewsProps) {
  const [reviews] = useState<Review[]>(initialReviews);
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [branch, setBranch] = useState<'pali_khera' | 'gla_university'>('pali_khera');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !comment.trim()) {
      setErrorMsg('Please enter your name and a brief comment.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_name: customerName, rating, comment, branch }),
      });
      const data = await res.json();
      setSubmitting(false);

      if (data.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setShowModal(false);
          setSubmitSuccess(false);
          setCustomerName('');
          setComment('');
        }, 2200);
      } else {
        setErrorMsg(data.error || 'Failed to submit review.');
      }
    } catch (e: any) {
      setSubmitting(false);
      setErrorMsg('Network error submitting review.');
    }
  };

  return (
    <section className="py-14 sm:py-20 bg-warm-cream border-b border-border-warm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-tomato font-bold text-xs uppercase tracking-wider mb-1">
              <Star className="w-4 h-4 fill-tomato" />
              <span>Verified Customer Feedback</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-forest font-serif">
              Loved by Mathura & GLA Students
            </h2>
            <p className="text-xs sm:text-sm text-muted-gray mt-1">
              Real opinions from food lovers across Pali Khera, Chaumuhan, and university hostels.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-primary-green hover:bg-forest text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-xs hover:shadow transition transform active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl p-5 border border-border-warm shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative"
            >
              <div>
                <Quote className="w-8 h-8 text-primary-green/20 mb-2" />
                
                {/* Stars */}
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-200'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-xs text-charcoal/90 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>

              <div className="pt-4 border-t border-border-warm mt-4">
                <div className="text-xs font-bold text-forest">{rev.customer_name}</div>
                <div className="text-[10px] text-muted-gray capitalize">
                  {rev.branch === 'gla_university' ? 'GLA Campus Delivery' : 'Pali Khera Dine-In'}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Review Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            onClick={() => setShowModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border-warm z-10 space-y-4">
            <h3 className="text-lg font-black text-forest font-serif">Leave Your Experience</h3>
            <p className="text-xs text-muted-gray">
              Your honest feedback helps us maintain artisan quality for all of Mathura.
            </p>

            {submitSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">Review Submitted!</h4>
                <p className="text-xs text-emerald-700">
                  Thank you! Your review has been submitted for moderation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {errorMsg && (
                  <div className="p-2.5 bg-red-50 text-tomato text-xs rounded-lg flex items-center gap-1.5 border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border-warm rounded-lg focus:outline-hidden focus:border-primary-green"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-charcoal block mb-1">Outlet Visited</label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value as any)}
                      className="w-full text-xs p-2.5 border border-border-warm rounded-lg bg-white outline-hidden"
                    >
                      <option value="pali_khera">Pali Khera</option>
                      <option value="gla_university">GLA Campus</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-charcoal block mb-1">Rating</label>
                    <div className="flex items-center gap-1 py-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 text-yellow-400 hover:scale-110 transition cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= rating ? 'fill-yellow-400' : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-charcoal block mb-1">Your Review</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tell us what you enjoyed (crust, toppings, delivery speed, cheese pull)..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border-warm rounded-lg focus:outline-hidden focus:border-primary-green"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-charcoal hover:bg-neutral-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg text-xs font-bold bg-primary-green hover:bg-forest text-white transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
