"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGameOutcome } from "@/lib/casino-math";

interface SlotEngineBubbleProps {
  isPlaying: boolean;
  theme: any;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function SlotEngineBubble({ isPlaying, theme, onComplete }: SlotEngineBubbleProps) {
  const generateGrid = () => Array(theme.cols).fill(0).map(() => Array(theme.rows).fill(0).map(() => theme.symbols[Math.floor(Math.random() * theme.symbols.length)]));
  
  const [grid, setGrid] = useState<string[][]>(generateGrid());
  const [rising, setRising] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setRising(false);
      return;
    }

    setRising(true);
    const outcome = calculateGameOutcome("SLOTS");
    const won = outcome.isWin;
    const mult = won ? outcome.multiplier : 0;

    const timer = setTimeout(() => {
      const newGrid = generateGrid();
      if (won) {
        const matchingFish = theme.symbols[0];
        newGrid[1][1] = matchingFish;
        newGrid[2][1] = matchingFish;
      }
      setGrid(newGrid);
      setRising(false);
      onCompleteRef.current(mult, won);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isPlaying, theme]);

  return (
    <div className="w-full h-full min-h-[500px] bg-gradient-to-b from-[#0b3c5d] via-[#051f30] to-[#01080d] rounded-3xl border border-teal-500/30 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
      
      {/* Moving bubble backgrounds */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-25">
        <motion.div animate={{ y: [-100, 600] }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} className="absolute left-1/4 w-3 h-3 rounded-full bg-white/40" />
        <motion.div animate={{ y: [-50, 650] }} transition={{ repeat: Infinity, duration: 12, ease: "linear" }} className="absolute right-1/4 w-5 h-5 rounded-full bg-white/30" />
      </div>

      <div className="text-center mb-6 z-10">
        <span className="text-teal-600 font-mono text-xs font-black tracking-widest uppercase">UNDERSEA BUBBLE RISE</span>
      </div>

      <div className="grid gap-4 w-full h-64 md:h-80 relative z-10" style={{ gridTemplateColumns: `repeat(${theme.cols}, minmax(0, 1fr))` }}>
        {grid.map((col, cIdx) => (
          <div key={cIdx} className="flex flex-col justify-around items-center h-full">
            {col.map((sym, rIdx) => (
              <motion.div
                key={rIdx}
                animate={rising ? { 
                  y: [100, -20, 0], 
                  scale: [0.7, 1.1, 1],
                  rotate: [-10, 10, 0] 
                } : { y: 0, scale: 1, rotate: 0 }}
                transition={{ duration: 1.5, delay: cIdx * 0.15 + rIdx * 0.1 }}
                className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400/40 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              >
                {sym}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
