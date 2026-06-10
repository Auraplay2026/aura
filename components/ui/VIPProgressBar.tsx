"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { useTradingStore } from "@/lib/store";

const TIERS = [
  { name: "Bronze", minWager: 0, maxWager: 500000 },
  { name: "Silver", minWager: 500000, maxWager: 2500000 },
  { name: "Gold", minWager: 2500000, maxWager: 10000000 },
  { name: "Diamond", minWager: 10000000, maxWager: Infinity }
];

export function VIPProgressBar() {
  const { isLoggedIn, transactions } = useTradingStore();
  const [isClient, setIsClient] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const prevTierRef = useRef<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const totalWagered = isClient && isLoggedIn 
    ? transactions.filter(t => t.type === 'casino' || t.type === 'trade').reduce((sum, t) => sum + t.amount, 0) 
    : 0;

  // Determine current tier
  const currentTierIndex = TIERS.findLastIndex(t => totalWagered >= t.minWager) || 0;
  const currentTier = TIERS[currentTierIndex];
  const nextTier = TIERS[currentTierIndex + 1] || null;

  // Trigger level up explosion when tier increases
  useEffect(() => {
    if (isClient && isLoggedIn) {
      if (prevTierRef.current && prevTierRef.current !== currentTier.name) {
        setLevelUp(true);
        setTimeout(() => setLevelUp(false), 3000);
      }
      prevTierRef.current = currentTier.name;
    }
  }, [currentTier.name, isLoggedIn, isClient]);

  // Calculate progress percent
  let progress = 100;
  if (nextTier) {
    const range = nextTier.minWager - currentTier.minWager;
    const currentOffset = totalWagered - currentTier.minWager;
    progress = Math.min(100, Math.max(0, (currentOffset / range) * 100));
  }

  if (!isClient) return null;

  return (
    <div className="hidden lg:flex items-center gap-3 w-48 xl:w-64 relative">
      <div className="w-8 h-8 rounded-full bg-[#0a0a0f] border border-yellow-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.3)] relative z-10">
        <Star className="w-4 h-4 text-neon-yellow fill-neon-yellow" />
      </div>
      
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex justify-between items-end">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.1em]">
            VIP <span className="text-white">{currentTier.name}</span>
          </span>
          <span className="text-[10px] text-neon-yellow font-black font-mono tracking-tighter">
            {progress.toFixed(0)}%
          </span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/10 relative">
          <motion.div 
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-yellow-600 via-neon-yellow to-amber-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
          {/* Micro-particles / Glare on the bar */}
          <motion.div
            className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/80 to-transparent blur-[2px]"
            animate={{ x: ["-100%", "400%"] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
          />
        </div>
      </div>

      {/* Cinematic Level Up Explosion */}
      <AnimatePresence>
        {levelUp && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: [1, 2, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.8)_0%,transparent_70%)] pointer-events-none mix-blend-screen z-50"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
