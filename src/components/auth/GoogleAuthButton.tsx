'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { useCustomerAuth } from '@/lib/store/customer-auth-context';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/security/admin-edge';

interface GoogleAuthButtonProps {
  mode?: 'login' | 'register' | 'admin';
  redirectUrl?: string;
  className?: string;
  buttonText?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function GoogleIcon({ className = 'w-5 h-5 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  mode = 'login',
  redirectUrl,
  className = '',
  buttonText,
  onSuccess,
  onError,
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const { loginWithGoogle } = useCustomerAuth();

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState(
    mode === 'admin' ? PRIMARY_ADMIN_EMAIL : ''
  );
  const [googleName, setGoogleName] = useState(
    mode === 'admin' ? 'Sumit Dev Thakur' : ''
  );
  const [errorMsg, setErrorMsg] = useState('');

  const defaultLabel =
    buttonText ||
    (mode === 'admin'
      ? 'Sign in as Admin with Google'
      : mode === 'register'
      ? 'Sign up with Google'
      : 'Continue with Google');

  const executeGoogleAuth = async (emailToUse: string, nameToUse?: string) => {
    setLoading(true);
    setErrorMsg('');

    try {
      if (mode === 'admin') {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailToUse.trim().toLowerCase(),
            name: nameToUse?.trim() || 'Sumit Dev Thakur',
            role: 'admin',
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          const err = data.error || 'Google authentication failed.';
          setErrorMsg(err);
          onError?.(err);
          setLoading(false);
          return;
        }

        setModalOpen(false);
        onSuccess?.();
        router.push(redirectUrl || '/admin');
        router.refresh();
        return;
      }

      // Customer Google login / registration flow
      const res = await loginWithGoogle({
        email: emailToUse.trim().toLowerCase(),
        name: nameToUse?.trim() || emailToUse.split('@')[0],
      });

      if (!res.success) {
        const err = res.error || 'Google login failed.';
        setErrorMsg(err);
        onError?.(err);
        setLoading(false);
        return;
      }

      setModalOpen(false);
      onSuccess?.();
      router.push(redirectUrl || '/account');
      router.refresh();
    } catch (e: any) {
      const err = e.message || 'Error connecting to Google.';
      setErrorMsg(err);
      onError?.(err);
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    // If admin mode and default email is sumitdevthakur@gmail.com, can authenticate directly
    if (mode === 'admin') {
      executeGoogleAuth(PRIMARY_ADMIN_EMAIL, 'Sumit Dev Thakur');
      return;
    }

    // Open Google Account selector modal
    setModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setErrorMsg('Please enter your Google account email.');
      return;
    }
    executeGoogleAuth(googleEmail, googleName);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition shadow-xs hover:shadow border border-[#DADCE0] bg-white text-[#3C4043] hover:bg-[#F8F9FA] active:bg-[#F1F3F4] disabled:opacity-60 cursor-pointer select-none ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-[#4285F4]" />
            <span>Connecting to Google...</span>
          </>
        ) : (
          <>
            <GoogleIcon className="w-5 h-5" />
            <span>{defaultLabel}</span>
          </>
        )}
      </button>

      {/* Google Sign-In Account Selector Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-border-warm space-y-4 relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center shadow-xs">
                  <GoogleIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-charcoal">
                    Sign in with Google
                  </h3>
                  <p className="text-[11px] text-muted-gray">to continue to Pizza Harrison</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-muted-gray hover:text-charcoal hover:bg-neutral-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Google Account Selector */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-gray">
                Continue with Google
              </div>

              <button
                type="button"
                onClick={() => executeGoogleAuth(PRIMARY_ADMIN_EMAIL, 'Sumit Dev Thakur')}
                className="w-full p-2.5 rounded-xl border border-border-warm hover:border-emerald-500 hover:bg-neutral-50 transition flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                    S
                  </div>
                  <div>
                    <div className="text-xs font-bold text-charcoal leading-tight">
                      Sumit Dev Thakur
                    </div>
                    <div className="text-[11px] text-muted-gray leading-tight">
                      {PRIMARY_ADMIN_EMAIL}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-gray group-hover:text-forest transition" />
              </button>
            </div>

            {/* Custom Google Email Form */}
            <form onSubmit={handleModalSubmit} className="pt-2 border-t border-border-warm space-y-3">
              <div className="text-[11px] font-bold text-charcoal">Or use another Google account:</div>
              <div>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-border-warm bg-white focus:outline-hidden focus:border-forest"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Your Full Name (Optional)"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-border-warm bg-white focus:outline-hidden focus:border-forest"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-forest hover:bg-forest/90 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
