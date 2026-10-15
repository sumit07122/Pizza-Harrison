'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Menu as MenuIcon,
  X,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  User,
  Utensils,
  Tag,
  Award,
  Calendar,
  Compass,
  MessageCircle,
  ChevronDown,
  Search,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useCart } from '@/lib/store/cart-context';
import { useCustomerAuth } from '@/lib/store/customer-auth-context';
import { formatINR } from '@/lib/pricing';
import { RESTAURANT_PHONE, getClickToCallUrl, RESTAURANT_WHATSAPP } from '@/lib/whatsapp';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, totalPaise, openCartDrawer, branch, setBranch } = useCart();
  const { customer, isAuthenticated } = useCustomerAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [branchPopoverOpen, setBranchPopoverOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const branchPopoverRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  // Detect scroll state for dynamic glassmorphic backdrop
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchPopoverRef.current && !branchPopoverRef.current.contains(e.target as Node)) {
        setBranchPopoverOpen(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open on iOS / mobile
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setBranchPopoverOpen(false);
    setMoreDropdownOpen(false);
  }, [pathname]);

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText('GLA100');
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2500);
  };

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileSearchQuery.trim()) return;
    setMobileMenuOpen(false);
    router.push(`/menu?q=${encodeURIComponent(mobileSearchQuery.trim())}`);
  };

  const primaryLinks: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    highlight?: boolean;
  }> = [
    { label: 'Menu', href: '/menu', icon: Utensils },
    { label: 'Offers', href: '/offers', icon: Tag, badge: 'Deals' },
    { label: 'Rewards', href: '/rewards', icon: Award, highlight: true },
    { label: 'Book Table', href: '/book-table', icon: Calendar },
    { label: 'Track Order', href: '/order-tracking/search', icon: Compass },
  ];

  const secondaryLinks = [
    { label: 'Our Story', href: '/about' },
    { label: 'Customer Reviews', href: '/reviews' },
    { label: 'Contact & Outlets', href: '/contact' },
  ];

  const mobileNavItems: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { label: 'Full Menu', href: '/menu', icon: Utensils },
    { label: 'Deals & Coupons', href: '/offers', icon: Tag, badge: 'Deals' },
    { label: 'Rewards Club', href: '/rewards', icon: Award },
    { label: 'Track Live Order', href: '/order-tracking/search', icon: Compass },
    { label: 'Book a Table', href: '/book-table', icon: Calendar },
    { label: 'Customer Reviews', href: '/reviews', icon: Sparkles },
    { label: 'Our Story', href: '/about', icon: Sparkles },
    { label: 'Contact & Outlets', href: '/contact', icon: MapPin },
  ];

  const branches = [
    {
      id: 'pali_khera',
      name: 'Pali Khera (Main Outlet)',
      address: 'Sonkh Road, Opp. Indian Oil Petrol Pump',
      hours: '11:00 AM – 11:30 PM',
      status: 'Open Now',
      isLateNight: false,
    },
    {
      id: 'gla_university',
      name: 'GLA Campus Branch',
      address: 'Near Gate No. 1, NH-19, Chaumuhan',
      hours: '10:30 AM – 01:00 AM',
      status: 'Open Till 1 AM',
      isLateNight: true,
    },
  ];

  const activeBranch = branches.find((b) => b.id === branch) || branches[0];

  return (
    <>
      {/* 1. Fast, Compact Announcement Bar */}
      <div className="bg-[#0D2418] text-[#FAF7F0] py-1.5 px-3 sm:px-4 text-xs font-medium border-b border-[#1A3D2C] relative z-40 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Flash Promo Coupon */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
            <span className="bg-tomato text-white text-[9px] uppercase font-black px-1.5 sm:px-2 py-0.5 rounded-full tracking-wider shrink-0 shadow-xs flex items-center gap-0.5">
              <span>⚡</span> <span className="hidden xs:inline">DEAL</span>
            </span>
            <span className="text-[11px] sm:text-xs truncate">
              GLA & Mathura: Code <strong className="text-amber-300 font-mono font-bold tracking-wide">GLA100</strong> for Flat ₹100 Off!
            </span>
            <button
              onClick={handleCopyCoupon}
              className="text-[10px] sm:text-xs text-amber-300 hover:text-white font-bold underline transition cursor-pointer shrink-0 ml-1 px-1 py-0.5 rounded hover:bg-white/10"
              aria-label="Copy discount coupon"
            >
              {copiedCoupon ? 'Copied! ✓' : 'Copy'}
            </button>
          </div>

          {/* Quick Hotline & Speed Delivery Pill */}
          <div className="hidden sm:flex items-center gap-3 sm:gap-4 text-[11px] text-warm-cream/90 shrink-0">
            <span className="hidden md:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>30-Min Rush Delivery</span>
            </span>
            <a
              href={getClickToCallUrl()}
              className="flex items-center gap-1 font-bold text-amber-300 hover:text-white transition px-2 py-0.5 rounded-full bg-white/5 border border-white/10"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>+91 {RESTAURANT_PHONE}</span>
            </a>
          </div>

        </div>
      </div>

      {/* 2. Main Luxury Responsive Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled
            ? 'bg-[#FFFDF9]/95 backdrop-blur-xl shadow-md border-b border-border-warm/90'
            : 'bg-[#FFFDF9]/90 backdrop-blur-md border-b border-border-warm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-17 sm:h-20 flex items-center justify-between gap-2">
          
          {/* Brand Logo with Micro-interaction */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 group shrink-0 select-none py-1"
            aria-label="Pizza Harrison Homepage"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-forest to-[#0B2519] flex items-center justify-center text-white shadow-md group-hover:scale-105 group-hover:rotate-3 transition-transform duration-200 border-2 border-emerald-500/40">
              <span className="text-lg sm:text-2xl leading-none">🍕</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-lg sm:text-2xl font-black tracking-tight text-forest font-serif leading-none">
                  Pizza Harrison
                </span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-tomato shrink-0" />
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold text-emerald-700 tracking-wider uppercase mt-0.5 leading-none">
                Mathura • Artisan Pizzeria
              </p>
            </div>
          </Link>

          {/* Desktop & Tablet Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {primaryLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs xl:text-sm font-bold transition-all px-2.5 xl:px-3 py-2 rounded-full relative flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-forest text-white shadow-xs'
                      : 'text-charcoal hover:bg-[#F2ECE1] hover:text-forest'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-700'}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="bg-tomato text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow-2xs">
                      {link.badge}
                    </span>
                  )}
                  {link.highlight && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  )}
                </Link>
              );
            })}

            {/* Desktop More Links Dropdown (For Story, Reviews, Contact) */}
            <div className="relative" ref={moreDropdownRef}>
              <button
                type="button"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className={`text-xs xl:text-sm font-bold transition-all px-2.5 xl:px-3 py-2 rounded-full flex items-center gap-1 cursor-pointer ${
                  moreDropdownOpen
                    ? 'bg-[#F2ECE1] text-forest'
                    : 'text-charcoal hover:bg-[#F2ECE1] hover:text-forest'
                }`}
                aria-expanded={moreDropdownOpen}
                aria-haspopup="true"
              >
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#FFFDF9] rounded-2xl shadow-xl border border-border-warm py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {secondaryLinks.map((subLink) => {
                    const isSubActive = pathname === subLink.href;
                    return (
                      <Link
                        key={subLink.href}
                        href={subLink.href}
                        onClick={() => setMoreDropdownOpen(false)}
                        className={`block px-4 py-2 text-xs font-bold transition ${
                          isSubActive
                            ? 'bg-forest text-white'
                            : 'text-charcoal hover:bg-[#F5EFE6] hover:text-forest'
                        }`}
                      >
                        {subLink.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Cluster: Branch Outlet, Account, Cart, Mobile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Interactive Branch Switcher Popover (Desktop / Tablet) */}
            <div className="hidden md:block relative" ref={branchPopoverRef}>
              <button
                type="button"
                onClick={() => setBranchPopoverOpen(!branchPopoverOpen)}
                className="flex items-center gap-1.5 bg-[#F5EFE6] hover:bg-[#EFE7DC] px-2.5 py-1.5 rounded-full text-xs font-bold text-forest border border-border-warm shadow-2xs transition cursor-pointer"
                aria-label="Select Serving Outlet"
                aria-expanded={branchPopoverOpen}
              >
                <MapPin className="w-3.5 h-3.5 text-tomato shrink-0" />
                <span className="truncate max-w-[110px] xl:max-w-[140px] text-left">
                  {activeBranch.id === 'pali_khera' ? 'Pali Khera' : 'GLA Campus'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <ChevronDown className={`w-3 h-3 text-forest/70 transition-transform ${branchPopoverOpen ? 'rotate-180' : ''}`} />
              </button>

              {branchPopoverOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#FFFDF9] rounded-2xl shadow-xl border border-border-warm p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1.5">
                  <div className="px-2 pt-1 pb-1.5 text-[11px] font-black uppercase tracking-wider text-muted-gray flex items-center justify-between">
                    <span>Select Kitchen Outlet</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      Baking Live
                    </span>
                  </div>

                  {branches.map((b) => {
                    const isSelected = branch === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setBranch(b.id as any);
                          setBranchPopoverOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-forest text-white border-forest shadow-xs'
                            : 'bg-white hover:bg-[#F5EFE6] text-charcoal border-border-warm'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>{b.name}</span>
                            {b.isLateNight && (
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                                isSelected ? 'bg-amber-400 text-charcoal' : 'bg-amber-100 text-amber-900'
                              }`}>
                                1 AM
                              </span>
                            )}
                          </div>
                          <div className={`text-[10px] leading-tight ${isSelected ? 'text-white/80' : 'text-muted-gray'}`}>
                            {b.address}
                          </div>
                          <div className={`text-[10px] font-medium flex items-center gap-1 pt-0.5 ${isSelected ? 'text-emerald-200' : 'text-emerald-700'}`}>
                            <Clock className="w-3 h-3" />
                            <span>{b.hours}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Customer Account / Sign In Pill */}
            <Link
              href={isAuthenticated ? "/account" : "/login"}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-bold border transition text-forest bg-white hover:bg-forest hover:text-white border-border-warm shadow-2xs hover:shadow cursor-pointer select-none"
              aria-label={isAuthenticated ? "Customer Profile" : "Sign In to Account"}
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
              className="relative flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-primary-green to-forest hover:from-forest hover:to-primary-green text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition transform active:scale-95 cursor-pointer select-none"
              aria-label={`View Shopping Cart (${itemCount} items)`}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-200 shrink-0" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="bg-tomato text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-black animate-in zoom-in-75">
                  {itemCount}
                </span>
              )}
              {itemCount > 0 && (
                <span className="hidden md:inline text-xs font-bold pl-1 border-l border-white/20">
                  {formatINR(totalPaise)}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Button with 44px tap target for iOS */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-2xl bg-[#F5EFE6] text-forest border border-border-warm hover:bg-forest hover:text-white transition cursor-pointer select-none"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* 3. Smooth Mobile Navigation Drawer with Native iOS Sheet Feel */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 top-[69px] sm:top-[80px] z-50 flex flex-col justify-between bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="bg-[#FFFDF9] border-b border-border-warm px-4 pt-3.5 pb-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-3.5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Quick Search Input */}
              <form onSubmit={handleMobileSearch} className="relative w-full">
                <Search className="w-4 h-4 text-muted-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search pizzas, burgers, shakes..."
                  value={mobileSearchQuery}
                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                  className="w-full bg-[#F5EFE6] border border-border-warm rounded-xl pl-9 pr-14 py-2.5 text-xs font-medium text-charcoal placeholder:text-muted-gray focus:outline-hidden focus:border-forest shadow-2xs"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-forest text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                >
                  Go
                </button>
              </form>

              {/* Customer Greeting / Auth Pill */}
              <Link
                href={isAuthenticated ? "/account" : "/login"}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between bg-gradient-to-r from-[#0E271B] to-[#17432E] p-3 rounded-2xl text-white shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-base">
                    {isAuthenticated ? '👤' : '🍕'}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white leading-tight">
                      {isAuthenticated
                        ? `Hi, ${customer?.full_name || customer?.name || 'Customer'}!`
                        : 'Sign In / Register'}
                    </div>
                    <div className="text-[10px] text-emerald-200 font-medium leading-tight mt-0.5">
                      {isAuthenticated
                        ? `Phone: +91 ${customer?.phone}`
                        : 'Unlock rewards & save ₹100'}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <span>{isAuthenticated ? 'Profile' : 'Log In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>

              {/* Outlet Branch Selector for Mobile */}
              <div className="bg-[#F8F4EC] p-3 rounded-2xl border border-border-warm space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-forest">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-tomato" /> Serving Kitchen:
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    🟢 Live Kitchen
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  {branches.map((b) => {
                    const isSelected = branch === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBranch(b.id as any)}
                        className={`p-2 rounded-xl text-left border text-xs transition cursor-pointer ${
                          isSelected
                            ? 'bg-forest text-white border-forest font-bold shadow-xs'
                            : 'bg-white text-charcoal border-border-warm font-medium hover:bg-[#F2ECE1]'
                        }`}
                      >
                        <div className="text-[11px] font-bold leading-tight truncate">
                          {b.id === 'pali_khera' ? 'Pali Khera (Main)' : 'GLA Campus'}
                        </div>
                        <div className={`text-[9px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-muted-gray'}`}>
                          {b.hours}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Grid Links */}
              <div className="grid grid-cols-2 gap-2">
                {mobileNavItems.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition border ${
                        isActive
                          ? 'bg-forest text-white border-forest shadow-xs'
                          : 'bg-white text-charcoal border-border-warm hover:bg-[#F4ECE1]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{link.label}</span>
                      {link.badge && (
                        <span className="ml-auto bg-tomato text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase shrink-0">
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
                  className="flex items-center justify-center gap-1.5 bg-white text-forest border border-border-warm py-2.5 rounded-xl font-bold text-xs shadow-2xs hover:bg-forest hover:text-white transition"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call Kitchen</span>
                </a>
                <a
                  href={`https://wa.me/${RESTAURANT_WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-[#25D366] text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition"
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
