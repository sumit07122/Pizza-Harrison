'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-cream p-4">
      <div className="bg-white rounded-3xl p-8 border border-border-warm shadow-xl text-center max-w-md w-full space-y-5">
        <div className="w-16 h-16 bg-red-100 text-tomato rounded-full mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-black text-forest font-serif">Something Went Wrong</h1>
          <p className="text-xs text-muted-gray leading-relaxed">
            Our kitchen system encountered a temporary error. Don't worry, your orders are safe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-primary-green hover:bg-forest text-white text-xs font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto bg-warm-cream hover:bg-neutral-100 text-forest border border-border-warm text-xs font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
