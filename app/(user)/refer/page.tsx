"use client";

import { motion } from "framer-motion";
import { Users, Coins, Percent, Copy, CheckCircle2, TrendingUp, Link as LinkIcon, Gift } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTradingStore } from "@/lib/store";

export default function ReferAndEarnPage() {
  const { isLoggedIn, currentUser, syncFromServer } = useTradingStore();
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (isLoggedIn) {
      syncFromServer();
    }
  }, [isLoggedIn, syncFromServer]);

  const referralLink = isClient && isLoggedIn && currentUser?.affiliateCode 
    ? `${window.location.origin}?ref=${currentUser.affiliateCode}`
    : "https://AuraBet.com/r/loading...";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-slate-50/40 border border-slate-200/80 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden flex flex-col items-center text-center max-w-xl mx-auto my-12">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-neon-purple/5 to-transparent pointer-events-none" />
        <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mb-6">
          <Gift className="w-8 h-8 text-neon-purple" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Referral Program Locked</h2>
        <p className="text-slate-600 mt-2 text-sm leading-relaxed max-w-sm mb-6">
          Please log in to your account to retrieve your unique affiliate referral tracking link and begin earning commissions.
        </p>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: 'login' } }))}
          className="bg-neon-purple hover:bg-purple-600 text-white font-black text-xs px-6 py-3.5 rounded-xl uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95"
        >
          Sign In to Unlock
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-50/40 border border-slate-200/80 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-neon-purple/10 to-transparent pointer-events-none" />
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight relative z-10">
          <span className="w-1.5 h-6 bg-neon-purple rounded-full shadow-[0_0_10px_rgba(168,85,247,0.6)]"></span>
          Affiliate Dashboard
        </h1>
        <p className="text-sm text-slate-600 mt-1 pl-4 relative z-10">Invite friends and earn lifetime commissions on their play.</p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-200/80 rounded-3xl p-6 shadow-xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-neon-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Commission Earned</h3>
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Coins className="w-5 h-5 text-neon-green" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 relative z-10 drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">₹ {((currentUser?.affiliateEarnings || 0)).toLocaleString()}</p>
          <p className="text-xs text-neon-green font-bold mt-2 flex items-center gap-1 relative z-10">
            <TrendingUp className="w-3 h-3" /> Updated Live
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-200/80 rounded-3xl p-6 shadow-xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Total Referrals</h3>
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Users className="w-5 h-5 text-neon-purple" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 relative z-10 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">{currentUser?.referralCount || 0}</p>
          <p className="text-xs text-slate-500 font-bold mt-2 relative z-10">
            Active Accounts Registered
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-200/80 rounded-3xl p-6 shadow-xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-neon-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Current Rate</h3>
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Percent className="w-5 h-5 text-neon-yellow" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 relative z-10 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">15%</p>
          <p className="text-xs text-slate-500 font-bold mt-2 relative z-10 flex items-center justify-between">
            <span>Tier: Gold</span>
            <span className="text-neon-yellow text-[10px]">Next Tier: 20%</span>
          </p>
          {/* Progress bar to next tier */}
          <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full w-[60%] bg-neon-yellow shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
          </div>
        </div>

      </div>

      {/* Invite Link Section */}
      <div className="bg-slate-50/40 border border-slate-200/80 rounded-3xl p-6 lg:p-10 backdrop-blur-xl flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="flex-1 space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 flex items-center justify-center shadow-lg mb-6">
            <Gift className="w-8 h-8 text-slate-900" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Share Your Link</h2>
          <p className="text-slate-600 leading-relaxed text-sm">
            Give your friends a 200% Deposit Bonus when they sign up with your link. You earn up to 25% of the house edge on all their wagers forever.
          </p>
        </div>
        
        <div className="w-full md:w-1/2 space-y-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Your Unique Affiliate Link</label>
          <div 
            className="w-full relative group cursor-pointer" 
            onClick={handleCopy}
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <LinkIcon className="w-5 h-5 text-neon-purple" />
            </div>
            <input 
              type="text" 
              readOnly 
              value={referralLink} 
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-16 py-5 text-sm text-slate-900 font-bold focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all shadow-inner cursor-pointer"
            />
            <motion.div 
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all shadow-lg",
                copied ? "bg-neon-green" : "bg-neon-purple group-hover:bg-purple-500"
              )}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? <CheckCircle2 className="w-5 h-5 text-slate-950" /> : <Copy className="w-5 h-5 text-slate-900" />}
            </motion.div>
          </div>
        </div>
      </div>

    </div>
  );
}
