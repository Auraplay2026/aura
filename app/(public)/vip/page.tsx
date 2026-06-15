"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Crown, Star, Shield, Gift, Zap, ArrowRight, ChevronRight, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTradingStore } from "@/lib/store";
import { useState, useEffect } from "react";
import Link from "next/link";

const TIERS = [
  { name: "Bronze", wagerReq: "₹0", wagerNum: 0, rakeback: "5%", bonus: "None", color: "text-amber-600", bg: "bg-amber-600/10", border: "border-amber-600/20", icon: Shield },
  { name: "Silver", wagerReq: "₹5,00,000", wagerNum: 500000, rakeback: "10%", bonus: "Monthly", color: "text-slate-700", bg: "bg-slate-300/10", border: "border-slate-300/20", icon: Star },
  { name: "Gold", wagerReq: "₹25,00,000", wagerNum: 2500000, rakeback: "15%", bonus: "Weekly", color: "text-yellow-600", bg: "bg-yellow-400/10", border: "border-yellow-400/20", icon: Crown },
  { name: "Diamond", wagerReq: "₹1,00,00,000", wagerNum: 10000000, rakeback: "20%", bonus: "Daily + Weekly", color: "text-cyan-600", bg: "bg-cyan-400/10", border: "border-cyan-400/20", glow: "shadow-[0_0_30px_rgba(34,211,238,0.2)]", icon: Zap },
];

export default function VIPClubPage() {
  const { isLoggedIn, balance, transactions, currentUser } = useTradingStore();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  // Calculate actual total wager from real wagers in database only (no demo)
  const simulatedWager = isClient && isLoggedIn 
    ? (currentUser?.totalWagered || 0)
    : 0;
  
  const currentTierIndex = TIERS.findLastIndex(t => simulatedWager >= t.wagerNum) || 0;
  const currentTier = TIERS[currentTierIndex];
  const nextTier = TIERS[currentTierIndex + 1];
  
  const progressPercent = nextTier ? Math.min(100, Math.max(0, ((simulatedWager - currentTier.wagerNum) / (nextTier.wagerNum - currentTier.wagerNum)) * 100)) : 100;
  return (
    <div className="flex min-h-full w-full max-w-[1400px] mx-auto text-slate-800 p-4 sm:p-6 lg:p-8 flex-col space-y-12 pb-20 overflow-x-hidden">
      
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center pt-10 sm:pt-16 pb-8 space-y-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-yellow-600 to-yellow-300 p-1 shadow-[0_0_40px_rgba(234,179,8,0.4)] relative"
        >
          <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-40 animate-pulse" />
          <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center border border-slate-200">
            <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-600" />
          </div>
        </motion.div>
        
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-tight">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-200 drop-shadow-sm">VIP Club</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl font-medium mt-4 mx-auto px-4">
            Unrivaled rewards for our most dedicated players. Progress through the tiers to unlock daily cashbacks, dedicated hosts, and exclusive events.
          </p>
        </motion.div>
      </div>

      {/* Progress Tracker (If Logged In) */}
      <AnimatePresence>
        {isClient && isLoggedIn && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 sm:p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border", currentTier.bg, currentTier.border)}>
                  <currentTier.icon className={cn("w-7 h-7", currentTier.color)} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Status</p>
                  <h3 className={cn("text-2xl font-black", currentTier.color)}>{currentTier.name} VIP</h3>
                </div>
              </div>

              <div className="w-full sm:w-1/2 flex flex-col gap-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-600">Total Wagered: <span className="text-slate-900">₹{simulatedWager.toLocaleString()}</span></span>
                  {nextTier && <span className="text-slate-500">{progressPercent.toFixed(1)}% to {nextTier.name}</span>}
                </div>
                
                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-200 relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn("h-full rounded-full relative", currentTier.bg.replace('/10', '/50'))}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30" />
                  </motion.div>
                </div>
                
                {nextTier ? (
                  <p className="text-xs text-slate-500 font-medium text-right">
                    Wager <span className="text-slate-900">₹{(nextTier.wagerNum - simulatedWager).toLocaleString()}</span> more to upgrade
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 font-medium text-right text-yellow-500">Maximum Tier Reached!</p>
                )}
              </div>
            </div>

            {/* VIP Conversion Nudges / Hooks */}
            {currentUser?.accountType === 'demo' ? (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <span>⚠️ You are currently in DEMO mode. Demo wagers do not count towards VIP rank. Switch to Real Money to earn real cashbacks!</span>
                <Link href="/account/balance" className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors text-center w-full sm:w-auto uppercase tracking-wider text-[10px] font-black">Deposit & Play Real</Link>
              </div>
            ) : (
              <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-indigo-800 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <span>🚀 You are earning <strong>{currentTier.rakeback} Rakeback</strong> and exclusive <strong>{currentTier.bonus} bonuses</strong> on all real wagers! Play more to level up to {nextTier?.name || 'Max rank'}!</span>
                <Link href="/account/balance" className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors text-center w-full sm:w-auto uppercase tracking-wider text-[10px] font-black">Deposit / Cashier</Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tiers Mobile/Desktop Hybrid View */}
      <div className="w-full mt-8">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide">VIP Tiers</h2>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Swipe to view all <ChevronRight className="inline w-3 h-3" /></div>
        </div>

        <div className="w-full overflow-x-auto custom-scrollbar snap-x snap-mandatory pb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex sm:grid sm:grid-cols-4 gap-4 sm:gap-6 min-w-max sm:min-w-0">
            {TIERS.map((tier, i) => {
              const isCurrent = isClient && isLoggedIn && currentTier.name === tier.name;
              const isLocked = isClient && isLoggedIn && simulatedWager < tier.wagerNum;
              
              return (
                <motion.div 
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "snap-center w-[280px] sm:w-auto shrink-0 rounded-3xl p-6 sm:p-8 flex flex-col relative overflow-hidden backdrop-blur-xl border transition-all duration-500 hover:-translate-y-2 group",
                    tier.bg, tier.border, tier.glow,
                    isLocked ? "opacity-60 grayscale-[30%]" : "opacity-100"
                  )}
                >
                  {/* Background decoration */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-slate-900/5 rounded-full blur-2xl group-hover:bg-slate-900/10 transition-colors" />

                  {isCurrent && (
                    <div className="absolute top-4 right-4 bg-white text-slate-900 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-lg">
                      Current
                    </div>
                  )}

                  <tier.icon className={cn("w-10 h-10 mb-6", tier.color)} />
                  <h3 className={cn("text-2xl sm:text-3xl font-black mb-2", tier.color)}>{tier.name}</h3>
                  <p className="text-sm font-medium text-slate-600 mb-8 flex items-center gap-1.5">
                    {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    {tier.wagerReq} Wager
                  </p>
                  
                  <div className="space-y-6 w-full flex-1">
                    <div className="bg-slate-900/20 rounded-xl p-4 border border-slate-200">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Rakeback</p>
                      <p className="font-black text-slate-900 text-2xl">{tier.rakeback}</p>
                    </div>
                    <div className="bg-slate-900/20 rounded-xl p-4 border border-slate-200">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Bonus Frequency</p>
                      <p className="font-bold text-slate-800 text-sm leading-tight">{tier.bonus}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 hover:bg-slate-50 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-[50px] rounded-full group-hover:bg-yellow-500/10 transition-colors pointer-events-none" />
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 shadow-lg mb-6 group-hover:scale-110 transition-transform">
            <Star className="w-6 h-6 text-neon-yellow" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">Dedicated VIP Host</h3>
          <p className="text-slate-600 text-sm leading-relaxed">Diamond tier members receive 24/7 priority support via WhatsApp or Telegram from a personal account manager.</p>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 hover:bg-slate-50 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] rounded-full group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 shadow-lg mb-6 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6 text-neon-purple" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">Instant Withdrawals</h3>
          <p className="text-slate-600 text-sm leading-relaxed">Skip the queue. Platinum and Diamond members enjoy 0-confirmation crypto withdrawals with zero limits.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 hover:bg-slate-50 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[50px] rounded-full group-hover:bg-green-500/10 transition-colors pointer-events-none" />
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 shadow-lg mb-6 group-hover:scale-110 transition-transform">
            <Gift className="w-6 h-6 text-neon-green" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">Luxury Gifts</h3>
          <p className="text-slate-600 text-sm leading-relaxed">Reach new tiers to unlock physical rewards, from the latest tech to all-expenses-paid trips to our annual VIP gala.</p>
        </div>
      </div>

    </div>
  );
}
