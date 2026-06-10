'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, RefreshCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In a real app, log to Sentry or similar here
    console.error('Global Error Caught:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center relative z-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.1),transparent_70%)] pointer-events-none -z-10" />
      
      <div className="w-24 h-24 bg-slate-900 border border-red-900/50 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(220,38,38,0.2)]">
        <ShieldAlert className="w-12 h-12 text-red-500" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
        System Breach
      </h1>
      <h2 className="text-xl font-bold text-slate-300 mb-6 uppercase tracking-widest text-red-400">
        Fatal Exception Handled
      </h2>
      
      <p className="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed">
        A critical error has occurred in the application matrix. Our technicians have been notified. Please try reloading the system.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => reset()}
          className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-xl uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:scale-105 flex items-center justify-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Reboot System
        </button>
        <Link 
          href="/"
          className="bg-slate-800 hover:bg-slate-700 text-white font-black px-8 py-4 rounded-xl uppercase tracking-widest text-sm transition-all border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Return to Lobby
        </Link>
      </div>
      
      {/* Optional: Show error digest if available */}
      {error.digest && (
        <div className="mt-12 text-xs text-slate-700 font-mono">
          Error ID: {error.digest}
        </div>
      )}
    </div>
  );
}
