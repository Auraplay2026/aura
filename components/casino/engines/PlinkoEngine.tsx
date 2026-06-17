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
  const [ballCount, setBallCount] = useState<1 | 3 | 5 | 10>(1);
  const [balls, setBalls] = useState<{ id: number; pathX: number[]; pathY: number[]; multiplier: number; binIndex: number }[]>([]);
  const [ballId, setBallId] = useState(0);
  const [lastResult, setLastResult] = useState<{ mult: number; won: boolean } | null>(null);
  const [activePegs, setActivePegs] = useState<Record<string, number>>({});
  const [activeBucketIndex, setActiveBucketIndex] = useState<number | null>(null);
  
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
    dropMultipleBalls();
  }, [isPlaying, risk, ballCount]);

  const dropMultipleBalls = () => {
    const totalBalls = ballCount;
    const completedResults: number[] = [];
    let firstBallWon = false;

    for (let i = 0; i < totalBalls; i++) {
      setTimeout(() => {
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
        for (let idx = bounces.length - 1; idx > 0; idx--) {
          const j = Math.floor(Math.random() * (idx + 1));
          [bounces[idx], bounces[j]] = [bounces[j], bounces[idx]];
        }

        let posX = 0;
        const pathX = [0];
        const pathY = [0];
        const pathXIndexAtRow: number[] = [0];

        // Non-uniform spacing for acceleration simulating gravity
        for (let idx = 0; idx < bounces.length; idx++) {
          posX += bounces[idx];
          const wobble = (Math.random() * 4 - 2); // +/- 2px wobble
          pathX.push(posX * 18 + wobble);
          pathXIndexAtRow.push(posX);

          const gap = 20 + (idx + 1) * 3.2;
          const prevY = pathY[pathY.length - 1];
          pathY.push(prevY + gap);
        }

        const multiplier = MULTIPLIERS[risk][targetBinIndex];
        const currentBallId = ballId + i;
        const newBall = { id: currentBallId, pathX, pathY, multiplier, binIndex: targetBinIndex };

        setBalls(prev => [...prev, newBall]);

        // Sync sound effects & peg glows
        for (let r = 0; r < ROWS; r++) {
          const pegCol = (r + 2 + pathXIndexAtRow[r]) / 2;
          setTimeout(() => {
            playGameSound('tick');
            const pegKey = `${r}-${Math.round(pegCol)}`;
            setActivePegs(prev => ({ ...prev, [pegKey]: (prev[pegKey] || 0) + 1 }));
            setTimeout(() => {
              setActivePegs(prev => ({ ...prev, [pegKey]: Math.max(0, (prev[pegKey] || 1) - 1) }));
            }, 150);
          }, r * 200);
        }

        const animDuration = ROWS * 200;
        setTimeout(() => {
          setActiveBucketIndex(targetBinIndex);
          setTimeout(() => setActiveBucketIndex(null), 300);

          setBalls(prev => prev.filter(b => b.id !== newBall.id));
          completedResults.push(multiplier);

          if (i === 0) {
            firstBallWon = multiplier >= 1.5;
          }

          if (completedResults.length === totalBalls) {
            const sum = completedResults.reduce((a, b) => a + b, 0);
            const averageMultiplier = sum / totalBalls;
            setLastResult({ mult: averageMultiplier, won: firstBallWon });
            onCompleteRef.current(firstBallWon ? averageMultiplier : 0, firstBallWon);
          }
        }, animDuration + 200);

      }, i * 150);
    }

    setBallId(prev => prev + totalBalls);
  };

  const multColor = (m: number) => {
    if (m >= 10) return "from-red-500 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.8)] border-red-400 text-white";
    if (m >= 2)  return "from-orange-500 to-amber-500 shadow-[0_0_15px_rgba(249,115,22,0.6)] border-orange-400 text-white";
    if (m >= 1)  return "from-yellow-500 to-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)] border-yellow-300 text-slate-900";
    return "from-slate-700 to-slate-800 shadow-inner border-slate-600 text-slate-400";
  };

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] bg-slate-950 rounded-3xl border border-slate-800 p-4 relative overflow-hidden flex flex-col shadow-2xl">
      
      {/* Outer Lane Vignette */}
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
      <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Risk Selector */}
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

          {/* Ball Count Selector */}
          <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
            {[1, 3, 5, 10].map(count => (
              <button
                key={count}
                disabled={isPlaying}
                onClick={() => setBallCount(count as 1 | 3 | 5 | 10)}
                className={`px-3 py-2 rounded-lg text-xs font-black transition-all duration-300 ${
                  ballCount === count
                    ? "bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.6)]"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                {count} {count === 1 ? "Ball" : "Balls"}
              </button>
            ))}
          </div>
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
              {Array.from({ length: rIndex + 3 }).map((_, pIndex) => {
                const isPegActive = (activePegs[`${rIndex}-${pIndex}`] || 0) > 0;
                return (
                  <div key={pIndex} className="w-9 h-3 flex items-center justify-center relative">
                    <div className={`w-3 h-3 rounded-full transition-all duration-100 z-20 ${
                      isPegActive 
                        ? "bg-indigo-355 bg-indigo-200 shadow-[0_0_12px_rgba(99,102,241,1),0_0_4px_rgba(255,255,255,1)] scale-125 border-indigo-200" 
                        : isPlaying
                          ? "bg-slate-500 shadow-[0_0_6px_rgba(99,102,241,0.5)] border-slate-400" 
                          : "bg-slate-700 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.8),0_2px_5px_rgba(255,255,255,0.1)] border-slate-600"
                    }`} />
                    {isPegActive && (
                      <div className="absolute inset-0 bg-indigo-500/40 blur-md rounded-full animate-ping pointer-events-none" />
                    )}
                  </div>
                );
              })}
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
                  duration: ROWS * 0.2, 
                  ease: [0.25, 0.1, 0.25, 1],
                  times: Array.from({ length: ball.pathX.length }, (_, i) => i / (ball.pathX.length - 1))
                }}
                className="absolute top-0 left-1/2 -ml-3.5 z-30 pointer-events-none filter drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)]"
              >
                {/* Blur Trail / Comet Effect */}
                <div className="absolute inset-0 w-7 h-7 rounded-full bg-pink-500/20 blur-sm -z-10 animate-pulse" />
                <div className="w-7 h-7 rounded-full bg-[radial-gradient(circle_at_30%_30%,_#f472b6,_#c084fc,_#8b5cf6)] shadow-[0_0_25px_rgba(236,72,153,1),0_0_10px_rgba(139,92,246,0.8),inset_0_2px_4px_rgba(255,255,255,0.9)] border border-pink-300" />
                
                {/* Trail particles */}
                <motion.div 
                  initial={{ opacity: 0.6, scale: 1 }}
                  animate={{ opacity: 0, scale: 0.2, y: -15 }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                  className="absolute left-1/2 -ml-1 top-6 w-2 h-2 rounded-full bg-pink-400 blur-[1px]"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Multiplier Buckets */}
        <div className="flex justify-center gap-1 mt-6 w-full max-w-[550px] relative z-40 transform-style-3d rotate-x-[10deg]">
          {MULTIPLIERS[risk].map((mult, i) => {
            const isBouncing = activeBucketIndex === i;
            return (
              <motion.div
                key={i}
                animate={isBouncing ? { scale: [1, 1.15, 1.05, 1], y: [0, 8, 4, 0] } : { scale: 1, y: 0 }}
                transition={isBouncing ? { duration: 0.3, ease: "easeInOut" } : {}}
                className={`flex-1 h-12 flex items-center justify-center rounded-lg font-black text-[10px] md:text-xs bg-gradient-to-b border transition-all duration-300 relative ${multColor(mult)} ${isBouncing ? 'brightness-150 z-50 shadow-[0_0_25px_rgba(251,191,36,0.8)] border-yellow-300' : 'z-10'}`}
              >
                {mult}x
                
                {/* Expanding Fountain/Ripple Splash on Active Bucket */}
                {isBouncing && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-8 h-12 pointer-events-none overflow-visible z-50 flex items-end justify-center">
                    <div className={`w-1 bg-gradient-to-t rounded-full animate-[particle-fade_0.6s_ease-out] ${
                      mult >= 10 ? "from-yellow-400 to-transparent h-16 w-3" : 
                      mult >= 2 ? "from-orange-500 to-transparent h-12 w-2" : "from-blue-500 to-transparent h-8 w-1"
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
