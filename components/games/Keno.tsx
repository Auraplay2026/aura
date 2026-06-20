"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";

type RiskLevel = "classic" | "low" | "medium" | "high";
type GameState = "idle" | "playing" | "finished";

const PAYOUTS = {
  classic: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 250], // Simplified mock paytable
  low:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 100],
  medium:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 500],
  high:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1000],
};

export function Keno() {
  const [betAmount, setBetAmount] = useState(10);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("classic");
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [gameState, setGameState] = useState<GameState>("idle");

  const hits = useMemo(() => {
    return drawnNumbers.filter(n => selectedNumbers.includes(n)).length;
  }, [drawnNumbers, selectedNumbers]);

  const toggleNumber = (num: number) => {
    if (gameState === "playing") return;
    if (gameState === "finished") {
      setDrawnNumbers([]);
      setGameState("idle");
    }

    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length < 10) {
        setSelectedNumbers([...selectedNumbers, num]);
      }
    }
  };

  const autoPick = () => {
    if (gameState === "playing") return;
    const picks: number[] = [];
    while (picks.length < 10) {
      const r = Math.floor(Math.random() * 40) + 1;
      if (!picks.includes(r)) picks.push(r);
    }
    setSelectedNumbers(picks);
    setDrawnNumbers([]);
    setGameState("idle");
  };

  const clearPicks = () => {
    if (gameState === "playing") return;
    setSelectedNumbers([]);
    setDrawnNumbers([]);
    setGameState("idle");
  };

  const startGame = () => {
    if (selectedNumbers.length === 0) return;
    setGameState("playing");
    setDrawnNumbers([]);

    const willWin = Math.random() < 0.02;
    
    // Pre-calculate the 10 numbers we will draw
    const poolSelected = [...selectedNumbers];
    const poolUnselected = Array.from({ length: 40 }, (_, i) => i + 1).filter(n => !selectedNumbers.includes(n));
    
    const finalDraws: number[] = [];
    
    if (willWin) {
      // Draw 5 numbers from selected pool to ensure a hit ratio of ~50%
      for (let i = 0; i < Math.min(5, poolSelected.length); i++) {
        const idx = Math.floor(Math.random() * poolSelected.length);
        finalDraws.push(poolSelected.splice(idx, 1)[0]);
      }
      // Fill the remaining spots up to 10 from unselected pool
      while (finalDraws.length < 10 && poolUnselected.length > 0) {
        const idx = Math.floor(Math.random() * poolUnselected.length);
        finalDraws.push(poolUnselected.splice(idx, 1)[0]);
      }
    } else {
      // Draw all 10 numbers from unselected pool
      for (let i = 0; i < 10 && poolUnselected.length > 0; i++) {
        const idx = Math.floor(Math.random() * poolUnselected.length);
        finalDraws.push(poolUnselected.splice(idx, 1)[0]);
      }
    }

    // Shuffle the final draws so they appear in a random order
    for (let i = finalDraws.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [finalDraws[i], finalDraws[j]] = [finalDraws[j], finalDraws[i]];
    }

    // Simulate drawing 10 numbers one by one
    const draws: number[] = [];
    const interval = setInterval(() => {
      const nextNum = finalDraws[draws.length];
      draws.push(nextNum);
      setDrawnNumbers([...draws]);

      if (draws.length === 10) {
        clearInterval(interval);
        setGameState("finished");
      }
    }, 200);
  };

  // Calculate generic mock payout
  const getPayoutMultiplier = () => {
    if (selectedNumbers.length === 0) return 0;
    // VERY simplified mock payout logic for UI purposes
    const hitRatio = hits / selectedNumbers.length;
    if (hitRatio === 1) return PAYOUTS[riskLevel][10] || 50;
    if (hitRatio > 0.5) return 2.0;
    if (hitRatio > 0.2) return 0.5;
    return 0;
  };

  const finalMultiplier = gameState === "finished" ? getPayoutMultiplier() : 0;
  const payoutAmount = (betAmount * finalMultiplier).toFixed(2);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto h-[600px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-2xl">
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
              disabled={gameState === "playing"}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full bg-transparent text-slate-900 font-bold px-3 focus:outline-none disabled:opacity-50"
            />
            <button disabled={gameState === "playing"} onClick={() => setBetAmount(Math.max(1, betAmount / 2))} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold disabled:opacity-50">1/2</button>
            <div className="w-[1px] bg-slate-100 mx-1"></div>
            <button disabled={gameState === "playing"} onClick={() => setBetAmount(betAmount * 2)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold disabled:opacity-50">2x</button>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-600 mb-2 block">Risk</label>
          <div className="grid grid-cols-2 gap-2">
            {(["classic", "low", "medium", "high"] as RiskLevel[]).map(r => (
              <button 
                key={r}
                disabled={gameState === "playing"}
                onClick={() => setRiskLevel(r)}
                className={`py-2 rounded-lg font-bold text-sm capitalize transition-colors ${
                  riskLevel === r ? "bg-slate-100 text-slate-900" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={autoPick} 
            disabled={gameState === "playing"}
            className="flex-1 py-2 bg-slate-100 hover:bg-slate-100 rounded-lg text-sm font-bold text-slate-900 transition-colors disabled:opacity-50"
          >
            Auto Pick
          </button>
          <button 
            onClick={clearPicks} 
            disabled={gameState === "playing"}
            className="flex-1 py-2 bg-slate-100 hover:bg-slate-100 rounded-lg text-sm font-bold text-slate-900 transition-colors disabled:opacity-50"
          >
            Clear
          </button>
        </div>

        <div className="mt-auto">
          <button 
            onClick={startGame}
            disabled={gameState === "playing" || selectedNumbers.length === 0}
            className={`w-full py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 shadow-lg ${
              gameState === "playing" ? "bg-slate-100 text-slate-500 cursor-not-allowed" :
              selectedNumbers.length === 0 ? "bg-slate-100 text-slate-500 cursor-not-allowed" :
              "bg-neon-green hover:bg-green-400 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            }`}
          >
            {gameState === "playing" ? "Drawing..." : `Bet (₹${betAmount})`}
          </button>
        </div>
      </div>

      {/* Interactive Game Canvas */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-8 bg-slate-50 overflow-hidden">
        
        {gameState === "finished" && finalMultiplier > 0 && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            className="absolute top-4 z-20 bg-green-500/20 border border-green-500/50 text-neon-green px-8 py-3 rounded-full font-black text-xl shadow-[0_0_30px_rgba(34,197,94,0.3)]"
          >
            {finalMultiplier}x (Won ₹{payoutAmount})
          </motion.div>
        )}

        <div className="grid grid-cols-8 gap-2 w-full max-w-[500px]">
          {Array.from({ length: 40 }).map((_, i) => {
            const num = i + 1;
            const isSelected = selectedNumbers.includes(num);
            const isDrawn = drawnNumbers.includes(num);
            const isHit = isSelected && isDrawn;
            const isMiss = !isSelected && isDrawn;

            return (
              <motion.button
                key={num}
                disabled={gameState === "playing"}
                onClick={() => toggleNumber(num)}
                whileHover={gameState !== "playing" ? { scale: 1.05 } : {}}
                whileTap={gameState !== "playing" ? { scale: 0.95 } : {}}
                className={`relative w-full aspect-square rounded-lg flex items-center justify-center font-bold text-sm sm:text-base border transition-colors ${
                  isHit ? "bg-neon-purple border-purple-400 text-slate-900 shadow-[0_0_15px_rgba(168,85,247,0.6)] z-10" :
                  isSelected ? "bg-slate-100 border-slate-500 text-slate-900" :
                  isMiss ? "bg-slate-100 border-slate-700 text-slate-500 opacity-50" :
                  "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {num}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-8 text-slate-500 font-bold tracking-widest text-sm uppercase">
          Selected: <span className="text-slate-900">{selectedNumbers.length}/10</span> | Hits: <span className="text-neon-purple">{hits}</span>
        </div>

      </div>
    </div>
  );
}
