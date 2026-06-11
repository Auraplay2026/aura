"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bomb, CircleDollarSign, ShieldAlert } from "lucide-react";

interface MinesEngineProps {
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
}

type GameState = "idle" | "playing" | "busted" | "cashed_out";

export function MinesEngine({ isPlaying, onComplete }: MinesEngineProps) {
  const [minesCount, setMinesCount] = useState(3);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [mineLocations, setMineLocations] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>(Array(25).fill(false));
  const [activeMultiplier, setActiveMultiplier] = useState(1.00);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Auto start game when isPlaying becomes true
  useEffect(() => {
    if (!isPlaying) {
      // Reset if stopped externally
      if (gameState === "playing") {
        setGameState("idle");
      }
      return;
    }
    if (gameState === "idle") {
      startGame();
    }
  }, [isPlaying]);

  const nextMultiplier = useMemo(() => {
    const safeRevealed = revealed.filter((v, i) => v && !mineLocations.includes(i)).length;
    return activeMultiplier * (1 + (minesCount / Math.max(1, 25 - safeRevealed)) * 0.95);
  }, [revealed, mineLocations, minesCount, activeMultiplier]);

  const startGame = () => {
    const newMines: number[] = [];
    while (newMines.length < minesCount) {
      const r = Math.floor(Math.random() * 25);
      if (!newMines.includes(r)) newMines.push(r);
    }
    setMineLocations(newMines);
    setRevealed(Array(25).fill(false));
    setActiveMultiplier(1.00);
    setGameState("playing");
  };

  const handleTileClick = (index: number) => {
    if (gameState !== "playing" || revealed[index]) return;
    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);

    if (mineLocations.includes(index)) {
      setGameState("busted");
      onCompleteRef.current(0, false);
    } else {
      setActiveMultiplier(nextMultiplier);
      const safeRevealedCount = newRevealed.filter((v, i) => v && !mineLocations.includes(i)).length;
      if (safeRevealedCount === 25 - minesCount) {
        setGameState("cashed_out");
        onCompleteRef.current(nextMultiplier, true);
      }
    }
  };

  const cashOut = () => {
    if (gameState !== "playing") return;
    setGameState("cashed_out");
    onCompleteRef.current(activeMultiplier, true);
  };

  const reset = () => {
    setGameState("idle");
    setRevealed(Array(25).fill(false));
    setMineLocations([]);
    setActiveMultiplier(1.00);
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4 relative">
      {/* Dark starfield background */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#050913] via-[#080f1e] to-[#020509]" />
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 70%, rgba(168,85,247,0.2) 0%, transparent 40%),
                              radial-gradient(circle at 70% 30%, rgba(16,185,129,0.1) 0%, transparent 40%)`
          }}
        />
      </div>

      {/* Top controls */}
      <div className="relative z-10 flex items-center gap-3 flex-wrap">
        {/* Mines count */}
        <div className="flex items-center gap-2 bg-white/40 border border-slate-200 rounded-xl px-3 py-2">
          <Bomb className="w-4 h-4 text-red-600" />
          <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Mines:</span>
          {[1, 3, 5, 10, 24].map(n => (
            <button
              key={n}
              disabled={gameState === "playing"}
              onClick={() => { setMinesCount(n); reset(); }}
              className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${minesCount === n ? "bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]" : "bg-slate-900/5 text-slate-600 hover:bg-slate-900/10 disabled:opacity-30"}`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Multiplier display */}
        <div className="ml-auto flex items-center gap-2 bg-white/40 border border-slate-200 rounded-xl px-4 py-2">
          <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Multiplier:</span>
          <span className={`font-black text-lg tabular-nums ${gameState === "playing" ? "text-neon-green" : "text-slate-500"}`}>
            {activeMultiplier.toFixed(2)}x
          </span>
        </div>

        {/* Cash out button */}
        {gameState === "playing" && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={cashOut}
            className="px-4 py-2 bg-neon-green text-slate-950 font-black text-sm rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] transition-all active:scale-95"
          >
            Cash Out
          </motion.button>
        )}
        {(gameState === "busted" || gameState === "cashed_out" || gameState === "idle") && (
          <button
            onClick={() => { reset(); if (isPlaying) setTimeout(startGame, 100); }}
            className="px-4 py-2 bg-slate-900/10 text-slate-900 font-black text-sm rounded-xl hover:bg-slate-900/20 transition-all active:scale-95"
          >
            {gameState === "idle" ? "Start" : "Play Again"}
          </button>
        )}
      </div>

      {/* Status banners */}
      <AnimatePresence>
        {gameState === "busted" && (
          <motion.div
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-20 flex items-center justify-center gap-2 bg-red-500/20 border border-red-500/40 text-red-600 rounded-xl py-2 font-black tracking-widest uppercase text-sm"
          >
            <ShieldAlert className="w-4 h-4" /> MINE HIT — GAME OVER
          </motion.div>
        )}
        {gameState === "cashed_out" && (
          <motion.div
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className="relative z-20 flex items-center justify-center gap-2 bg-neon-green/10 border border-neon-green/30 text-neon-green rounded-xl py-2 font-black tracking-widest uppercase text-sm"
          >
            <CircleDollarSign className="w-4 h-4" /> CASHED OUT @ {activeMultiplier.toFixed(2)}x
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5x5 Mines Grid */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="grid grid-cols-5 gap-2 md:gap-3 w-full max-w-[360px] aspect-square">
          {Array(25).fill(null).map((_, i) => {
            const isRevealed = revealed[i] || gameState === "busted" || gameState === "cashed_out";
            const isMine = mineLocations.includes(i);
            const isBustMine = gameState === "busted" && isMine && revealed[i];

            return (
              <motion.button
                key={i}
                disabled={gameState !== "playing" || revealed[i]}
                onClick={() => handleTileClick(i)}
                whileHover={gameState === "playing" && !revealed[i] ? { scale: 1.06, y: -2 } : {}}
                whileTap={gameState === "playing" && !revealed[i] ? { scale: 0.94 } : {}}
                className="relative w-full h-full rounded-xl"
                style={{ perspective: 1000 }}
              >
                <motion.div
                  className="w-full h-full relative"
                  animate={{ rotateY: isRevealed ? 180 : 0 }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Front (hidden) */}
                  <div
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 hover:border-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-colors"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent" />
                  </div>

                  {/* Back (revealed) */}
                  <div
                    className={`absolute inset-0 rounded-xl flex items-center justify-center border shadow-inner ${
                      isBustMine ? "bg-red-500 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)]" :
                      isMine && isRevealed ? "bg-slate-50 border-slate-700" :
                      "bg-gradient-to-br from-emerald-900/60 to-slate-900 border-emerald-700/50 shadow-[inset_0_0_15px_rgba(16,185,129,0.15)]"
                    }`}
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    {isMine ? (
                      <Bomb className={`w-6 h-6 md:w-8 md:h-8 ${isBustMine ? "text-slate-900 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "text-slate-600"}`} />
                    ) : (
                      <CircleDollarSign className="w-6 h-6 md:w-8 md:h-8 text-neon-green drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    )}
                  </div>
                </motion.div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
