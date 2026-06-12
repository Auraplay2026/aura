"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGameOutcome } from "@/lib/casino-math";
import { useTradingStore } from "@/lib/store";

interface ClassicCrashEngineProps {
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function ClassicCrashEngine({ isPlaying, onComplete }: ClassicCrashEngineProps) {
  const houseEdge = useTradingStore(state => state.houseEdge);
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashed, setCrashed] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setMultiplier(1.0);
      setCrashed(false);
      setPoints([]);
      return;
    }

    // Math-correct Crash win chance (baseline 40% success rate adjusted for houseEdge)
    const winChance = 0.40 * (1 - houseEdge / 100);
    const outcome = calculateGameOutcome("CRASH");
    const target = outcome.multiplier;
    const willWin = outcome.isWin;

    let current = 1.0;
    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      current += 0.01 + (current * 0.012);
      
      const width = containerRef.current?.clientWidth || 500;
      const height = containerRef.current?.clientHeight || 300;
      const x = Math.min(width, (tick / 120) * width);
      const y = Math.min(height, Math.log10(current) * height * 1.5);
      
      setPoints(prev => [...prev, { x, y: height - y }]);

      if (current >= target) {
        clearInterval(interval);
        setMultiplier(target);
        setCrashed(true);
        onCompleteRef.current(target, willWin);
      } else {
        setMultiplier(current);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] bg-slate-50 rounded-3xl border border-slate-200 relative flex flex-col items-center justify-center overflow-hidden shadow-inner">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(234,179,8,0.05)_0%,_transparent_100%)] pointer-events-none" />

      {/* Numerical HUD */}
      <div className="absolute top-10 flex flex-col items-center z-20">
        <span className="text-[10px] text-yellow-500/60 tracking-[0.3em] font-black uppercase mb-1">STAKE MULTIPLIER</span>
        <h1 className={`text-7xl md:text-9xl font-black font-mono tracking-tighter ${crashed ? "text-red-500" : "text-slate-900"}`}>
          {multiplier.toFixed(2)}x
        </h1>
        {crashed && (
          <div className="mt-2 bg-red-100 border border-red-500/20 px-4 py-1 rounded-full text-red-500 font-bold text-xs uppercase tracking-wider animate-pulse">
            💥 crashed @ {multiplier.toFixed(2)}x
          </div>
        )}
      </div>

      {/* SVG Exponential Graph Line */}
      <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
        {points.length > 1 && (
          <path
            d={`M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`}
            fill="none"
            stroke={crashed ? "#ef4444" : "#eab308"}
            strokeWidth="5"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 15px ${crashed ? '#ef4444' : '#eab308'})` }}
          />
        )}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="8"
            fill={crashed ? "#ef4444" : "#ffffff"}
            style={{ filter: "drop-shadow(0 0 10px #ffffff)" }}
          />
        )}
      </svg>
    </div>
  );
}
