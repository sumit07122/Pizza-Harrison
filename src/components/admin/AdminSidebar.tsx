'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  Pizza,
  BarChart3,
  Settings,
  Store,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  LogOut,
  Users,
  Award,
} from 'lucide-react';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/security/admin-edge';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AdminSidebar({
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/');
    router.refresh();
  };

  const mainNavItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Orders & Kitchen', href: '/admin/orders', icon: UtensilsCrossed },
    { label: 'Customer Directory', href: '/admin/customers', icon: Users },
    { label: 'Loyalty Rewards', href: '/admin/rewards', icon: Award },
    { label: 'Inventory & Stock', href: '/admin/inventory', icon: Package },
    { label: 'Menu & Offers', href: '/admin/menu', icon: Pizza },
    { label: 'Sales & Expenses', href: '/admin/sales-expenses', icon: BarChart3 },
    { label: 'Store Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#161B16] text-[#F3EFE6] border-r border-[#2C352C] flex flex-col justify-between transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#2C352C] sticky top-0 bg-[#161B16] z-10">
            <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-primary-green flex items-center justify-center text-white shrink-0 font-bold text-lg shadow-sm">
                🍕
              </div>
              {!collapsed && (
                <div className="truncate">
                  <div className="text-sm font-black font-serif tracking-tight text-white">
                    Pizza Harrison
                  </div>
                  <div className="text-[10px] text-accent-green uppercase font-bold tracking-wider">
                    Ops & KDS Console
                  </div>
                </div>
              )}
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-primary-green text-white shadow-sm'
                      : 'text-neutral-300 hover:bg-[#232B23] hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Toggle */}
        <div className="p-3 border-t border-[#2C352C] space-y-2 bg-[#161B16]">
          {/* Admin User Info */}
          {!collapsed ? (
            <div className="bg-[#212921] rounded-xl p-2.5 border border-[#2D3A2D] text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white text-[11px] truncate">
                  Sumit Dev Thakur
                </span>
              </div>
              <div className="text-[10px] text-neutral-400 font-mono truncate mt-0.5">
                {PRIMARY_ADMIN_EMAIL}
              </div>
            </div>
          ) : null}

          {/* Back to Public Storefront */}
          <Link
            href="/"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-[#232B23] transition font-semibold ${
              collapsed ? 'justify-center' : ''
            }`}
            title="View Public Storefront"
          >
            <Store className="w-4 h-4 shrink-0 text-accent-green" />
            {!collapsed && <span>Customer Storefront</span>}
          </Link>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 transition font-semibold cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Sign out of Admin"
          >
            <LogOut className="w-4 h-4 shrink-0 text-red-400" />
            {!collapsed && <span>Sign Out Admin</span>}
          </button>

          {/* Desktop Collapse Toggle */}
          <div className="hidden lg:flex items-center justify-between pt-2 border-t border-[#2C352C]/60 text-xs text-neutral-400">
            {!collapsed && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-green" />
                <span>Super Admin</span>
              </div>
            )}
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-[#232B23] text-neutral-400 hover:text-white transition mx-auto cursor-pointer"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
