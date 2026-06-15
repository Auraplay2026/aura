"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useTradingStore } from "@/lib/store";

export interface DraftBet {
  marketId: string;
  marketTitle: string;
  team: string;
  side: 'yes' | 'no';
  odds: number;
  price: number; // The underlying 1-99¢ price for the engine
}

interface BetslipDrawerProps {
  draftBet: DraftBet | null;
  onClearBet: () => void;
}

export function BetslipDrawer({ draftBet, onClearBet }: BetslipDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [stake, setStake] = useState<number>(1000);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { balance: rawBalance, placeSportsBet } = useTradingStore();
  const balance = typeof rawBalance === 'number' ? rawBalance : 0;

  const payout = stake * (draftBet?.odds || 0);

  const handlePlaceBet = () => {
    if (!draftBet || stake <= 0 || balance < stake) return;
    
    setIsProcessing(true);
    setTimeout(() => {
      placeSportsBet(draftBet.marketTitle, draftBet.team, draftBet.odds, stake);
      setIsProcessing(false);
      onClearBet();
    }, 1000);
  };

  if (!draftBet) return null;

  return (
    <div className="fixed bottom-0 right-4 sm:right-8 z-50 w-full max-w-[340px]">
      {/* Drawer Header (Always visible when there is a draft bet) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-[#FFD700] hover:bg-[#F0C800] text-black px-4 py-3 rounded-t-xl cursor-pointer flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.3)] transition-colors"
      >
        <div className="flex items-center gap-2 font-black">
          <div className="w-5 h-5 flex flex-col justify-center gap-0.5">
            <div className="h-0.5 w-full bg-slate-950 rounded" />
            <div className="h-0.5 w-full bg-slate-950 rounded" />
            <div className="h-0.5 w-full bg-slate-950 rounded" />
          </div>
          Betslip
          <span className="bg-white text-[#FFD700] text-[10px] px-1.5 py-0.5 rounded ml-1">1</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest">Quick Bet</span>
          <div className="w-8 h-4 bg-slate-900/20 rounded-full relative">
            <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
          </div>
          {isExpanded ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />}
        </div>
      </div>

      {/* Drawer Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-x border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="p-4">
              {/* Draft Bet Item */}
              <div className="bg-slate-50 rounded-lg p-3 mb-4 relative group border border-transparent hover:border-slate-700 transition-colors">
                <button 
                  onClick={onClearBet}
                  className="absolute top-2 right-2 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex justify-between items-start mb-2 pr-6">
                  <div>
                    <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Winner</span>
                    <p className="text-sm font-black text-slate-900">{draftBet.team}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900">{draftBet.odds.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 truncate">{draftBet.marketTitle}</p>
              </div>

              {/* Stake Input */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Stake</span>
                  <span className="text-[10px] font-bold text-slate-500">Bal: ₹{balance.toLocaleString()}</span>
                </div>
                <div className="relative flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1">
                  <span className="pl-3 text-slate-500 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(Number(e.target.value))}
                    className="w-full bg-transparent border-none text-slate-900 font-black text-lg py-1 px-2 outline-none"
                  />
                </div>
              </div>

              {/* Potential Payout */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-600">Total Payout</span>
                <span className="text-sm font-black text-[#22c55e]">₹{isNaN(payout) ? "0.00" : payout.toFixed(2)}</span>
              </div>

              {/* Place Bet Button */}
              <button
                onClick={handlePlaceBet}
                disabled={isProcessing || stake <= 0 || balance < stake}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-3 rounded-lg flex justify-center items-center gap-2 transition-all uppercase tracking-widest text-sm cursor-pointer"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : balance < stake ? (
                  "Insufficient Funds"
                ) : (
                  "Place Bet"
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
