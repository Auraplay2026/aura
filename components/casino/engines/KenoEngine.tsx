"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Hash, Star } from "lucide-react";

interface KenoEngineProps {
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
}

type GameState = "idle" | "drawing" | "finished";

export function KenoEngine({ isPlaying, onComplete }: KenoEngineProps) {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [gameState, setGameState] = useState<GameState>("idle");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setDrawnNumbers([]);
      setGameState("idle");
      return;
    }

    if (selectedNumbers.length === 0) {
      // Auto-pick 7 random numbers
      const picks: number[] = [];
      while (picks.length < 7) {
        const r = Math.floor(Math.random() * 40) + 1;
        if (!picks.includes(r)) picks.push(r);
      }
      setSelectedNumbers(picks);
    }

    setGameState("drawing");
    setDrawnNumbers([]);

    const willWin = Math.random() < 0.1;
    const pool = Array.from({ length: 40 }, (_, i) => i + 1).filter(n => !selectedNumbers.includes(n));
    const selected = [...selectedNumbers];

    const finalDraws: number[] = [];

    if (willWin && selected.length > 0) {
      const numHits = Math.max(3, Math.floor(selected.length * 0.5));
      for (let i = 0; i < Math.min(numHits, selected.length); i++) {
        const idx = Math.floor(Math.random() * selected.length);
        finalDraws.push(selected.splice(idx, 1)[0]);
      }
    }

    while (finalDraws.length < 10 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      finalDraws.push(pool.splice(idx, 1)[0]);
    }

    // Shuffle
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
        const hits = draws.filter(n => selectedNumbers.includes(n)).length;
        const mult = hits >= 5 ? hits * 2 : hits >= 3 ? 2.0 : 0;
        onCompleteRef.current(mult, mult > 0);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleNumber = (num: number) => {
    if (gameState !== "idle" && gameState !== "finished") return;
    setSelectedNumbers(prev =>
      prev.includes(num)
        ? prev.filter(n => n !== num)
        : prev.length < 10 ? [...prev, num] : prev
    );
  };

  const hits = drawnNumbers.filter(n => selectedNumbers.includes(n)).length;

  return (
    <div className="w-full h-full flex flex-col gap-3 p-4 md:p-6 relative">
      {/* Carnival-neon background */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0318] via-[#0d0523] to-[#060110]" />
        <div className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 0%, rgba(168,85,247,0.2) 0%, transparent 50%),
                              radial-gradient(circle at 0% 100%, rgba(236,72,153,0.15) 0%, transparent 40%),
                              radial-gradient(circle at 100% 50%, rgba(99,102,241,0.1) 0%, transparent 40%)`
          }}
        />
      </div>

      {/* Header stats */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-black/40 border border-purple-500/20 rounded-xl px-4 py-2">
          <Ticket className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Selected:</span>
          <span className="text-white font-black text-sm">{selectedNumbers.length}/10</span>
        </div>

        <AnimatePresence>
          {gameState === "finished" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-sm ${
                hits >= 3
                  ? "bg-neon-green/10 border-neon-green/40 text-neon-green"
                  : "bg-red-500/10 border-red-500/40 text-red-400"
              }`}
            >
              <Star className="w-4 h-4" />
              {hits} Hit{hits !== 1 ? "s" : ""} — {hits >= 3 ? `${hits * 2}x WIN!` : "No Payout"}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 bg-black/40 border border-purple-500/20 rounded-xl px-4 py-2">
          <Hash className="w-4 h-4 text-fuchsia-400" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Drawn:</span>
          <span className="text-white font-black text-sm">{drawnNumbers.length}/10</span>
        </div>
      </div>

      {/* Drawn numbers display */}
      <div className="relative z-10 min-h-[40px] flex items-center justify-center gap-2 flex-wrap">
        <AnimatePresence>
          {drawnNumbers.map((n, i) => {
            const isHit = selectedNumbers.includes(n);
            return (
              <motion.div
                key={n}
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: i * 0.02 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border-2 ${
                  isHit
                    ? "bg-purple-500 border-purple-300 text-white shadow-[0_0_15px_rgba(168,85,247,0.7)]"
                    : "bg-slate-800 border-slate-600 text-slate-300"
                }`}
              >
                {n}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {drawnNumbers.length === 0 && (
          <span className="text-slate-700 text-sm font-bold uppercase tracking-widest">Numbers will appear here...</span>
        )}
      </div>

      {/* Number grid */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="grid grid-cols-8 gap-1.5 w-full max-w-[480px]">
          {Array.from({ length: 40 }).map((_, i) => {
            const num = i + 1;
            const isSelected = selectedNumbers.includes(num);
            const isDrawn = drawnNumbers.includes(num);
            const isHit = isSelected && isDrawn;
            const isMiss = !isSelected && isDrawn;

            return (
              <motion.button
                key={num}
                disabled={gameState === "drawing"}
                onClick={() => toggleNumber(num)}
                whileHover={gameState !== "drawing" ? { scale: 1.1 } : {}}
                whileTap={gameState !== "drawing" ? { scale: 0.9 } : {}}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs md:text-sm font-black border transition-all duration-200 ${
                  isHit ? "bg-purple-500 border-purple-300 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)]" :
                  isSelected ? "bg-indigo-600/80 border-indigo-400 text-white" :
                  isMiss ? "bg-slate-800/50 border-slate-700/50 text-slate-600" :
                  "bg-white/5 border-white/10 text-slate-400 hover:bg-purple-900/30 hover:border-purple-500/40 hover:text-white"
                }`}
              >
                {num}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Hint */}
      {gameState === "idle" && selectedNumbers.length < 3 && (
        <p className="relative z-10 text-center text-xs text-slate-600 font-bold uppercase tracking-widest">
          Pick 3–10 numbers or they'll be auto-selected when you bet
        </p>
      )}
    </div>
  );
}
