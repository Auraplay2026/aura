"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGameOutcome } from "@/lib/casino-math";
import { useTradingStore } from "@/lib/store";

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
  const [balls, setBalls] = useState<{ id: number; xKeyframes: number[]; multiplier: number; binIndex: number }[]>([]);
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
    // Math-correct Plinko winning rate adjusted for houseEdge (baseline 50% for outer win bins)
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

    let pos = 0;
    const xKeyframes = [0];
    for (const dir of bounces) {
      pos += dir;
      xKeyframes.push(pos * 20);
    }

    const multiplier = MULTIPLIERS[risk][targetBinIndex];
    const newBall = { id: ballId, xKeyframes, multiplier, binIndex: targetBinIndex };
    setBalls(prev => [...prev, newBall]);
    setBallId(prev => prev + 1);

    const animDuration = 2200;
    setTimeout(() => {
      setBalls(prev => prev.filter(b => b.id !== newBall.id));
      const won = multiplier >= 1.5;
      setLastResult({ mult: multiplier, won });
      onCompleteRef.current(won ? multiplier : 0, won);
    }, animDuration + 300);
  };

  const multColor = (m: number) => {
    if (m >= 10) return "from-red-500 to-red-600 shadow-[0_0_12px_rgba(239,68,68,0.6)]";
    if (m >= 2)  return "from-orange-500 to-amber-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]";
    if (m >= 1)  return "from-yellow-500 to-yellow-400";
    return "from-slate-600 to-slate-700 opacity-60";
  };

  return (
    <div className="w-full h-full flex flex-col gap-3 p-3 md:p-5 relative">
      {/* Neon stadium background */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#02060f] via-[#050b1a] to-[#010308]" />
        <div className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse at 50% -20%, rgba(59,130,246,0.2) 0%, transparent 60%),
                              radial-gradient(circle at 80% 80%, rgba(168,85,247,0.1) 0%, transparent 40%)`
          }}
        />
        {/* vertical neon lines */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(99,102,241,0.5) 40px, rgba(99,102,241,0.5) 41px)`,
          }}
        />
      </div>

      {/* Risk selector */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-black uppercase tracking-widest">Risk Level</span>
        <div className="flex gap-2">
          {(["low", "medium", "high"] as Risk[]).map(r => (
            <button
              key={r}
              onClick={() => setRisk(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black capitalize transition-all ${
                risk === r
                  ? "bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                  : "bg-slate-900/5 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-blue-500/30"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {lastResult && (
            <motion.div
              key={`${lastResult.mult}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black ${
                lastResult.won ? "bg-neon-green/10 text-neon-green border border-neon-green/30" : "bg-red-500/10 text-red-600 border border-red-500/30"
              }`}
            >
              Last: {lastResult.mult}x
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Plinko board */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between">
        {/* Pegs */}
        <div className="w-full max-w-[420px] flex flex-col justify-between gap-2 flex-1 relative pb-2">
          {Array.from({ length: ROWS }).map((_, rIdx) => {
            const pegsInRow = 3 + rIdx;
            return (
              <div key={rIdx} className="flex justify-center gap-5 md:gap-6 w-full">
                {Array.from({ length: pegsInRow }).map((_, pIdx) => (
                  <div
                    key={pIdx}
                    className="w-2 h-2 rounded-full bg-blue-400/30 border border-blue-400/50 shadow-[0_0_6px_rgba(59,130,246,0.4)]"
                  />
                ))}
              </div>
            );
          })}

          {/* Falling balls */}
          <AnimatePresence>
            {balls.map(ball => (
              <motion.div
                key={ball.id}
                initial={{ x: 0, y: "-5%" }}
                animate={{
                  x: ball.xKeyframes,
                  y: ball.xKeyframes.map((_, i) => `${(i / ball.xKeyframes.length) * 95}%`)
                }}
                transition={{ duration: 2.2, ease: "easeIn", times: ball.xKeyframes.map((_, i) => i / ball.xKeyframes.length) }}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-white/30 shadow-[0_0_15px_rgba(168,85,247,0.8)] z-20"
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Multiplier bins */}
        <div className="w-full max-w-[420px] flex gap-1">
          {MULTIPLIERS[risk].map((mult, i) => (
            <div
              key={i}
              className={`flex-1 h-7 rounded-md flex items-center justify-center text-[10px] font-black text-slate-900 bg-gradient-to-b ${multColor(mult)}`}
            >
              {mult >= 10 ? `${mult}x` : `${mult}x`}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
