'use client';

import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  User,
  Utensils,
  Tag,
  Award,
  Calendar,
  Compass,
  MessageCircle,
  ChevronDown,
} from 'lucide-react';
import { useCart } from '@/lib/store/cart-context';
import { useCustomerAuth } from '@/lib/store/customer-auth-context';
import { formatINR } from '@/lib/pricing';
import { RESTAURANT_PHONE, getClickToCallUrl, RESTAURANT_WHATSAPP } from '@/lib/whatsapp';

export function Navbar() {
  const pathname = usePathname();
  const { itemCount, totalPaise, openCartDrawer, branch, setBranch } = useCart();
  const { customer, isAuthenticated } = useCustomerAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open on iOS
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText('GLA100');
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  const navLinks = [
    { label: 'Menu', href: '/menu', icon: Utensils },
    { label: 'Offers', href: '/offers', icon: Tag, badge: 'Deals' },
    { label: 'Rewards', href: '/rewards', icon: Award, highlight: true },
    { label: 'Book Table', href: '/book-table', icon: Calendar },
    { label: 'Track Order', href: '/order-tracking/search', icon: Compass },
    { label: 'Our Story', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const branchLabels: Record<string, { name: string; tag: string }> = {
    pali_khera: { name: 'Pali Khera', tag: 'Main Outlet • Till 11:30 PM' },
    gla_university: { name: 'GLA Campus', tag: 'Gate 1 • Open till 1:00 AM' },
  };

  return (
    <>
      {/* 1. Ultra-Sleek Announcement Bar */}
      <div className="bg-[#122A1E] text-[#FBF6EE] py-1.5 px-3 sm:px-4 text-xs font-medium border-b border-[#214332] relative z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Left Flash Offer */}
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="bg-tomato text-white text-[9px] uppercase font-black px-2 py-0.5 rounded-full tracking-wider shrink-0 shadow-xs">
              ⚡ Offer
            </span>
            <span className="text-[11px] sm:text-xs truncate">
              GLA Students & Mathura: Use <strong className="text-amber-300 font-mono font-bold">GLA100</strong> for Flat ₹100 Off!
            </span>
            <button
              onClick={handleCopyCoupon}
              className="text-[10px] sm:text-xs text-amber-300 hover:text-white font-bold underline transition cursor-pointer shrink-0 ml-0.5"
            >
              {copiedCoupon ? 'Copied! ✓' : 'Copy'}
            </button>
          </div>

          {/* Right Store Status & Quick Call */}
          <div className="hidden md:flex items-center gap-4 text-[11px] text-warm-cream/90 shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>30-Min Rush Delivery in Mathura</span>
            </span>
            <a
              href={getClickToCallUrl()}
              className="flex items-center gap-1 font-bold text-amber-300 hover:text-white transition"
            >
              <Phone className="w-3 h-3 text-emerald-400" /> +91 {RESTAURANT_PHONE}
            </a>
          </div>

        </div>
      </div>

      {/* 2. Main Sticky Luxury Navbar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled
            ? 'bg-[#FFFDF9]/95 backdrop-blur-xl shadow-md border-b border-border-warm/90'
            : 'bg-[#FFFDF9]/90 backdrop-blur-md border-b border-border-warm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-2">
          
          {/* Brand Logo with Premium Micro-interaction */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-forest flex items-center justify-center text-white shadow-md group-hover:scale-105 group-hover:rotate-3 transition-transform border-2 border-emerald-500/50">
              <span className="text-xl sm:text-2xl">🍕</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-forest font-serif leading-none">
                  Pizza Harrison
                </span>
                <span className="w-2 h-2 rounded-full bg-tomato" />
              </div>
              <p className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase mt-0.5 hidden xs:block">
                Mathura • Hand-Tossed Artisan
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs xl:text-sm font-bold transition-all px-3 py-2 rounded-full relative flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-forest text-white shadow-xs'
                      : 'text-charcoal hover:bg-[#F2ECE1] hover:text-forest'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="bg-tomato text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter">
                      {link.badge}
                    </span>
                  )}
                  {link.highlight && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Cluster: Branch, Account, Cart, Mobile Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Branch Outlet Selector (Desktop / Tablet) */}
            <div className="hidden md:flex items-center gap-1 bg-[#F5EFE6] px-2.5 py-1.5 rounded-full text-xs font-bold text-forest border border-border-warm shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-tomato shrink-0" />
              <select
                aria-label="Select Restaurant Branch Outlet"
                value={branch}
                onChange={(e) => setBranch(e.target.value as any)}
                className="bg-transparent text-forest font-bold cursor-pointer outline-hidden text-xs pr-1 font-sans"
              >
                <option value="pali_khera">Pali Khera (Main)</option>
                <option value="gla_university">GLA Campus (Gate 1)</option>
              </select>
            </div>

            {/* Customer Account / Sign In Pill */}
            <Link
              href={isAuthenticated ? "/account" : "/login"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition text-forest bg-white hover:bg-forest hover:text-white border-border-warm shadow-2xs hover:shadow"
              aria-label={isAuthenticated ? "Customer Account" : "Sign In"}
            >
              <div className="relative">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                {isAuthenticated && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                )}
              </div>
              <span className="hidden sm:inline">
                {isAuthenticated
                  ? ((customer?.full_name || customer?.name || 'Account').split(' ')[0])
                  : 'Sign In'}
              </span>
            </Link>

            {/* Shopping Cart Button */}
            <button
              onClick={openCartDrawer}
              className="relative flex items-center gap-2 bg-gradient-to-r from-primary-green to-forest hover:from-forest hover:to-primary-green text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition transform active:scale-95 cursor-pointer"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-200" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 ? (
                <span className="bg-tomato text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-black animate-in zoom-in-75">
                  {itemCount}
                </span>
              ) : null}
              {itemCount > 0 && (
                <span className="hidden md:inline text-xs font-bold pl-1 border-l border-white/20">
                  {formatINR(totalPaise)}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Button with 44px tap target for iOS */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-11 h-11 flex items-center justify-center rounded-2xl bg-[#F5EFE6] text-forest border border-border-warm hover:bg-forest hover:text-white transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* 3. Smooth Mobile Navigation Drawer with Backdrop Blur */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-[72px] sm:top-[80px] z-50 flex flex-col justify-between bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div
              className="bg-[#FFFDF9] border-b border-border-warm px-4 pt-4 pb-8 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Customer Greeting / Auth Pill */}
              <Link
                href={isAuthenticated ? "/account" : "/login"}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between bg-gradient-to-r from-[#122A1E] to-[#1C3E2D] p-3.5 rounded-2xl text-white shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-lg">
                    {isAuthenticated ? '👤' : '🍕'}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">
                      {isAuthenticated
                        ? `Welcome, ${customer?.full_name || customer?.name}!`
                        : 'Sign In to Your Account'}
                    </div>
                    <div className="text-[10px] text-emerald-200 font-medium">
                      {isAuthenticated
                        ? `Phone: +91 ${customer?.phone}`
                        : 'Unlock exclusive stamps & student discounts'}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-300">
                  {isAuthenticated ? 'Profile →' : 'Log In →'}
                </span>
              </Link>

              {/* Outlet Branch Selector for Mobile */}
              <div className="bg-[#F8F4EC] p-3 rounded-2xl border border-border-warm space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-forest">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-tomato" /> Serving Branch:
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Live Kitchen
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setBranch('pali_khera')}
                    className={`py-2 px-2.5 rounded-xl text-left border text-xs transition ${
                      branch === 'pali_khera'
                        ? 'bg-forest text-white border-forest font-bold shadow-xs'
                        : 'bg-white text-charcoal border-border-warm font-medium'
                    }`}
                  >
                    <div className="text-[11px] font-bold">Pali Khera (Main)</div>
                    <div className="text-[9px] opacity-80">Sonkh Road • 11:30pm</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBranch('gla_university')}
                    className={`py-2 px-2.5 rounded-xl text-left border text-xs transition ${
                      branch === 'gla_university'
                        ? 'bg-forest text-white border-forest font-bold shadow-xs'
                        : 'bg-white text-charcoal border-border-warm font-medium'
                    }`}
                  >
                    <div className="text-[11px] font-bold">GLA Campus</div>
                    <div className="text-[9px] opacity-80">Gate 1 • 1:00 AM</div>
                  </button>
                </div>
              </div>

              {/* Navigation Grid Links */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition border ${
                        isActive
                          ? 'bg-forest text-white border-forest shadow-xs'
                          : 'bg-white text-charcoal border-border-warm hover:bg-[#F4ECE1]'
                      }`}
                    >
                      {Icon && <Icon className="w-4 h-4 text-emerald-600" />}
                      <span>{link.label}</span>
                      {link.badge && (
                        <span className="ml-auto bg-tomato text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Direct Touch Calling & WhatsApp Buttons for iOS / Mobile */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-warm">
                <a
                  href={getClickToCallUrl()}
                  className="flex items-center justify-center gap-1.5 bg-white text-forest border border-border-warm py-3 rounded-xl font-bold text-xs shadow-2xs hover:bg-forest hover:text-white transition"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call Kitchen</span>
                </a>
                <a
                  href={`https://wa.me/${RESTAURANT_WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-[#25D366] text-white py-3 rounded-xl font-bold text-xs shadow-md transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Click-outside backdrop closer */}
            <div
              className="flex-1 cursor-pointer"
              onClick={() => setMobileMenuOpen(false)}
            />
          </div>
        )}
      </header>
    </>
  );
}
