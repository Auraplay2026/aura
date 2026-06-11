"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Dice5 } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

export function Dice() {
  const [betAmount, setBetAmount] = useState(10);
  const [rollUnder, setRollUnder] = useState(50);
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);

  const { processBet, processWin } = useWallet();

  // Math logic
  const winChance = rollUnder;
  const rawMultiplier = 99 / winChance;
  const multiplier = rawMultiplier.toFixed(4);
  const payout = (betAmount * rawMultiplier).toFixed(2);

  const handleRoll = () => {
    if (isRolling) return;
    setIsRolling(true);
    setLastResult(null);

    // 1. Process Bet (Deduct Balance securely)
    try {
      processBet(betAmount, "Originals: Dice");
    } catch (error: any) {
      alert(error.message || "Insufficient balance");
      setIsRolling(false);
      return;
    }

    // 2. Simulate Game Logic (Rigged 2% win rate for prototype)
    setTimeout(() => {
      const willWin = Math.random() < 0.02;
      const result = willWin 
        ? parseFloat((Math.random() * rollUnder).toFixed(2)) 
        : parseFloat((rollUnder + Math.random() * (100 - rollUnder)).toFixed(2));
      
      setLastResult(result);
      
      // 3. Settle Win
      if (result < rollUnder) {
        processWin(betAmount, rawMultiplier, "Originals: Dice");
      }
      
      setIsRolling(false);
    }, 600);
  };

  const isWin = lastResult !== null && lastResult < rollUnder;

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
            <button onClick={() => setBetAmount(Math.max(1, betAmount / 2))} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors">1/2</button>
            <div className="w-[1px] bg-slate-100 mx-1"></div>
            <button onClick={() => setBetAmount(betAmount * 2)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors">2x</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-200/50">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Multiplier</span>
            <div className="text-lg font-black text-slate-900">{multiplier}x</div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Roll Under</span>
            <div className="text-lg font-black text-neon-green">{rollUnder}</div>
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
            {isRolling ? "Rolling..." : "Roll Dice"}
          </button>
        </div>
      </div>

      {/* Interactive Game Canvas */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blend-overlay">
        
        {/* Result Display */}
        <div className="absolute top-10 flex flex-col items-center">
          <h2 className="text-sm font-bold text-slate-500 tracking-widest uppercase mb-2">Result</h2>
          <div className={`text-6xl font-black drop-shadow-2xl transition-colors duration-300 ${
            lastResult === null ? "text-slate-700" : isWin ? "text-neon-green shadow-neon-green" : "text-red-500"
          }`}>
            {lastResult !== null ? lastResult.toFixed(2) : "00.00"}
          </div>
          {lastResult !== null && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`mt-4 px-6 py-2 rounded-full font-bold text-sm border ${
                isWin ? "bg-green-500/10 border-green-500/50 text-neon-green" : "bg-red-500/10 border-red-500/50 text-red-500"
              }`}
            >
              {isWin ? `Won ₹${payout}` : "Loss"}
            </motion.div>
          )}
        </div>

        {/* Dice Track */}
        <div className="w-full max-w-2xl mt-32 relative">
          
          <div className="flex justify-between text-slate-500 font-bold mb-4 px-2">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>

          <div className="relative h-4 bg-slate-50 rounded-full border border-slate-200">
            {/* Win zone (Green) */}
            <div 
              className="absolute left-0 top-0 bottom-0 bg-green-500/20 border-t border-b border-l border-green-500/50 rounded-l-full"
              style={{ width: `${rollUnder}%` }}
            />
            {/* Loss zone (Red) */}
            <div 
              className="absolute right-0 top-0 bottom-0 bg-red-500/20 border-t border-b border-r border-red-500/50 rounded-r-full"
              style={{ width: `${100 - rollUnder}%` }}
            />

            {/* Draggable Thumb for Roll Under */}
            <input 
              type="range" 
              min="1" 
              max="98" 
              step="1"
              value={rollUnder}
              onChange={(e) => setRollUnder(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-6 h-8 bg-white rounded shadow-lg pointer-events-none z-10 border-2 border-slate-300"
              style={{ left: `calc(${rollUnder}% - 12px)` }}
            >
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-100 text-slate-900 text-xs font-bold px-2 py-1 rounded">
                {rollUnder}
              </div>
            </div>

            {/* Result Marker Animation */}
            {lastResult !== null && (
              <motion.div
                initial={{ left: "50%", opacity: 0, scale: 0 }}
                animate={{ left: `${lastResult}%`, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center z-30 pointer-events-none ${
                  isWin ? "bg-neon-green text-slate-950" : "bg-red-500 text-white"
                }`}
                style={{ left: `${lastResult}%`, marginLeft: "-16px" }}
              >
                <Dice5 className="w-5 h-5" />
              </motion.div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
