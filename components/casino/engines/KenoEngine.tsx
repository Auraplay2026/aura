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
  const email = currentUser?.email || "admin@aurabet.io";

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
    <div className="w-full h-full min-h-[380px] md:min-h-[600px] flex flex-col p-3 md:p-6 relative bg-[#09090b] rounded-3xl overflow-hidden shadow-2xl border border-[#27272a] perspective-[1200px]">
      
      {/* Dynamic 3D Neon Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.15),transparent_70%)]" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.4) 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
            transform: 'rotateX(60deg) translateY(-50%)',
            transformOrigin: 'top'
          }}
        />
      </div>

      {/* Header UI */}
      <div className="relative z-20 flex items-center justify-between bg-[#18181b]/80 p-4 rounded-2xl border border-[#27272a] backdrop-blur-md mb-6 shadow-lg">
        <div className="flex gap-2">
          <button 
            onClick={clearSelection}
            disabled={gameState !== "idle"}
            className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] text-xs font-black uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
          >
            Clear
          </button>
          <button 
            onClick={autoPick}
            disabled={gameState !== "idle"}
            className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 text-xs font-black uppercase tracking-wider rounded-xl border border-purple-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-4 h-4" /> Auto Pick
          </button>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-[#71717a] font-black">Selected</span>
          <span className="text-2xl font-black font-mono text-white drop-shadow-md">
            {selectedNumbers.length} <span className="text-[#52525b] text-base">/ 10</span>
          </span>
        </div>
      </div>

      {/* 3D Grid container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center transform-style-3d rotate-x-[15deg]">
        <div className="grid grid-cols-8 gap-2 md:gap-3 w-full max-w-[600px] bg-[#18181b]/50 p-4 rounded-3xl border border-[#27272a] shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_0_50px_rgba(0,0,0,0.8)]">
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
                  relative aspect-square rounded-xl font-black text-sm md:text-lg flex items-center justify-center transform-style-3d outline-none
                  ${isSelected && !isDrawn ? "bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-[0_8px_0_rgba(88,28,135,1),0_15px_20px_rgba(147,51,234,0.5)] border-t border-purple-400 z-10" : ""}
                  ${isHit ? "bg-gradient-to-b from-emerald-400 to-emerald-600 text-slate-900 shadow-[0_10px_0_rgba(6,95,70,1),0_20px_30px_rgba(16,185,129,0.8)] border-t border-emerald-300 z-20" : ""}
                  ${isMiss ? "bg-[#27272a] text-white border border-[#3f3f46] shadow-inner opacity-80" : ""}
                  ${!isSelected && !isDrawn ? "bg-[#18181b] text-[#71717a] border border-[#27272a] shadow-[0_4px_0_rgba(9,9,11,1)] hover:text-[#a1a1aa]" : ""}
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
                      className="absolute inset-0 bg-emerald-400 rounded-xl z-0 mix-blend-screen blur-sm"
                    />
                  )}
                </AnimatePresence>

                {/* Drawn Miss effect (dimming) */}
                <AnimatePresence>
                  {isSelected && !isDrawn && gameState === "finished" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-[#09090b]/60 rounded-xl z-20 flex items-center justify-center"
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
      <div className="relative z-20 flex items-center justify-between h-16 bg-[#18181b]/90 rounded-2xl border border-[#27272a] px-6 mt-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Target className="w-6 h-6 text-purple-500 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]" />
          <span className="text-sm font-black uppercase tracking-widest text-[#a1a1aa]">
            Hits: <span className="text-white text-xl ml-1">{hitsCount}</span>
          </span>
        </div>
        
        <AnimatePresence>
          {gameState === "finished" && (
            <motion.div 
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              className={`font-black uppercase tracking-widest text-lg md:text-xl px-6 py-2 rounded-lg border
                ${hitsCount >= 4 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(52,211,153,0.3)]" : "bg-red-500/10 text-red-500 border-red-500/30"}
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
