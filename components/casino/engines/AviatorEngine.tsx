"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGameOutcome } from "@/lib/casino-math";
import { AlertCircle } from "lucide-react";
import { useTradingStore } from "@/lib/store";

interface AviatorEngineProps {
  isPlaying: boolean;
  betAmount?: number;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function AviatorEngine({ isPlaying, betAmount = 1000, onComplete }: AviatorEngineProps) {
  const houseEdge = useTradingStore(state => state.houseEdge);
  const [multiplier, setMultiplier] = useState(1.0);
  const [fled, setFled] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [xPos, setXPos] = useState(0);
  const [yPos, setYPos] = useState(350);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const hasCashedOutRef = useRef(hasCashedOut);
  useEffect(() => {
    hasCashedOutRef.current = hasCashedOut;
  }, [hasCashedOut]);

  useEffect(() => {
    if (!isPlaying) {
      setMultiplier(1.0);
      setFled(false);
      setHasCashedOut(false);
      setXPos(0);
      setYPos(350);
      return;
    }

    // Math-correct Aviator win chance (baseline 45% win rate adjusted for houseEdge)
    const winChance = 0.45 * (1 - houseEdge / 100);
    const outcome = calculateGameOutcome("CRASH");
    const target = outcome.multiplier;
    const willWin = outcome.isWin;

    let current = 1.0;
    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      current += 0.01 + (current * 0.015);
      
      const targetX = Math.min(300, (tick / 80) * 300);
      const targetY = Math.max(100, 350 - (Math.log10(current) * 200));

      setXPos(targetX);
      setYPos(targetY);

      if (current >= target) {
        clearInterval(interval);
        setMultiplier(target);
        setFled(true);
        if (!hasCashedOutRef.current) {
          onCompleteRef.current(target, false);
        }
      } else {
        setMultiplier(current);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleCashout = () => {
    if (fled || hasCashedOut || !isPlaying) return;
    setHasCashedOut(true);
    onCompleteRef.current(multiplier, true);
  };

  // Keyboard and event cashout hotkey
  useEffect(() => {
    const handleTriggerCashout = () => {
      if (isPlaying && !fled && !hasCashedOut) {
        handleCashout();
      }
    };
    window.addEventListener("trigger-cashout", handleTriggerCashout);
    return () => window.removeEventListener("trigger-cashout", handleTriggerCashout);
  }, [isPlaying, fled, hasCashedOut, multiplier]);

  return (
    <div className="w-full h-full min-h-[500px] bg-slate-50 rounded-3xl border-4 border-[#e11d48]/40 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]">
      
      {/* Aviator Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(225, 29, 72, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(225, 29, 72, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }}
      />

      <div className="absolute top-8 text-center z-25">
        <span className="text-[#e11d48] font-black text-xs uppercase tracking-[0.3em]">AVIATOR FLIGHT DECK</span>
      </div>

      {/* Big Multiplier */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20 flex flex-col items-center w-full">
        <h1 className={`text-8xl md:text-9xl font-black font-mono tracking-tighter ${
          fled ? "text-slate-600" : 
          hasCashedOut ? "text-green-600 drop-shadow-[0_0_20px_rgba(22,163,74,0.3)]" : 
          "text-slate-900"
        }`}>
          {multiplier.toFixed(2)}x
        </h1>
        {fled && (
          <div className="mt-2 bg-[#e11d48]/10 border border-[#e11d48]/30 px-6 py-1.5 rounded-full text-[#e11d48] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 animate-bounce">
            <AlertCircle className="w-4 h-4" /> FLEW AWAY
          </div>
        )}
        <AnimatePresence>
          {hasCashedOut && !fled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 px-6 py-2 bg-green-500/10 border border-green-500/30 rounded-xl backdrop-blur-md flex flex-col items-center shadow-[0_0_30px_rgba(16,185,129,0.1)]"
            >
              <span className="text-green-600 text-xs font-bold uppercase tracking-widest">Secured</span>
              <span className="text-green-700 font-black text-xl font-mono">₹{(betAmount * multiplier).toFixed(2)}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/*Propeller Plane Vector */}
      <div className="absolute inset-16 z-10 pointer-events-none">
        
        {/* Curved Path Trace */}
        <svg className="absolute inset-0 w-full h-full overflow-visible">
          <path
            d={`M 0,350 Q ${xPos/2},${(yPos+350)/2} ${xPos},${yPos}`}
            fill="none"
            stroke="#e11d48"
            strokeWidth="6"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 12px #e11d48)" }}
          />
        </svg>

        {/* The Red Propeller Plane */}
        {!fled && isPlaying && (
          <motion.div
            style={{ left: `${xPos}px`, top: `${yPos}px` }}
            className="absolute w-16 h-16 -ml-8 -mt-8 flex items-center justify-center"
          >
            <motion.div 
              animate={{ y: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 0.1 }}
              className="text-4xl text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] filter"
            >
              🛩️
            </motion.div>
          </motion.div>
        )}
      {/* Manual Cashout Interaction Panel */}
      <AnimatePresence>
        {isPlaying && !fled && !hasCashedOut && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-8 z-50 w-[90%] max-w-[300px]"
          >
            <button
              onClick={handleCashout}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xl md:text-2xl rounded-2xl shadow-[0_10px_30px_rgba(225,29,72,0.3)] transition-all uppercase tracking-widest flex items-center justify-center gap-3 cursor-pointer active:scale-95 border border-red-500/20"
            >
              <span>Cashout</span>
              <span className="bg-black/20 px-3 py-1 rounded-lg font-mono text-base">₹{(betAmount * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

    </div>
  );
}
