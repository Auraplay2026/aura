"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Unlock, Crown, ChevronRight, Zap, Calendar, Gift } from "lucide-react";
import { useState, useEffect } from "react";

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RewardsModal({ isOpen, onClose }: RewardsModalProps) {
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds

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
            className="fixed inset-0 bg-white/80 z-50 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
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
                  <p className="text-sm text-slate-600 mt-1">Claim your bonuses and track your VIP journey.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8 bg-slate-900/50">
                
                {/* VIP Journey */}
                <section>
                  <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/80">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Current Tier</p>
                        <div className="flex items-center gap-2">
                          <Crown className="w-5 h-5 text-[#a855f7]" />
                          <span className="text-xl font-black text-slate-900">Beginner</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Next: Silver I</p>
                        <span className="text-sm font-bold text-slate-900">₹ 45,000 <span className="text-slate-500">/ ₹ 1,00,000</span></span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#a855f7] to-[#22c55e] w-[45%]" />
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
                        disabled={timeLeft > 0}
                        className={`px-8 py-3 rounded-full font-bold transition-all ${
                          timeLeft > 0 
                            ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                            : 'bg-[#a855f7] hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]'
                        }`}
                      >
                        Unlock Vault
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
                          <p className="text-xs text-slate-600 mt-0.5">Available now</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-black text-slate-900">₹ 1,250</span>
                        <button className="bg-slate-50 hover:bg-green-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all">
                          Claim
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
                          <p className="text-xs text-slate-600 mt-0.5">Claimed today</p>
                        </div>
                      </div>
                      <div className="w-24 h-1.5 bg-white rounded-full overflow-hidden">
                        <div className="h-full bg-slate-700 w-[100%]" />
                      </div>
                    </div>

                    {/* Weekly Bonus */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between group hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                          <Gift className="w-5 h-5 text-[#a855f7]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Weekly Bonus</h4>
                          <p className="text-xs text-slate-600 mt-0.5">Progress: 85%</p>
                        </div>
                      </div>
                      <div className="w-24 h-1.5 bg-white rounded-full overflow-hidden">
                        <div className="h-full bg-[#a855f7] w-[85%]" />
                      </div>
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
