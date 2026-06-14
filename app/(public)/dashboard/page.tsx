"use client";
import { useEffect, useState } from "react";
import { useTradingStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Crown, Zap, Shield, Gift, ChevronRight, Activity, TrendingUp, Gem, Lock } from "lucide-react";
import { motion } from "framer-motion";

const VIP_LEVELS = [
  { name: 'Bronze', threshold: 0, color: 'text-[#cd7f32]', bg: 'bg-[#cd7f32]', shadow: 'shadow-[#cd7f32]/20', icon: Shield, perks: ['Basic Rakeback (2%)'] },
  { name: 'Silver', threshold: 50000, color: 'text-slate-300', bg: 'bg-slate-300', shadow: 'shadow-slate-300/20', icon: Zap, perks: ['Level Up Bonus: ₹500', 'Weekly Bonus (5%)'] },
  { name: 'Gold', threshold: 250000, color: 'text-yellow-400', bg: 'bg-yellow-400', shadow: 'shadow-yellow-400/20', icon: Crown, perks: ['Level Up Bonus: ₹2,500', 'Daily Reload (8%)', 'Dedicated Host'] },
  { name: 'Platinum', threshold: 1000000, color: 'text-cyan-400', bg: 'bg-cyan-400', shadow: 'shadow-cyan-400/20', icon: Gem, perks: ['Level Up Bonus: ₹10,000', 'High Roller Rakeback (12%)', 'VIP Event Invites'] },
  { name: 'Diamond', threshold: 5000000, color: 'text-purple-400', bg: 'bg-purple-400', shadow: 'shadow-purple-400/20', icon: DiamondIcon, perks: ['Level Up Bonus: ₹50,000', 'Unlimited Withdrawals', 'Luxury Gifts', 'Bespoke Bonuses'] }
];

function DiamondIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"/>
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, balance } = useTradingStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  if (!mounted || !currentUser) return <div className="min-h-screen bg-[#02050a]" />;

  const totalWagered = currentUser.totalWagered || 0;
  const currentLevelStr = currentUser.vipLevel || 'Bronze';
  const currentLevelIdx = VIP_LEVELS.findIndex(l => l.name === currentLevelStr);
  const currentLevel = VIP_LEVELS[currentLevelIdx] || VIP_LEVELS[0];
  const nextLevel = VIP_LEVELS[currentLevelIdx + 1];

  const progressToNext = nextLevel 
    ? Math.min(100, Math.max(0, ((totalWagered - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100))
    : 100;

  const wagerRemaining = nextLevel ? nextLevel.threshold - totalWagered : 0;

  return (
    <div className="min-h-screen bg-[#02050a] pt-24 pb-20 selection:bg-neon-purple/30">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&q=80')] opacity-5 bg-cover bg-center mix-blend-screen pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/5 via-[#02050a] to-[#02050a] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-8 drop-shadow-md">
          Player <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-green">Dashboard</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* VIP Progress Ring Card */}
          <div className="lg:col-span-2 bg-[#0a0f1c] border border-white/10 rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {/* VIP Glow Background */}
            <div className={`absolute top-0 right-0 w-64 h-64 ${currentLevel.bg} blur-[120px] opacity-20 pointer-events-none`} />
            
            <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
              
              {/* Circular Progress */}
              <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
                  <motion.circle 
                    cx="50" cy="50" r="45" fill="none" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    strokeLinecap="round"
                    className={currentLevel.color}
                    initial={{ strokeDasharray: "283", strokeDashoffset: "283" }}
                    animate={{ strokeDashoffset: 283 - (283 * progressToNext) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#02050a]/40 rounded-full backdrop-blur-sm m-2 border border-white/5">
                  <currentLevel.icon className={`w-10 h-10 mb-1 ${currentLevel.color} drop-shadow-lg`} />
                  <span className={`text-xl font-black uppercase tracking-widest ${currentLevel.color}`}>{currentLevel.name}</span>
                </div>
              </div>

              {/* Progress Stats */}
              <div className="flex-1 w-full text-center md:text-left">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Total Wagered</p>
                <h2 className="text-4xl md:text-5xl font-black text-white font-mono tracking-tighter mb-4">
                  ₹{totalWagered.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </h2>
                
                {nextLevel ? (
                  <>
                    <p className="text-slate-300 text-sm mb-2 font-medium">
                      Wager <span className="text-neon-green font-bold">₹{wagerRemaining.toLocaleString()}</span> more to unlock <span className={`font-black uppercase tracking-widest ${nextLevel.color}`}>{nextLevel.name}</span>!
                    </p>
                    <div className="w-full h-3 bg-[#1e293b] rounded-full overflow-hidden border border-white/5 shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToNext}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`h-full ${currentLevel.bg} ${currentLevel.shadow}`}
                      />
                    </div>
                  </>
                ) : (
                  <div className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 rounded-xl">
                    <p className="text-purple-400 font-black uppercase tracking-widest flex items-center gap-2">
                      <Crown className="w-5 h-5" /> Maximum VIP Level Reached
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-[#0a0f1c] border border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col gap-4">
            <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-neon-yellow" /> Wallet Overview
            </h3>
            
            <div className="bg-[#131b2c] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Current Balance</p>
                <p className="text-2xl font-black text-white font-mono tracking-tight">₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <button onClick={() => window.dispatchEvent(new CustomEvent('open-cashier'))} className="bg-neon-green text-black px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                Deposit
              </button>
            </div>

            <div className="bg-[#131b2c] p-4 rounded-2xl border border-white/5">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Bets Placed</p>
              <p className="text-xl font-black text-slate-300 font-mono">{currentUser.transactions.filter(t => t.type === 'casino' || t.type === 'trade').length}</p>
            </div>
          </div>
        </div>

        {/* VIP Benefits & Unlocks */}
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mt-12 mb-6 flex items-center gap-3">
          <Gift className="w-6 h-6 text-neon-purple" /> VIP Benefits Hub
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {VIP_LEVELS.map((level, i) => {
            const isUnlocked = totalWagered >= level.threshold;
            return (
              <div 
                key={level.name} 
                className={`relative p-5 rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isUnlocked 
                    ? `bg-[#0a0f1c] border-${level.color.split('-')[1]}-500/30 ${level.shadow} shadow-lg hover:-translate-y-1` 
                    : 'bg-[#0a0f1c]/50 border-white/5 opacity-60 grayscale'
                }`}
              >
                {!isUnlocked && <Lock className="absolute top-4 right-4 w-4 h-4 text-slate-500" />}
                
                <level.icon className={`w-8 h-8 mb-4 ${isUnlocked ? level.color : 'text-slate-500'}`} />
                <h3 className={`font-black uppercase tracking-widest mb-1 ${isUnlocked ? level.color : 'text-slate-400'}`}>{level.name}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 font-mono">
                  {level.threshold === 0 ? 'Unlocked' : `₹${(level.threshold / 1000)}k+ Wager`}
                </p>

                <ul className="space-y-2">
                  {level.perks.map((perk, j) => (
                    <li key={j} className="text-xs text-slate-300 font-medium flex items-start gap-1.5">
                      <ChevronRight className={`w-3 h-3 mt-0.5 shrink-0 ${isUnlocked ? level.color : 'text-slate-600'}`} />
                      <span className="leading-tight">{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
