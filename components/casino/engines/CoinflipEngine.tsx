"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { calculateGameOutcome } from "@/lib/casino-math";
import { playGameSound } from "@/lib/audio";

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

    // Play spin sound immediately
    playGameSound("spin");

    // Play decelerating click-ticks to simulate physics deceleration audio cues
    let tickDelay = 60;
    let isActive = true;
    const playTickSequence = () => {
      if (!isActive) return;
      playGameSound("tick");
      tickDelay = tickDelay * 1.25;
      if (tickDelay < 450) {
        setTimeout(playTickSequence, tickDelay);
      }
    };
    setTimeout(playTickSequence, tickDelay);

    const outcome = calculateGameOutcome("ORIGINAL");
    const won = outcome.isWin;
    
    // Land on selection on win, opposite on loss
    const finalResult = won ? selectedSide : (selectedSide === "AURA" ? "SKULL" : "AURA");

    const extraSpins = 1800 + (finalResult === "AURA" ? 0 : 180);
    setRotationX(prev => prev + extraSpins);

    const timer = setTimeout(() => {
      isActive = false;
      setResult(finalResult);
      setFlipping(false);
      setLanded(true);
      
      // Play win or lose sound on landing
      playGameSound(won ? "win" : "lose");
      
      onCompleteRef.current(2.0, won);
    }, 2500);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [isPlaying, selectedSide]);

  return (
    <div className="w-full h-full min-h-[300px] h-[340px] md:min-h-[600px] md:h-full bg-gradient-to-br from-sky-50 via-white to-yellow-50/60 rounded-3xl border border-slate-200/80 p-4 md:p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)]">
      
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

      <div className="h-44 md:h-64 flex items-center justify-center relative z-10 select-none perspective-[1000px]">
        {/* Ambient base glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-500/20 rounded-full blur-[50px] pointer-events-none" />

        {/* Realistic 3D floor shadow */}
        <motion.div 
          className="absolute w-28 h-28 md:w-36 md:h-36 bg-black/25 rounded-full blur-xl pointer-events-none"
          animate={
            flipping 
              ? { 
                  scale: [0.8, 0.45, 0.95, 0.8],
                  opacity: [0.5, 0.15, 0.65, 0.5],
                  y: 40
                }
              : landed
                ? {
                    scale: 0.9,
                    opacity: 0.5,
                    y: 35
                  }
                : { 
                    scale: 1, 
                    opacity: 0.5,
                    y: 35
                  }
          }
          transition={
            flipping 
              ? { duration: 2.5, ease: [0.15, 0.85, 0.3, 1] }
              : { duration: 0.5 }
          }
          style={{ transform: "rotateX(75deg)" }}
        />
        
        {/* Landed Win Glow Halos and Particle Sparks */}
        <AnimatePresence>
          {result && !flipping && (
            <>
              {/* Outer Glow Halo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ 
                  opacity: [0.5, 0.9, 0.5], 
                  scale: [1, 1.3, 1],
                  transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                }}
                exit={{ opacity: 0 }}
                className={cn(
                  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 md:w-52 md:h-52 rounded-full blur-[40px] md:blur-[50px] pointer-events-none z-0",
                  result === "AURA" ? "bg-amber-400/45" : "bg-cyan-500/35"
                )}
              />
              {/* Shockwave expanding ring */}
              <motion.div
                initial={{ opacity: 1, scale: 0.8 }}
                animate={{ opacity: 0, scale: 1.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn(
                  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 md:w-40 md:h-40 rounded-full border-4 pointer-events-none z-20",
                  result === "AURA" ? "border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.6)]" : "border-cyan-400/80 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                )}
              />
              {/* Subtle spark particles */}
              <motion.div
                initial={{ opacity: 1, scale: 0.5 }}
                animate={{ opacity: 0, scale: 1.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 pointer-events-none z-20"
              >
                {[...Array(6)].map((_, i) => {
                  const angle = (i * 360) / 6;
                  return (
                    <motion.div
                      key={i}
                      className={cn(
                        "absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full",
                        result === "AURA" ? "bg-amber-400" : "bg-cyan-400"
                      )}
                      style={{
                        x: "-50%",
                        y: "-50%",
                      }}
                      animate={{
                        x: [0, Math.cos((angle * Math.PI) / 180) * 80],
                        y: [0, Math.sin((angle * Math.PI) / 180) * 80],
                      }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        <motion.div
          animate={
            flipping 
              ? { 
                  rotateX: rotationX, 
                  rotateY: [0, 25, -20, 18, -15, 12, -8, 5, -2, 0],
                  rotateZ: [0, 12, -8, 10, -6, 5, -3, 2, -1, 0],
                  y: [-20, -180, -80, -120, -40, 0], 
                  scale: [1, 1.35, 1.15, 1.25, 0.95, 1] 
                }
              : landed 
                ? { 
                    rotateX: result === "AURA" ? 0 : 180, 
                    rotateY: [15, -10, 6, -3, 0],
                    rotateZ: [8, -5, 3, -1, 0],
                    y: [0, -15, 0], 
                    scale: [1, 1.08, 1] 
                  }
                : { 
                    rotateX: selectedSide === "AURA" ? 0 : 180, 
                    rotateY: 0,
                    rotateZ: 0,
                    y: 0, 
                    scale: 1 
                  }
          }
          transition={
            flipping 
              ? { 
                  duration: 2.5,
                  rotateX: { duration: 2.5, ease: [0.15, 0.85, 0.3, 1] },
                  rotateY: { duration: 2.5, ease: "easeInOut" },
                  rotateZ: { duration: 2.5, ease: "easeInOut" },
                  y: { duration: 2.5, ease: [0.25, 0.46, 0.45, 0.94] },
                  scale: { duration: 2.5, ease: "easeInOut" }
                }
              : landed
                ? { 
                    duration: 0.8,
                    rotateX: { duration: 0.3, ease: "easeOut" },
                    rotateY: { duration: 0.8, ease: "easeOut" },
                    rotateZ: { duration: 0.8, ease: "easeOut" },
                    y: { duration: 0.5, ease: "easeOut" },
                    scale: { duration: 0.4, ease: "easeOut" }
                  }
                : { duration: 0.5, type: "spring", stiffness: 100 }
          }
          className="w-28 h-28 md:w-40 md:h-40 relative font-black"
          style={{ transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d" }}
        >
          {/* 3D Reeded Edge Stack representing coin body thickness */}
          {[-3, -2, -1, 0, 1, 2, 3].map((z) => (
            <div
              key={z}
              className="absolute inset-0 rounded-full bg-[repeating-conic-gradient(from_0deg,#d97706_0deg_4deg,#78350f_4deg_8deg)]"
              style={{ transform: `translateZ(${z}px)` }}
            />
          ))}

          {/* Side A (AURA) - Gold Coin Face */}
          <div 
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#fffbeb_0%,#fef08a_25%,#eab308_60%,#ca8a04_85%,#854d0e_100%)] border-[8px] border-amber-500 shadow-[inset_0_4px_12px_rgba(0,0,0,0.4),0_8px_20px_rgba(0,0,0,0.25)]" 
            style={{ 
              backfaceVisibility: "hidden", 
              WebkitBackfaceVisibility: "hidden", 
              transform: "rotateX(0deg) translateZ(4px)",
              display: (!flipping && (result ? result !== "AURA" : selectedSide !== "AURA")) ? "none" : "flex"
            }}
          >
            {/* Elegant embossed background letter */}
            <div className="absolute inset-0 flex items-center justify-center text-[110px] font-serif font-extrabold text-yellow-600/10 select-none pointer-events-none">A</div>

            {/* Inner rotating detail ring */}
            <div className="absolute inset-2 rounded-full border-2 border-yellow-600/30 border-dotted animate-spin-slow opacity-60 pointer-events-none" />
            
            {/* Crown Crest */}
            <svg className="w-10 h-10 md:w-16 md:h-16 text-yellow-950 drop-shadow-[0_3px_5px_rgba(133,77,14,0.4)] z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" fill="currentColor" opacity="0.15" />
              <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
              <path d="M3 20h18" strokeWidth="2.5" />
              <circle cx="12" cy="4" r="1" fill="currentColor" />
              <circle cx="2" cy="4" r="1" fill="currentColor" />
              <circle cx="22" cy="4" r="1" fill="currentColor" />
            </svg>
            <span className="text-[9px] md:text-[11px] text-yellow-950 font-black tracking-[0.3em] mt-2 md:mt-3 uppercase drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)] z-10">AURA</span>

            {/* Specular Glare highlight sheen */}
            <motion.div 
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none z-20"
              animate={flipping ? { x: ["-100%", "100%"] } : landed ? { x: ["-100%", "100%"], transition: { duration: 1.2, ease: "easeOut" } } : { x: "-100%" }}
              transition={flipping ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}
            />
          </div>

          {/* Side B (SKULL) - Midnight Obsidian Coin Face */}
          <div 
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#1e293b_0%,#0f172a_50%,#020617_90%,#000000_100%)] border-[8px] border-slate-200 shadow-[inset_0_4px_12px_rgba(0,0,0,0.8),0_8px_20px_rgba(0,0,0,0.25)]"
            style={{ 
              backfaceVisibility: "hidden", 
              WebkitBackfaceVisibility: "hidden", 
              transform: "rotateX(180deg) translateZ(4px)",
              display: (!flipping && (result ? result !== "SKULL" : selectedSide !== "SKULL")) ? "none" : "flex"
            }}
          >
            {/* Elegant embossed background letter */}
            <div className="absolute inset-0 flex items-center justify-center text-[110px] font-serif font-extrabold text-slate-800/15 select-none pointer-events-none">S</div>

            {/* Inner counter-rotating detail ring */}
            <div className="absolute inset-2 rounded-full border-2 border-dashed animate-[spin_6s_linear_infinite_reverse] opacity-50 pointer-events-none" style={{ borderColor: "rgba(0, 240, 255, 0.25)" }} />
            
            {/* Skull SVG with teal accents */}
            <svg className="w-10 h-10 md:w-16 md:h-16 z-10" style={{ color: "#00f0ff", filter: "drop-shadow(0 0 8px rgba(0, 240, 255, 0.6))" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10a8 8 0 0 1 16 0c0 2-.5 3.5-1.5 5l-.5 2v3a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-3l-.5-2C4.5 13.5 4 12 4 10z" fill="rgba(0, 240, 255, 0.08)" />
              <circle cx="8.5" cy="10.5" r="2.5" fill="currentColor" stroke="none" className="animate-pulse" />
              <circle cx="15.5" cy="10.5" r="2.5" fill="currentColor" stroke="none" className="animate-pulse" />
              <path d="M12 12.5l-1 1.5h2z" fill="currentColor" stroke="none" />
              <path d="M8 17h8" strokeWidth="1.5" />
              <path d="M9.5 17v3M12 17v3M14.5 17v3" strokeWidth="1.5" />
            </svg>
            <span className="text-[9px] md:text-[11px] font-black tracking-[0.3em] mt-2 md:mt-3 uppercase z-10" style={{ color: "#00f0ff", filter: "drop-shadow(0 1px 4px rgba(0, 240, 255, 0.5))" }}>SKULL</span>

            {/* Specular Glare highlight sheen */}
            <motion.div 
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none z-20"
              animate={flipping ? { x: ["-100%", "100%"] } : landed ? { x: ["-100%", "100%"], transition: { duration: 1.2, ease: "easeOut" } } : { x: "-100%" }}
              transition={flipping ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}
            />
          </div>
        </motion.div>
      </div>

      {/* Side Selector */}
      <div className="mt-4 md:mt-8 flex gap-4 z-20">
        <button
          disabled={flipping}
          onClick={() => setSelectedSide("AURA")}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-200 border-2 cursor-pointer ${
            selectedSide === "AURA"
              ? "bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 text-yellow-950 border-yellow-250 shadow-[0_4px_12px_rgba(234,179,8,0.25)] scale-105"
              : "bg-white text-slate-600 border-slate-200/80 hover:border-amber-400/40 hover:text-slate-800"
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
              ? "bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-950 text-slate-900 border-slate-200 shadow-[0_4px_12px_rgba(0,240,255,0.25)] scale-105"
              : "bg-white text-slate-600 border-slate-200/80 hover:border-teal-400/40 hover:text-slate-800"
          }`}
        >
          {/* Miniature Silver/Charcoal Coin Preview */}
          <div 
            className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-700 to-slate-950 border shadow-sm flex items-center justify-center scale-95"
            style={{ borderColor: "#00f0ff" }}
          >
            <svg 
              className="w-3 h-3" 
              style={{ color: "#00f0ff" }}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
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
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="mt-8 px-10 py-4.5 rounded-2xl text-center border border-slate-200/80 bg-white/90 shadow-[0_12px_36px_rgba(0,0,0,0.08)] backdrop-blur-md flex items-center gap-4 relative overflow-hidden z-20"
          >
            {/* Ambient background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100 to-transparent translate-x-[-100%] animate-[shimmer_2.5s_infinite]" />

            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm",
              result === 'AURA' 
                ? 'bg-amber-100 border-amber-200 text-amber-600' 
                : 'bg-teal-100 border-teal-200 text-teal-600'
            )}>
              {result === 'AURA' ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a8 8 0 0 0-8 8c0 1.89.62 3.63 1.67 5.04L5 19a2 2 0 0 0 1.74 2.96h10.52A2 2 0 0 0 19 19l-.67-3.96c1.05-1.41 1.67-3.15 1.67-5.04a8 8 0 0 0-8-8z"/>
                  <circle cx="9" cy="11" r="1" fill="currentColor"/>
                  <circle cx="15" cy="11" r="1" fill="currentColor"/>
                </svg>
              )}
            </div>
            
            <div className="text-left select-none">
              <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest block">WINNING SIDE</span>
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-xl font-black tracking-widest uppercase font-mono",
                  result === 'AURA' ? 'text-amber-600' : 'text-teal-600'
                )}>
                  {result}
                </span>
                <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
                  2.0x
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
