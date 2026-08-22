"use client";

import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { LiveDealerStudioEngine } from "@/components/casino/engines/LiveDealerStudioEngine";

export default function LiveDealerStudioPage() {
  return (
    <div className="min-h-screen bg-[#04060B] text-white p-2 sm:p-4 md:p-6 lg:p-8 flex flex-col">
      {/* Top Header Breadcrumb */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <Link
            href="/casino/live"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Live Casino Lobby</span>
          </Link>
          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>AURA Live Studios</span>
            <span>•</span>
            <span className="text-amber-400">Dream Wheel VIP</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Provably Fair RNG</span>
          </div>
        </div>
      </div>

      {/* Main Studio Engine Canvas */}
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col justify-center">
        <LiveDealerStudioEngine />
      </div>
    </div>
  );
}
