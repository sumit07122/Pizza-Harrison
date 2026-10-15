'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useCustomerAuth } from '@/lib/store/customer-auth-context';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';

  const { loginWithPassword, loginWithOtp, sendOtp, isAuthenticated } = useCustomerAuth();

  const [activeTab, setActiveTab] = useState<'otp' | 'password'>('otp');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'enter_phone' | 'enter_otp'>('enter_phone');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const clean = phone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    const res = await sendOtp(clean, 'login');
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to send OTP. Please try again.');
      return;
    }

    setStep('enter_otp');
    setSuccessMsg(`Verification code sent to +91 ${clean}`);
    if (res.dev_token) {
      setOtp(res.dev_token);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    const clean = phone.replace(/\D/g, '').slice(-10);
    const res = await loginWithOtp(clean, otp.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Invalid or expired OTP. Please try again.');
      return;
    }

    router.replace(redirectUrl);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = phone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    const res = await loginWithPassword(clean, password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Invalid phone or password.');
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-forest text-warm-cream shadow-md mb-3 border-2 border-primary-green">
            <span className="text-3xl">🍕</span>
          </div>
          <h1 className="text-2xl font-black text-forest font-serif tracking-tight">
            Welcome to Pizza Harrison
          </h1>
          <p className="text-xs text-muted-gray mt-1">
            Access your orders, rewards, saved addresses & exclusive offers in Mathura
          </p>
        </div>

        {/* Google One-Click Login */}
        <div className="mb-6">
          <GoogleAuthButton
            mode="login"
            redirectUrl={redirectUrl}
            buttonText="Continue with Google"
          />

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-warm" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-muted-gray font-bold text-[10px] tracking-wider">
                Or sign in with Phone
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#F7F4ED] rounded-xl p-1 mb-6 border border-[#E8E2D2]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('otp');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'otp'
                ? 'bg-forest text-warm-cream shadow-xs'
                : 'text-muted-gray hover:text-forest'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Fast OTP Login
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'password'
                ? 'bg-forest text-warm-cream shadow-xs'
                : 'text-muted-gray hover:text-forest'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Password Login
          </button>
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


        {/* Tab 1: OTP Login */}
        {activeTab === 'otp' && (
          <>
            {step === 'enter_phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="login-phone" className="block text-xs font-bold text-forest uppercase tracking-wider mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-gray">
                      +91
                    </span>
                    <input
                      id="login-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765 43210"
                      maxLength={10}
                      required
                      autoFocus
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-warm text-forest text-sm font-semibold focus:outline-hidden focus:border-primary-green focus:ring-1 focus:ring-primary-green transition bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-muted-gray mt-1">
                    We will send a 6-digit one-time verification code via SMS
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-forest hover:bg-forest/90 text-warm-cream font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Sending Code...
                    </>
                  ) : (
                    <>
                      Send Verification Code <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-otp" className="text-xs font-bold text-forest uppercase tracking-wider">
                      6-Digit Code
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('enter_phone');
                        setOtp('');
                        setError(null);
                      }}
                      className="text-xs font-semibold text-primary-green hover:underline cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>
                  <input
                    id="login-otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    required
                    autoFocus
                    className="w-full px-4 py-3 text-center tracking-[0.3em] font-mono text-lg font-bold rounded-xl border border-border-warm text-forest focus:outline-hidden focus:border-primary-green focus:ring-1 focus:ring-primary-green transition bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-tomato hover:bg-tomato/90 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Sign In <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="text-xs font-semibold text-muted-gray hover:text-forest transition cursor-pointer"
                  >
                    Didn&apos;t receive code? Resend OTP
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Tab 2: Password Login */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label htmlFor="pwd-phone" className="block text-xs font-bold text-forest uppercase tracking-wider mb-1.5">
                Registered Mobile
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-gray">
                  +91
                </span>
                <input
                  id="pwd-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  maxLength={10}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-warm text-forest text-sm font-semibold focus:outline-hidden focus:border-primary-green focus:ring-1 focus:ring-primary-green transition bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-forest uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border-warm text-forest text-sm font-semibold focus:outline-hidden focus:border-primary-green focus:ring-1 focus:ring-primary-green transition bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-forest hover:bg-forest/90 text-warm-cream font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  Sign In With Password <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-border-warm text-center space-y-2">
          <p className="text-xs text-muted-gray">
            Don&apos;t have an account yet?{' '}
            <Link
              href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}
              className="font-bold text-primary-green hover:text-forest transition underline"
            >
              Create Account
            </Link>
          </p>
          <p className="text-[11px] text-muted-gray">
            Ordering for immediate delivery? You can also{' '}
            <Link href="/checkout" className="font-semibold text-tomato hover:underline">
              Continue as Guest
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-forest">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
