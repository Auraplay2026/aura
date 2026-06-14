"use client";

import { motion } from "framer-motion";
import { Briefcase, TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";

const HOLDINGS = [
  { id: 1, market: "Next US Election Winner: Incumbent Party?", position: "YES", shares: 1500, avgPrice: 45, currentPrice: 52, pnl: "+₹ 1,050", isPositive: true },
  { id: 2, market: "Bitcoin to hit $100k by EOY?", position: "NO", shares: 500, avgPrice: 30, currentPrice: 20, pnl: "+₹ 500", isPositive: true },
  { id: 3, market: "Will the next interest rate decision be a cut?", position: "YES", shares: 800, avgPrice: 70, currentPrice: 65, pnl: "-₹ 400", isPositive: false },
];

export default function HoldingsPage() {
  const totalValue = "₹ 1,25,450";
  const totalPnl = "+₹ 1,150";

  return (
    <div className="flex min-h-full w-full max-w-[1400px] mx-auto text-slate-800 p-4 sm:p-6 lg:p-8 flex-col space-y-8">
      
      {/* Header & Overview */}
      <div className="bg-slate-50/40 border border-slate-200/80 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Briefcase className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 flex items-center gap-4 tracking-tight mb-2">
              <span className="w-2 h-10 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)]"></span>
              My Portfolio
            </h1>
            <p className="text-slate-600 max-w-xl text-lg">Track your active prediction shares and manage your financial exposure.</p>
          </div>
          
          <div className="flex items-center gap-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-200">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Portfolio Value</p>
              <p className="text-3xl font-black text-slate-900">{totalValue}</p>
            </div>
            <div className="w-px h-12 bg-slate-100"></div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Total Return</p>
              <p className="text-2xl font-bold text-neon-green flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> {totalPnl}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Positions */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-red-600" /> Active Positions
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          {HOLDINGS.map((holding, i) => (
            <motion.div
              key={holding.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-50/40 border border-slate-200/80 rounded-2xl p-6 hover:bg-slate-50/80 transition-all duration-300 backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{holding.market}</h3>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest ${holding.position === 'YES' ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
                    {holding.position}
                  </span>
                  <span className="text-sm text-slate-600 font-medium">{holding.shares} Shares</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-8 bg-slate-900/50 p-4 rounded-xl border border-slate-200/50 lg:w-auto">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Avg Price</p>
                  <p className="text-slate-900 font-bold">{holding.avgPrice}¢</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Current</p>
                  <p className="text-slate-900 font-bold">{holding.currentPrice}¢</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">P&L</p>
                  <p className={`font-black flex items-center gap-1 ${holding.isPositive ? 'text-neon-green' : 'text-red-500'}`}>
                    {holding.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {holding.pnl}
                  </p>
                </div>
                <button className="bg-slate-100 hover:bg-slate-700 text-slate-900 text-sm font-bold py-2 px-6 rounded-lg transition-colors border border-slate-700">
                  Trade
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}
