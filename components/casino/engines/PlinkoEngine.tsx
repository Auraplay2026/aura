"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTradingStore } from "@/lib/store";
import { playGameSound } from "@/lib/audio";

interface PlinkoEngineProps {
  isPlaying: boolean;
  betAmount?: number;
  onComplete: (multiplier: number, won: boolean) => void;
}

type Risk = "low" | "medium" | "high";
const ROWS = 10;
const MULTIPLIERS: Record<Risk, number[]> = {
  low:    [5.6, 2.1, 1.1, 1.0, 0.5, 0.5, 0.5, 1.0, 1.1, 2.1, 5.6],
  medium: [13.0, 3.0, 1.5, 0.8, 0.4, 0.4, 0.4, 0.8, 1.5, 3.0, 13.0],
  high:   [76.0, 10.0, 2.5, 0.3, 0.2, 0.2, 0.2, 0.3, 2.5, 10.0, 76.0],
};

export function PlinkoEngine({ isPlaying, betAmount = 100, onComplete }: PlinkoEngineProps) {
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

  const dropMultipleBalls = async () => {
    const totalBalls = ballCount;
    const completedResults: number[] = [];
    let firstBallWon = false;

    const ballOutcomes: { multiplier: number; targetBinIndex: number }[] = [];

    try {
      const email = useTradingStore.getState().currentUser?.email || "admin@aurabet.io";
      const singleBallBet = betAmount / totalBalls;

      for (let i = 0; i < totalBalls; i++) {
        const res = await fetch('/api/casino/bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            gameId: "orig-3",
            gameTitle: "Plinko",
            betAmount: singleBallBet,
            selectedTarget: risk
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          ballOutcomes.push({
            multiplier: data.multiplier,
            targetBinIndex: data.targetBinIndex !== undefined ? data.targetBinIndex : 5
          });
        } else {
          const targetBin = Math.floor(Math.random() * (ROWS + 1));
          ballOutcomes.push({
            multiplier: MULTIPLIERS[risk][targetBin],
            targetBinIndex: targetBin
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch Plinko server wagers", err);
      for (let i = 0; i < totalBalls; i++) {
        const targetBin = Math.floor(Math.random() * (ROWS + 1));
        ballOutcomes.push({
          multiplier: MULTIPLIERS[risk][targetBin],
          targetBinIndex: targetBin
        });
      }
    }

    for (let i = 0; i < totalBalls; i++) {
      setTimeout(() => {
        const outcome = ballOutcomes[i];
        const targetBinIndex = outcome.targetBinIndex;

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

        for (let idx = 0; idx < bounces.length; idx++) {
          posX += bounces[idx];
          const wobble = (Math.random() * 4 - 2);
          pathX.push(posX * 18 + wobble);
          pathXIndexAtRow.push(posX);

          const gap = 20 + (idx + 1) * 3.2;
          const prevY = pathY[pathY.length - 1];
          pathY.push(prevY + gap);
        }

        const multiplier = outcome.multiplier;
        const currentBallId = ballId + i;
        const newBall = { id: currentBallId, pathX, pathY, multiplier, binIndex: targetBinIndex };

        setBalls(prev => [...prev, newBall]);

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
            setLastResult({ mult: averageMultiplier, won: averageMultiplier >= 1.0 });
            onCompleteRef.current(averageMultiplier, averageMultiplier > 0);
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
    <div className="w-full h-full min-h-[400px] md:min-h-[600px] bg-slate-950 rounded-3xl border border-slate-800 p-4 relative overflow-hidden flex flex-col shadow-2xl">
      
      {balls.some(b => b.binIndex === 0 || b.binIndex === 1 || b.binIndex === 9 || b.binIndex === 10) && (
        <div className="absolute inset-0 border-[6px] border-amber-500/40 rounded-3xl pointer-events-none z-30 animate-[heartbeat-glow_1.5s_infinite_ease-in-out]" />
      )}

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

      <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center justify-center gap-3">
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

      <div className="relative flex-1 flex items-center justify-center min-h-[280px]">
        <div className="relative w-full max-w-[420px] aspect-[4/5] flex items-center justify-center">
          
          <svg className="absolute inset-0 w-full h-full z-0 overflow-visible pointer-events-none opacity-40">
            {Array.from({ length: ROWS }).map((_, rIdx) => {
              const pegCount = rIdx + 3;
              const rowY = 40 + rIdx * 25;
              return Array.from({ length: pegCount }).map((__, pIdx) => {
                const pegX = 210 + (pIdx - (pegCount - 1) / 2) * 26;
                const pegKey = `${rIdx}-${pIdx}`;
                const isLit = activePegs[pegKey] > 0;
                return (
                  <circle
                    key={pegKey}
                    cx={pegX}
                    cy={rowY}
                    r={isLit ? 4.5 : 3}
                    fill={isLit ? "#a5b4fc" : "#475569"}
                    className={`transition-all duration-75 ${
                      isLit ? "shadow-[0_0_8px_rgba(165,180,252,0.8)] filter brightness-200" : ""
                    }`}
                  />
                );
              });
            })}
          </svg>

          <AnimatePresence>
            {balls.map(ball => (
              <motion.div
                key={ball.id}
                initial={{ x: 210 - 14, y: 10, opacity: 0, scale: 0.5 }}
                animate={{
                  x: ball.pathX.map(px => px + 210 - 14),
                  y: ball.pathY.map(py => py + 40),
                  opacity: 1,
                  scale: 1
                }}
                transition={{
                  type: "tween",
                  ease: [0.25, 0.1, 0.25, 1],
                  duration: ROWS * 0.2
                }}
                className="absolute w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 shadow-[0_0_12px_rgba(236,72,153,0.7),inset_0_2px_4px_rgba(255,255,255,0.6)] z-20 flex items-center justify-center"
              >
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full blur-[0.5px]" />
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="absolute bottom-4 left-0 right-0 h-10 flex gap-1 z-10">
            {MULTIPLIERS[risk].map((m, idx) => {
              const isActive = activeBucketIndex === idx;
              return (
                <motion.div
                  key={idx}
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    y: isActive ? -5 : 0
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 12 }}
                  className={`flex-1 rounded-lg bg-gradient-to-b ${multColor(m)} border flex items-center justify-center text-[9px] font-black font-mono shadow-md select-none`}
                >
                  {m < 1 ? m.toFixed(1) : m.toString()}
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>

    </div>
  );
}
