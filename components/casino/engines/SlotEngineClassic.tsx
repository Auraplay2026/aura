"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SlotEngineClassicProps {
  isPlaying: boolean;
  theme: any;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function SlotEngineClassic({ isPlaying, theme, onComplete }: SlotEngineClassicProps) {
  const [leverPulled, setLeverPulled] = useState(false);
  const [reels, setReels] = useState<string[][]>([
    [theme.symbols[0], theme.symbols[1], theme.symbols[2]],
    [theme.symbols[1], theme.symbols[2], theme.symbols[3]],
    [theme.symbols[2], theme.symbols[3], theme.symbols[0]]
  ]);
  const [spinning, setSpinning] = useState([false, false, false]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setLeverPulled(false);
      return;
    }

    setLeverPulled(true);
    setSpinning([true, true, true]);

    const isWin = Math.random() < 0.35;
    const mult = isWin ? 5 : 0;

    const finalReels = [
      [theme.symbols[0], theme.symbols[1], theme.symbols[2]],
      [theme.symbols[0], theme.symbols[1], theme.symbols[2]],
      [theme.symbols[0], theme.symbols[1], theme.symbols[2]]
    ];

    if (!isWin) {
      finalReels[2] = [theme.symbols[3], theme.symbols[4], theme.symbols[1]];
    }

    // Stop reels one by one (mechanical sound/delay)
    const timers = [
      setTimeout(() => {
        setSpinning(s => [false, s[1], s[2]]);
        setReels(prev => [finalReels[0], prev[1], prev[2]]);
      }, 1000),
      setTimeout(() => {
        setSpinning(s => [s[0], false, s[2]]);
        setReels(prev => [prev[0], finalReels[1], prev[2]]);
      }, 1500),
      setTimeout(() => {
        setSpinning(s => [s[0], s[1], false]);
        setReels(prev => [prev[0], prev[1], finalReels[2]]);
        onCompleteRef.current(mult, isWin);
      }, 2000)
    ];

    return () => timers.forEach(clearTimeout);
  }, [isPlaying, theme]);

  return (
    <div className="w-full max-w-lg bg-gradient-to-b from-yellow-700 via-amber-900 to-yellow-950 border-8 border-yellow-500 rounded-[3rem] p-6 relative flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] select-none">
      
      {/* Golden Cabinet Arch Header */}
      <div className="absolute top-4 text-center border border-yellow-400 bg-slate-950/90 px-6 py-1 rounded-full shadow-inner z-10">
        <span className="text-yellow-400 text-xs font-black tracking-[0.3em] uppercase">VINTAGE CABINET</span>
      </div>

      <div className="flex w-full items-center justify-center gap-6 mt-6">
        
        {/* Main Reels Viewport */}
        <div className="flex-1 bg-black rounded-2xl p-4 border-4 border-yellow-600 shadow-inner grid grid-cols-3 gap-3 relative h-64 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black to-transparent z-10" />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black to-transparent z-10" />
          <div className="absolute inset-y-0 left-1/3 w-px bg-yellow-600/30" />
          <div className="absolute inset-y-0 left-2/3 w-px bg-yellow-600/30" />
          
          {reels.map((col, cIdx) => (
            <div key={cIdx} className="flex flex-col justify-around items-center h-full relative">
              <motion.div
                animate={spinning[cIdx] ? { y: [-600, 0] } : { y: 0 }}
                transition={spinning[cIdx] ? { repeat: Infinity, duration: 0.15, ease: "linear" } : { type: "spring", stiffness: 300 }}
                className="flex flex-col gap-4 items-center justify-center"
              >
                {col.map((sym, rIdx) => (
                  <span key={rIdx} className="text-5xl drop-shadow-md">
                    {sym}
                  </span>
                ))}
              </motion.div>
            </div>
          ))}
        </div>

        {/* Physical Mechanical Lever Handle on the side */}
        <div className="w-12 h-64 flex flex-col items-center justify-end relative shrink-0">
          {/* Shaft */}
          <motion.div 
            animate={leverPulled ? { height: ["140px", "60px", "140px"] } : { height: "140px" }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="w-3 bg-gradient-to-r from-slate-400 to-slate-200 border border-slate-500 rounded-full origin-bottom"
          />
          {/* Knob */}
          <motion.div 
            animate={leverPulled ? { y: [0, 80, 0] } : { y: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute top-10 w-10 h-10 rounded-full bg-red-600 border-2 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.7)] flex items-center justify-center cursor-pointer"
          />
          {/* Base */}
          <div className="w-8 h-8 rounded-t-full bg-slate-900 border border-slate-700" />
        </div>

      </div>
    </div>
  );
}
