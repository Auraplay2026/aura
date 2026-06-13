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
    // ALWAYS start game when isPlaying goes from false to true
    startGame();
  }, [isPlaying]);

  const nextMultiplier = useMemo(() => {
    const safeRevealed = revealed.filter((v, i) => v && !mineLocations.includes(i)).length;
    // Classic mines multiplier curve
    return activeMultiplier * (1 + (minesCount / Math.max(1, 25 - safeRevealed)) * 0.95);
  }, [revealed, mineLocations, minesCount, activeMultiplier]);

  const startGame = () => {
    // 1. Calculate outcome strictly using the central engine
    const outcome = calculateGameOutcome("ORIGINAL"); // Global 20% win rate
    setScheduledOutcome(outcome);

    const newMines: number[] = [];
    
    // Rigging Logic
    if (outcome.isWin) {
      // It's a genuine win. Seed the board fairly so they can navigate it.
      while (newMines.length < minesCount) {
        const r = Math.floor(Math.random() * 25);
        if (!newMines.includes(r)) newMines.push(r);
      }
    } else {
      // It's a strict LOSS. 
      // We will place mines lazily based on their clicks.
      // Determine on which click they will bust (e.g. 1st, 2nd, 3rd, or 4th click)
      // If Near Miss is true, let them click 3 or 4 times. If false, kill them early.
      const bustOn = outcome.isNearMiss ? Math.floor(Math.random() * 3) + 3 : Math.floor(Math.random() * 2) + 1;
      setRiggedBustClick(bustOn);
      // We don't seed `newMines` yet. We will seed them dynamically when they click.
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

    // Dynamically Rig the Mine if scheduled to lose
    if (scheduledOutcome && !scheduledOutcome.isWin) {
      if (currentClick >= riggedBustClick) {
        // Force the mine exactly under their mouse
        isBust = true;
        
        // Populate the rest of the board with fake mines to make it look legit
        const fakeMines = [index];
        while (fakeMines.length < minesCount) {
          const r = Math.floor(Math.random() * 25);
          if (!fakeMines.includes(r)) fakeMines.push(r);
        }
        setMineLocations(fakeMines);
      }
    } else {
      // Genuine seeded game
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
      // Reveal all tiles
      setRevealed(Array(25).fill(true));
      setTimeout(() => onCompleteRef.current(0, false), 1500);
    } else {
      setActiveMultiplier(nextMultiplier);
      const safeRevealedCount = newRevealed.filter((v, i) => v && (!mineLocations.includes(i) || (scheduledOutcome && !scheduledOutcome.isWin))).length;
      
      // Auto cashout if they clear the board
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
    setRevealed(Array(25).fill(true)); // Reveal board on cashout
    onCompleteRef.current(activeMultiplier, true);
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-4 p-4 relative bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e293b,transparent_80%)]" />
        {gameState === "busted" && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 0.3 }} 
            className="absolute inset-0 bg-red-600 mix-blend-overlay"
          />
        )}
        {gameState === "cashed_out" && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 0.2 }} 
            className="absolute inset-0 bg-emerald-500 mix-blend-overlay"
          />
        )}
      </div>

      {/* Header UI */}
      <div className="relative z-10 flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-700/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <Bomb className="w-4 h-4 text-red-400" />
            <select 
              disabled={gameState === "playing"}
              className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer"
              value={minesCount}
              onChange={(e) => setMinesCount(Number(e.target.value))}
            >
              {[1,3,5,10,24].map(n => <option key={n} value={n} className="bg-slate-900">{n} Mines</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Current Multiplier</span>
          <motion.span 
            key={activeMultiplier}
            initial={{ scale: 1.5, color: "#10b981" }}
            animate={{ scale: 1, color: "#ffffff" }}
            className="text-xl font-black font-mono tracking-tight"
          >
            {activeMultiplier.toFixed(2)}x
          </motion.span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="grid grid-cols-5 gap-2 w-full max-w-md aspect-square p-4 bg-slate-900/50 rounded-3xl border border-slate-800/80 shadow-[0_0_50px_rgba(0,0,0,0.3)_inset]">
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
                  whileHover={gameState === "playing" && !isRevealed ? { scale: 1.05, y: -2 } : {}}
                  whileTap={gameState === "playing" && !isRevealed ? { scale: 0.95 } : {}}
                  className={`relative w-full h-full rounded-xl flex items-center justify-center transform-style-3d transition-all duration-500
                    ${!isRevealed ? "bg-gradient-to-b from-slate-700 to-slate-800 shadow-[0_4px_0_rgb(51,65,85),0_10px_15px_rgba(0,0,0,0.5)] border-t border-slate-600 cursor-pointer" 
                    : isMine 
                      ? isBustCause ? "bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.8)] z-20" : "bg-slate-800 opacity-50"
                      : "bg-slate-800/80 shadow-inner border border-emerald-500/20"}
                  `}
                >
                  <motion.div
                    initial={false}
                    animate={{ rotateY: isRevealed ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="absolute inset-0 w-full h-full flex items-center justify-center backface-hidden"
                  >
                    {isRevealed && (
                      <div className="transform rotate-y-180">
                        {isMine ? (
                          <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", bounce: 0.6 }}
                          >
                            <Bomb className={`w-8 h-8 ${isBustCause ? 'text-white' : 'text-slate-500'}`} />
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="relative"
                          >
                            <Gem className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                            {/* Particle burst */}
                            <motion.div 
                              initial={{ scale: 0, opacity: 1 }}
                              animate={{ scale: 2, opacity: 0 }}
                              transition={{ duration: 0.5 }}
                              className="absolute inset-0 bg-emerald-400 rounded-full mix-blend-screen blur-md z-[-1]"
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

      {/* Cashout Action */}
      <div className="relative z-10 flex justify-center mt-2 h-14">
        {gameState === "playing" && clickCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={cashOut}
            className="w-full max-w-sm bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-900 font-black text-xl rounded-xl shadow-[0_0_30px_rgba(52,211,153,0.3)] transition-all uppercase tracking-widest"
          >
            Cashout {(betAmount * activeMultiplier).toFixed(2)}
          </motion.button>
        )}
        {gameState === "busted" && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 text-red-500 font-black text-2xl uppercase tracking-widest"
          >
            <Skull className="w-6 h-6" /> Busted
          </motion.div>
        )}
        {gameState === "cashed_out" && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center"
          >
            <span className="text-emerald-400 font-black text-2xl uppercase tracking-widest drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
              Winner!
            </span>
            <span className="text-emerald-500/80 text-xs font-bold uppercase tracking-wider">
              +{((activeMultiplier - 1) * betAmount).toFixed(2)} Profit
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
