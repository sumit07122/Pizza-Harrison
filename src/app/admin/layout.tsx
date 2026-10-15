'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, Store, Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { AdminProvider } from '@/lib/store/admin-context';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/security/admin-edge';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('all');

  const [authStatus, setAuthStatus] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');
  const [adminUser, setAdminUser] = useState<{ email: string; name: string } | null>(null);

  // Skip guard check on login page itself
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setAuthStatus('authorized');
      return;
    }

    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/auth/me');
        const data = await res.json();

        if (
          isMounted &&
          data.authenticated &&
          data.admin?.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()
        ) {
          setAdminUser(data.admin);
          setAuthStatus('authorized');
        } else {
          if (isMounted) setAuthStatus('unauthorized');
        }
      } catch (e) {
        if (isMounted) setAuthStatus('unauthorized');
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [pathname, isLoginPage]);

  // If on /admin/login, render login page directly without layout shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-[#111611] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <p className="text-xs font-mono text-neutral-400">Verifying administrator authorization...</p>
      </div>
    );
  }

  // Unauthorized state: strictly for sumitdevthakur@gmail.com
  if (authStatus === 'unauthorized') {
    return (
      <div className="min-h-screen bg-[#F6F4F0] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-border-warm shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-forest font-serif">
              Store Admin Access Restricted
            </h1>
            <p className="text-xs text-muted-gray leading-relaxed">
              The Pizza Harrison management console is strictly restricted to authorized store administrator (<strong>{PRIMARY_ADMIN_EMAIL}</strong>).
            </p>
            <p className="text-xs text-muted-gray">
              All other visitors, guests, and customers enjoy our simple online pizza storefront.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/"
              className="w-full bg-forest hover:bg-emerald-950 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>Continue to Simple Website</span>
            </Link>

            <Link
              href="/admin/login"
              className="w-full bg-neutral-100 hover:bg-neutral-200 text-charcoal py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Sign In as {PRIMARY_ADMIN_EMAIL}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authorized Admin View
  return (
    <AdminProvider>
      <div className="min-h-screen bg-[#F6F4F0] text-charcoal flex">
        {/* Sidebar */}
        <AdminSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            collapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
        >
          <AdminTopBar
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            selectedBranch={selectedBranch}
            onBranchChange={setSelectedBranch}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminProvider>
  );
}
