"use client";

import { useState, useEffect } from "react";
import { 
  Info, ChevronLeft, ChevronRight, CheckCircle2, ChevronUp, ChevronDown, Gift, Lock, Star, Sparkles, Coins, HelpCircle 
} from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

export default function RewardsPage() {
  const { balance, deposit, transactions, isLoggedIn } = useTradingStore();
  const [isClient, setIsClient] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Claim states tracked via localStorage
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [weeklyClaimed, setWeeklyClaimed] = useState(false);
  const [monthlyClaimed, setMonthlyClaimed] = useState(false);
  const [rakebackClaimed, setRakebackClaimed] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Load claimed states
    setDailyClaimed(localStorage.getItem("reward_daily_claimed") === "true");
    setWeeklyClaimed(localStorage.getItem("reward_weekly_claimed") === "true");
    setMonthlyClaimed(localStorage.getItem("reward_monthly_claimed") === "true");
    setRakebackClaimed(localStorage.getItem("reward_rakeback_claimed") === "true");
  }, []);

  const totalWager = isClient && isLoggedIn 
    ? transactions.filter(t => t.type === 'casino' || t.type === 'trade').reduce((sum, t) => sum + t.amount, 0)
    : 0;

  // Calculate instant rakeback: 5% of total wagers, capped at ₹25,000 for safety, or ₹0 if already claimed
  const pendingRakeback = rakebackClaimed ? 0 : Math.min(25000, totalWager * 0.05);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleClaimDaily = () => {
    if (dailyClaimed) return;
    deposit(250, "Daily Bonus Drop");
    localStorage.setItem("reward_daily_claimed", "true");
    setDailyClaimed(true);
    triggerToast("₹250 Daily Bonus successfully credited to your wallet!");
  };

  const handleClaimWeekly = () => {
    if (weeklyClaimed) return;
    deposit(1500, "Weekly VIP Drop");
    localStorage.setItem("reward_weekly_claimed", "true");
    setWeeklyClaimed(true);
    triggerToast("₹1,500 Weekly Reward successfully credited!");
  };

  const handleClaimMonthly = () => {
    if (monthlyClaimed) return;
    deposit(5000, "Monthly Super Drop");
    localStorage.setItem("reward_monthly_claimed", "true");
    setMonthlyClaimed(true);
    triggerToast("₹5,000 Monthly VIP Bonus successfully credited!");
  };

  const handleClaimRakeback = () => {
    if (rakebackClaimed || pendingRakeback <= 0) {
      triggerToast("No pending rakeback to claim. Place more bets to accumulate rakeback!");
      return;
    }
    deposit(pendingRakeback, "Instant Rakeback");
    localStorage.setItem("reward_rakeback_claimed", "true");
    setRakebackClaimed(true);
    triggerToast(`₹${pendingRakeback.toFixed(2)} Instant Rakeback successfully claimed!`);
  };

  // Rank Calculation
  const ranks = [
    { name: "Beginner", minWager: 0, nextRank: "Silver I", nextMinWager: 18500 },
    { name: "Silver I", minWager: 18500, nextRank: "Silver II", nextMinWager: 35000 },
    { name: "Silver II", minWager: 35000, nextRank: "Silver III", nextMinWager: 50000 },
    { name: "Silver III", minWager: 50000, nextRank: "Max Rank", nextMinWager: 50000 }
  ];

  const currentRankIndex = ranks.findLastIndex(r => totalWager >= r.minWager) || 0;
  const currentRank = ranks[currentRankIndex];
  const remainingToNext = Math.max(0, currentRank.nextMinWager - totalWager);
  const rankProgress = currentRank.nextMinWager > currentRank.minWager 
    ? Math.min(100, ((totalWager - currentRank.minWager) / (currentRank.nextMinWager - currentRank.minWager)) * 100)
    : 100;

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-slate-50">
        <div className="w-10 h-10 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[85vh] w-full items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl w-full bg-white/80 border border-slate-200/80 rounded-3xl p-8 backdrop-blur-2xl relative overflow-hidden shadow-[0_0_80px_rgba(234,179,8,0.08)] flex flex-col items-center text-center">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-yellow-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.2)] mb-6">
            <Lock className="w-10 h-10 text-neon-yellow" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mb-4 uppercase tracking-tight">Rewards Lobby Locked</h1>
          <p className="text-slate-600 text-lg mb-8 max-w-lg font-medium leading-relaxed">
            Please authenticate your player account to claim your daily drops, monitor rakeback progress, and access the rewards schedule.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: 'login' } }))}
              className="bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-slate-950 font-black px-8 py-4 rounded-xl text-lg tracking-wide uppercase transition-all shadow-[0_0_30px_rgba(234,179,8,0.25)] transform hover:scale-[1.02] active:scale-95"
            >
              Log In to Claim
            </button>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: 'signup' } }))}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-700/80 text-slate-900 font-bold px-8 py-4 rounded-xl text-lg tracking-wide uppercase transition-colors"
            >
              Register Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-6 lg:p-8 pb-32">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-10">

        {/* 14 Day Rewards Vault Hero */}
        <div className="relative bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col md:flex-row shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-yellow-500 via-purple-500 to-[#7148ff]" />
          
          <div className="p-8 md:w-1/2 flex flex-col justify-center relative z-10">
            <h1 className="text-4xl font-black text-slate-900 leading-none mb-2 uppercase">14 Day</h1>
            <h1 className="text-4xl font-black text-yellow-500 leading-none mb-4 uppercase">Rewards <span className="text-slate-900">Vault</span></h1>
            
            <p className="text-sm text-slate-600 mb-6 max-w-sm font-medium">
              Keep playing to unlock bonuses in your vault. Vaulted rewards mature over 14 days and become fully claimable.
            </p>

            <div className="flex items-center gap-4">
              <button 
                onClick={handleClaimDaily}
                disabled={dailyClaimed}
                className={`px-8 py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all transform hover:scale-[1.02] active:scale-[0.98] ${dailyClaimed ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200' : 'bg-gradient-to-r from-yellow-600 to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:from-yellow-500'}`}
              >
                {dailyClaimed ? "Daily Drop Claimed" : "Claim Daily Drop (₹250)"}
              </button>
            </div>
          </div>

          <div className="hidden md:flex md:w-1/2 items-center justify-end p-8 relative z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#272b40]/50 pointer-events-none" />
            <img src="https://cdni.iconscout.com/illustration/premium/thumb/safe-box-4991444-4159516.png" alt="Vault" className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 object-contain opacity-40 mix-blend-screen pointer-events-none" />
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-right shadow-2xl relative z-20 min-w-[280px]">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Unlocking soon</p>
              <p className="text-3xl font-black text-neon-green font-mono">₹{dailyClaimed ? "0.00" : "250.00"}</p>
            </div>
          </div>
        </div>

        {/* Rakeback Section */}
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-500" /> Rakeback & Drops
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                title: "Instant Rakeback", 
                icon: "🪙", 
                desc: `5% of your wagered volume. Pending: ₹${pendingRakeback.toFixed(2)}`,
                btn: rakebackClaimed ? "Claimed" : `Claim Rakeback`,
                action: handleClaimRakeback,
                disabled: rakebackClaimed || pendingRakeback <= 0
              },
              { 
                title: "Daily Bonus Drop", 
                icon: "💰", 
                desc: "Get free ₹250 added to your balance every single day.",
                btn: dailyClaimed ? "Claimed" : "Claim ₹250",
                action: handleClaimDaily,
                disabled: dailyClaimed
              },
              { 
                title: "Weekly VIP Drop", 
                icon: "🎒", 
                desc: "Weekly reward drop based on your recent VIP wagering.",
                btn: weeklyClaimed ? "Claimed" : "Claim ₹1,500",
                action: handleClaimWeekly,
                disabled: weeklyClaimed
              },
              { 
                title: "Monthly Super Drop", 
                icon: "🧰", 
                desc: "Our biggest monthly drop for active VIP players.",
                btn: monthlyClaimed ? "Claimed" : "Claim ₹5,000",
                action: handleClaimMonthly,
                disabled: monthlyClaimed
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center text-center group hover:bg-slate-50 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-yellow-500/10 transition-colors" />
                
                <div className="w-20 h-20 mb-4 relative z-10 flex items-center justify-center">
                  <span className="text-5xl drop-shadow-2xl">{item.icon}</span>
                </div>
                
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5 mb-2 z-10">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 mb-6 font-medium h-12 flex items-center justify-center px-2 z-10">
                  {item.desc}
                </p>
                
                <button 
                  onClick={item.action}
                  disabled={item.disabled}
                  className={`w-full border rounded-xl py-3 text-xs font-black transition-all z-10 uppercase tracking-widest ${item.disabled ? 'bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-slate-600 hover:bg-slate-50 text-slate-900 cursor-pointer'}`}
                >
                  {item.btn}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Current Rank & Ranks and Bonuses */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Current Rank Panel */}
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Current Rank</h2>
            <div className="bg-white border border-slate-200 rounded-3xl p-8 flex-1 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="relative w-32 h-32 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 bg-red-500/20 rotate-45 rounded-2xl blur-md" />
                <div className="relative w-24 h-24 bg-slate-50 border-4 border-red-600 rotate-45 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.4)]">
                  <div className="w-16 h-16 bg-white border border-red-600/50 rounded-lg shadow-inner flex items-center justify-center -rotate-45">
                    <Star className="w-8 h-8 text-red-600 fill-red-400/20" />
                  </div>
                </div>
              </div>
              
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Current Tier</p>
              <h3 className="text-3xl font-black text-slate-900 relative z-10 mb-8 uppercase tracking-wide">{currentRank.name}</h3>
              
              <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-2xl p-5 relative z-10">
                <div className="flex justify-between items-center mb-2 text-xs font-bold">
                  <span className="text-slate-600">Next: <span className="text-slate-900">{currentRank.nextRank}</span></span>
                  {remainingToNext > 0 ? (
                    <span className="text-slate-600">Remaining: <span className="text-slate-900">₹{remainingToNext.toLocaleString()}</span></span>
                  ) : (
                    <span className="text-yellow-500">Max Tier reached</span>
                  )}
                </div>
                <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-200 relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${rankProgress}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ranks and Bonuses Panel */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ranks and Bonuses</h2>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-3xl p-6 flex-1 flex flex-col gap-3">
              {[
                { name: "Beginner", wager: "₹0.00", isReached: totalWager >= 0 },
                { name: "Silver I", wager: "₹18,500.00", isReached: totalWager >= 18500 },
                { name: "Silver II", wager: "₹35,000.00", isReached: totalWager >= 35000 },
                { name: "Silver III", wager: "₹50,000.00", isReached: totalWager >= 50000 },
              ].map((rank, idx) => (
                <div 
                  key={idx} 
                  className={`border rounded-2xl p-4 flex items-center justify-between transition-all duration-300 ${rank.isReached ? 'bg-[#7148ff]/10 border-[#7148ff]' : 'bg-slate-50 border-slate-200 opacity-70'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${rank.isReached ? 'bg-[#7148ff]/20 border-[#7148ff]' : 'bg-white border-slate-200'}`}>
                      <Star className={`w-5 h-5 ${rank.isReached ? 'text-[#7148ff] fill-[#7148ff]/20' : 'text-slate-600'}`} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-base">{rank.name}</h4>
                      <p className="text-xs text-slate-500 font-bold">Wager Requirement: <span className="text-slate-700">{rank.wager}</span></p>
                    </div>
                  </div>
                  {rank.isReached ? (
                    <span className="text-[10px] font-black tracking-widest text-[#7148ff] bg-[#7148ff]/20 px-3 py-1 rounded-full uppercase border border-[#7148ff]/40">Unlocked</span>
                  ) : (
                    <span className="text-[10px] font-black tracking-widest text-slate-600 bg-slate-50 px-3 py-1 rounded-full uppercase border border-slate-200">Locked</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* Claimed Rewards Summary */}
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Your Rewards Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { title: "Total Claimed", val: (
                (dailyClaimed ? 250 : 0) + 
                (weeklyClaimed ? 1500 : 0) + 
                (monthlyClaimed ? 5000 : 0) + 
                (rakebackClaimed ? pendingRakeback : 0)
              ) },
              { title: "Rakeback Claimed", val: rakebackClaimed ? pendingRakeback : 0 },
              { title: "Vault Claimed", val: dailyClaimed ? 250 : 0 },
              { title: "Daily Bonuses", val: dailyClaimed ? 250 : 0 },
              { title: "Weekly Bonuses", val: weeklyClaimed ? 1500 : 0 },
              { title: "Monthly Bonuses", val: monthlyClaimed ? 5000 : 0 }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.title}</p>
                <p className="text-2xl font-black text-slate-900 font-mono">₹{stat.val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Floating success toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-50 border border-emerald-400 text-slate-950 font-black tracking-wide px-6 py-4 rounded-2xl shadow-2xl z-[999] flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />
            <span className="text-sm">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
