"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTradingStore } from "@/lib/store";

import { calculateGameOutcome } from "@/lib/casino-math";

interface CoinflipEngineProps {
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
  selectedTarget?: string;
  setSelectedTarget?: (t: string) => void;
}

export function CoinflipEngine({ isPlaying, onComplete, selectedTarget, setSelectedTarget }: CoinflipEngineProps) {
  const houseEdge = useTradingStore(state => state.houseEdge);
  const [flipping, setFlipping] = useState(false);
  const [localSide, setLocalSide] = useState<"AURA" | "SKULL">("AURA");
  
  const selectedSide = selectedTarget === "AURA" || selectedTarget === "SKULL" ? (selectedTarget as "AURA" | "SKULL") : localSide;
  const setSelectedSide = (side: "AURA" | "SKULL") => {
    setLocalSide(side);
    if (setSelectedTarget) setSelectedTarget(side);
  };
  const [result, setResult] = useState<"AURA" | "SKULL" | null>(null);
  const [rotationX, setRotationX] = useState(0);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setFlipping(false);
      setResult(null);
      return;
    }

    setFlipping(true);
    const outcome = calculateGameOutcome("ORIGINAL");
    const won = outcome.isWin;
    
    // Land on selection on win, opposite on loss
    const finalResult = won ? selectedSide : (selectedSide === "AURA" ? "SKULL" : "AURA");

    const extraSpins = 1800 + (finalResult === "AURA" ? 0 : 180);
    setRotationX(prev => prev + extraSpins);

    const timer = setTimeout(() => {
      setResult(finalResult);
      setFlipping(false);
      onCompleteRef.current(2.0, won);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isPlaying, selectedSide]);

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] bg-slate-950 rounded-3xl border border-slate-800 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
      
      {/* Deep Space Background / Arena */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      
      {/* Floor grid for depth */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[40%] opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom'
        }}
      />

      <div className="h-64 flex items-center justify-center relative z-10 select-none perspective-[1000px]">
        {/* Glow underneath the coin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-500/30 rounded-full blur-[50px]" />
        
        <motion.div
          animate={flipping ? { 
            rotateX: rotationX,
            y: [-20, -150, -20, 0],
            scale: [1, 1.5, 0.8, 1]
          } : { rotateX: selectedSide === "AURA" ? 0 : 180, y: 0, scale: 1 }}
          transition={{ duration: 2.5, ease: [0.32, 0.72, 0, 1] }}
          className="w-40 h-40 relative font-black drop-shadow-[0_20px_25px_rgba(0,0,0,0.85)]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Side A (AURA) */}
          <div 
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 border-[6px] border-yellow-200 shadow-[inset_0_0_25px_rgba(0,0,0,0.6)]" 
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="absolute inset-2 rounded-full border-2 border-yellow-600/30 border-dashed animate-spin-slow opacity-60" />
            <svg className="w-16 h-16 text-yellow-900 drop-shadow-[0_2px_0_rgba(255,255,255,0.4)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span className="text-[10px] text-yellow-950 font-black tracking-widest mt-2 uppercase drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">AURA</span>
          </div>

          {/* Side B (SKULL) */}
          <div 
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 border-[6px] border-slate-500 shadow-[inset_0_0_25px_rgba(0,0,0,0.8)]"
            style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
          >
            <div className="absolute inset-2 rounded-full border-2 border-slate-600/30 border-dashed animate-[spin_4s_linear_infinite_reverse] opacity-50" />
            <svg className="w-16 h-16 text-slate-200 drop-shadow-[0_0_12px_rgba(244,63,94,0.85)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C7.03 2 3 6.03 3 11c0 2.76 1.25 5.23 3.22 6.88L6 22l4-2 2 1 2-1 4 2-.22-4.12C19.75 16.23 21 13.76 21 11c0-4.97-4.03-9-9-9z" fill="currentColor" fillOpacity="0.15" />
              <circle cx="8.5" cy="11" r="1.75" fill="#f43f5e" className="animate-pulse" stroke="none" />
              <circle cx="15.5" cy="11" r="1.75" fill="#f43f5e" className="animate-pulse" stroke="none" />
              <polygon points="12,13 11,14.5 13,14.5" fill="#0f172a" stroke="none" />
              <path d="M9 17.5h6v1.2H9z" fill="#0f172a" stroke="none" />
              <path d="M10.5 17.5v1.2 M12 17.5v1.2 M13.5 17.5v1.2" stroke="#475569" strokeWidth="1" />
            </svg>
            <span className="text-[10px] text-slate-300 font-black tracking-widest mt-2 uppercase drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]">SKULL</span>
          </div>

          {/* Edge / Thickness Illusion */}
          <div className="absolute inset-0 rounded-full border-[10px] border-black/20 mix-blend-overlay pointer-events-none" />
        </motion.div>
      </div>

      {/* Side Selector */}
      <div className="mt-8 flex gap-4 z-20">
        <button
          disabled={flipping}
          onClick={() => setSelectedSide("AURA")}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-200 border-2 cursor-pointer ${
            selectedSide === "AURA"
              ? "bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 text-yellow-950 border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.4)] scale-105"
              : "bg-slate-900 text-slate-400 border-slate-800 hover:border-yellow-500/30"
          }`}
        >
          {/* Miniature Gold Coin Preview */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 border border-yellow-200 shadow-sm flex items-center justify-center scale-95">
            <svg className="w-2.5 h-2.5 text-yellow-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          Aura
        </button>
        <button
          disabled={flipping}
          onClick={() => setSelectedSide("SKULL")}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-200 border-2 cursor-pointer ${
            selectedSide === "SKULL"
              ? "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 text-slate-950 border-slate-200 shadow-[0_0_15px_rgba(203,213,225,0.4)] scale-105"
              : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-400/30"
          }`}
        >
          {/* Miniature Silver Coin Preview */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 border border-slate-200 shadow-sm flex items-center justify-center scale-95">
            <svg className="w-2.5 h-2.5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="9" cy="11" r="1.5" fill="currentColor" />
              <circle cx="15" cy="11" r="1.5" fill="currentColor" />
            </svg>
          </div>
          Skull
        </button>
      </div>

      {/* Result HUD Overlay */}
      <AnimatePresence>
        {result && !flipping && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`mt-12 px-10 py-4 rounded-2xl text-center border shadow-2xl backdrop-blur-md ${result === 'AURA' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-slate-500/10 border-slate-500/30'}`}
          >
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Landed On</span>
            <p className={`text-4xl font-black mt-1 tracking-wider ${result === 'AURA' ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.5)]'}`}>
              {result}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
