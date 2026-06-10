"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, TrendingUp, Lock, Users, Activity, Zap, Star, ShieldAlert, ArrowRight, Wallet, Percent, ArrowUpRight, Flame } from "lucide-react";
import { useRouter } from "next/navigation";

// Fake Live Activity Feed
const ACTIVITIES = [
  "🔥 CryptoWhale just closed a +₹4.2M position!",
  "💎 DiamondHands is copying the #1 Portfolio with ₹500,000",
  "🚀 Satoshi_VIP just joined the Top 1% Club",
  "👑 EliteTrader99 secured a +450% ROI on CS:GO Predictions",
  "⚡ A massive ₹1.2M deposit was just made by an anonymous whale",
  "🔥 The 'Golden Bull' portfolio is up 24% today!"
];

const WHALES = [
  { rank: 1, name: "CryptoWhale", title: "Apex Predator", roi: "+845.2%", pnl: "₹42,500,000", followers: 12450, winRate: "94.2%", avatar: "👑", color: "from-amber-400 to-yellow-600", text: "text-amber-400" },
  { rank: 2, name: "Diamond_HODL", title: "Market Maker", roi: "+620.8%", pnl: "₹28,150,000", followers: 8200, winRate: "89.5%", avatar: "💎", color: "from-cyan-400 to-blue-600", text: "text-cyan-400" },
  { rank: 3, name: "Alpha_Seeker", title: "Quant Master", roi: "+415.5%", pnl: "₹15,400,000", followers: 5120, winRate: "86.1%", avatar: "🐺", color: "from-purple-400 to-fuchsia-600", text: "text-purple-400" },
  { rank: 4, name: "Anonymous_Whale", title: "Shadow Trader", roi: "+???", pnl: "₹???,???", followers: 21000, winRate: "99.9%", avatar: "🕵️", color: "from-slate-600 to-slate-800", text: "text-slate-400", isLocked: true },
];

export default function TopPortfoliosPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all-time");
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % ACTIVITIES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyTrade = () => {
    // Force the user to deposit by opening the cashier
    window.dispatchEvent(new CustomEvent("open-cashier"));
  };

  return (
    <div className="w-full min-h-screen bg-[#02050a] text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Ambient Effects */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-amber-900/20 via-[#02050a] to-[#02050a] pointer-events-none" />
      <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] -left-[100px] w-[400px] h-[400px] bg-neon-purple/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Live Ticker Bar */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-slate-900/80 backdrop-blur-md border border-amber-500/20 rounded-xl p-3 flex items-center gap-4 overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.1)]">
          <div className="flex items-center gap-2 text-amber-500 font-black uppercase tracking-widest shrink-0 border-r border-amber-500/20 pr-4">
            <Activity className="w-5 h-5 animate-pulse" /> Live
          </div>
          <div className="flex-1 overflow-hidden relative h-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={tickerIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-sm font-bold text-slate-300 absolute w-full"
              >
                {ACTIVITIES[tickerIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 relative z-10">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 flex items-center justify-center md:justify-start gap-4">
              <Crown className="w-12 h-12 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-600 drop-shadow-lg">
                Top 1% Portfolios
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl font-medium">
              Elite traders. Massive returns. Welcome to the Apex of the market. Copy their strategies or forge your own path to the top.
            </p>
          </div>
          
          <div className="flex gap-2 p-1.5 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl shrink-0">
            {["24h", "7d", "30d", "all-time"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Global Stats Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10">
          <div className="bg-gradient-to-br from-slate-900 to-black border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Wallet className="w-8 h-8 text-amber-500 mb-4 opacity-80" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Total AUM (Top 1%)</p>
            <p className="text-3xl font-black text-white font-mono">₹4.2 Billion</p>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-black border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <TrendingUp className="w-8 h-8 text-neon-green mb-4 opacity-80" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Average Apex ROI</p>
            <p className="text-3xl font-black text-white font-mono text-neon-green">+412.5%</p>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-black border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Users className="w-8 h-8 text-neon-purple mb-4 opacity-80" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Active Copiers</p>
            <p className="text-3xl font-black text-white font-mono">1.2 Million</p>
          </div>
        </div>

        {/* The Leaderboard */}
        <div className="space-y-6 relative z-10">
          {WHALES.map((whale, idx) => (
            <motion.div
              key={whale.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative overflow-hidden rounded-[2rem] border ${whale.rank === 1 ? 'border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.15)]' : 'border-white/10'} bg-slate-900/60 backdrop-blur-xl p-1`}
            >
              {whale.rank === 1 && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-600" />
              )}
              
              <div className="flex flex-col md:flex-row items-center gap-6 p-6">
                
                {/* Rank & Avatar */}
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className={`w-12 h-12 flex items-center justify-center font-black text-xl rounded-full ${whale.rank === 1 ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                    #{whale.rank}
                  </div>
                  <div className="relative">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${whale.color} flex items-center justify-center text-4xl shadow-lg relative z-10`}>
                      {whale.avatar}
                    </div>
                    {whale.rank === 1 && (
                      <div className="absolute -inset-2 bg-amber-500/20 blur-xl z-0 rounded-full animate-pulse" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-wide">{whale.name}</h2>
                    <p className={`text-sm font-bold uppercase tracking-widest ${whale.text}`}>{whale.title}</p>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden md:block w-px h-16 bg-white/10 mx-4" />

                {/* Stats Grid */}
                <div className={`grid grid-cols-2 xl:grid-cols-4 gap-4 flex-1 w-full ${whale.isLocked ? 'blur-md select-none' : ''}`}>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 whitespace-nowrap">Total PnL</p>
                    <p className="text-lg md:text-xl font-black font-mono text-white">{whale.pnl}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 whitespace-nowrap">All-Time ROI</p>
                    <p className="text-lg md:text-xl font-black font-mono text-neon-green flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> {whale.roi}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 whitespace-nowrap">Win Rate</p>
                    <p className="text-lg md:text-xl font-black font-mono text-white">{whale.winRate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 whitespace-nowrap">Followers</p>
                    <p className="text-lg md:text-xl font-black font-mono text-white flex items-center gap-1">
                      <Users className="w-4 h-4 text-slate-400" /> {whale.followers.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Action / Lock */}
                <div className="w-full md:w-auto shrink-0 flex items-center justify-center pt-4 md:pt-0">
                  {whale.isLocked ? (
                    <div className="flex flex-col items-center justify-center gap-2 px-8 py-4 bg-slate-950 rounded-2xl border border-slate-800 absolute inset-0 md:relative md:inset-auto z-20">
                      <Lock className="w-6 h-6 text-slate-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">VIP Level 10 Required</p>
                    </div>
                  ) : (
                    <button 
                      onClick={handleCopyTrade}
                      className={`w-full md:w-auto px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg group
                        ${whale.rank === 1 
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.3)]' 
                          : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95'
                        }`}
                    >
                      <Zap className="w-4 h-4" /> Copy Trade
                    </button>
                  )}
                </div>

              </div>
            </motion.div>
          ))}
        </div>

        {/* VIP Call to action footer */}
        <div className="mt-16 bg-gradient-to-r from-neon-purple/20 via-black to-blue-600/20 border border-neon-purple/30 rounded-[2rem] p-8 md:p-12 text-center relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.1)]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
          <Star className="w-12 h-12 text-neon-purple mx-auto mb-6 animate-pulse relative z-10" />
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 relative z-10">Want to join the Top 1%?</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8 relative z-10">
            Increase your volume, make bolder predictions, and secure your spot on the elite leaderboard to attract copiers and earn passive revenue shares.
          </p>
          <button onClick={() => window.dispatchEvent(new CustomEvent("open-cashier"))} className="relative z-10 px-10 py-5 bg-gradient-to-r from-neon-purple to-blue-600 text-white font-black text-lg uppercase tracking-widest rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.5)] hover:scale-105 active:scale-95 transition-all">
            Deposit to Boost Rank
          </button>
        </div>
      </div>
    </div>
  );
}
