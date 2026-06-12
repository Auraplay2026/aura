"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGameOutcome } from "@/lib/casino-math";

interface RouletteEngineProps {
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
}

const NUMBERS = [
  { n: 0, color: "bg-green-500", label: "Green" },
  { n: 32, color: "bg-red-500", label: "Red" },
  { n: 15, color: "bg-slate-50", label: "Black" },
  { n: 19, color: "bg-red-500", label: "Red" },
  { n: 4, color: "bg-slate-50", label: "Black" },
  { n: 21, color: "bg-red-500", label: "Red" },
  { n: 2, color: "bg-slate-50", label: "Black" },
  { n: 25, color: "bg-red-500", label: "Red" },
  { n: 17, color: "bg-slate-50", label: "Black" },
  { n: 34, color: "bg-red-500", label: "Red" },
  { n: 6, color: "bg-slate-50", label: "Black" },
  { n: 27, color: "bg-red-500", label: "Red" },
  { n: 13, color: "bg-slate-50", label: "Black" },
  { n: 36, color: "bg-red-500", label: "Red" },
  { n: 11, color: "bg-slate-50", label: "Black" },
  { n: 30, color: "bg-red-500", label: "Red" },
  { n: 8, color: "bg-slate-50", label: "Black" },
  { n: 23, color: "bg-red-500", label: "Red" },
  { n: 10, color: "bg-slate-50", label: "Black" },
  { n: 5, color: "bg-red-500", label: "Red" },
  { n: 24, color: "bg-slate-50", label: "Black" },
  { n: 16, color: "bg-red-500", label: "Red" },
  { n: 33, color: "bg-slate-50", label: "Black" },
  { n: 1, color: "bg-red-500", label: "Red" },
  { n: 20, color: "bg-slate-50", label: "Black" },
  { n: 14, color: "bg-red-500", label: "Red" },
  { n: 31, color: "bg-slate-50", label: "Black" },
  { n: 9, color: "bg-red-500", label: "Red" },
  { n: 22, color: "bg-slate-50", label: "Black" },
  { n: 18, color: "bg-red-500", label: "Red" },
  { n: 29, color: "bg-slate-50", label: "Black" },
  { n: 7, color: "bg-red-500", label: "Red" },
  { n: 28, color: "bg-slate-50", label: "Black" },
  { n: 12, color: "bg-red-500", label: "Red" },
  { n: 35, color: "bg-slate-50", label: "Black" },
  { n: 3, color: "bg-red-500", label: "Red" },
  { n: 26, color: "bg-slate-50", label: "Black" }
];

export function RouletteEngine({ isPlaying, onComplete }: RouletteEngineProps) {
  const [rotation, setRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [winningNumber, setWinningNumber] = useState<typeof NUMBERS[0] | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setIsSpinning(false);
      setWinningNumber(null);
      return;
    }

    setIsSpinning(true);
    const outcome = calculateGameOutcome("TABLE");
    const won = outcome.isWin;
    const targetIdx = won 
      ? Math.floor(Math.random() * (NUMBERS.length - 1)) + 1 // red or black mostly
      : Math.floor(Math.random() * NUMBERS.length);

    const result = NUMBERS[targetIdx];
    const segmentAngle = 360 / NUMBERS.length;
    const finalWheelRotation = 1440 + (360 - (targetIdx * segmentAngle)); // Spin at least 4 full turns
    
    setRotation(finalWheelRotation);
    setBallRotation(-(1440 + 720)); // Counter-spin the ball

    const timer = setTimeout(() => {
      setWinningNumber(result);
      setIsSpinning(false);
      const mult = result.n === 0 ? 35.0 : 2.0; // 35x payout for 0, 2x for Red/Black
      onCompleteRef.current(mult, won);
    }, 4000);

    return () => clearTimeout(timer);
  }, [isPlaying]);

  return (
    <div className="w-full h-full min-h-[500px] bg-gradient-to-br from-emerald-950 via-slate-900 to-black rounded-3xl border border-slate-200 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
      {/* Table Felt Background Details */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.9)_100%)] pointer-events-none" />

      {/* Wheel Area */}
      <div className="relative w-80 h-80 md:w-96 md:h-96 rounded-full border-8 border-amber-300 bg-white flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.8)] select-none">
        
        {/* Outer Gold Ring */}
        <div className="absolute inset-2 rounded-full border-4 border-yellow-600/30" />
        
        {/* Neon Spinning Ring */}
        <motion.div
          animate={isSpinning ? { rotate: rotation } : { rotate: rotation % 360 }}
          transition={{ duration: 4, ease: "easeOut" }}
          className="w-full h-full rounded-full relative overflow-hidden"
        >
          {/* Render Wheel Segments */}
          {NUMBERS.map((num, i) => {
            const angle = (360 / NUMBERS.length) * i;
            return (
              <div
                key={i}
                className="absolute top-0 left-1/2 w-8 h-1/2 origin-bottom -translate-x-1/2 flex flex-col items-center pt-3 pb-2 text-[8px] font-black text-slate-900 font-mono"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <span className={`px-1 rounded-sm ${num.color} shadow-sm border border-slate-200`}>
                  {num.n}
                </span>
                <div className="w-0.5 h-6 bg-yellow-600/20 mt-1 origin-top" />
              </div>
            );
          })}
        </motion.div>

        {/* Center Golden Turret */}
        <div className="absolute w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500 via-amber-700 to-yellow-600 border border-yellow-400 shadow-2xl flex items-center justify-center z-25">
          <div className="w-16 h-16 rounded-full bg-white border border-yellow-600/40 flex items-center justify-center">
            <span className="text-yellow-500 text-xs font-black tracking-widest uppercase">AURA</span>
          </div>
        </div>

        {/* Spinning Ball */}
        {isSpinning && (
          <motion.div
            animate={{ rotate: ballRotation }}
            transition={{ duration: 4, ease: "easeOut" }}
            className="absolute inset-8 rounded-full pointer-events-none z-20"
          >
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border border-slate-300 shadow-[0_0_15px_rgba(255,255,255,1)]" />
          </motion.div>
        )}
      </div>

      {/* Winning Indicator */}
      <AnimatePresence>
        {winningNumber && !isSpinning && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute inset-0 bg-white/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center"
          >
            <span className="text-slate-600 text-xs font-black uppercase tracking-widest mb-2">Winning Slot</span>
            <div className={`w-32 h-32 rounded-3xl ${winningNumber.color} border-4 border-white/20 flex items-center justify-center shadow-2xl`}>
              <span className="text-slate-900 text-6xl font-black font-mono">{winningNumber.n}</span>
            </div>
            <span className="text-slate-900 font-bold text-sm mt-3 uppercase tracking-wider">{winningNumber.label} Winning Spin</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
