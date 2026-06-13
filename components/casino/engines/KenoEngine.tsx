"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, CircleDollarSign, Ghost } from "lucide-react";
import { calculateGameOutcome, GameOutcome } from "@/lib/casino-math";

interface KenoEngineProps {
  isPlaying: boolean;
  betAmount?: number;
  onComplete: (multiplier: number, won: boolean) => void;
}

type GameState = "idle" | "drawing" | "finished";

export function KenoEngine({ isPlaying, betAmount = 10, onComplete }: KenoEngineProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [outcome, setOutcome] = useState<GameOutcome | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      if (gameState === "drawing") {
        setGameState("idle");
        setDrawnNumbers([]);
      }
      return;
    }

    // ALWAYS start game when isPlaying goes from false to true
    startGame();
  }, [isPlaying]);

  const startGame = () => {
    let currentPicks = [...selectedNumbers];
    if (currentPicks.length === 0) {
      // Auto-pick 10 random numbers if none selected
      const picks: number[] = [];
      while (picks.length < 10) {
        const r = Math.floor(Math.random() * 40) + 1;
        if (!picks.includes(r)) picks.push(r);
      }
      setSelectedNumbers(picks);
      currentPicks = picks;
    }

    setGameState("drawing");
    setDrawnNumbers([]);

    // 1. Calculate outcome strictly using the central engine
    const mathOutcome = calculateGameOutcome("ORIGINAL"); // Global 20% win rate
    setOutcome(mathOutcome);

    const pool = Array.from({ length: 40 }, (_, i) => i + 1);
    const nonSelectedPool = pool.filter(n => !currentPicks.includes(n));
    const finalDraws: number[] = [];

    if (mathOutcome.isWin) {
      // WIN: Force 5 to 10 hits
      const numHits = Math.floor(Math.random() * 6) + 5; // 5 to 10 hits
      const selectedCopy = [...currentPicks];
      for (let i = 0; i < Math.min(numHits, currentPicks.length); i++) {
        const idx = Math.floor(Math.random() * selectedCopy.length);
        finalDraws.push(selectedCopy.splice(idx, 1)[0]);
      }
    } else {
      // LOSS: Force 0 to 2 hits (to prevent big payouts)
      const numHits = mathOutcome.isNearMiss ? 2 : Math.floor(Math.random() * 2); 
      const selectedCopy = [...currentPicks];
      for (let i = 0; i < Math.min(numHits, currentPicks.length); i++) {
        const idx = Math.floor(Math.random() * selectedCopy.length);
        finalDraws.push(selectedCopy.splice(idx, 1)[0]);
      }
    }

    // Fill the rest with non-selected numbers
    while (finalDraws.length < 10) {
      const idx = Math.floor(Math.random() * nonSelectedPool.length);
      finalDraws.push(nonSelectedPool.splice(idx, 1)[0]);
    }

    // Shuffle final draws
    for (let i = finalDraws.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [finalDraws[i], finalDraws[j]] = [finalDraws[j], finalDraws[i]];
    }

    const draws: number[] = [];
    const interval = setInterval(() => {
      const next = finalDraws[draws.length];
      draws.push(next);
      setDrawnNumbers([...draws]);
      
      if (draws.length === 10) {
        clearInterval(interval);
        setGameState("finished");
        const hits = draws.filter(n => currentPicks.includes(n)).length;
        // Basic payout logic (in a real app, this would use a matrix)
        let mult = 0;
        if (hits >= 10) mult = 500;
        else if (hits >= 8) mult = 50;
        else if (hits >= 6) mult = 5;
        else if (hits >= 4) mult = 1.5;
        
        onCompleteRef.current(mult, mult > 0);
      }
    }, 400);

    return () => clearInterval(interval);
  };

  const toggleNumber = (num: number) => {
    if (gameState !== "idle") return;
    setSelectedNumbers(prev => {
      if (prev.includes(num)) return prev.filter(n => n !== num);
      if (prev.length < 10) return [...prev, num];
      return prev;
    });
  };

  const clearSelection = () => {
    if (gameState === "idle") setSelectedNumbers([]);
  };

  const autoPick = () => {
    if (gameState !== "idle") return;
    const picks: number[] = [];
    while (picks.length < 10) {
      const r = Math.floor(Math.random() * 40) + 1;
      if (!picks.includes(r)) picks.push(r);
    }
    setSelectedNumbers(picks);
  };

  const hitsCount = drawnNumbers.filter(n => selectedNumbers.includes(n)).length;

  return (
    <div className="w-full flex-1 flex flex-col gap-4 p-4 relative bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl border border-purple-900/30">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_70%)]" />
        <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-purple-900/10 to-transparent" />
      </div>

      {/* Header UI */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex gap-2">
          <button 
            onClick={clearSelection}
            disabled={gameState !== "idle"}
            className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-700 disabled:opacity-50 transition-colors"
          >
            Clear
          </button>
          <button 
            onClick={autoPick}
            disabled={gameState !== "idle"}
            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider rounded-lg border border-purple-500/30 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Zap className="w-3 h-3" /> Auto Pick
          </button>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Selected</span>
          <span className="text-xl font-black text-white">
            {selectedNumbers.length} <span className="text-slate-500 text-sm">/ 10</span>
          </span>
        </div>
      </div>

      {/* Grid container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        <div className="grid grid-cols-8 gap-2 sm:gap-3 w-full max-w-2xl">
          {Array.from({ length: 40 }, (_, i) => i + 1).map(num => {
            const isSelected = selectedNumbers.includes(num);
            const isDrawn = drawnNumbers.includes(num);
            const isHit = isSelected && isDrawn;
            const isMiss = !isSelected && isDrawn;

            return (
              <motion.button
                key={num}
                onClick={() => toggleNumber(num)}
                disabled={gameState !== "idle"}
                whileHover={gameState === "idle" ? { scale: 1.05 } : {}}
                whileTap={gameState === "idle" ? { scale: 0.95 } : {}}
                className={`
                  relative aspect-square rounded-lg sm:rounded-xl font-black text-sm sm:text-base flex items-center justify-center transition-all duration-300
                  ${isSelected && !isDrawn ? "bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.5)] border border-purple-400" : ""}
                  ${isHit ? "bg-emerald-500 text-slate-900 shadow-[0_0_30px_rgba(16,185,129,0.8)] border border-emerald-300 z-10 scale-110" : ""}
                  ${isMiss ? "bg-slate-800/80 text-white border border-slate-600" : ""}
                  ${!isSelected && !isDrawn ? "bg-slate-900/50 text-slate-500 border border-slate-800 hover:border-slate-700 hover:text-slate-400" : ""}
                `}
              >
                {/* Number text */}
                <span className="relative z-10">{num}</span>

                {/* Hit effect */}
                <AnimatePresence>
                  {isHit && (
                    <motion.div
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute inset-0 bg-emerald-400 rounded-full z-0"
                    />
                  )}
                </AnimatePresence>
                
                {/* Miss selection effect */}
                <AnimatePresence>
                  {isSelected && !isDrawn && gameState === "finished" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-slate-900/60 rounded-xl z-20 flex items-center justify-center"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 flex items-center justify-between h-12 bg-slate-900/80 rounded-2xl border border-slate-800 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Target className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
            Hits: <span className="text-white text-base">{hitsCount}</span>
          </span>
        </div>
        
        {gameState === "finished" && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`font-black uppercase tracking-widest text-sm
              ${hitsCount >= 4 ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" : "text-slate-500"}
            `}
          >
            {hitsCount >= 4 ? "Winner!" : "No Win"}
          </motion.div>
        )}
      </div>
    </div>
  );
}
