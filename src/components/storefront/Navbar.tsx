'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  Menu as MenuIcon,
  X,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '@/lib/store/cart-context';
import { formatINR } from '@/lib/pricing';
import { RESTAURANT_PHONE, getClickToCallUrl } from '@/lib/whatsapp';

export function Navbar() {
  const pathname = usePathname();
  const { itemCount, totalPaise, openCartDrawer, branch, setBranch } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText('GLA100');
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  const navLinks = [
    { label: 'Menu', href: '/menu' },
    { label: 'Offers & Combos', href: '/offers' },
    { label: 'Book a Table', href: '/book-table' },
    { label: 'Track Order', href: '/order-tracking/search' },
    { label: 'Our Story', href: '/about' },
    { label: 'Outlets & Contact', href: '/contact' },
  ];

  return (
    <>
      {/* 1. Announcement Bar */}
      <div className="bg-forest text-warm-cream py-2 px-4 text-xs sm:text-sm font-medium border-b border-primary-green/30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center">
            <span className="bg-tomato text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide animate-pulse">
              Flash Deal
            </span>
            <span>
              GLA University & Mathura Special: Use code <strong className="text-yellow-300">GLA100</strong> for Flat ₹100 Off on orders above ₹499!
            </span>
            <button
              onClick={handleCopyCoupon}
              className="underline hover:text-yellow-300 text-xs transition cursor-pointer ml-1 inline-flex items-center gap-1"
            >
              {copiedCoupon ? (
                <span className="text-emerald-300 inline-flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Copied!
                </span>
              ) : (
                'Copy Code'
              )}
            </button>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs text-warm-cream/90">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-accent-green" /> Open: Pali Khera 11am-11:30pm | GLA till 1am
            </span>
            <a
              href={getClickToCallUrl()}
              className="flex items-center gap-1 font-semibold hover:text-yellow-300 transition"
            >
              <Phone className="w-3.5 h-3.5 text-accent-green" /> +91 {RESTAURANT_PHONE}
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-[#FFFDF8]/95 backdrop-blur-md border-b border-border-warm shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full bg-forest flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform border-2 border-primary-green">
              <span className="text-2xl">🍕</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-forest font-serif">
                  Pizza Harrison
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-tomato"></span>
              </div>
              <p className="text-[11px] font-semibold text-primary-green tracking-wider uppercase -mt-0.5">
                Mathura • Authentic Italian
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-semibold transition-colors duration-150 relative py-1 ${
                    isActive
                      ? 'text-primary-green font-bold'
                      : 'text-charcoal hover:text-primary-green'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-green rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Outlet Selector & Cart Action */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Branch Switcher Pill */}
            <div className="hidden sm:flex items-center gap-1.5 bg-[#F6EFE6] px-3 py-1.5 rounded-full text-xs font-medium text-forest border border-border-warm">
              <MapPin className="w-3.5 h-3.5 text-tomato" />
              <select
                aria-label="Select Restaurant Branch Outlet"
                value={branch}
                onChange={(e) => setBranch(e.target.value as any)}
                className="bg-transparent text-forest font-semibold cursor-pointer outline-hidden pr-1"
              >
                <option value="pali_khera">Pali Khera (Main)</option>
                <option value="gla_university">GLA Campus (Gate 1)</option>
              </select>
            </div>

            {/* Direct Call Button */}
            <a
              href={getClickToCallUrl()}
              title="Call Pizza Harrison"
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-border-warm text-forest hover:bg-forest hover:text-white transition"
            >
              <Phone className="w-4 h-4" />
            </a>

            {/* Shopping Cart Button */}
            <button
              onClick={openCartDrawer}
              className="relative flex items-center gap-2 bg-primary-green hover:bg-forest text-white px-4 py-2.5 rounded-full font-bold text-sm shadow-sm hover:shadow transition transform active:scale-95 cursor-pointer"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="bg-tomato text-white text-xs px-2 py-0.5 rounded-full font-extrabold ml-1">
                  {itemCount}
                </span>
              )}
              {itemCount > 0 && (
                <span className="hidden md:inline text-xs font-semibold pl-1 border-l border-white/30">
                  {formatINR(totalPaise)}
                </span>
              )}
            </button>

            {/* Admin Portal Shortcut */}
            <Link
              href="/admin"
              className="hidden xl:inline-block text-xs font-bold text-muted-gray hover:text-forest transition px-2 py-1 rounded border border-border-warm hover:border-forest"
            >
              Staff KDS
            </Link>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-charcoal hover:text-primary-green focus:outline-hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-warm-cream border-b border-border-warm px-4 pt-3 pb-6 space-y-3">
            {/* Mobile Branch Selector */}
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-border-warm">
              <span className="text-xs font-semibold text-muted-gray flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-tomato" /> Outlet:
              </span>
              <select
                aria-label="Mobile Select Restaurant Branch Outlet"
                value={branch}
                onChange={(e) => setBranch(e.target.value as any)}
                className="bg-transparent text-forest font-bold text-xs outline-hidden"
              >
                <option value="pali_khera">Pali Khera (Main Outlet)</option>
                <option value="gla_university">GLA Campus (Gate 1)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    pathname === link.href
                      ? 'bg-primary-green text-white'
                      : 'bg-white text-charcoal hover:bg-[#F2EAE0]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border-warm text-xs">
              <a
                href={getClickToCallUrl()}
                className="flex items-center gap-1.5 font-bold text-forest bg-white px-3 py-2 rounded-lg border border-border-warm"
              >
                <Phone className="w-3.5 h-3.5 text-primary-green" /> Call: {RESTAURANT_PHONE}
              </a>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-primary-green bg-white px-3 py-2 rounded-lg border border-border-warm"
              >
                Kitchen KDS Board →
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
