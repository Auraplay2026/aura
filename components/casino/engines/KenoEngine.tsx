"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { playGameSound } from "@/lib/audio";

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
  const [outcomeMultiplier, setOutcomeMultiplier] = useState(0);

  const currentUser = useTradingStore(state => state.currentUser);
  const email = currentUser?.email || "twintubrovquattro@gmail.com";

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
    startGame();
  }, [isPlaying]);

  const startGame = async () => {
    let currentPicks = [...selectedNumbers];
    if (currentPicks.length === 0) {
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

    try {
      const res = await fetch('/api/casino/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          gameId: "orig-6",
          gameTitle: "Keno",
          betAmount
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const isWin = data.isWin;
        const mult = data.multiplier;
        setOutcomeMultiplier(mult);

        let hits = 0;
        if (isWin) {
          if (mult >= 500) hits = 10;
          else if (mult >= 50) hits = 8;
          else if (mult >= 5) hits = 6;
          else hits = 4;
        } else {
          hits = Math.floor(Math.random() * 4); // 0, 1, 2 or 3 hits (no win)
        }

        const pool = Array.from({ length: 40 }, (_, i) => i + 1);
        const nonSelectedPool = pool.filter(n => !currentPicks.includes(n));
        const finalDraws: number[] = [];

        // Select hitting numbers
        const selectedCopy = [...currentPicks];
        const actualHits = Math.min(hits, currentPicks.length);
        for (let i = 0; i < actualHits; i++) {
          const idx = Math.floor(Math.random() * selectedCopy.length);
          finalDraws.push(selectedCopy.splice(idx, 1)[0]);
        }

        // Fill up to 10 with non-selected numbers
        while (finalDraws.length < 10) {
          const idx = Math.floor(Math.random() * nonSelectedPool.length);
          finalDraws.push(nonSelectedPool.splice(idx, 1)[0]);
        }

        // Shuffle drawn numbers
        for (let i = finalDraws.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [finalDraws[i], finalDraws[j]] = [finalDraws[j], finalDraws[i]];
        }

        const draws: number[] = [];
        const interval = setInterval(() => {
          const next = finalDraws[draws.length];
          draws.push(next);
          setDrawnNumbers([...draws]);
          playGameSound('tick');
          
          if (draws.length === 10) {
            clearInterval(interval);
            setGameState("finished");
            const wonGame = isWin;
            if (wonGame) {
              playGameSound('win');
            } else {
              playGameSound('lose');
            }
            onCompleteRef.current(mult, wonGame);
          }
        }, 400);

      } else {
        setGameState("idle");
        onCompleteRef.current(0, false);
        alert(data.error || "Wager placement failed.");
      }
    } catch (err) {
      console.error("Keno bet initiation failed", err);
      setGameState("idle");
      onCompleteRef.current(0, false);
    }
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
    <div className="w-full h-full min-h-[300px] h-[330px] md:min-h-[600px] md:h-full flex flex-col p-2 md:p-6 relative bg-gradient-to-br from-slate-50 via-white to-violet-50/60 rounded-3xl overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)] border border-slate-200/80 perspective-[1200px]">
      
      {/* Soft ambient grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(167,139,250,0.12),transparent_65%)]" />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.12) 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
            transform: 'rotateX(60deg) translateY(-50%)',
            transformOrigin: 'top'
          }}
        />
      </div>

      {/* Header UI */}
      <div className="relative z-20 flex items-center justify-between bg-white/80 p-2 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 backdrop-blur-md mb-3 md:mb-6 shadow-md">
        <div className="flex gap-1.5">
          <button 
            onClick={clearSelection}
            disabled={gameState !== "idle"}
            className="px-3 py-1.5 md:px-4 md:py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-lg md:rounded-xl transition-colors disabled:opacity-50"
          >
            Clear
          </button>
          <button 
            onClick={autoPick}
            disabled={gameState !== "idle"}
            className="px-3 py-1.5 md:px-4 md:py-2 bg-violet-100 hover:bg-violet-200 text-violet-700 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-lg md:rounded-xl border border-violet-300/50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" /> Auto Pick
          </button>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-[#71717a] font-black leading-none mb-0.5">Selected</span>
          <span className="text-lg md:text-2xl font-black font-mono text-slate-900 drop-shadow-md leading-none">
            {selectedNumbers.length} <span className="text-[#52525b] text-xs md:text-base">/ 10</span>
          </span>
        </div>
      </div>

      {/* 3D Grid container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center transform-style-3d rotate-x-[15deg]">
        <div className="grid grid-cols-8 gap-1.5 md:gap-3 w-full max-w-[290px] md:max-w-[600px] bg-white/70 p-2 md:p-4 rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)]">
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
                whileHover={gameState === "idle" ? { scale: 1.1, y: -5 } : {}}
                whileTap={gameState === "idle" ? { scale: 0.9, y: 2 } : {}}
                animate={
                  isSelected && !isDrawn ? { y: -3, scale: 1.05 } : 
                  isHit ? { y: -8, scale: 1.15 } : 
                  { y: 0, scale: 1 }
                }
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`
                  relative aspect-square rounded-lg md:rounded-xl font-black text-[10px] md:text-lg flex items-center justify-center transform-style-3d outline-none
                  ${isSelected && !isDrawn ? "bg-gradient-to-b from-violet-400 to-violet-600 text-white shadow-[0_8px_0_rgba(109,40,217,0.4),0_12px_20px_rgba(139,92,246,0.3)] border-t border-violet-300 z-10" : ""}
                  ${isHit ? "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-[0_10px_0_rgba(6,95,70,0.4),0_15px_25px_rgba(16,185,129,0.4)] border-t border-emerald-300 z-20" : ""}
                  ${isMiss ? "bg-slate-200 text-slate-500 border border-slate-300 shadow-inner opacity-80" : ""}
                  ${!isSelected && !isDrawn ? "bg-gradient-to-b from-slate-100 to-slate-200 text-slate-600 border border-slate-200 shadow-[0_4px_0_rgba(148,163,184,0.5)] hover:text-slate-900 hover:from-white hover:to-slate-100" : ""}
                `}
              >
                <span className="relative z-10">{num}</span>

                {/* Hit explosion effect */}
                <AnimatePresence>
                  {isHit && (
                    <motion.div
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: [1, 2.5], opacity: [1, 0] }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute inset-0 bg-emerald-400 rounded-lg md:rounded-xl z-0 mix-blend-screen blur-sm"
                    />
                  )}
                </AnimatePresence>

                {/* Drawn Miss effect (dimming) */}
                <AnimatePresence>
                  {isSelected && !isDrawn && gameState === "finished" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-[#09090b]/60 rounded-lg md:rounded-xl z-20 flex items-center justify-center"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#52525b]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Footer Info / Results */}
      <div className="relative z-20 flex items-center justify-between h-10 md:h-16 bg-white/80 rounded-xl md:rounded-2xl border border-slate-200 px-3 md:px-6 mt-3 md:mt-6 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-2 md:gap-4">
          <Target className="w-4.5 h-4.5 md:w-6 md:h-6 text-violet-500" />
          <span className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-600">
            Hits: <span className="text-slate-900 text-sm md:text-xl ml-1">{hitsCount}</span>
          </span>
        </div>
        
        <AnimatePresence>
          {gameState === "finished" && (
            <motion.div 
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className={`font-black uppercase tracking-widest text-xs md:text-xl px-3 py-1 rounded-lg border
                ${hitsCount >= 4 ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm" : "bg-red-50 text-red-600 border-red-300"}
              `}
            >
              {hitsCount >= 4 ? `Winner! ${outcomeMultiplier.toFixed(2)}x` : "No Win"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
