'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Utensils, Tag, Award, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/lib/store/cart-context';
import { formatINR } from '@/lib/pricing';

export function MobileBottomBar() {
  const pathname = usePathname();
  const { itemCount, totalPaise, openCartDrawer } = useCart();

  // Hide bottom bar on checkout or admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/checkout')) {
    return null;
  }

  const tabs = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Menu', href: '/menu', icon: Utensils },
    { label: 'Offers', href: '/offers', icon: Tag, badge: 'Deals' },
    { label: 'Rewards', href: '/rewards', icon: Award },
  ];

  return (
    <>
      {/* Floating Active Cart Strip for Instant Checkout on Mobile */}
      {itemCount > 0 && pathname !== '/cart' && (
        <div className="lg:hidden fixed bottom-[68px] left-0 right-0 z-40 px-3 pointer-events-none animate-in slide-in-from-bottom-3 duration-200">
          <button
            onClick={openCartDrawer}
            className="w-full max-w-md mx-auto pointer-events-auto bg-gradient-to-r from-tomato to-[#E03A2E] text-white py-3 px-4 rounded-2xl shadow-xl flex items-center justify-between border border-red-400/40 transform active:scale-98 transition cursor-pointer"
            aria-label="View current cart"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-sm">
                {itemCount}
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">Your Pizza Order</div>
                <div className="text-[11px] font-semibold text-white/90">
                  Total: {formatINR(totalPaise)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide bg-white text-tomato px-3 py-1.5 rounded-xl shadow-xs">
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* Main Glassmorphic Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121A14]/95 backdrop-blur-xl border-t border-[#233327] shadow-2xl pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 px-3 transition-transform"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1 text-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition ${
                  isActive
                    ? 'text-emerald-400 font-bold'
                    : 'text-neutral-400 hover:text-white font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-3.5 bg-tomato text-[9px] font-black text-white px-1 py-0.2 rounded-full uppercase scale-90 tracking-tighter">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight leading-none">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shadow-xs shadow-emerald-400" />
                )}
              </Link>
            );
          })}

          {/* Cart Tab in Mobile Bar */}
          <button
            onClick={openCartDrawer}
            className="relative flex flex-col items-center justify-center py-1 rounded-xl text-neutral-300 hover:text-white cursor-pointer"
            aria-label="Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-tomato text-[10px] font-black text-white w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 font-bold text-white tracking-tight leading-none">
              {itemCount > 0 ? formatINR(totalPaise) : 'Cart'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
