"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGameOutcome } from "@/lib/casino-math";

interface RouletteEngineProps {
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
}

const NUMBERS = [
  { n: 0, color: "bg-emerald-500 text-white border-emerald-400", label: "Green" },
  { n: 32, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 15, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 19, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 4, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 21, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 2, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 25, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 17, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 34, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 6, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 27, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 13, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 36, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 11, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 30, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 8, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 23, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 10, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 5, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 24, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 16, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 33, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 1, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 20, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 14, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 31, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 9, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 22, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 18, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 29, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 7, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 28, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 12, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 35, color: "bg-white text-slate-900 border-slate-350", label: "Black" },
  { n: 3, color: "bg-red-600 text-white border-red-500", label: "Red" },
  { n: 26, color: "bg-white text-slate-900 border-slate-350", label: "Black" }
];

export function RouletteEngine({ isPlaying, onComplete }: RouletteEngineProps) {
  const [rotation, setRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [ballRadiusOffset, setBallRadiusOffset] = useState(0);
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
      setBallRadiusOffset(0);
      return;
    }

    setIsSpinning(true);
    setWinningNumber(null);
    setBallRadiusOffset(30); // Ball starts far out on the rim

    const outcome = calculateGameOutcome("TABLE");
    const won = outcome.isWin;
    const targetIdx = won 
      ? Math.floor(Math.random() * (NUMBERS.length - 1)) + 1 // red or black mostly
      : Math.floor(Math.random() * NUMBERS.length);

    const result = NUMBERS[targetIdx];
    const segmentAngle = 360 / NUMBERS.length;
    const finalWheelRotation = 1440 + (360 - (targetIdx * segmentAngle)); // Spin at least 4 full turns
    
    setRotation(finalWheelRotation);
    setBallRotation(-(1800 + 720)); // Counter-spin the ball very fast

    // Gradually drop the ball in towards the center over 4 seconds
    setTimeout(() => {
      setBallRadiusOffset(0); // Drops into pocket
    }, 2500);

    const timer = setTimeout(() => {
      setWinningNumber(result);
      setIsSpinning(false);
      const mult = result.n === 0 ? 35.0 : 2.0;
      onCompleteRef.current(mult, won);
    }, 4500);

    return () => clearTimeout(timer);
  }, [isPlaying]);

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] bg-gradient-to-br from-amber-50/60 via-white to-slate-50 rounded-3xl border border-amber-200/60 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)]">
      
      {/* Subtle warm radial glow - casino felt feel */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* 3D Wheel Area */}
      <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center select-none perspective-[1200px]">
        
        {/* Glow behind wheel */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-amber-500/10 rounded-full blur-[50px] pointer-events-none" />

        {/* The Rotated Wheel Assembly */}
        <div 
          className="relative w-[90%] h-[90%] rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.8)] transform-style-3d"
          style={{ transform: "rotateX(60deg)" }}
        >
          {/* Wooden Rim (Outer edge illusion) */}
          <div className="absolute -inset-6 rounded-full border-[12px] border-amber-900 shadow-[inset_0_5px_20px_rgba(0,0,0,0.8)] bg-amber-800 flex items-center justify-center">
            {/* Inner gold track */}
            <div className="absolute inset-2 rounded-full border-4 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]" />
          </div>
          
          {/* Neon Spinning Wheel Base */}
          <motion.div
            animate={isSpinning ? { rotate: rotation } : { rotate: rotation % 360 }}
            transition={{ duration: 4.5, ease: [0.25, 1, 0.5, 1] }}
            className="absolute inset-0 rounded-full bg-white border-[8px] border-amber-600 overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.9)]"
          >
            {/* Render Wheel Segments */}
            {NUMBERS.map((num, i) => {
              const angle = (360 / NUMBERS.length) * i;
              return (
                <div
                  key={i}
                  className="absolute top-0 left-1/2 w-10 h-1/2 origin-bottom -translate-x-1/2 flex flex-col items-center pt-1"
                  style={{ transform: `rotate(${angle}deg)` }}
                >
                  {/* Pocket Slot */}
                  <div className={`w-8 h-10 flex items-start justify-center pt-2 rounded-sm border ${num.color} shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]`}>
                    <span className="text-[10px] md:text-xs font-black font-mono">
                      {num.n}
                    </span>
                  </div>
                  {/* Separator Line */}
                  <div className="w-[1px] h-full bg-yellow-600/30 origin-top shadow-[1px_0_0_rgba(0,0,0,0.5)]" />
                </div>
              );
            })}
            
            {/* Center Golden Turret / Cone */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-gradient-to-br from-yellow-300 via-amber-600 to-yellow-700 shadow-[0_0_30px_rgba(0,0,0,1)] flex items-center justify-center z-20">
              <div className="w-16 h-16 rounded-full bg-white border-2 border-yellow-500/50 flex items-center justify-center shadow-inner">
                <span className="text-yellow-500 text-[10px] font-black tracking-widest uppercase drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">AURA</span>
              </div>
            </div>
          </motion.div>

          {/* Spinning Ball Track */}
          {isSpinning && (
            <motion.div
              animate={{ rotate: ballRotation }}
              transition={{ duration: 4.5, ease: [0.25, 1, 0.5, 1] }}
              className="absolute inset-0 rounded-full pointer-events-none z-30"
            >
              <motion.div 
                animate={{ y: ballRadiusOffset }}
                transition={{ duration: 2.5, ease: "easeIn" }}
                className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,1),inset_-2px_-2px_4px_rgba(0,0,0,0.3)]"
              />
            </motion.div>
          )}

          {/* Static winning ball placed inside the pocket after spin */}
          <AnimatePresence>
            {!isSpinning && winningNumber && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 rounded-full pointer-events-none z-30"
                style={{ transform: `rotate(${rotation % 360}deg)` }}
              >
                 <div className="absolute top-5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.3)]" />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Winning Indicator / Result HUD */}
      <AnimatePresence>
        {winningNumber && !isSpinning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`absolute top-8 left-1/2 -translate-x-1/2 px-12 py-4 rounded-2xl text-center border backdrop-blur-md z-40 shadow-lg ${
              winningNumber.n === 0 ? "bg-emerald-50 border-emerald-300" : "bg-white/90 border-slate-200"
            }`}
          >
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Winning Number</span>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className={`w-6 h-6 rounded-full border ${winningNumber.color}`} />
              <p className={`text-5xl font-black font-mono tracking-wider ${
                winningNumber.n === 0 ? 'text-emerald-600' : 
                winningNumber.color.includes('red') ? 'text-red-600' : 'text-slate-800'
              }`}>
                {winningNumber.n}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
