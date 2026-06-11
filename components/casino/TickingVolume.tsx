"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

export function TickingVolume() {
  // Start at around 1.2 Billion Rupees
  const [volume, setVolume] = useState(1245890230);

  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly increase volume by 10k to 500k
      const jump = Math.floor(Math.random() * 490000) + 10000;
      setVolume(prev => prev + jump);
    }, 2000); // Ticks every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex justify-center py-8">
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-blue-100 blur-2xl rounded-full transition-colors" />
        
        <div className="relative bg-white border border-slate-200 rounded-full px-8 py-4 flex items-center gap-6 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col items-end">
            <span className="text-[10px] sm:text-xs text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-blue-600" /> 24H Global Wagered Volume
            </span>
            <div className="text-2xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight mt-1 flex items-baseline">
              <span className="text-green-600 mr-1 text-xl sm:text-3xl">₹</span>
              {volume.toLocaleString()}
            </div>
          </div>

          <div className="w-px h-10 bg-slate-200 hidden sm:block" />
          
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Active Players</span>
            <div className="text-xl font-bold text-slate-900 font-mono flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              14,592
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
