"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SlotEngineCascadeProps {
  isPlaying: boolean;
  theme: any;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function SlotEngineCascade({ isPlaying, theme, onComplete }: SlotEngineCascadeProps) {
  const generateGrid = () => Array(theme.cols).fill(0).map(() => Array(theme.rows).fill(0).map(() => theme.symbols[Math.floor(Math.random() * theme.symbols.length)]));
  
  const [grid, setGrid] = useState<string[][]>(generateGrid());
  const [cascading, setCascading] = useState(false);
  const [winSymbols, setWinSymbols] = useState<number[][]>([]); // Indices of winning blocks

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setCascading(false);
      setWinSymbols([]);
      return;
    }

    setCascading(true);
    setWinSymbols([]);

    const won = Math.random() < 0.35;
    const mult = won ? 4.0 : 0;

    // Simulate falling elements in sequence
    const timer = setTimeout(() => {
      const newGrid = generateGrid();
      if (won) {
        // Create 3 matching elements at [0,1], [1,1], [2,1]
        const match = theme.symbols[0];
        newGrid[0][1] = match;
        newGrid[1][1] = match;
        newGrid[2][1] = match;
        setWinSymbols([[0,1], [1,1], [2,1]]);
      }
      setGrid(newGrid);
      setCascading(false);

      setTimeout(() => {
        onCompleteRef.current(mult, won);
      }, 1000);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isPlaying, theme]);

  return (
    <div className={`w-full bg-slate-950/90 border-4 border-fuchsia-500/40 rounded-3xl p-6 shadow-[0_0_80px_rgba(217,70,239,0.2)] relative flex flex-col items-center justify-center`}>
      
      {/* Header Info */}
      <div className="text-center mb-4">
        <span className="text-fuchsia-400 font-mono text-xs font-black tracking-widest uppercase">CLUSTER CASCADE MATRIX</span>
      </div>

      <div className="grid gap-2 w-full h-80 relative" style={{ gridTemplateColumns: `repeat(${theme.cols}, minmax(0, 1fr))` }}>
        {grid.map((col, cIdx) => (
          <div key={cIdx} className="flex flex-col gap-2 justify-end h-full">
            {col.map((sym, rIdx) => {
              const isMatch = winSymbols.some(([cx, rx]) => cx === cIdx && rx === rIdx);
              return (
                <motion.div
                  key={rIdx}
                  initial={{ y: -400, opacity: 0 }}
                  animate={cascading ? { y: [-400, 0], opacity: [0, 1] } : { y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: cIdx * 0.1 }}
                  className={`h-12 md:h-16 rounded-xl flex items-center justify-center text-3xl md:text-4xl shadow-inner relative border
                    ${isMatch 
                      ? "bg-fuchsia-500/30 border-fuchsia-400 animate-pulse shadow-[0_0_20px_rgba(217,70,239,0.5)] scale-110" 
                      : "bg-slate-900/60 border-white/5"
                    }`}
                >
                  {sym}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
