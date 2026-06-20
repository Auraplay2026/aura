"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
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
  const [landed, setLanded] = useState(false);
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
      setLanded(false);
      return;
    }

    setFlipping(true);
    setLanded(false);
    const outcome = calculateGameOutcome("ORIGINAL");
    const won = outcome.isWin;
    
    // Land on selection on win, opposite on loss
    const finalResult = won ? selectedSide : (selectedSide === "AURA" ? "SKULL" : "AURA");

    const extraSpins = 1800 + (finalResult === "AURA" ? 0 : 180);
    setRotationX(prev => prev + extraSpins);

    const timer = setTimeout(() => {
      setResult(finalResult);
      setFlipping(false);
      setLanded(true);
      onCompleteRef.current(2.0, won);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isPlaying, selectedSide]);

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] bg-gradient-to-br from-sky-50 via-white to-yellow-50/60 rounded-3xl border border-slate-200/80 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)]">
      
      {/* Soft Sky Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(186,230,253,0.3),transparent_60%)] pointer-events-none" />
      
      {/* Floor grid for depth */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[40%] opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(14,165,233,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.2) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom'
        }}
      />

      <div className="h-64 flex items-center justify-center relative z-10 select-none perspective-[1000px]">
        {/* Ambient base glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-500/20 rounded-full blur-[50px]" />
        
        {/* Landed Win Glow Halos */}
        <AnimatePresence>
          {result && !flipping && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: [0.4, 0.8, 0.4], 
                scale: [1, 1.25, 1],
                transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
              }}
              exit={{ opacity: 0 }}
              className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[40px] pointer-events-none z-0",
                result === "AURA" ? "bg-amber-400/40" : "bg-rose-500/30"
              )}
            />
          )}
        </AnimatePresence>
        
        <motion.div
          animate={
            flipping 
              ? { rotateX: rotationX, y: [-20, -150, -20, 0], scale: [1, 1.5, 0.8, 1] }
              : landed 
                ? { rotateX: result === "AURA" ? 0 : 180, y: [0, -20, 0], scale: [1, 1.12, 1] }
                : { rotateX: selectedSide === "AURA" ? 0 : 180, y: 0, scale: 1 }
          }
          transition={
            flipping 
              ? { duration: 2.5, ease: [0.32, 0.72, 0, 1] }
              : landed
                ? { duration: 0.6, ease: "easeOut" }
                : { duration: 0.5, type: "spring", stiffness: 100 }
          }
          className="w-40 h-40 relative font-black drop-shadow-[0_25px_30px_rgba(0,0,0,0.4)]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Side A (AURA) - Gold Coin Face */}
          <div 
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#fef08a_0%,#eab308_60%,#ca8a04_100%)] border-[8px] border-amber-400 shadow-[inset_0_0_20px_rgba(0,0,0,0.5),0_8px_20px_rgba(0,0,0,0.4)]" 
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="absolute inset-2 rounded-full border-2 border-yellow-600/30 border-dotted animate-spin-slow opacity-60" />
            <svg className="w-16 h-16 text-amber-950 drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span className="text-[10px] text-amber-950 font-black tracking-[0.25em] mt-3 uppercase drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">AURA</span>
          </div>

          {/* Side B (SKULL) - Midnight Obsidian Coin Face with matching Gold Rim */}
          <div 
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#3f3f46_0%,#18181b_70%,#09090b_100%)] border-[8px] border-amber-400 shadow-[inset_0_0_20px_rgba(0,0,0,0.6),0_8px_20px_rgba(0,0,0,0.4)]"
            style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
          >
            <div className="absolute inset-2 rounded-full border-2 border-rose-500/20 border-dashed animate-[spin_4s_linear_infinite_reverse] opacity-50" />
            <svg className="w-16 h-16 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8c0 1.89.62 3.63 1.67 5.04L5 19a2 2 0 0 0 1.74 2.96h10.52A2 2 0 0 0 19 19l-.67-3.96c1.05-1.41 1.67-3.15 1.67-5.04a8 8 0 0 0-8-8z" fill="rgba(244,63,94,0.08)" />
              <circle cx="8.5" cy="11" r="2" fill="#f43f5e" className="animate-pulse" stroke="none" />
              <circle cx="15.5" cy="11" r="2" fill="#f43f5e" className="animate-pulse" stroke="none" />
              <polygon points="12,13 11,14.5 13,14.5" fill="#f43f5e" stroke="none" />
              <path d="M9 17.5h6" stroke="#f43f5e" strokeWidth="1.5" />
              <path d="M10.5 17.5v2.5M12 17.5v2.5M13.5 17.5v2.5" stroke="#f43f5e" strokeWidth="1.5" />
            </svg>
            <span className="text-[10px] text-rose-400 font-black tracking-[0.25em] mt-3 uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">SKULL</span>
          </div>

          {/* Reeded coin edge effect */}
          <div className="absolute inset-0 rounded-full border-[10px] border-amber-500/10 mix-blend-overlay pointer-events-none z-30" />
          <div className="absolute inset-0 rounded-full border-[2px] border-white/20 pointer-events-none z-30" />
        </motion.div>
      </div>

      {/* Side Selector */}
      <div className="mt-8 flex gap-4 z-20">
        <button
          disabled={flipping}
          onClick={() => setSelectedSide("AURA")}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-200 border-2 cursor-pointer ${
            selectedSide === "AURA"
              ? "bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 text-yellow-950 border-yellow-250 shadow-[0_4px_12px_rgba(234,179,8,0.25)] scale-105"
              : "bg-white text-slate-555 border-slate-200/80 hover:border-amber-400/40 hover:text-slate-800"
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
              ? "bg-gradient-to-br from-slate-700 via-slate-800 to-zinc-900 text-slate-100 border-slate-600 shadow-[0_4px_12px_rgba(39,39,42,0.25)] scale-105"
              : "bg-white text-slate-555 border-slate-200/80 hover:border-rose-400/40 hover:text-slate-800"
          }`}
        >
          {/* Miniature Silver/Charcoal Coin Preview */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 border border-slate-200 shadow-sm flex items-center justify-center scale-95">
            <svg className="w-3.5 h-3.5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8c0 1.89.62 3.63 1.67 5.04L5 19a2 2 0 0 0 1.74 2.96h10.52A2 2 0 0 0 19 19l-.67-3.96c1.05-1.41 1.67-3.15 1.67-5.04a8 8 0 0 0-8-8z"/>
              <circle cx="9" cy="11" r="1" fill="currentColor"/>
              <circle cx="15" cy="11" r="1" fill="currentColor"/>
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
            className={cn(
              "mt-8 px-8 py-3.5 rounded-2xl text-center border shadow-xl backdrop-blur-md flex items-center gap-3 relative overflow-hidden",
              result === 'AURA' 
                ? 'bg-amber-500/5 border-amber-500/20 text-amber-900 shadow-amber-500/5' 
                : 'bg-rose-500/5 border-rose-500/20 text-rose-700 shadow-rose-500/5'
            )}
          >
            {/* Ambient background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />

            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center border",
              result === 'AURA' ? 'bg-amber-500/10 border-amber-500/25 text-amber-600' : 'bg-rose-500/10 border-rose-500/25 text-rose-500'
            )}>
              {result === 'AURA' ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a8 8 0 0 0-8 8c0 1.89.62 3.63 1.67 5.04L5 19a2 2 0 0 0 1.74 2.96h10.52A2 2 0 0 0 19 19l-.67-3.96c1.05-1.41 1.67-3.15 1.67-5.04a8 8 0 0 0-8-8z"/>
                  <circle cx="9" cy="11" r="1" fill="currentColor"/>
                  <circle cx="15" cy="11" r="1" fill="currentColor"/>
                </svg>
              )}
            </div>
            
            <div className="text-left">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Result</span>
              <span className={cn(
                "text-lg font-black tracking-widest uppercase font-mono",
                result === 'AURA' ? 'text-amber-600' : 'text-rose-500'
              )}>
                {result}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
