'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ShieldCheck, ArrowRight, Store, AlertTriangle, KeyRound, CheckCircle2, Loader2 } from 'lucide-react';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/security/admin-edge';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState(PRIMARY_ADMIN_EMAIL);
  const [password, setPassword] = useState('PizzaHarrison@2026');
  const [loggingIn, setLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isPrimaryAdmin = email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isPrimaryAdmin) {
      setErrorMessage(
        `Access Restricted: Only authorized administrator (${PRIMARY_ADMIN_EMAIL}) can access this panel. All other visitors and customers view the simple storefront.`
      );
      return;
    }

    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Authentication failed. Please check credentials.');
        setLoggingIn(false);
        return;
      }

      setSuccessMessage('Administrator verified! Loading dashboard...');
      setTimeout(() => {
        router.push(redirectTarget);
        router.refresh();
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error during login.');
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111611] flex flex-col justify-center items-center p-4 selection:bg-primary-green selection:text-white">
      {/* Background Accent Glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-30">
        <div className="w-[500px] h-[500px] rounded-full bg-primary-green/20 blur-[120px]" />
      </div>

      <div className="relative z-10 bg-[#1E251E] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#2D3A2D] space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-primary-green text-white flex items-center justify-center text-3xl mx-auto shadow-lg shadow-primary-green/20 border-2 border-emerald-400">
            🍕
          </div>
          <h1 className="text-2xl font-black text-white font-serif tracking-tight">
            Pizza Harrison Admin
          </h1>
          <p className="text-xs text-neutral-400">
            Restricted Operations & Kitchen KDS Management Portal
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-emerald-300">Protected Administrator Portal</span>
            This management console is strictly restricted to <span className="font-mono font-bold text-white underline">{PRIMARY_ADMIN_EMAIL}</span>. Non-admin users view the simple customer storefront.
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-red-950/80 border border-red-500/50 rounded-xl p-3.5 text-xs text-red-200 flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block text-red-300">Access Denied</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="bg-emerald-900/80 border border-emerald-400/60 rounded-xl p-3.5 text-xs text-emerald-100 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1">
              Authorized Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sumitdevthakur@gmail.com"
                className="w-full text-xs pl-10 pr-3 py-3 rounded-xl bg-[#141A14] border border-[#2D3A2D] text-white focus:outline-hidden focus:border-emerald-400 font-mono"
              />
            </div>
            {!isPrimaryAdmin && (
              <p className="text-[11px] text-amber-400 mt-1 font-medium">
                ⚠️ Warning: Only {PRIMARY_ADMIN_EMAIL} is authorized.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-neutral-300 block">
                Admin Password / Master Key
              </label>
              <span className="text-[10px] text-neutral-400">Default: PizzaHarrison@2026</span>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-10 pr-3 py-3 rounded-xl bg-[#141A14] border border-[#2D3A2D] text-white focus:outline-hidden focus:border-emerald-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loggingIn || !isPrimaryAdmin}
            className="w-full bg-primary-green hover:bg-emerald-600 text-white py-3.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-green/20 transition transform active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loggingIn ? 'Authenticating Admin...' : 'Sign In as Administrator'}</span>
          </button>
        </form>

        <div className="pt-4 border-t border-[#2D3A2D] flex items-center justify-between text-xs text-neutral-400">
          <Link
            href="/"
            className="hover:text-emerald-400 flex items-center gap-1.5 transition font-semibold"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Return to Simple Storefront</span>
          </Link>

          <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
            ROOT ADMIN
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111611] flex flex-col items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
          <p className="text-xs font-mono text-neutral-400">Loading Administrator Portal...</p>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
