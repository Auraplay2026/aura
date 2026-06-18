"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGameOutcome } from "@/lib/casino-math";
import { Zap, Target, TrendingUp } from "lucide-react";
import { useTradingStore } from "@/lib/store";

interface LimboEngineProps {
  isPlaying: boolean;
  betAmount: number;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function LimboEngine({ isPlaying, betAmount, onComplete }: LimboEngineProps) {
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

    let active = true;
    let interval: any = null;

    const executeBet = async () => {
      try {
        const currentUser = useTradingStore.getState().currentUser;
        const res = await fetch('/api/casino/bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUser?.email || "admin@aurabet.io",
            gameId: "orig-2",
            gameTitle: "Limbo",
            betAmount: betAmount,
            targetMultiplier: targetMultiplier
          })
        });
        const data = await res.json();
        if (!active) return;

        if (res.ok && data.success) {
          const finalResult = parseFloat(data.multiplier.toFixed(2));
          let current = 1.00;
          const step = (finalResult - 1.00) / 30;
          
          interval = setInterval(() => {
            current = Math.min(current + step + (current * 0.05), finalResult);
            setLiveCounter(parseFloat(current.toFixed(2)));
            if (current >= finalResult) {
              clearInterval(interval);
              setResult(finalResult);
              setPhase("reveal");
              const won = finalResult >= targetMultiplier;
              setTimeout(() => onCompleteRef.current(won ? finalResult : 0, won), 1000);
            }
          }, 40);
        } else {
          setPhase("idle");
          onCompleteRef.current(0, false);
          alert(data.error || "Wager placement failed.");
        }
      } catch (err) {
        console.error("Limbo bet placement failed", err);
        setPhase("idle");
        onCompleteRef.current(0, false);
      }
    };

    executeBet();

    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, targetMultiplier, betAmount]);

  const isWin = result !== null && result >= targetMultiplier;
  const winChance = targetMultiplier <= 1 ? 99 : (99 / targetMultiplier).toFixed(2);

  // Generate 20 warp lines for the 3D tunnel effect
  const warpLines = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    angle: (360 / 20) * i,
    delay: Math.random() * 2,
    duration: Math.random() * 1 + 0.5
  }));

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] flex flex-col items-center justify-center gap-6 relative p-6 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-black perspective-[1000px]">
      
      {/* 3D Warp Tunnel Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        {/* Deep space glow */}
        <div className={`absolute inset-0 transition-colors duration-700 ${
          phase === 'reveal' && isWin ? 'bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.2)_0%,_#000_100%)]' :
          phase === 'reveal' ? 'bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.2)_0%,_#000_100%)]' :
          'bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.15)_0%,_#000_100%)]'
        }`} />
        
        {/* Warp lines */}
        <div className="absolute w-[200vw] h-[200vw] flex items-center justify-center transform-style-3d">
          {warpLines.map(line => (
            <motion.div
              key={line.id}
              className="absolute origin-center w-full h-[2px] flex justify-end"
              style={{ transform: `rotate(${line.angle}deg)` }}
            >
              <motion.div 
                animate={
                  phase === 'counting' 
                    ? { x: ['0%', '-500%'], scaleX: [1, 5, 1], opacity: [0, 1, 0] } 
                    : phase === 'reveal' 
                      ? { x: '-500%', opacity: 0 } 
                      : { x: ['0%', '-100%'], opacity: [0, 0.5, 0] }
                }
                transition={
                  phase === 'counting'
                    ? { repeat: Infinity, duration: line.duration * 0.3, ease: "linear", delay: line.delay * 0.3 }
                    : { repeat: Infinity, duration: line.duration * 2, ease: "linear", delay: line.delay }
                }
                className={`w-[10%] h-full blur-sm ${
                  phase === 'reveal' && isWin ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]' :
                  phase === 'reveal' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' :
                  'bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]'
                }`}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Target multiplier selector */}
      <div className="relative z-20 flex items-center gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl px-6 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <Target className="w-6 h-6 text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]" />
        <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Target</span>
        <input
          type="number"
          step="0.01"
          min="1.01"
          value={targetMultiplier}
          onChange={(e) => setTargetMultiplier(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
          disabled={isPlaying}
          className="w-28 bg-slate-950/50 border border-slate-800 rounded-lg px-2 py-1 text-white font-black text-xl text-right focus:outline-none focus:border-blue-500 transition-colors shadow-inner disabled:opacity-50"
        />
        <span className="text-blue-400 font-black text-xl drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]">x</span>
        <div className="ml-4 pl-4 border-l border-slate-800 flex flex-col">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Win Chance</span>
          <span className="text-emerald-400 font-mono font-bold">{winChance}%</span>
        </div>
      </div>

      {/* Main counter display */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-[250px] w-full">
        <motion.div
          key={`${phase}-${result}`}
          animate={
            phase === "reveal"
              ? isWin
                ? { scale: [1, 1.2, 1], filter: ["drop-shadow(0 0 0px transparent)", "drop-shadow(0 0 80px rgba(52,211,153,1))", "drop-shadow(0 0 40px rgba(52,211,153,0.5))"] }
                : { scale: [1, 0.9, 1], filter: ["drop-shadow(0 0 0px transparent)", "drop-shadow(0 0 80px rgba(239,68,68,1))", "drop-shadow(0 0 30px rgba(239,68,68,0.5))"] }
              : phase === "counting"
                ? { scale: [1, 1.02, 1], filter: ["drop-shadow(0 0 20px rgba(96,165,250,0))", "drop-shadow(0 0 40px rgba(96,165,250,0.5))", "drop-shadow(0 0 20px rgba(96,165,250,0))"] }
                : {}
          }
          transition={
            phase === "counting" 
              ? { repeat: Infinity, duration: 0.5 } 
              : { duration: 0.6, type: "spring", bounce: 0.5 }
          }
          className={`text-[5rem] md:text-[8rem] lg:text-[10rem] font-black font-mono tabular-nums tracking-tighter leading-none transition-colors duration-300 flex items-baseline ${
            phase === "idle" ? "text-slate-700" :
            phase === "counting" ? "text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" :
            isWin ? "text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.8)]" : "text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]"
          }`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {(phase === "idle" ? 1.00 : liveCounter).toFixed(2)}
          <span className={`text-4xl md:text-6xl ml-2 font-black ${
            phase === 'idle' ? 'text-slate-800' :
            phase === 'counting' ? 'text-blue-500' :
            isWin ? 'text-emerald-500' : 'text-red-700'
          }`}>x</span>
        </motion.div>

        {/* Target indicator line / message */}
        <AnimatePresence>
          {phase === "reveal" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-8 flex items-center justify-center gap-4 w-full"
            >
              <div className={`h-px flex-1 max-w-[100px] bg-gradient-to-r ${isWin ? 'from-transparent to-emerald-500' : 'from-transparent to-red-500'}`} />
              <span className={`text-sm md:text-base font-black uppercase tracking-widest px-4 py-1 rounded-full border bg-slate-900 ${
                isWin ? "text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.3)]" : "text-red-500 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              }`}>
                {isWin ? `TARGET BEATEN` : `CRASHED EARLY`}
              </span>
              <div className={`h-px flex-1 max-w-[100px] bg-gradient-to-l ${isWin ? 'from-transparent to-emerald-500' : 'from-transparent to-red-500'}`} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
