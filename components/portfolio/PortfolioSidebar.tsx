"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart2, DollarSign, AlertCircle, TrendingUp, TrendingDown, Briefcase, Activity, Wallet, Percent, Trophy } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { useLiveMarkets } from "@/hooks/useLiveMarkets";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function PortfolioSidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { positions, transactions, cashOut, cancelSportsBet } = useTradingStore();
  const liveMarkets = useLiveMarkets('sports'); // Fallback to 'sports', could be all
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  if (!isClient) return null;

  // Aggregate calculations
  const totalInvested = positions.reduce((acc, pos) => acc + pos.investment, 0);
  const totalCurrentValue = positions.reduce((acc, pos) => {
    const liveMarket = liveMarkets.find(m => m.id === pos.marketId);
    const livePrice = liveMarket ? (pos.side === 'yes' ? liveMarket.yes : liveMarket.no) : pos.buyPrice;
    return acc + (pos.shares * (livePrice / 100));
  }, 0);
  
  const totalPnL = totalCurrentValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const isAggregateProfit = totalPnL >= 0;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }} 
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            onClick={onClose}
            className="fixed inset-0 bg-white/70 z-[9990]"
          />
          
          <motion.div 
            initial={{ x: '100%', borderTopLeftRadius: '100px', borderBottomLeftRadius: '100px' }} 
            animate={{ x: 0, borderTopLeftRadius: '0px', borderBottomLeftRadius: '0px' }} 
            exit={{ x: '100%', borderTopLeftRadius: '100px', borderBottomLeftRadius: '100px' }} 
            transition={{ type: "spring", damping: 30, stiffness: 250 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-white border-l border-slate-200 z-[9995] shadow-[-20px_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
          >
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-neon-green/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-white/80 flex justify-between items-center shrink-0 relative z-10 backdrop-blur-xl shadow-lg">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-600 flex items-center justify-center shadow-[0_0_30px_rgba(52,211,153,0.4)] relative z-10">
                    <Activity className="w-6 h-6 text-slate-950" />
                  </div>
                  <div className="absolute -inset-1 bg-emerald-500/20 blur-lg rounded-full animate-pulse z-0" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-widest drop-shadow-md">POSITIONS</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                    </span>
                    <p className="text-xs text-neon-green font-bold uppercase tracking-widest text-shadow-sm">
                      Live Market Tracking
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a 
                  href="/vip/top-portfolios" 
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-600/20 hover:from-amber-500/30 hover:to-yellow-600/30 border border-yellow-500/40 rounded-xl text-[10px] font-black text-yellow-500 uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  <Trophy className="w-3 h-3" />
                  Top 1% VIP
                </a>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-slate-200 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg">
                  <X className="w-5 h-5 text-slate-700" />
                </button>
              </div>
            </div>

            {/* Aggregate Dashboard */}
            <div className="p-6 shrink-0 relative z-10">
              <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                
                <div className="relative z-10">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> Total Active Value
                  </p>
                  <div className="flex items-end gap-4 mb-6">
                    <h3 className="text-5xl font-black font-mono tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                      ₹{totalCurrentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-slate-600" />
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Invested</p>
                      </div>
                      <p className="text-xl font-black text-slate-900 font-mono">₹{totalInvested.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 backdrop-blur-md relative overflow-hidden">
                      <div className={`absolute inset-0 opacity-10 ${isAggregateProfit ? 'bg-neon-green' : 'bg-red-500'}`} />
                      <div className="flex items-center gap-2 mb-2 relative z-10">
                        <Percent className={`w-4 h-4 ${isAggregateProfit ? 'text-neon-green' : 'text-red-500'}`} />
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Total PnL</p>
                      </div>
                      <div className="flex items-center justify-between relative z-10">
                        <p className={`text-xl font-black font-mono ${isAggregateProfit ? 'text-neon-green' : 'text-red-500'}`}>
                          {isAggregateProfit ? '+' : ''}₹{totalPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isAggregateProfit ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {isAggregateProfit ? '+' : ''}{totalPnLPercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-2 shrink-0 relative z-10">
              <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase flex items-center gap-2 border-b border-slate-200 pb-4">
                <Activity className="w-4 h-4 text-neon-purple" /> Active Positions ({positions.length})
              </h3>
            </div>

            {/* Trades List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar relative z-10">
              {positions.length === 0 && transactions.filter(t => t.type === 'trade' && t.status === 'Pending' && t.details.startsWith('Placed')).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="relative mb-8 group">
                    <div className="absolute inset-0 bg-neon-purple/20 blur-2xl rounded-full animate-pulse-glow" />
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-900 to-[#0a0f1d] border border-slate-200 flex items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] relative z-10 transform transition-transform duration-500 hover:scale-105">
                      <BarChart2 className="w-12 h-12 text-slate-700 group-hover:text-neon-purple transition-colors drop-shadow-md" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 mb-3 tracking-widest drop-shadow-lg">NO ACTIVE TRADES</p>
                  <p className="text-sm text-slate-600 max-w-[280px] leading-relaxed font-medium">Explore the global markets, analyze trends, and place your first prediction to start building your empire.</p>
                  <button onClick={onClose} className="mt-8 px-8 py-3 bg-white/5 hover:bg-white/10 border border-slate-200 rounded-full text-xs font-black uppercase tracking-widest text-slate-900 transition-all hover:scale-105 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    Explore Markets
                  </button>
                </div>
              ) : (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-4 pt-4"
                >
                  {positions.map((pos) => {
                    const liveMarket = liveMarkets.find(m => m.id === pos.marketId);
                    const livePrice = liveMarket ? (pos.side === 'yes' ? liveMarket.yes : liveMarket.no) : pos.buyPrice;
                    
                    const currentValue = pos.shares * (livePrice / 100);
                    const pnl = currentValue - pos.investment;
                    const pnlPercent = (pnl / pos.investment) * 100;
                    const isProfit = pnl >= 0;

                    return (
                      <motion.div variants={itemVariants} key={pos.id} className="group bg-slate-50/60 backdrop-blur-xl border border-slate-200 rounded-[1.5rem] p-5 hover:border-white/20 transition-all duration-300 relative overflow-hidden">
                        {/* Glow effect on hover */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r ${isProfit ? 'from-green-500' : 'from-red-500'} to-transparent`} />
                        
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="flex-1 pr-4">
                            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">Prediction</p>
                            <p className="text-sm font-black text-slate-900 leading-tight line-clamp-2">{pos.marketTitle}</p>
                          </div>
                          <div className={`flex flex-col items-end shrink-0`}>
                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${pos.side === 'yes' ? 'bg-green-500/20 text-green-600 border border-green-500/30' : 'bg-red-500/20 text-red-600 border border-red-500/30'}`}>
                              {pos.side}
                            </span>
                            <span className="text-[10px] font-bold text-slate-700 mt-2">
                              {pos.shares.toFixed(1)} Shares
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-slate-200 mb-4 relative z-10 shadow-inner">
                          <div>
                            <p className="text-[10px] text-slate-700 uppercase font-bold tracking-widest mb-1">Buy Price</p>
                            <p className="text-sm font-black text-slate-700 font-mono">{pos.buyPrice}¢</p>
                          </div>
                          <div className="w-px h-8 bg-white/10" />
                          <div>
                            <p className="text-[10px] text-slate-700 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                              Current Price
                            </p>
                            <p className="text-sm font-black text-slate-900 font-mono flex items-center gap-1.5">
                              {livePrice}¢ <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse shadow-[0_0_5px_#34d399]" />
                            </p>
                          </div>
                          <div className="w-px h-8 bg-white/10" />
                          <div className="text-right">
                            <p className="text-[10px] text-slate-700 uppercase font-bold tracking-widest mb-1">ROI</p>
                            <p className={`text-sm font-black font-mono flex items-center gap-1 ${isProfit ? 'text-neon-green drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`}>
                              {isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="flex-1">
                            <p className="text-[10px] text-slate-700 uppercase font-bold tracking-widest mb-1">Current Value</p>
                            <p className={`text-xl font-black font-mono tracking-tight ${isProfit ? 'text-slate-900' : 'text-slate-700'}`}>
                              ₹{currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <button 
                            onClick={() => cashOut(pos.id, livePrice)}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-slate-200 rounded-xl text-xs font-black text-slate-900 uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group/btn shadow-lg"
                          >
                            <DollarSign className="w-4 h-4 text-slate-600 group-hover/btn:text-neon-green transition-colors" /> 
                            Cash Out
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
              
              {/* Active Sports Bets Section */}
              {(() => {
                const pendingSportsBets = transactions.filter(t => t.type === 'trade' && t.status === 'Pending' && t.details.startsWith('Placed'));
                if (pendingSportsBets.length === 0) return null;
                
                return (
                  <div className="mt-8">
                    <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase flex items-center gap-2 border-b border-slate-200 pb-4 mb-4">
                      <TrendingUp className="w-4 h-4 text-emerald-600" /> Active Sports Bets ({pendingSportsBets.length})
                    </h3>
                    <motion.div 
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      className="space-y-4"
                    >
                      {pendingSportsBets.map((bet) => {
                        // details format: Placed ₹100 bet on India @ 1.50 (India vs Pakistan)
                        const regex = /Placed ₹([\d.]+) bet on (.+?) @ ([\d.]+) \((.+?)\)/;
                        const match = bet.details.match(regex);
                        
                        const selection = match ? match[2] : "Selection";
                        const odds = match ? match[3] : "0.00";
                        const matchTitle = match ? match[4] : bet.details;
                        const payout = bet.amount * parseFloat(odds);

                        return (
                          <motion.div variants={itemVariants} key={bet.id} className="group bg-slate-50/60 backdrop-blur-xl border border-slate-200 rounded-[1.5rem] p-5 hover:border-white/20 transition-all duration-300 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r from-blue-500 to-transparent" />
                            
                            <div className="flex justify-between items-start mb-4 relative z-10">
                              <div className="flex-1 pr-4">
                                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">Match</p>
                                <p className="text-sm font-black text-slate-900 leading-tight line-clamp-2">{matchTitle}</p>
                              </div>
                              <div className="flex flex-col items-end shrink-0">
                                <span className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest bg-blue-500/20 text-blue-600 border border-blue-500/30">
                                  {selection}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-slate-200 mb-4 relative z-10 shadow-inner">
                              <div>
                                <p className="text-[10px] text-slate-700 uppercase font-bold tracking-widest mb-1">Wager</p>
                                <p className="text-sm font-black text-slate-900 font-mono">₹{bet.amount.toLocaleString()}</p>
                              </div>
                              <div className="w-px h-8 bg-white/10" />
                              <div>
                                <p className="text-[10px] text-slate-700 uppercase font-bold tracking-widest mb-1">Odds</p>
                                <p className="text-sm font-black text-emerald-600 font-mono">{odds}</p>
                              </div>
                              <div className="w-px h-8 bg-white/10" />
                              <div className="text-right">
                                <p className="text-[10px] text-slate-700 uppercase font-bold tracking-widest mb-1">To Win</p>
                                <p className="text-sm font-black text-slate-900 font-mono">₹{payout.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between relative z-10">
                               <div className="flex items-center gap-2">
                                 <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Status</p>
                                 <span className="text-xs font-bold text-yellow-600 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/40 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                                    Awaiting Settlement
                                 </span>
                               </div>
                               <button 
                                  onClick={() => cancelSportsBet(bet.id)}
                                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-[10px] font-black text-red-600 uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 group/btn"
                               >
                                 <X className="w-3 h-3 group-hover/btn:text-slate-900 transition-colors" /> 
                                 Cancel Bet
                               </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

