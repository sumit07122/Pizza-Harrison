'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ShieldCheck, ArrowRight, Store, CheckCircle2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('manager@pizzaharrison.com');
  const [password, setPassword] = useState('••••••••');
  const [role, setRole] = useState<'admin' | 'manager' | 'staff'>('manager');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    // Simulates secure session establishment
    setTimeout(() => {
      setLoggingIn(false);
      router.push('/admin');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-forest flex flex-col justify-center items-center p-4">
      
      <div className="bg-[#FFFDF9] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-border-warm space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-forest text-white flex items-center justify-center text-3xl mx-auto shadow-md border-2 border-primary-green">
            🍕
          </div>
          <h1 className="text-2xl font-black text-forest font-serif">
            Pizza Harrison Staff Portal
          </h1>
          <p className="text-xs text-muted-gray">
            Sign in to access Kitchen KDS, order processing, and restaurant settings.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">
              Select Operator Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full text-xs p-3 border border-border-warm rounded-xl bg-white font-bold text-forest focus:outline-hidden"
            >
              <option value="admin">Restaurant Owner / Administrator</option>
              <option value="manager">Outlet Manager (Pali Khera / GLA)</option>
              <option value="staff">Kitchen & Counter Staff (KDS)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">
              Staff Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs pl-10 pr-3 py-3 border border-border-warm rounded-xl focus:outline-hidden focus:border-primary-green"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-charcoal block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-10 pr-3 py-3 border border-border-warm rounded-xl focus:outline-hidden focus:border-primary-green"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full bg-primary-green hover:bg-forest text-white py-3.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition transform active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loggingIn ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
          </button>
        </form>

        <div className="pt-4 border-t border-border-warm flex items-center justify-between text-xs text-muted-gray">
          <Link
            href="/"
            className="hover:text-forest flex items-center gap-1 transition"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Customer Storefront</span>
          </Link>

          <span className="text-[11px] font-mono text-emerald-700 font-semibold">
            Role: {role.toUpperCase()}
          </span>
        </div>

      </div>

    </div>
  );
}
