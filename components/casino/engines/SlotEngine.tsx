"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SlotEngineProps {
  isPlaying: boolean;
  isTurbo: boolean;
  theme: any;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function SlotEngine({ isPlaying, isTurbo, theme, onComplete }: SlotEngineProps) {
  const [spinStops, setSpinStops] = useState<boolean[]>(Array(theme.cols).fill(true));
  const generateGrid = () => Array(theme.cols).fill(0).map(() => Array(theme.rows).fill(0).map(() => theme.symbols[Math.floor(Math.random() * theme.symbols.length)]));
  const [reels, setReels] = useState<string[][]>(generateGrid());

  const hasStartedSpin = useRef(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      hasStartedSpin.current = false;
      return;
    }

    // Guard to prevent mid-spin resets if parent re-renders
    if (hasStartedSpin.current) return;
    hasStartedSpin.current = true;

    setSpinStops(Array(theme.cols).fill(false));
    const baseTime = isTurbo ? 400 : 800;
    const staggerTime = isTurbo ? 150 : 300;
    
    // Compute result early (exactly 2% win rate)
    const isWin = Math.random() < 0.02;
    const multiplier = isWin ? (Math.random() > 0.8 ? (Math.floor(Math.random() * 50) + 10) : (Math.floor(Math.random() * 5) + 1)) : 0;
    
    const newReels = generateGrid();
    if (isWin) {
      const winSymbol = theme.symbols[Math.floor(Math.random() * theme.symbols.length)];
      const middleRow = Math.floor(theme.rows / 2);
      for (let c = 0; c < Math.min(4, theme.cols); c++) newReels[c][middleRow] = winSymbol;
    }
    setReels(newReels);

    const timeouts: NodeJS.Timeout[] = [];

    // Staggered Stops
    Array.from({ length: theme.cols }).forEach((_, i) => {
      const t = setTimeout(() => {
        setSpinStops(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, baseTime + (i * staggerTime));
      timeouts.push(t);
    });

    // Finish Spin
    const timer = setTimeout(() => {
      onCompleteRef.current(multiplier, isWin);
    }, baseTime + (theme.cols * staggerTime) + 300);
    timeouts.push(timer);

    return () => timeouts.forEach(clearTimeout);
  }, [isPlaying, isTurbo, theme]);

  return (
    <div className={`w-full bg-white/80 backdrop-blur-2xl border-4 ${theme.borderClass} rounded-3xl p-4 md:p-6 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden`}>
      <div className="grid gap-2 h-64 md:h-96 relative" style={{ gridTemplateColumns: `repeat(${theme.cols}, minmax(0, 1fr))` }}>
        {reels.map((col, cIdx) => (
          <div key={cIdx} className={`${theme.slotBg} rounded-xl overflow-hidden relative border border-slate-200 shadow-inner flex justify-center`}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 z-10 pointer-events-none" />
            
            <motion.div 
              animate={!spinStops[cIdx] ? (theme.animationType === "tumble" ? { y: [-800, 0] } : { y: [0, -1600] }) : { y: 0 }}
              transition={!spinStops[cIdx] 
                ? { repeat: Infinity, duration: isTurbo ? 0.1 : 0.2, ease: "linear" }
                : { type: "spring", stiffness: 400, damping: 15, mass: 1.2 }
              }
              className="h-full w-full flex flex-col justify-around items-center"
            >
              {col.map((sym, rIdx) => (
                <div key={rIdx} className={`text-5xl md:text-7xl lg:text-8xl flex items-center justify-center w-full h-full relative ${!spinStops[cIdx] ? (theme.animationType === "tumble" ? "blur-[2px]" : "blur-[8px] opacity-70 scale-125") : "scale-100"}`}>
                  <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] rounded-2xl opacity-50 m-2 border border-slate-200" />
                  <span className="relative z-10 drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)] filter transition-all duration-300 group-hover:drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                    {sym}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
