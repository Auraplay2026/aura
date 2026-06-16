"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGameOutcome } from "@/lib/casino-math";
import { useTradingStore } from "@/lib/store";
import { playGameSound } from "@/lib/audio";

interface PlinkoEngineProps {
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
}

type Risk = "low" | "medium" | "high";
const ROWS = 10;
const MULTIPLIERS: Record<Risk, number[]> = {
  low:    [5.6, 2.1, 1.1, 1, 0.5, 0.5, 0.5, 1, 1.1, 2.1, 5.6],
  medium: [13, 3, 1.5, 0.8, 0.4, 0.4, 0.4, 0.8, 1.5, 3, 13],
  high:   [76, 10, 2.5, 0.3, 0.2, 0.2, 0.2, 0.3, 2.5, 10, 76],
};

export function PlinkoEngine({ isPlaying, onComplete }: PlinkoEngineProps) {
  const houseEdge = useTradingStore(state => state.houseEdge);
  const [risk, setRisk] = useState<Risk>("medium");
  const [balls, setBalls] = useState<{ id: number; pathX: number[]; pathY: number[]; multiplier: number; binIndex: number }[]>([]);
  const [ballId, setBallId] = useState(0);
  const [lastResult, setLastResult] = useState<{ mult: number; won: boolean } | null>(null);
  const onCompleteRef = useRef(onComplete);
  const hasDroppedRef = useRef(false);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      hasDroppedRef.current = false;
      setLastResult(null);
      return;
    }
    if (hasDroppedRef.current) return;
    hasDroppedRef.current = true;
    dropBall();
  }, [isPlaying, risk]);

  const dropBall = () => {
    const outcome = calculateGameOutcome("ORIGINAL");
    const willWin = outcome.isWin;
    let targetBinIndex: number;

    if (willWin) {
      const winBins = [0, 1, 2, 8, 9, 10];
      targetBinIndex = winBins[Math.floor(Math.random() * winBins.length)];
    } else {
      const loseBins = [3, 4, 5, 6, 7];
      targetBinIndex = loseBins[Math.floor(Math.random() * loseBins.length)];
    }

    const bounces = [
      ...Array(targetBinIndex).fill(1),
      ...Array(ROWS - targetBinIndex).fill(-1)
    ];
    for (let i = bounces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bounces[i], bounces[j]] = [bounces[j], bounces[i]];
    }

    let posX = 0;
    const pathX = [0];
    const pathY = [0];
    
    for (let i = 0; i < bounces.length; i++) {
      posX += bounces[i];
      // Multiply by peg spacing for precise coordinates
      pathX.push(posX * 18); 
      pathY.push((i + 1) * 36);
    }

    const multiplier = MULTIPLIERS[risk][targetBinIndex];
    const newBall = { id: ballId, pathX, pathY, multiplier, binIndex: targetBinIndex };
    setBalls(prev => [...prev, newBall]);
    setBallId(prev => prev + 1);

    // Play synchronized tick sounds for peg collisions
    for (let r = 1; r <= ROWS; r++) {
      setTimeout(() => {
        playGameSound('tick');
      }, r * 250);
    }

    const animDuration = ROWS * 250;
    setTimeout(() => {
      setBalls(prev => prev.filter(b => b.id !== newBall.id));
      const won = multiplier >= 1.5;
      setLastResult({ mult: multiplier, won });
      onCompleteRef.current(won ? multiplier : 0, won);
    }, animDuration + 300);
  };

  const multColor = (m: number) => {
    if (m >= 10) return "from-red-500 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.8)] border-red-400 text-white";
    if (m >= 2)  return "from-orange-500 to-amber-500 shadow-[0_0_15px_rgba(249,115,22,0.6)] border-orange-400 text-white";
    if (m >= 1)  return "from-yellow-500 to-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)] border-yellow-300 text-slate-900";
    return "from-slate-700 to-slate-800 shadow-inner border-slate-600 text-slate-400";
  };

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] bg-slate-950 rounded-3xl border border-slate-800 p-4 relative overflow-hidden flex flex-col shadow-2xl">
      
      {/* Outer Lane Tension Vignette */}
      {balls.some(b => b.binIndex === 0 || b.binIndex === 1 || b.binIndex === 9 || b.binIndex === 10) && (
        <div className="absolute inset-0 border-[6px] border-amber-500/40 rounded-3xl pointer-events-none z-30 animate-[heartbeat-glow_1.5s_infinite_ease-in-out]" />
      )}

      {/* 3D Deep Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.4) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          transform: 'perspective(1000px) rotateX(45deg) scale(2)',
          transformOrigin: 'top'
        }}
      />

      {/* Header UI */}
      <div className="relative z-20 flex items-center justify-between mb-8">
        <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
          {(["low", "medium", "high"] as Risk[]).map(r => (
            <button
              key={r}
              disabled={isPlaying}
              onClick={() => setRisk(r)}
              className={`px-4 py-2 rounded-lg text-xs font-black capitalize transition-all duration-300 ${
                risk === r
                  ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className={`px-6 py-2 rounded-xl text-lg font-black border ${
                lastResult.won ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "bg-red-500/10 text-red-500 border-red-500/30"
              }`}
            >
              {lastResult.mult.toFixed(2)}x
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The 3D Board */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end pb-12 perspective-[1000px]">
        
        {/* Board Container */}
        <div className="relative w-full max-w-[500px] aspect-[4/3] flex flex-col items-center">
          
          {/* Pegs */}
          {Array.from({ length: ROWS }).map((_, rIndex) => (
            <div key={rIndex} className="flex justify-center" style={{ marginTop: rIndex === 0 ? 0 : '24px' }}>
              {Array.from({ length: rIndex + 3 }).map((_, pIndex) => (
                <div key={pIndex} className="w-9 h-3 flex items-center justify-center relative">
                  <div className={`w-3 h-3 rounded-full bg-slate-700 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.8),0_2px_5px_rgba(255,255,255,0.1)] border border-slate-600 z-20 transition-all duration-100 ${isPlaying ? "shadow-[0_0_8px_rgba(99,102,241,0.4)] border-slate-500" : ""}`} />
                  <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full opacity-0 transition-opacity duration-100 hover:opacity-100" />
                </div>
              ))}
            </div>
          ))}

          {/* Balls */}
          <AnimatePresence>
            {balls.map(ball => (
              <motion.div
                key={ball.id}
                initial={{ x: 0, y: -20, scale: 0 }}
                animate={{ 
                  x: ball.pathX, 
                  y: ball.pathY,
                  scale: 1 
                }}
                transition={{ 
                  duration: ROWS * 0.25, 
                  ease: "linear",
                  times: Array.from({ length: ball.pathX.length }, (_, i) => i / (ball.pathX.length - 1))
                }}
                className="absolute top-0 left-1/2 -ml-3 z-30 pointer-events-none filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
              >
                {/* Comet Trail */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: [1, 2, 0] }}
                  transition={{ duration: ROWS * 0.25 }}
                  className="absolute -top-10 left-1/2 -ml-1 w-2 h-10 bg-gradient-to-t from-pink-500 to-transparent blur-sm rounded-full"
                />
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 shadow-[0_0_20px_rgba(236,72,153,1),inset_0_2px_4px_rgba(255,255,255,0.8)] border border-pink-300" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Multiplier Buckets */}
        <div className="flex justify-center gap-1 mt-6 w-full max-w-[550px] relative z-40 transform-style-3d rotate-x-[10deg]">
          {MULTIPLIERS[risk].map((mult, i) => {
            const isActive = balls.some(b => b.binIndex === i && b.pathY.length === ROWS + 1);
            return (
              <motion.div
                key={i}
                animate={isActive ? { y: 10, scale: 1.1 } : { y: 0, scale: 1 }}
                className={`flex-1 h-12 flex items-center justify-center rounded-lg font-black text-[10px] md:text-xs bg-gradient-to-b border transition-all duration-300 relative ${multColor(mult)} ${isActive ? 'brightness-150 z-50' : 'z-10'}`}
              >
                {mult}x
                {/* Expanding Fountain/Ripple Splash on Active Bucket */}
                {isActive && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-8 h-12 pointer-events-none overflow-visible z-50 flex items-end justify-center">
                    <div className={`w-1 bg-gradient-to-t rounded-full animate-[particle-fade_0.6s_ease-out] ${
                      mult >= 10 ? "from-yellow-400 to-transparent h-16 w-3" : 
                      mult >= 2 ? "from-orange-450 to-transparent h-12 w-2" : "from-blue-450 to-transparent h-8 w-1"
                    }`} />
                    <div className="absolute inset-x-0 bottom-0 h-4 bg-white/20 rounded-full animate-ping" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
