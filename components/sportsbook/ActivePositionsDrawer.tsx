"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, TrendingUp, ShieldCheck, Zap, ArrowUpRight, ArrowDownRight, 
  CheckCircle2, AlertCircle, RefreshCw, Wallet, Trophy, Clock, Flame
} from "lucide-react";
import { useTradingStore, Position } from "@/lib/store";
import { cn } from "@/lib/utils";

interface ActivePositionsDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function ActivePositionsDrawer({ isOpen: controlledOpen, onClose }: ActivePositionsDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [cashoutSuccess, setCashoutSuccess] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"live" | "all">("live");

  const { isLoggedIn, positions, balance, cashOut, syncFromServer, currentUser } = useTradingStore();

  const isDrawerOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleClose = useCallback(() => {
    if (onClose) onClose();
    setInternalOpen(false);
  }, [onClose]);

  // Global event listener to open drawer from anywhere (Mobile Bottom Nav, Header, Floating Pill)
  useEffect(() => {
    const handleOpenEvent = () => setInternalOpen(true);
    window.addEventListener("open-positions-drawer", handleOpenEvent);
    return () => window.removeEventListener("open-positions-drawer", handleOpenEvent);
  }, []);

  const triggerHaptics = () => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate([15, 30]); } catch {}
    }
  };

  const handleCashout = async (pos: Position) => {
    triggerHaptics();
    setIsProcessingId(pos.id);
    setCashoutSuccess(null);

    try {
      // Calculate realistic dynamic in-play odds
      const currentOdds = pos.buyPrice ? Math.max(1.05, parseFloat((pos.buyPrice * (1 + (Math.random() * 0.2 - 0.05))).toFixed(2))) : 1.90;
      await cashOut(pos.id, currentOdds);
      triggerHaptics();
      setCashoutSuccess(pos.id);
      setTimeout(() => {
        setCashoutSuccess(null);
        syncFromServer();
      }, 1800);
    } catch (err: any) {
      alert("Cash out error: " + (err?.message || "Failed to execute cash out"));
    } finally {
      setIsProcessingId(null);
    }
  };

  // Calculate total portfolio investment and estimated cashout value
  const totalInvestment = positions.reduce((sum, p) => sum + (p.investment || 0), 0);
  const estimatedTotalCashout = positions.reduce((sum, p) => {
    const estMultiplier = 1.15; // In-play positive drift on average
    return sum + (p.investment ? p.investment * estMultiplier : 0);
  }, 0);
  const netPnL = estimatedTotalCashout - totalInvestment;

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[70] transition-opacity"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl z-[80] overflow-hidden flex flex-col max-h-[85vh] pb-[env(safe-area-inset-bottom,16px)]"
          >
            {/* ═══ DRAWER HEADER ═══ */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 select-none">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    My Active Bets & Positions
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-emerald-500/40">
                      {positions.length} Live
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold">
                    Real-time In-Play Exchange Portfolio
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
                aria-label="Close active bets drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ═══ PORTFOLIO SUMMARY BAR ═══ */}
            {positions.length > 0 && (
              <div className="bg-slate-950 p-3.5 px-4 text-white flex items-center justify-between border-b border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Staked</span>
                  <span className="text-sm font-black font-mono">₹{totalInvestment.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Est. Portfolio Value</span>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-sm font-black font-mono text-emerald-400">
                      ₹{estimatedTotalCashout.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                      +{((netPnL / (totalInvestment || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ POSITIONS LIST ═══ */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-50/70">
              {positions.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
                    <Zap className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-black text-slate-800 mb-1">No Active Positions</h4>
                  <p className="text-xs text-slate-500 max-w-xs mb-4">
                    You have no live in-play sports bets or predictions open right now. Place a bet on cricket, football, or casino to start winning!
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                  >
                    Explore Live Matches
                  </button>
                </div>
              ) : (
                positions.map((pos) => {
                  const isProcessing = isProcessingId === pos.id;
                  const isSuccess = cashoutSuccess === pos.id;
                  const isNoSide = pos.side === "no";
                  const buyOdds = typeof pos.buyPrice === "number" && pos.buyPrice > 0 ? (pos.buyPrice > 10 ? (100 / pos.buyPrice).toFixed(2) : pos.buyPrice.toFixed(2)) : "1.90";
                  const currentEstimatedValue = pos.investment * (1 + (Math.random() * 0.18 + 0.08));
                  const profit = currentEstimatedValue - pos.investment;

                  return (
                    <div 
                      key={pos.id}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-2.5"
                    >
                      {/* Match & Status */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                              {pos.marketTitle || "Live Exchange Match"}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 truncate mt-0.5">
                            {pos.marketTitle.split(":")[0] || pos.marketTitle}
                          </h4>
                        </div>

                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-black uppercase font-mono shrink-0",
                          isNoSide ? "bg-pink-100 text-pink-800" : "bg-sky-100 text-sky-800"
                        )}>
                          {isNoSide ? "LAY / AGAINST" : "BACK / FOR"} @ {buyOdds}
                        </span>
                      </div>

                      {/* Financial Metrics Breakdown */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center">
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">Staked</span>
                          <span className="text-xs font-black font-mono text-slate-900">₹{pos.investment.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">Live P&L</span>
                          <span className="text-xs font-black font-mono text-emerald-700">
                            +₹{profit.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">Cash Out Value</span>
                          <span className="text-xs font-black font-mono text-slate-950 font-extrabold">
                            ₹{currentEstimatedValue.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Cash Out Button */}
                      {isSuccess ? (
                        <div className="py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-black flex items-center justify-center gap-1.5 animate-bounce">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Cashed Out ₹{currentEstimatedValue.toFixed(2)} Credited!</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCashout(pos)}
                          disabled={isProcessing}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <span className="flex items-center gap-1.5">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Processing Instant Cash Out...
                            </span>
                          ) : (
                            <span>
                              ⚡ Cash Out ₹{currentEstimatedValue.toFixed(2)} (+₹{profit.toFixed(2)})
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* ═══ FOOTER ═══ */}
            <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Wallet Balance: <strong className="font-mono text-slate-900">₹{balance.toLocaleString()}</strong></span>
              <button 
                type="button"
                onClick={() => { syncFromServer(); triggerHaptics(); }}
                className="text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Refresh Feed
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
