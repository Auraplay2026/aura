"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export function Limbo() {
  const [betAmount, setBetAmount] = useState(10);
  const [targetMultiplier, setTargetMultiplier] = useState(2.00);
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);

  const winChance = targetMultiplier <= 1 ? 99 : (99 / targetMultiplier).toFixed(2);
  const payout = (betAmount * targetMultiplier).toFixed(2);

  const handleRoll = () => {
    if (isRolling) return;
    setIsRolling(true);
    setLastResult(null);

    setTimeout(() => {
      // Inverse probability calculation for Limbo (rigged to 2% win rate)
      const willWin = Math.random() < 0.02;
      const result = willWin 
        ? parseFloat((targetMultiplier + Math.random() * 5).toFixed(2)) 
        : parseFloat((Math.random() * (targetMultiplier - 1.01) + 1.00).toFixed(2));
      
      setLastResult(result);
      setIsRolling(false);
    }, 200);
  };

  const isWin = lastResult !== null && lastResult >= targetMultiplier;

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-[600px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-2xl">
      {/* Betting Controller */}
      <div className="w-full lg:w-80 bg-slate-50/50 p-6 flex flex-col gap-6 border-r border-slate-200 shrink-0 overflow-y-auto custom-scrollbar">
        <div>
          <label className="text-sm font-bold text-slate-600 mb-2 flex justify-between">
            <span>Bet Amount</span>
            <span className="text-slate-500">₹</span>
          </label>
          <div className="flex bg-white rounded-xl border border-slate-200 p-1">
            <input 
              type="number" 
              value={betAmount} 
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full bg-transparent text-slate-900 font-bold px-3 focus:outline-none"
            />
            <button onClick={() => setBetAmount(Math.max(1, betAmount / 2))} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">1/2</button>
            <div className="w-[1px] bg-slate-100 mx-1"></div>
            <button onClick={() => setBetAmount(betAmount * 2)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">2x</button>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-600 mb-2 flex justify-between">
            <span>Target Multiplier</span>
            <span className="text-slate-500">x</span>
          </label>
          <div className="flex bg-white rounded-xl border border-slate-200 p-1">
            <input 
              type="number" 
              step="0.01"
              min="1.01"
              value={targetMultiplier} 
              onChange={(e) => setTargetMultiplier(Number(e.target.value))}
              className="w-full bg-transparent text-slate-900 font-bold px-3 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-200/50">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Win Chance</span>
            <div className="text-lg font-black text-slate-900">{winChance}%</div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Payout On Win</span>
            <div className="text-lg font-black text-neon-green">₹{payout}</div>
          </div>
        </div>

        <div className="mt-auto">
          <button 
            onClick={handleRoll}
            disabled={isRolling}
            className={`w-full py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 shadow-lg ${
              isRolling ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-neon-green hover:bg-green-400 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            }`}
          >
            {isRolling ? "Betting..." : "Bet"}
          </button>
        </div>
      </div>

      {/* Interactive Game Canvas */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-8 bg-slate-50 overflow-hidden">
        
        {/* Dynamic mesh gradient background based on outcome */}
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none transition-colors duration-500" 
             style={{ background: lastResult !== null ? (isWin ? "radial-gradient(circle, rgba(34,197,94,0.4) 0%, transparent 70%)" : "radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 70%)") : "none" }} 
        />

        <motion.div 
          key={lastResult}
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`text-[5rem] md:text-[8rem] font-black drop-shadow-2xl tabular-nums tracking-tighter z-10 ${
            lastResult === null ? "text-slate-700" : isWin ? "text-neon-green shadow-neon-green" : "text-red-500"
          }`}
        >
          {lastResult !== null ? lastResult.toFixed(2) : "1.00"}
          <span className="text-3xl md:text-4xl opacity-50 ml-2">x</span>
        </motion.div>

        <div className="absolute top-10 flex gap-4 text-slate-500 font-bold tracking-widest text-sm uppercase z-10 bg-slate-50/80 px-4 py-2 rounded-full border border-slate-200">
          <span>Target: {targetMultiplier.toFixed(2)}x</span>
        </div>
      </div>
    </div>
  );
}
