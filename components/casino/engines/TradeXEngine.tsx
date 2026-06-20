"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { calculateGameOutcome } from "@/lib/casino-math";

interface TradeXEngineProps {
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function TradeXEngine({ isPlaying, onComplete }: TradeXEngineProps) {
  const [dataPoints, setDataPoints] = useState<number[]>(Array(20).fill(50));
  const [gameState, setGameState] = useState<"idle" | "waiting_choice" | "resolving">("idle");
  const [choice, setChoice] = useState<"UP" | "DOWN" | null>(null);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Idle chart movement
  useEffect(() => {
    if (gameState === "resolving") return;
    const interval = setInterval(() => {
      setDataPoints(prev => {
        const next = [...prev.slice(1)];
        // Random walk
        const last = next[next.length - 1];
        const shift = (Math.random() - 0.5) * 10;
        let val = last + shift;
        if (val > 90) val = 90;
        if (val < 10) val = 10;
        next.push(val);
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    if (isPlaying && gameState === "idle") {
      setGameState("waiting_choice");
      setChoice(null);
    } else if (!isPlaying) {
      setGameState("idle");
      setChoice(null);
    }
  }, [isPlaying, gameState]);

  const handleChoice = (selected: "UP" | "DOWN") => {
    if (gameState !== "waiting_choice") return;
    setChoice(selected);
    setGameState("resolving");

    // Get outcome from math engine
    const outcome = calculateGameOutcome("ORIGINAL"); // 20% win
    const won = outcome.isWin;
    const multiplier = won ? 2.0 : 0; // Standard 2x for binary options

    // Animate the chart spike
    const targetDirection = won ? selected : (selected === "UP" ? "DOWN" : "UP");
    
    let ticks = 0;
    const resolveInterval = setInterval(() => {
      ticks++;
      setDataPoints(prev => {
        const next = [...prev.slice(1)];
        const last = next[next.length - 1];
        // Force the chart in the target direction rapidly
        const shift = targetDirection === "UP" ? (Math.random() * 15 + 5) : -(Math.random() * 15 + 5);
        next.push(last + shift);
        return next;
      });

      if (ticks > 15) {
        clearInterval(resolveInterval);
        setTimeout(() => {
          onCompleteRef.current(multiplier, won);
        }, 1000);
      }
    }, 100);
  };

  // Convert data points to SVG path
  const maxData = 100;
  const svgWidth = 800;
  const svgHeight = 300;
  
  const points = dataPoints.map((val, i) => {
    const x = (i / (dataPoints.length - 1)) * svgWidth;
    const y = svgHeight - (val / maxData) * svgHeight;
    return `${x},${y}`;
  }).join(" L ");

  const pathD = `M ${points}`;
  const fillPathD = `M ${points} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`;

  const isUpTrend = dataPoints[dataPoints.length - 1] > dataPoints[dataPoints.length - 2];

  return (
    <div className="w-full h-full min-h-[300px] h-[340px] md:min-h-[600px] md:h-full bg-[#020617] rounded-3xl border border-slate-800 shadow-2xl relative flex flex-col p-3 md:p-8 overflow-hidden">
      
      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-center mb-3 md:mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isUpTrend ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
            <Activity className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-slate-100 font-black text-lg md:text-xl tracking-widest uppercase">TradeX</h2>
            <p className="text-slate-550 text-[10px] md:text-xs font-mono">BTC/USD Binary Options</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-0.5 md:mb-1">Live Price</p>
          <p className={`font-mono font-black text-lg md:text-2xl drop-shadow-md ${isUpTrend ? "text-emerald-400" : "text-rose-400"}`}>
            ${(50000 + dataPoints[dataPoints.length - 1] * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative flex-1 w-full bg-[#0f172a]/50 rounded-2xl border border-slate-800 shadow-inner overflow-hidden flex items-end">
        {/* Fill Gradient */}
        <svg className="absolute inset-0 w-full h-full preserve-3d" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradientUp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(52,211,153,0.5)" />
              <stop offset="100%" stopColor="rgba(52,211,153,0)" />
            </linearGradient>
            <linearGradient id="chartGradientDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(244,63,94,0.5)" />
              <stop offset="100%" stopColor="rgba(244,63,94,0)" />
            </linearGradient>
          </defs>
          <motion.path 
            d={fillPathD} 
            fill={`url(#${isUpTrend ? "chartGradientUp" : "chartGradientDown"})`} 
            transition={{ duration: 0.2, ease: "linear" }}
          />
          <motion.path 
            d={pathD} 
            fill="none" 
            stroke={isUpTrend ? "#34d399" : "#f43f5e"} 
            strokeWidth="4" 
            className="drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]"
            transition={{ duration: 0.2, ease: "linear" }}
          />
        </svg>

        {/* Current Price Dot */}
        <motion.div 
          className={`absolute w-4 h-4 rounded-full ${isUpTrend ? "bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)]" : "bg-rose-400 shadow-[0_0_20px_rgba(244,63,94,1)]"} -translate-x-1/2 -translate-y-1/2`}
          style={{ right: '0%', bottom: `${(dataPoints[dataPoints.length - 1] / maxData) * 100}%` }}
          animate={{ bottom: `${(dataPoints[dataPoints.length - 1] / maxData) * 100}%` }}
          transition={{ duration: 0.2, ease: "linear" }}
        >
          <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-50" />
        </motion.div>
      </div>

      {/* Manual Interactive Controls */}
      <AnimatePresence>
        {gameState === "waiting_choice" && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute inset-x-8 bottom-8 flex gap-4 z-20"
          >
            <button 
              onClick={() => handleChoice("UP")}
              className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-emerald-950 font-black text-xl md:text-2xl py-6 rounded-2xl shadow-[0_10px_0_rgba(6,95,70,1),0_20px_30px_rgba(52,211,153,0.5)] active:translate-y-2 active:shadow-[0_2px_0_rgba(6,95,70,1),0_10px_10px_rgba(52,211,153,0.5)] transition-all flex flex-col items-center justify-center gap-2 border-2 border-emerald-200"
            >
              <TrendingUp className="w-8 h-8" /> PUMP (2x)
            </button>
            <button 
              onClick={() => handleChoice("DOWN")}
              className="flex-1 bg-gradient-to-t from-rose-600 to-rose-400 hover:from-rose-500 hover:to-rose-300 text-rose-950 font-black text-xl md:text-2xl py-6 rounded-2xl shadow-[0_10px_0_rgba(159,18,57,1),0_20px_30px_rgba(244,63,94,0.5)] active:translate-y-2 active:shadow-[0_2px_0_rgba(159,18,57,1),0_10px_10px_rgba(244,63,94,0.5)] transition-all flex flex-col items-center justify-center gap-2 border-2 border-rose-200"
            >
              <TrendingDown className="w-8 h-8" /> DUMP (2x)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resolving State Overlay */}
      <AnimatePresence>
        {gameState === "resolving" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-white/80 backdrop-blur-md px-8 py-3 rounded-full border border-slate-700 shadow-2xl"
          >
            <span className="text-slate-900 font-black tracking-widest uppercase animate-pulse">Resolving Market...</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
