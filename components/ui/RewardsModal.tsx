"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Unlock, Crown, Zap, Calendar, Gift, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function RewardsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);

  const { currentUser, syncFromServer, isLoggedIn, xp } = useTradingStore();
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [isClaimingRakeback, setIsClaimingRakeback] = useState(false);
  const [isUnlockingVault, setIsUnlockingVault] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Listen to open-rewards-hub custom event for manual triggers
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setSuccessMsg(null);
      setErrorMsg(null);
    };
    window.addEventListener("open-rewards-hub", handleOpen);
    return () => window.removeEventListener("open-rewards-hub", handleOpen);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Derive Rakeback amount: 5% of user total wagered
  const totalWagered = currentUser?.totalWagered || 0;
  const rawRakeback = Math.floor(totalWagered * 0.05);
  const rakebackAmount = Math.max(0, rawRakeback);

  const claimRakeback = async () => {
    if (isClaimingRakeback || rakebackAmount <= 0 || !isLoggedIn || !currentUser) return;
    setIsClaimingRakeback(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          rewardType: 'rakeback',
          amount: rakebackAmount,
          details: 'Instant Rakeback'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Successfully claimed ₹${rakebackAmount.toLocaleString('en-IN')} rakeback!`);
        await syncFromServer();
      } else {
        setErrorMsg(data.error || "Failed to claim rakeback.");
      }
    } catch (err) {
      console.error("Rakeback claim failed", err);
      setErrorMsg("Failed to connect to server. Please try again.");
    } finally {
      setIsClaimingRakeback(false);
    }
  };

  const claimWeeklyDrop = async () => {
    if (isUnlockingVault || timeLeft > 0 || !isLoggedIn || !currentUser) return;
    setIsUnlockingVault(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          rewardType: 'weekly',
          amount: 500,
          details: 'Weekly VIP Drop'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Successfully claimed ₹500 Weekly VIP Drop!");
        await syncFromServer();
      } else {
        setErrorMsg(data.error || "Failed to claim weekly drop.");
      }
    } catch (err) {
      console.error("Weekly claim failed", err);
      setErrorMsg("Failed to connect to server. Please try again.");
    } finally {
      setIsUnlockingVault(false);
    }
  };

  const xpVal = xp || 0;
  const progressPercent = (xpVal % 1000) / 10;
  const currentTier = currentUser?.vipLevel || "Bronze";
  const level = Math.floor(xpVal / 1000) + 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-white/80 z-[9990] backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-2xl rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-slate-200 relative flex flex-col max-h-[90vh] ring-1 ring-white/5"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 sm:p-8 pb-4 shrink-0 bg-slate-50 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Rewards Hub</h2>
                  <p className="text-sm text-slate-650 mt-1">Claim your bonuses and track your VIP journey.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-650 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner Messages */}
              {successMsg && (
                <div className="mx-6 sm:mx-8 mt-4 p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="mx-6 sm:mx-8 mt-4 p-4 bg-red-500/15 border border-red-500/30 text-red-650 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Content */}
              <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 bg-white/50">
                
                {/* VIP Journey */}
                <section>
                  <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/80">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Current Tier</p>
                        <div className="flex items-center gap-2">
                          <Crown className="w-5 h-5 text-[#a855f7]" />
                          <span className="text-xl font-black text-slate-900 uppercase tracking-wide">{currentTier} (LVL {level})</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Next: LVL {level + 1}</p>
                        <span className="text-sm font-bold text-slate-900">{(xpVal % 1000).toLocaleString()} <span className="text-slate-500">/ 1,000 XP</span></span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#a855f7] to-[#22c55e] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </section>

                {/* The Vault */}
                <section>
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-4">The Vault</h3>
                  <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-16 h-16 bg-white rounded-full border border-slate-200 flex items-center justify-center mb-4 shadow-inner">
                        {timeLeft > 0 ? (
                          <Lock className="w-6 h-6 text-slate-500" />
                        ) : (
                          <Unlock className="w-6 h-6 text-[#22c55e]" />
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-2">Next Reward Drop</h4>
                      <div className="text-3xl font-black font-mono text-[#a855f7] tracking-widest drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] mb-4">
                        {formatTime(timeLeft)}
                      </div>
                      <button 
                        disabled={timeLeft > 0 || isUnlockingVault}
                        onClick={claimWeeklyDrop}
                        className={`px-8 py-3 rounded-full font-bold transition-all flex items-center justify-center gap-2 ${
                          (timeLeft > 0 || isUnlockingVault)
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed opacity-50'
                            : 'bg-[#a855f7] hover:bg-purple-500 text-slate-900 shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] cursor-pointer'
                        }`}
                      >
                        {isUnlockingVault ? (
                          <span className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                        ) : (
                          "Unlock Vault (₹500)"
                        )}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Claimables */}
                <section>
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-4">Claimable Bonuses</h3>
                  <div className="space-y-3">
                    
                    {/* Instant Rakeback */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between group hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                          <Zap className="w-5 h-5 text-[#22c55e]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Instant Rakeback</h4>
                          <p className="text-xs text-slate-650 mt-0.5">Available now (5% of wagers)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-black text-slate-900">₹{rakebackAmount.toLocaleString('en-IN')}</span>
                        <button 
                          disabled={rakebackAmount <= 0 || isClaimingRakeback}
                          onClick={claimRakeback}
                          className="bg-slate-50 hover:bg-green-500 disabled:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold px-4 py-2 rounded-lg text-sm shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all cursor-pointer flex items-center justify-center min-w-[80px]"
                        >
                          {isClaimingRakeback ? (
                            <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                          ) : (
                            "Claim"
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Daily Bonus */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between opacity-50 cursor-not-allowed">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Daily Bonus</h4>
                          <p className="text-xs text-slate-650 mt-0.5">Configured in Streak Calendar</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-500">Integrated</span>
                    </div>

                    {/* Weekly Bonus */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between opacity-50 cursor-not-allowed">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                          <Gift className="w-5 h-5 text-[#a855f7]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Weekly Loyalty Drop</h4>
                          <p className="text-xs text-slate-650 mt-0.5">Claimable at the Vault above</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-500">Weekly drop</span>
                    </div>

                  </div>
                </section>

              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
