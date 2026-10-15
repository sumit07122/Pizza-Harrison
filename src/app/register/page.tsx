'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Phone,
  User,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Gift,
} from 'lucide-react';
import { useCustomerAuth } from '@/lib/store/customer-auth-context';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';

  const { registerWithOtp, sendOtp, isAuthenticated } = useCustomerAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const [step, setStep] = useState<'details' | 'verify_otp'>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devTokenNotice, setDevTokenNotice] = useState<string | null>(null);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  const handleInitiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setDevTokenNotice(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const clean = phone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (password && password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const res = await sendOtp(clean, 'registration');
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to send OTP code. Please try again.');
      return;
    }

    setStep('verify_otp');
    setSuccessMsg(`We sent a 6-digit verification code to +91 ${clean}`);
    if (res.dev_token) {
      setDevTokenNotice(
        `[Dev/Sandbox Mode]: SMS Gateway not configured. Your test code is ${res.dev_token}`
      );
      setOtp(res.dev_token);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    const clean = phone.replace(/\D/g, '').slice(-10);
    const res = await registerWithOtp({
      name: name.trim(),
      phone: clean,
      email: email.trim() || undefined,
      password: password || undefined,
      otp: otp.trim(),
    });
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Registration failed. Please check the OTP or try again.');
      return;
    }

    router.replace(redirectUrl);
  };

  return (
    <div className="min-h-[80vh] bg-[#F7F4ED] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#E8E2D2] p-8 sm:p-10 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-forest via-primary-green to-tomato" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-forest text-warm-cream shadow-md mb-3 border-2 border-primary-green">
            <span className="text-3xl">🍕</span>
          </div>
          <h1 className="text-2xl font-black text-forest font-serif tracking-tight">
            Create Customer Account
          </h1>
          <p className="text-xs text-muted-gray mt-1">
            Join Pizza Harrison Club for order tracking, loyalty stamps & exclusive student deals
          </p>
        </div>

        {/* Loyalty Perk Banner */}
        <div className="mb-6 p-3 rounded-2xl bg-[#F6EFE6] border border-border-warm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-tomato text-white flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <strong className="text-forest font-bold block">1 Free Pizza Stamp</strong>
            <span className="text-muted-gray text-[11px]">
              Earn stamps on orders ₹299+ and unlock free wood-fired pizzas!
            </span>
          </div>
        </div>

        {/* Google One-Click Registration */}
        <div className="mb-6">
          <GoogleAuthButton
            mode="register"
            redirectUrl={redirectUrl}
            buttonText="Sign up with Google"
          />

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-warm" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-muted-gray font-bold text-[10px] tracking-wider">
                Or register with Mobile OTP
              </span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-tomato shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{successMsg}</div>
          </div>
        )}

        {devTokenNotice && (
          <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono">
            {devTokenNotice}
          </div>
        )}

        {step === 'details' ? (
          <form onSubmit={handleInitiateRegistration} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-bold text-forest uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aman Mathur"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-border-warm text-forest text-sm font-semibold focus:outline-hidden focus:border-primary-green focus:ring-1 focus:ring-primary-green transition bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-bold text-forest uppercase tracking-wider mb-1.5">
                Mobile Number * (Will be verified via OTP)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-gray">
                  +91
                </span>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  maxLength={10}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-warm text-forest text-sm font-semibold focus:outline-hidden focus:border-primary-green focus:ring-1 focus:ring-primary-green transition bg-white"
                />
              </div>
              <p className="text-[11px] text-muted-gray mt-1">
                Required for real-time delivery updates and order security
              </p>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-bold text-forest uppercase tracking-wider mb-1.5">
                Email Address (Optional)
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aman@example.com"
                className="w-full px-4 py-3 rounded-xl border border-border-warm text-forest text-sm font-semibold focus:outline-hidden focus:border-primary-green focus:ring-1 focus:ring-primary-green transition bg-white"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-bold text-forest uppercase tracking-wider mb-1.5">
                Password (Optional - for quick password login)
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-3 rounded-xl border border-border-warm text-forest text-sm font-semibold focus:outline-hidden focus:border-primary-green focus:ring-1 focus:ring-primary-green transition bg-white"
              />
              <p className="text-[11px] text-muted-gray mt-1">
                You can also log in anytime using instant SMS OTP without a password
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-forest hover:bg-forest/90 text-warm-cream font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer pt-3"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Mobile...
                </>
              ) : (
                <>
                  Verify Mobile & Register <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="reg-otp" className="text-xs font-bold text-forest uppercase tracking-wider">
                  Enter 6-Digit OTP
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep('details');
                    setOtp('');
                    setError(null);
                  }}
                  className="text-xs font-semibold text-primary-green hover:underline cursor-pointer"
                >
                  Edit Details
                </button>
              </div>
              <input
                id="reg-otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                required
                autoFocus
                className="w-full px-4 py-3 text-center tracking-[0.3em] font-mono text-lg font-bold rounded-xl border border-border-warm text-forest focus:outline-hidden focus:border-primary-green focus:ring-1 focus:ring-primary-green transition bg-white"
              />
              <p className="text-[11px] text-muted-gray mt-1 text-center">
                OTP sent to +91 {phone} (Expires in 10 minutes)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-tomato hover:bg-tomato/90 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                  Confirm OTP & Create Account <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleInitiateRegistration}
                disabled={loading}
                className="text-xs font-semibold text-muted-gray hover:text-forest transition cursor-pointer"
              >
                Didn&apos;t receive code? Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border-warm text-center space-y-2">
          <p className="text-xs text-muted-gray">
            Already have an account?{' '}
            <Link
              href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
              className="font-bold text-primary-green hover:text-forest transition underline"
            >
              Sign In Instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-forest">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
