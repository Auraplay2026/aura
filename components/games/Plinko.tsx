"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Risk = "low" | "medium" | "high";

const ROWS = 10;
const PEGS_PER_ROW_BASE = 3; // Top row has 3 pegs, bottom has 12

export function Plinko() {
  const [betAmount, setBetAmount] = useState(10);
  const [risk, setRisk] = useState<Risk>("medium");
  const [balls, setBalls] = useState<{ id: number; path: number[]; multiplier: number }[]>([]);
  const [ballId, setBallId] = useState(0);

  // Example multipliers for the bottom bins (11 bins for 10 rows)
  const MULTIPLIERS = {
    low: [5.6, 2.1, 1.1, 1, 0.5, 0.5, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.5, 0.8, 0.4, 0.4, 0.4, 0.8, 1.5, 3, 13],
    high: [76, 10, 2.5, 0.3, 0.2, 0.2, 0.2, 0.3, 2.5, 10, 76],
  };

  const handleDrop = () => {
    // Generate path
    let currentX = 0; // Starts at center 0. Each row it goes -0.5 or +0.5
    const path = [];
    let binIndex = 0;
    
    const willWin = Math.random() < 0.02;
    let targetBinIndex = 0;
    
    if (willWin) {
      // Choose a winning bin (index 0, 1, 2 or 8, 9, 10)
      const winBins = [0, 1, 2, 8, 9, 10];
      targetBinIndex = winBins[Math.floor(Math.random() * winBins.length)];
    } else {
      // Choose a losing bin (index 3, 4, 5, 6, 7)
      const loseBins = [3, 4, 5, 6, 7];
      targetBinIndex = loseBins[Math.floor(Math.random() * loseBins.length)];
    }

    const bounces = [
      ...Array(targetBinIndex).fill(0.5),
      ...Array(ROWS - targetBinIndex).fill(-0.5)
    ];
    // Shuffle bounces (Fisher-Yates)
    for (let i = bounces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bounces[i], bounces[j]] = [bounces[j], bounces[i]];
    }

    for (let r = 0; r < ROWS; r++) {
      const dir = bounces[r];
      currentX += dir;
      path.push(currentX);
      if (dir > 0) binIndex++;
    }

    const multiplier = MULTIPLIERS[risk][binIndex];
    
    const newBall = { id: ballId, path, multiplier };
    setBalls((prev) => [...prev, newBall]);
    setBallId((prev) => prev + 1);

    // Remove ball after animation completes (roughly 2.5s)
    setTimeout(() => {
      setBalls((prev) => prev.filter(b => b.id !== newBall.id));
    }, 3000);
  };

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
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full bg-transparent text-white font-bold px-3 focus:outline-none"
            />
            <button onClick={() => setBetAmount(Math.max(1, betAmount / 2))} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-colors">1/2</button>
            <div className="w-[1px] bg-slate-800 mx-1"></div>
            <button onClick={() => setBetAmount(betAmount * 2)} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-colors">2x</button>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-400 mb-2 block">Risk Level</label>
          <div className="grid grid-cols-3 gap-2">
            {(["low", "medium", "high"] as Risk[]).map(r => (
              <button 
                key={r}
                onClick={() => setRisk(r)}
                className={`py-2 rounded-lg font-bold text-sm capitalize transition-colors ${
                  risk === r ? "bg-slate-700 text-white shadow-lg" : "bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <button 
            onClick={handleDrop}
            className="w-full py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 shadow-lg bg-neon-purple hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          >
            Drop Ball
          </button>
        </div>
      </div>

      {/* Interactive Game Canvas */}
      <div className="flex-1 relative flex flex-col items-center justify-end pb-12 pt-4 bg-slate-950 overflow-hidden">
        
        {/* Plinko Board */}
        <div className="relative w-full max-w-[500px] aspect-square flex flex-col justify-between">
          
          {/* Render Pegs */}
          {Array.from({ length: ROWS }).map((_, rIdx) => {
            const pegsInRow = 3 + rIdx;
            return (
              <div key={rIdx} className="flex justify-center gap-6 md:gap-8 w-full">
                {Array.from({ length: pegsInRow }).map((_, pIdx) => (
                  <div key={pIdx} className="w-2 h-2 rounded-full bg-white/20 shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
                ))}
              </div>
            );
          })}

          {/* Render Bins at Bottom */}
          <div className="flex justify-center gap-1 w-full mt-2">
            {MULTIPLIERS[risk].map((mult, i) => {
              const isHigh = mult >= 5;
              const isLow = mult <= 0.5;
              return (
                <div 
                  key={i} 
                  className={`flex-1 h-8 rounded text-[10px] sm:text-xs font-bold flex items-center justify-center text-slate-950 ${
                    isHigh ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : 
                    isLow ? "bg-yellow-500/80" : "bg-orange-500"
                  }`}
                >
                  {mult}x
                </div>
              );
            })}
          </div>

          {/* Render Falling Balls */}
          <AnimatePresence>
            {balls.map((ball) => {
              // Create keyframes for the ball dropping
              const xKeyframes: (number | string)[] = [0];
              const yKeyframes: (number | string)[] = [0];
              const pegRowHeight = 100 / ROWS; // percentage roughly

              ball.path.forEach((x, i) => {
                xKeyframes.push(x * 32); // 32px horizontal shift per bounce roughly
                yKeyframes.push((i + 1) * pegRowHeight + "%");
              });

              return (
                <motion.div
                  key={ball.id}
                  initial={{ x: "0%", y: "-10%" }}
                  animate={{ 
                    x: xKeyframes, 
                    y: yKeyframes 
                  }}
                  transition={{ 
                    duration: 2, 
                    ease: "linear",
                    times: Array.from({length: ROWS + 1}).map((_, i) => i / ROWS)
                  }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.8)] z-10"
                />
              );
            })}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
