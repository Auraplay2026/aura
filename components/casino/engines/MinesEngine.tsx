"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bomb, Gem, Skull, Sparkles } from "lucide-react";
import { calculateGameOutcome, GameOutcome } from "@/lib/casino-math";

interface MinesEngineProps {
  isPlaying: boolean;
  betAmount?: number;
  onComplete: (multiplier: number, won: boolean) => void;
}

type GameState = "idle" | "playing" | "busted" | "cashed_out";

export function MinesEngine({ isPlaying, betAmount = 10, onComplete }: MinesEngineProps) {
  const [minesCount, setMinesCount] = useState(3);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [revealed, setRevealed] = useState<boolean[]>(Array(25).fill(false));
  const [mineLocations, setMineLocations] = useState<number[]>([]);
  const [bustedIndex, setBustedIndex] = useState<number | null>(null);
  
  // Game math state
  const [activeMultiplier, setActiveMultiplier] = useState(1.00);
  const [scheduledOutcome, setScheduledOutcome] = useState<GameOutcome | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [riggedBustClick, setRiggedBustClick] = useState(0);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Auto start game
  useEffect(() => {
    if (!isPlaying) {
      if (gameState === "playing") setGameState("idle");
      return;
    }
    startGame();
  }, [isPlaying]);

  const nextMultiplier = useMemo(() => {
    const safeRevealed = revealed.filter((v, i) => v && !mineLocations.includes(i)).length;
    return activeMultiplier * (1 + (minesCount / Math.max(1, 25 - safeRevealed)) * 0.95);
  }, [revealed, mineLocations, minesCount, activeMultiplier]);

  const startGame = () => {
    const outcome = calculateGameOutcome("ORIGINAL"); 
    setScheduledOutcome(outcome);

    const newMines: number[] = [];
    
    if (outcome.isWin) {
      while (newMines.length < minesCount) {
        const r = Math.floor(Math.random() * 25);
        if (!newMines.includes(r)) newMines.push(r);
      }
    } else {
      const bustOn = outcome.isNearMiss ? Math.floor(Math.random() * 3) + 3 : Math.floor(Math.random() * 2) + 1;
      setRiggedBustClick(bustOn);
    }

    setMineLocations(newMines);
    setRevealed(Array(25).fill(false));
    setActiveMultiplier(1.00);
    setClickCount(0);
    setBustedIndex(null);
    setGameState("playing");
  };

  const handleTileClick = (index: number) => {
    if (gameState !== "playing" || revealed[index]) return;
    
    const currentClick = clickCount + 1;
    setClickCount(currentClick);
    
    let isBust = false;

    if (scheduledOutcome && !scheduledOutcome.isWin) {
      if (currentClick >= riggedBustClick) {
        isBust = true;
        const fakeMines = [index];
        while (fakeMines.length < minesCount) {
          const r = Math.floor(Math.random() * 25);
          if (!fakeMines.includes(r)) fakeMines.push(r);
        }
        setMineLocations(fakeMines);
      }
    } else {
      if (mineLocations.includes(index)) {
        isBust = true;
      }
    }

    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);

    if (isBust) {
      setBustedIndex(index);
      setGameState("busted");
      setRevealed(Array(25).fill(true));
      setTimeout(() => onCompleteRef.current(0, false), 1500);
    } else {
      setActiveMultiplier(nextMultiplier);
      const safeRevealedCount = newRevealed.filter((v, i) => v && (!mineLocations.includes(i) || (scheduledOutcome && !scheduledOutcome.isWin))).length;
      
      if (safeRevealedCount === 25 - minesCount) {
        setGameState("cashed_out");
        setRevealed(Array(25).fill(true));
        setTimeout(() => onCompleteRef.current(nextMultiplier, true), 1000);
      }
    }
  };

  const cashOut = () => {
    if (gameState !== "playing") return;
    setGameState("cashed_out");
    setRevealed(Array(25).fill(true));
    onCompleteRef.current(activeMultiplier, true);
  };

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] relative bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col p-4 md:p-6 gap-6">
      
      {/* Deep Space / Casino Floor Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 pointer-events-none" />
      
      {/* 3D Floor Grid */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/2 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          transform: 'perspective(1000px) rotateX(70deg)',
          transformOrigin: 'bottom'
        }}
      />

      {/* Screen Shake on Bust */}
      <motion.div 
        animate={gameState === 'busted' ? { x: [-10, 10, -10, 10, 0], y: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex-1 flex flex-col"
      >
        {/* Header UI */}
        <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md mb-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-700 shadow-inner">
              <Bomb className="w-5 h-5 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
              <select 
                disabled={gameState === "playing"}
                className="bg-transparent text-white font-black text-sm outline-none cursor-pointer"
                value={minesCount}
                onChange={(e) => setMinesCount(Number(e.target.value))}
              >
                {[1,3,5,10,24].map(n => <option key={n} value={n} className="bg-slate-900">{n} Mines</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Current Multiplier</span>
            <motion.span 
              key={activeMultiplier}
              initial={{ scale: 1.5, color: "#34d399" }}
              animate={{ scale: 1, color: "#f8fafc" }}
              className="text-2xl font-black font-mono tracking-tight drop-shadow-md"
            >
              {activeMultiplier.toFixed(2)}x
            </motion.span>
          </div>
        </div>

        {/* 3D Mines Grid Container */}
        <div className="relative flex-1 flex items-center justify-center perspective-[1200px]">
          <div className="grid grid-cols-5 gap-3 w-full max-w-[450px] aspect-square p-4 bg-slate-900/40 rounded-[2rem] border border-slate-800/80 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] transform-style-3d rotate-x-[15deg]">
            <AnimatePresence>
              {Array(25).fill(0).map((_, i) => {
                const isRevealed = revealed[i];
                const isMine = (gameState !== "idle" && scheduledOutcome && !scheduledOutcome.isWin && clickCount < riggedBustClick && !isRevealed) ? false : mineLocations.includes(i);
                const isBustCause = bustedIndex === i;

                return (
                  <motion.button
                    key={i}
                    disabled={gameState !== "playing" || isRevealed}
                    onClick={() => handleTileClick(i)}
                    whileHover={gameState === "playing" && !isRevealed ? { y: -5, scale: 1.05 } : {}}
                    whileTap={gameState === "playing" && !isRevealed ? { y: 2, scale: 0.95 } : {}}
                    className={`relative w-full h-full rounded-2xl flex items-center justify-center transition-all duration-300 transform-style-3d outline-none
                      ${!isRevealed 
                        ? "bg-gradient-to-b from-slate-700 to-slate-800 shadow-[0_6px_0_rgb(30,41,59),0_15px_20px_rgba(0,0,0,0.6)] border-t-2 border-slate-600 cursor-pointer" 
                        : "bg-slate-900 shadow-[inset_0_0_20px_rgba(0,0,0,1)] border border-slate-800"
                      }
                      ${isRevealed && isMine && isBustCause ? "bg-red-950/50 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5),inset_0_0_30px_rgba(239,68,68,0.8)] z-20" : ""}
                    `}
                  >
                    {/* The 3D flip wrapper */}
                    <motion.div
                      initial={false}
                      animate={{ rotateY: isRevealed ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 150, damping: 15 }}
                      className="absolute inset-0 w-full h-full flex items-center justify-center transform-style-3d"
                    >
                      {/* Front of tile (hidden when flipped) */}
                      <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5" />
                      </div>

                      {/* Back of tile (the result) */}
                      {isRevealed && (
                        <div className="absolute inset-0 flex items-center justify-center transform rotate-y-180">
                          {isMine ? (
                            <motion.div
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", bounce: 0.6 }}
                            >
                              <Bomb className={`w-10 h-10 ${isBustCause ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)]' : 'text-slate-700 opacity-50'}`} />
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ scale: 0, y: 10 }}
                              animate={{ scale: 1, y: [-2, 2, -2] }}
                              transition={{ y: { repeat: Infinity, duration: 2, ease: "easeInOut" }, scale: { type: "spring", bounce: 0.5 } }}
                              className="relative"
                            >
                              <Gem className="w-10 h-10 text-emerald-400 drop-shadow-[0_10px_10px_rgba(52,211,153,0.5)]" />
                              <motion.div 
                                initial={{ scale: 0, opacity: 1 }}
                                animate={{ scale: 2.5, opacity: 0 }}
                                transition={{ duration: 0.8 }}
                                className="absolute inset-0 bg-emerald-400 rounded-full mix-blend-screen blur-lg z-[-1]"
                              />
                            </motion.div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Global Overlays & Buttons */}
        <AnimatePresence>
          {gameState === "busted" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-red-950/20 backdrop-blur-sm z-30 pointer-events-none flex items-center justify-center"
            >
              <div className="bg-slate-900 border border-red-500/50 p-8 rounded-3xl flex flex-col items-center shadow-[0_0_100px_rgba(239,68,68,0.4)]">
                <Skull className="w-20 h-20 text-red-500 mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,1)]" />
                <h2 className="text-4xl font-black text-white tracking-widest uppercase">Busted</h2>
              </div>
            </motion.div>
          )}

          {gameState === "playing" && clickCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[350px]"
            >
              <button
                onClick={cashOut}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-900 font-black text-2xl rounded-2xl shadow-[0_10px_50px_rgba(52,211,153,0.5),inset_0_2px_0_rgba(255,255,255,0.8)] transition-all uppercase tracking-widest border border-emerald-300 flex items-center justify-center gap-3 active:scale-95"
              >
                <span>Cashout</span>
                <span className="bg-slate-900/20 px-3 py-1 rounded-lg">₹{(betAmount * activeMultiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
