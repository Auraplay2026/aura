"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGameOutcome } from "@/lib/casino-math";
import { Cloud, HelpCircle } from "lucide-react";

interface BalloonRaceEngineProps {
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function BalloonRaceEngine({ isPlaying, onComplete }: BalloonRaceEngineProps) {
  const [multiplier, setMultiplier] = useState(1.0);
  const [popped, setPopped] = useState(false);
  const [balloonY, setBalloonY] = useState(350);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setMultiplier(1.0);
      setPopped(false);
      setBalloonY(350);
      return;
    }

    const outcome = calculateGameOutcome("CRASH");
    const target = outcome.multiplier;
    const willWin = outcome.isWin;

    let current = 1.0;
    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      current += 0.01 + (current * 0.012);
      
      const targetY = Math.max(80, 350 - (Math.log10(current) * 200));
      setBalloonY(targetY);

      if (current >= target) {
        clearInterval(interval);
        setMultiplier(target);
        setPopped(true);
        onCompleteRef.current(target, willWin);
      } else {
        setMultiplier(current);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="w-full h-full min-h-[500px] bg-gradient-to-b from-[#2563eb] via-[#60a5fa] to-[#93c5fd] rounded-3xl border-4 border-yellow-400 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
      
      {/* Moving Cloud Overlays */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <motion.div animate={{ x: [-100, 600] }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }} className="absolute top-12 left-10">
          <Cloud className="w-20 h-10 text-slate-900 fill-white" />
        </motion.div>
        <motion.div animate={{ x: [600, -100] }} transition={{ repeat: Infinity, duration: 35, ease: "linear" }} className="absolute bottom-20 right-10">
          <Cloud className="w-24 h-12 text-slate-900 fill-white" />
        </motion.div>
      </div>

      <div className="absolute top-8 text-center z-25">
        <span className="text-slate-900 font-black text-xs uppercase tracking-[0.3em] drop-shadow-md">BALLOON ESCALATION RACE</span>
      </div>

      {/* Numerical display */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20">
        <h1 className={`text-8xl md:text-9xl font-black font-mono tracking-tighter text-slate-900 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]`}>
          {multiplier.toFixed(2)}x
        </h1>
        {popped && (
          <div className="mt-2 bg-red-600 border border-red-500 px-6 py-1.5 rounded-full text-slate-900 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md animate-bounce">
            🎈 POPPED AWAY
          </div>
        )}
      </div>

      {/* Rising Hot Air Balloon */}
      <div className="absolute inset-x-16 inset-y-12 z-10 pointer-events-none">
        {!popped && isPlaying && (
          <motion.div
            style={{ left: "50%", top: `${balloonY}px` }}
            className="absolute w-20 h-28 -ml-10 flex flex-col items-center"
          >
            {/* Balloon graphics */}
            <motion.span 
              animate={{ rotate: [-2, 2, -2] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-6xl drop-shadow-lg"
            >
              🎈
            </motion.span>
            <div className="w-6 h-6 bg-amber-800 rounded-sm border border-amber-300 mt-1 shadow-inner" />
          </motion.div>
        )}
      </div>

    </div>
  );
}
