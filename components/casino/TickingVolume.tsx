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
        <div className="absolute inset-0 bg-neon-purple/20 blur-2xl rounded-full group-hover:bg-neon-purple/30 transition-colors" />
        
        <div className="relative bg-[#050505] border border-white/10 rounded-full px-8 py-4 flex items-center gap-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-end">
            <span className="text-[10px] sm:text-xs text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-neon-green" /> 24H Global Wagered Volume
            </span>
            <div className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 font-mono tracking-tight mt-1 flex items-baseline">
              <span className="text-neon-green mr-1 text-xl sm:text-3xl">₹</span>
              {volume.toLocaleString()}
            </div>
          </div>

          <div className="w-px h-10 bg-white/10 hidden sm:block" />
          
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Active Players</span>
            <div className="text-xl font-bold text-white font-mono flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              14,592
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
