"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Target } from "lucide-react";
import { calculateGameOutcome } from "@/lib/casino-math";

interface PenaltyEngineProps {
  isPlaying: boolean;
  onLiveTick?: (multiplier: number) => void;
  onComplete: (multiplier: number, won: boolean) => void;
}

type GoalZone = "TL" | "TR" | "C" | "BL" | "BR";

export function PenaltyEngine({ isPlaying, onLiveTick, onComplete }: PenaltyEngineProps) {
  const [gameState, setGameState] = useState<"idle" | "playing" | "shooting" | "busted" | "cashed_out">("idle");
  const [multiplier, setMultiplier] = useState(1.0);
  const [targetWinLength, setTargetWinLength] = useState(0);
  const [winsSoFar, setWinsSoFar] = useState(0);
  
  const [ballPos, setBallPos] = useState({ x: 0, y: 0, scale: 1 });
  const [gkPos, setGkPos] = useState({ x: 0, y: 0 });

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    if (isPlaying && gameState === "idle") {
      setGameState("playing");
      setMultiplier(1.0);
      setWinsSoFar(0);
      setBallPos({ x: 0, y: 0, scale: 1 });
      setGkPos({ x: 0, y: 0 });
      
      const mathOutcome = calculateGameOutcome("ORIGINAL");
      if (mathOutcome.isWin) {
        setTargetWinLength(Math.floor(Math.random() * 5) + 3); 
      } else {
        setTargetWinLength(mathOutcome.isNearMiss ? 2 : 0); 
      }
    } else if (!isPlaying) {
      setGameState("idle");
    }
  }, [isPlaying, gameState]);

  const handleShoot = (zone: GoalZone) => {
    if (gameState !== "playing") return;
    setGameState("shooting");

    const willWin = winsSoFar < targetWinLength;
    
    // Scale destination coordinates for smaller mobile viewports (under 400px wide)
    const isMobileViewport = typeof window !== "undefined" && window.innerWidth < 400;
    const scalingFactor = isMobileViewport ? 0.85 : 1.0;

    // Determine ball destination
    const dests: Record<GoalZone, { x: number, y: number }> = {
      "TL": { x: -120 * scalingFactor, y: -80 * scalingFactor },
      "TR": { x: 120 * scalingFactor, y: -80 * scalingFactor },
      "C": { x: 0, y: -20 * scalingFactor },
      "BL": { x: -120 * scalingFactor, y: 40 * scalingFactor },
      "BR": { x: 120 * scalingFactor, y: 40 * scalingFactor },
    };

    const ballDest = dests[zone];
    
    // Determine GK destination
    let gkZone: GoalZone;
    if (!willWin) {
      // Force GK to block by diving to same zone
      gkZone = zone;
    } else {
      // Force GK to miss by diving to a different zone
      const availableZones = Object.keys(dests).filter(z => z !== zone) as GoalZone[];
      gkZone = availableZones[Math.floor(Math.random() * availableZones.length)];
    }

    const gkDest = dests[gkZone];

    // Animate Ball
    setBallPos({ x: ballDest.x, y: ballDest.y, scale: 0.4 });
    
    // Animate GK
    setGkPos({ x: gkDest.x, y: gkDest.y });

    setTimeout(() => {
      if (willWin) {
        setMultiplier(prev => +(prev * 1.5).toFixed(2));
        setWinsSoFar(prev => prev + 1);
        
        // Reset positions for next shot
        setTimeout(() => {
          setGameState("playing");
          setBallPos({ x: 0, y: 0, scale: 1 });
          setGkPos({ x: 0, y: 0 });
        }, 1000);
      } else {
        setGameState("busted");
        setTimeout(() => {
          onCompleteRef.current(0, false);
        }, 1500);
      }
    }, 600); // Wait for animations
  };

  const handleCashout = () => {
    if (gameState !== "playing") return;
    setGameState("cashed_out");
    setTimeout(() => {
      onCompleteRef.current(multiplier, true);
    }, 1500);
  };

  useEffect(() => {
    if (gameState === "playing") {
      onLiveTick?.(multiplier);
    } else {
      onLiveTick?.(1.0);
    }
  }, [multiplier, gameState, onLiveTick]);

  useEffect(() => {
    const handleTriggerCashout = () => {
      if (gameState === "playing" && multiplier > 1.0) {
        handleCashout();
      }
    };
    window.addEventListener("trigger-cashout", handleTriggerCashout);
    window.addEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    return () => {
      window.removeEventListener("trigger-cashout", handleTriggerCashout);
      window.removeEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    };
  }, [gameState, multiplier]);

  return (
    <div className="w-full h-full min-h-[260px] sm:min-h-[360px] md:min-h-[600px] bg-sky-900 rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[3rem] border-2 sm:border-4 md:border-8 border-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative flex flex-col items-center overflow-hidden perspective-[1000px]">
      
      {/* 3D Grass Pitch Background */}
      <div 
        className="absolute bottom-0 w-full h-[60%] bg-green-600 transform-style-3d rotate-x-[40deg] origin-bottom shadow-[inset_0_50px_100px_rgba(0,0,0,0.5)]"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 40px, transparent 40px, transparent 80px)`
        }}
      />
      
      {/* Sky Gradient */}
      <div className="absolute top-0 w-full h-[60%] bg-gradient-to-b from-sky-900 via-sky-800 to-sky-700 pointer-events-none" />

      {/* Header */}
      <div className="relative z-20 w-full flex justify-between items-center p-3 sm:p-6 mb-1 sm:mb-4">
        <div className="bg-white/50 backdrop-blur-md px-3 sm:px-6 py-1 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-700/50">
          <h2 className="text-slate-900 font-black text-sm sm:text-xl tracking-widest uppercase drop-shadow-md">Penalty X</h2>
        </div>
        <div className="bg-white/80 backdrop-blur-md px-3 sm:px-6 py-1 sm:py-2 rounded-xl sm:rounded-2xl border border-emerald-500/30 flex flex-col items-end">
          <span className="text-[8px] sm:text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-0.5 sm:mb-1">Multiplier</span>
          <span className="text-lg sm:text-2xl font-mono font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
            {multiplier.toFixed(2)}x
          </span>
        </div>
      </div>

      {/* Scaling Goalpost & Ball Arena */}
      <div className="relative flex-1 w-full max-w-md flex flex-col items-center justify-center scale-[0.75] xs:scale-[0.85] sm:scale-100 origin-center -translate-y-6 sm:translate-y-0">
        
        {/* Goal Post */}
        <div className="relative z-10 w-[250px] xs:w-[300px] md:w-[400px] h-[130px] xs:h-[160px] md:h-[200px] border-[6px] xs:border-[8px] border-white rounded-t-lg flex items-center justify-center bg-black/10">
          {/* Goal Net Illusion */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')] opacity-20 pointer-events-none" />
          
          {/* Goalkeeper */}
          <motion.div 
            animate={{ x: gkPos.x, y: gkPos.y }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
            className="absolute z-20 w-12 xs:w-16 h-20 xs:h-24 bg-yellow-500 rounded-t-[1.5rem] xs:rounded-t-[2rem] rounded-b-md border-2 border-slate-900 shadow-2xl flex flex-col items-center pt-1 xs:pt-2"
          >
            <div className="w-6 xs:w-8 h-6 xs:h-8 bg-pink-300 rounded-full border-2 border-slate-900" />
          </motion.div>

          {/* Interactive Shoot Zones */}
          {gameState === "playing" && (
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-2 p-2 z-30">
              <button onClick={() => handleShoot("TL")} className="bg-white/10 hover:bg-white/30 border border-white/20 rounded transition-colors flex items-center justify-center group"><Target className="w-6 h-6 text-slate-900/50 group-hover:text-slate-900 group-hover:scale-125 transition-all" /></button>
              <div className="bg-transparent" /> {/* Top Middle gap */}
              <button onClick={() => handleShoot("TR")} className="bg-white/10 hover:bg-white/30 border border-white/20 rounded transition-colors flex items-center justify-center group"><Target className="w-6 h-6 text-slate-900/50 group-hover:text-slate-900 group-hover:scale-125 transition-all" /></button>
              <button onClick={() => handleShoot("BL")} className="bg-white/10 hover:bg-white/30 border border-white/20 rounded transition-colors flex items-center justify-center group"><Target className="w-6 h-6 text-slate-900/50 group-hover:text-slate-900 group-hover:scale-125 transition-all" /></button>
              <button onClick={() => handleShoot("C")} className="bg-white/10 hover:bg-white/30 border border-white/20 rounded transition-colors flex items-center justify-center group"><Target className="w-6 h-6 text-slate-900/50 group-hover:text-slate-900 group-hover:scale-125 transition-all" /></button>
              <button onClick={() => handleShoot("BR")} className="bg-white/10 hover:bg-white/30 border border-white/20 rounded transition-colors flex items-center justify-center group"><Target className="w-6 h-6 text-slate-900/50 group-hover:text-slate-900 group-hover:scale-125 transition-all" /></button>
            </div>
          )}
        </div>

        {/* The Ball */}
        <div className="absolute bottom-4 z-40">
          <AnimatePresence>
            {(gameState === "playing" || gameState === "shooting" || gameState === "busted") && (
              <motion.div
                initial={{ scale: 1, y: 100 }}
                animate={{ x: ballPos.x, y: ballPos.y, scale: ballPos.scale }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-10 xs:w-12 h-10 xs:h-12 bg-white rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_-5px_-5px_10px_rgba(0,0,0,0.5)] border-2 border-slate-300 flex items-center justify-center"
                style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, white, #cbd5e1)' }}
              >
                <div className="w-4 h-4 bg-slate-50 rounded-full opacity-50" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Result Overlays */}
      <AnimatePresence>
        {gameState === "busted" && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-sm">
            <div className="bg-rose-600 text-slate-900 font-black text-4xl px-12 py-6 rounded-2xl border-4 border-rose-400 shadow-[0_0_50px_rgba(225,29,72,0.8)] -rotate-6">
              SAVED!
            </div>
          </motion.div>
        )}
        {gameState === "cashed_out" && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-sm">
            <div className="bg-emerald-500 text-slate-900 font-black text-3xl px-12 py-6 rounded-2xl border-4 border-emerald-300 shadow-[0_0_50px_rgba(16,185,129,0.8)] rotate-6 flex flex-col items-center">
              <span>CASHED OUT</span>
              <span className="text-2xl mt-2">{multiplier.toFixed(2)}x</span>
            </div>
          </motion.div>
        )}
        {gameState === "idle" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full border border-slate-700">
              <span className="text-slate-900 font-black tracking-widest uppercase">Place Bet to Shoot</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Cashout Control */}
      <AnimatePresence>
        {gameState === "playing" && multiplier > 1.0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="hidden md:block absolute bottom-8 z-40 w-full max-w-sm px-6"
          >
            <button 
              onClick={handleCashout}
              className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-slate-900 font-black text-xl py-4 rounded-2xl shadow-[0_8px_0_rgba(6,95,70,1),0_15px_20px_rgba(16,185,129,0.5)] active:translate-y-2 active:shadow-[0_0_0_rgba(6,95,70,1),0_5px_10px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-3 border-2 border-emerald-300"
            >
              CASHOUT <Wallet className="w-6 h-6 stroke-[3]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
