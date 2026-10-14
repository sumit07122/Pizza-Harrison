'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Clock, MapPin, Volume2, Store } from 'lucide-react';
import Link from 'next/link';

interface AdminTopBarProps {
  onOpenMobileMenu: () => void;
  selectedBranch: string;
  onBranchChange: (b: string) => void;
}

export function AdminTopBar({
  onOpenMobileMenu,
  selectedBranch,
  onBranchChange,
}: AdminTopBarProps) {
  const [istTime, setIstTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-border-warm px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-charcoal hover:bg-neutral-100 rounded-lg cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-forest hidden sm:inline">
            Live Operations Dashboard
          </span>
        </div>
      </div>

      {/* Right: Branch Filter, Time & Storefront Shortcut */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Branch Outlet Selector */}
        <div className="flex items-center gap-1.5 bg-warm-cream border border-border-warm rounded-lg px-2.5 py-1 text-xs font-bold text-forest">
          <MapPin className="w-3.5 h-3.5 text-tomato" />
          <select
            value={selectedBranch}
            onChange={(e) => onBranchChange(e.target.value)}
            className="bg-transparent outline-hidden font-bold cursor-pointer text-xs pr-1"
          >
            <option value="all">All Outlets (Combined)</option>
            <option value="pali_khera">Pali Khera (Main)</option>
            <option value="gla_university">GLA Campus (Gate 1)</option>
          </select>
        </div>

        {/* Live IST Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono font-bold text-muted-gray bg-neutral-100 px-3 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-primary-green" />
          <span>{istTime || 'IST Clock'}</span>
        </div>

        {/* Link to Storefront */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1 text-xs font-bold text-primary-green hover:text-forest transition px-3 py-1.5 rounded-lg border border-border-warm hover:border-primary-green"
        >
          <Store className="w-3.5 h-3.5" />
          <span>View Store</span>
        </Link>
      </div>

    </header>
  );
}
