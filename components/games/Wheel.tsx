"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Risk = "low" | "medium" | "high";

const SEGMENTS = {
  low: [1.2, 0, 1.2, 0, 1.2, 0, 1.5, 0, 1.2, 0],
  medium: [2.0, 0, 0, 2.0, 0, 0, 3.0, 0, 1.5, 0],
  high: [5.0, 0, 0, 0, 0, 9.9, 0, 0, 0, 0]
};

const COLORS = ["#10b981", "#334155", "#10b981", "#334155", "#10b981", "#334155", "#eab308", "#334155", "#3b82f6", "#334155"];

export function Wheel() {
  const [betAmount, setBetAmount] = useState(10);
  const [risk, setRisk] = useState<Risk>("medium");
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [resultMultiplier, setResultMultiplier] = useState<number | null>(null);

  const segments = SEGMENTS[risk];

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setResultMultiplier(null);

    // Pick a random segment (0 to 9) - rigged to 2% win rate
    const willWin = Math.random() < 0.02;
    let targetSegment = 0;
    
    // Filter segments based on win/loss
    const winIndices: number[] = [];
    const loseIndices: number[] = [];
    segments.forEach((val, idx) => {
      if (val > 0) winIndices.push(idx);
      else loseIndices.push(idx);
    });

    if (willWin && winIndices.length > 0) {
      targetSegment = winIndices[Math.floor(Math.random() * winIndices.length)];
    } else if (loseIndices.length > 0) {
      targetSegment = loseIndices[Math.floor(Math.random() * loseIndices.length)];
    } else {
      targetSegment = Math.floor(Math.random() * 10);
    }
    const multiplier = segments[targetSegment];
    
    // Calculate rotation: each segment is 36 degrees.
    // Base rotation + extra spins + target offset
    const spins = 5; // number of full rotations
    const degreesPerSegment = 360 / 10;
    
    // We want the target segment to end up at the top (0 degrees or 360 degrees).
    // If target segment is index i, it starts at angle i * 36.
    // To bring it to the top, we rotate by 360 - (i * 36) - offset for center.
    const targetRotation = rotation + (spins * 360) + (360 - (targetSegment * degreesPerSegment));

    setRotation(targetRotation);

    setTimeout(() => {
      setResultMultiplier(multiplier);
      setIsSpinning(false);
    }, 4000);
  };

  const payout = resultMultiplier !== null ? (betAmount * resultMultiplier).toFixed(2) : "0.00";

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto h-[600px] bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Betting Controller */}
      <div className="w-full lg:w-80 bg-slate-900/50 p-6 flex flex-col gap-6 border-r border-slate-800 shrink-0">
        <div>
          <label className="text-sm font-bold text-slate-400 mb-2 flex justify-between">
            <span>Bet Amount</span>
            <span className="text-slate-500">₹</span>
          </label>
          <div className="flex bg-slate-950 rounded-xl border border-slate-800 p-1">
            <input 
              type="number" 
              value={betAmount} 
              disabled={isSpinning}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full bg-transparent text-white font-bold px-3 focus:outline-none disabled:opacity-50"
            />
            <button disabled={isSpinning} onClick={() => setBetAmount(Math.max(1, betAmount / 2))} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold disabled:opacity-50">1/2</button>
            <div className="w-[1px] bg-slate-800 mx-1"></div>
            <button disabled={isSpinning} onClick={() => setBetAmount(betAmount * 2)} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold disabled:opacity-50">2x</button>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-400 mb-2 block">Risk Level</label>
          <div className="grid grid-cols-3 gap-2">
            {(["low", "medium", "high"] as Risk[]).map(r => (
              <button 
                key={r}
                disabled={isSpinning}
                onClick={() => setRisk(r)}
                className={`py-2 rounded-lg font-bold text-sm capitalize transition-colors ${
                  risk === r ? "bg-slate-700 text-white shadow-lg" : "bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-50"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <button 
            onClick={handleSpin}
            disabled={isSpinning}
            className={`w-full py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 shadow-lg ${
              isSpinning ? "bg-slate-800 text-slate-500 cursor-not-allowed" :
              "bg-neon-green hover:bg-green-400 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            }`}
          >
            {isSpinning ? "Spinning..." : "Spin Wheel"}
          </button>
        </div>
      </div>

      {/* Interactive Game Canvas */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-8 bg-slate-950 overflow-hidden">
        
        {/* The Wheel */}
        <div className="relative w-80 h-80 sm:w-96 sm:h-96 drop-shadow-[0_0_40px_rgba(16,185,129,0.1)]">
          {/* Top Indicator / Pointer */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-10 bg-slate-200" style={{ clipPath: "polygon(50% 100%, 0 0, 100% 0)" }}></div>
          
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.1, 0.9, 0.2, 1] }} // smooth deceleration curve
            className="w-full h-full rounded-full border-8 border-slate-800 relative overflow-hidden bg-slate-900"
          >
            {segments.map((mult, i) => {
              const rotationDeg = i * 36;
              const color = mult === 0 ? "#1e293b" : mult >= 5 ? "#ef4444" : mult >= 2 ? "#eab308" : mult >= 1.5 ? "#3b82f6" : "#10b981";
              
              return (
                <div 
                  key={i}
                  className="absolute top-0 left-1/2 w-full h-full origin-bottom -translate-x-1/2"
                  style={{
                    transform: `rotate(${rotationDeg}deg)`,
                    clipPath: "polygon(50% 50%, 0 0, 100% 0)"
                  }}
                >
                  <div className="absolute inset-0" style={{ backgroundColor: color }} />
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 text-slate-950 font-black text-sm tracking-tighter">
                    {mult}x
                  </div>
                </div>
              );
            })}
            {/* Center Hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-800 rounded-full border-4 border-slate-700 shadow-inner z-10" />
          </motion.div>
        </div>

        <AnimatePresence>
          {resultMultiplier !== null && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className={`absolute top-10 px-8 py-3 rounded-full font-black text-xl z-20 border shadow-2xl ${
                resultMultiplier > 0 ? "bg-green-500/20 text-neon-green border-green-500/50" : "bg-red-500/20 text-red-500 border-red-500/50"
              }`}
            >
              {resultMultiplier > 0 ? `${resultMultiplier}x Win! (₹${payout})` : "Lost"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
