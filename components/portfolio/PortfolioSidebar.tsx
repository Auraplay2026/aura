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
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                    </span>
                    <p className="text-xs text-emerald-700 font-extrabold uppercase tracking-widest">
                      Live Market Tracking
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a 
                  href="/vip/top-portfolios" 
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-[10px] font-black text-amber-900 uppercase tracking-widest transition-all hover:scale-105 shadow-xs"
                >
                  <Trophy className="w-3 h-3 text-amber-600" />
                  Top 1% VIP
                </a>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm cursor-pointer">
                  <X className="w-5 h-5 text-slate-800" />
                </button>
              </div>
            </div>

            {/* Aggregate Dashboard */}
            <div className="p-6 shrink-0 relative z-10">
              <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> Total Active Value
                  </p>
                  <div className="flex items-end gap-4 mb-6">
                    <h3 className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-950">
                      ₹{totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-slate-700" />
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Invested</p>
                      </div>
                      <p className="text-xl font-black text-slate-950 font-mono">₹{totalInvested.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-xs relative overflow-hidden">
                      <div className="flex items-center gap-2 mb-2 relative z-10">
                        <Percent className={`w-4 h-4 ${isAggregateProfit ? 'text-emerald-600' : 'text-rose-600'}`} />
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Total PnL</p>
                      </div>
                      <div className="flex items-center justify-between relative z-10">
                        <p className={`text-xl font-black font-mono ${isAggregateProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isAggregateProfit ? '+' : ''}₹{totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${isAggregateProfit ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'}`}>
                          {isAggregateProfit ? '+' : ''}{totalPnLPercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-2 shrink-0 relative z-10">
              <h3 className="text-sm font-black text-slate-900 tracking-wider uppercase flex items-center gap-2 border-b border-slate-200 pb-4">
                <Activity className="w-4 h-4 text-indigo-600" /> Active Positions ({positions.length})
              </h3>
            </div>

            {/* Trades List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar relative z-10">
              {positions.length === 0 && transactions.filter(t => t.type === 'trade' && t.status === 'Pending' && t.details.startsWith('Placed')).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="relative mb-8 group">
                    <div className="w-28 h-28 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center shadow-md relative z-10">
                      <BarChart2 className="w-12 h-12 text-slate-500" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 mb-3 tracking-wider">NO ACTIVE TRADES</p>
                  <p className="text-sm text-slate-600 max-w-[280px] leading-relaxed font-medium">Explore the live sports exchange and place your first prediction to track real-time returns.</p>
                  <button onClick={onClose} className="mt-8 px-8 py-3 bg-slate-900 hover:bg-slate-800 rounded-full text-xs font-black uppercase tracking-widest text-white transition-all shadow-md cursor-pointer">
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
                    const isSports = pos.marketId.startsWith('SPORT-') || pos.marketTitle.includes(':');
                    const liveMarket = liveMarkets.find(m => m.id === pos.marketId);
                    const livePrice = isSports ? pos.buyPrice : (liveMarket ? (pos.side === 'yes' ? liveMarket.yes : liveMarket.no) : pos.buyPrice);
                    
                    const currentValue = isSports 
                      ? pos.shares * (pos.buyPrice > 1 ? pos.buyPrice : 1)
                      : pos.shares * (livePrice / 100);
                    const pnl = currentValue - pos.investment;
                    const pnlPercent = pos.investment > 0 ? (pnl / pos.investment) * 100 : 0;
                    const isProfit = pnl >= 0;

                    return (
                      <motion.div variants={itemVariants} key={pos.id} className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="flex-1 pr-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                              {isSports ? "Sports Exchange" : "Prediction"}
                            </p>
                            <p className="text-sm font-black text-slate-900 leading-tight line-clamp-2">{pos.marketTitle}</p>
                          </div>
                          <div className="flex flex-col items-end shrink-0">
                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${pos.side === 'yes' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                              {pos.side === 'no' ? 'LAY / KHAYI' : 'BACK / LAGAI'}
                            </span>
                            <span className="text-[11px] font-extrabold text-slate-700 mt-2 font-mono">
                              ₹{pos.investment.toFixed(0)} Stake
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4 relative z-10 text-center">
                          <div>
                            <p className="text-[9px] text-slate-600 uppercase font-black tracking-wider mb-1">
                              {isSports ? "Odds" : "Buy Price"}
                            </p>
                            <p className="text-sm font-black text-slate-900 font-mono">
                              {isSports ? Number(pos.buyPrice).toFixed(2) : `${pos.buyPrice}¢`}
                            </p>
                          </div>
                          <div className="border-x border-slate-200">
                            <p className="text-[9px] text-slate-600 uppercase font-black tracking-wider mb-1">
                              {isSports ? "Est. Return" : "Current"}
                            </p>
                            <p className="text-sm font-black text-slate-900 font-mono">
                              {isSports ? `₹${currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `${livePrice}¢`}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-600 uppercase font-black tracking-wider mb-1">Status</p>
                            <p className="text-xs font-black font-mono text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded-md inline-block">
                              Active
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between gap-4 relative z-10 pt-1">
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">
                              {isSports ? "Cashout Value" : "Current Value"}
                            </p>
                            <p className="text-lg font-black font-mono tracking-tight text-slate-950">
                              ₹{(isSports ? pos.investment * 0.95 : currentValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <button 
                            onClick={async () => {
                              await cashOut(pos.id, livePrice);
                            }}
                            className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl text-xs font-black text-rose-800 uppercase tracking-wider transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <DollarSign className="w-4 h-4 text-rose-600" /> 
                            Cash Out / Cancel
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
                        // details format: Placed ₹100 Back bet on Australia @ 4.50 (Australia vs Bangladesh)
                        const regex = /Placed\s+₹?([\d.]+)\s+(?:Lay|Back)?\s*bet(?:\s*\(Liability:\s*₹?[\d.]+\))?\s+on\s+(.+?)\s+@\s+([\d.]+)\s*\((.+?)\)/i;
                        const match = bet.details.match(regex);
                        
                        const selection = match ? match[2] : (bet.details.includes('on ') ? bet.details.split('on ')[1]?.split(' @')[0] : "Selection");
                        const odds = match ? match[3] : (bet.details.includes('@ ') ? bet.details.split('@ ')[1]?.split(' ')[0] : "1.00");
                        const matchTitle = match ? match[4] : (bet.details.includes('(') ? bet.details.split('(')[1]?.replace(')', '') : bet.details);
                        const parsedOdds = parseFloat(odds) || 1.0;
                        const payout = bet.amount * parsedOdds;

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

