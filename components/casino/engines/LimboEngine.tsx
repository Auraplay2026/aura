"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Target, TrendingUp } from "lucide-react";
import { useTradingStore } from "@/lib/store";

interface LimboEngineProps {
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function LimboEngine({ isPlaying, onComplete }: LimboEngineProps) {
  const houseEdge = useTradingStore(state => state.houseEdge);
  const [targetMultiplier, setTargetMultiplier] = useState(2.00);
  const [liveCounter, setLiveCounter] = useState(1.00);
  const [result, setResult] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "counting" | "reveal">("idle");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setLiveCounter(1.00);
      setResult(null);
      setPhase("idle");
      return;
    }

    setPhase("counting");
    setResult(null);
    setLiveCounter(1.00);

    // Math-correct Limbo probability: P(win) = (1 - houseEdge/100) / targetMultiplier
    const winChance = (1 - houseEdge / 100) / targetMultiplier;
    const willWin = Math.random() < winChance;
    const finalResult = willWin
      ? parseFloat((targetMultiplier + Math.random() * 5).toFixed(2))
      : parseFloat((Math.random() * (targetMultiplier - 1.01) + 1.00).toFixed(2));

    let current = 1.00;
    const step = (finalResult - 1.00) / 30;
    const interval = setInterval(() => {
      current = Math.min(current + step, finalResult);
      setLiveCounter(parseFloat(current.toFixed(2)));
      if (current >= finalResult) {
        clearInterval(interval);
        setResult(finalResult);
        setPhase("reveal");
        const won = finalResult >= targetMultiplier;
        setTimeout(() => onCompleteRef.current(won ? finalResult : 0, won), 800);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const isWin = result !== null && result >= targetMultiplier;
  const winChance = targetMultiplier <= 1 ? 99 : (99 / targetMultiplier).toFixed(2);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 relative p-6">
      {/* Deep space background */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#000510] via-[#050a1f] to-[#000510]" />
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, rgba(6,182,212,0.1) 0%, transparent 40%)`
          }}
        />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Target multiplier selector */}
      <div className="relative z-10 flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-3">
        <Target className="w-5 h-5 text-cyan-400" />
        <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Target</span>
        <input
          type="number"
          step="0.01"
          min="1.01"
          value={targetMultiplier}
          onChange={(e) => setTargetMultiplier(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
          disabled={isPlaying}
          className="w-24 bg-transparent text-white font-black text-lg text-right focus:outline-none disabled:opacity-50"
        />
        <span className="text-cyan-400 font-black text-lg">x</span>
        <span className="text-slate-500 text-xs font-bold ml-2">{winChance}% chance</span>
      </div>

      {/* Main counter display */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <motion.div
          key={`${phase}-${result}`}
          animate={
            phase === "reveal"
              ? isWin
                ? { scale: [1, 1.15, 1], filter: ["drop-shadow(0 0 0px transparent)", "drop-shadow(0 0 60px rgba(34,197,94,0.8))", "drop-shadow(0 0 30px rgba(34,197,94,0.5))"] }
                : { scale: [1, 0.95, 1], filter: ["drop-shadow(0 0 0px transparent)", "drop-shadow(0 0 60px rgba(239,68,68,0.8))", "drop-shadow(0 0 20px rgba(239,68,68,0.3))"] }
              : {}
          }
          transition={{ duration: 0.5 }}
          className={`text-[6rem] md:text-[9rem] font-black font-mono tabular-nums tracking-tighter leading-none transition-colors duration-300 ${
            phase === "idle" ? "text-slate-600" :
            phase === "counting" ? "text-white" :
            isWin ? "text-neon-green" : "text-red-500"
          }`}
        >
          {(phase === "idle" ? 1.00 : liveCounter).toFixed(2)}
          <span className="text-3xl md:text-5xl text-cyan-400 ml-2">x</span>
        </motion.div>

        {/* Target indicator line */}
        <div className="flex items-center gap-3">
          <div className={`h-0.5 w-16 rounded-full transition-colors duration-300 ${
            phase === "reveal" && isWin ? "bg-neon-green shadow-[0_0_10px_rgba(34,197,94,0.8)]" :
            phase === "reveal" ? "bg-red-500" : "bg-white/20"
          }`} />
          <span className={`text-sm font-black uppercase tracking-widest transition-colors duration-300 ${
            phase === "reveal" && isWin ? "text-neon-green" :
            phase === "reveal" ? "text-red-400" : "text-slate-500"
          }`}>
            {phase === "idle" ? "Awaiting roll..." :
             phase === "counting" ? "Calculating..." :
             isWin ? `✓ Above ${targetMultiplier}x — WIN!` : `✗ Below ${targetMultiplier}x — BUST`}
          </span>
          <div className={`h-0.5 w-16 rounded-full transition-colors duration-300 ${
            phase === "reveal" && isWin ? "bg-neon-green shadow-[0_0_10px_rgba(34,197,94,0.8)]" :
            phase === "reveal" ? "bg-red-500" : "bg-white/20"
          }`} />
        </div>
      </div>

      {/* History dots */}
      <div className="relative z-10 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-slate-600" />
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${i === 7 && phase === "reveal" ? (isWin ? "bg-neon-green shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500") : "bg-slate-800"}`}
          />
        ))}
        <Zap className="w-4 h-4 text-slate-600" />
      </div>
    </div>
  );
}
