"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTradingStore } from "@/lib/store";

interface DiceEngineProps {
  isPlaying: boolean;
  betAmount?: number;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function DiceEngine({ isPlaying, betAmount = 10, onComplete }: DiceEngineProps) {
  const [target, setTarget] = useState(50.5);
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [won, setWon] = useState<boolean | null>(null);

  const currentUser = useTradingStore(state => state.currentUser);
  const email = currentUser?.email || "twintubrovquattro@gmail.com";

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Handle game start
  useEffect(() => {
    if (!isPlaying) {
      setIsRolling(false);
      return;
    }

    setIsRolling(true);
    setRollResult(null);
    setWon(null);

    let active = true;

    const executeBet = async () => {
      try {
        const targetMultiplier = 99 / target;
        const res = await fetch('/api/casino/bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            gameId: "orig-5",
            gameTitle: "Dice",
            betAmount,
            targetMultiplier
          })
        });
        const data = await res.json();
        if (!active) return;

        if (res.ok && data.success) {
          const isWin = data.isWin;
          const finalRoll = isWin 
            ? Math.random() * target // Roll under target
            : target + Math.random() * (100 - target); // Roll over target
            
          setTimeout(() => {
            if (!active) return;
            setRollResult(Number(finalRoll.toFixed(2)));
            setWon(isWin);
            setIsRolling(false);
            onCompleteRef.current(data.multiplier, isWin);
          }, 1500);
        } else {
          setIsRolling(false);
          onCompleteRef.current(0, false);
          alert(data.error || "Wager placement failed.");
        }
      } catch (err) {
        console.error("Dice bet placement failed", err);
        setIsRolling(false);
        onCompleteRef.current(0, false);
      }
    };

    executeBet();

    return () => {
      active = false;
    };
  }, [isPlaying, target, betAmount]);

  // Derived values for UI
  const winMultiplier = (99 / target).toFixed(2);
  const winChance = target.toFixed(2);

  return (
    <div className="w-full h-full min-h-[300px] h-[320px] md:min-h-[600px] md:h-full bg-white rounded-3xl border border-[#e9e2d3] flex flex-col items-center justify-center relative overflow-hidden shadow-[0_20px_45px_rgba(224,87,62,0.04)] p-3 md:p-12">
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-100/20 via-white to-white pointer-events-none" />

      {/* Central Roll Display */}
      <div className="relative w-full max-w-2xl mx-auto z-10 flex flex-col items-center">
        
        {/* Animated Result Badge */}
        <div className="h-20 md:h-32 flex items-center justify-center mb-4 md:mb-8">
          <AnimatePresence mode="wait">
            {isRolling ? (
              <motion.div 
                key="rolling"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="text-5xl md:text-8xl font-black font-mono text-slate-300 animate-pulse tracking-tighter"
              >
                00.00
              </motion.div>
            ) : rollResult !== null ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`text-6xl md:text-9xl font-black font-mono tracking-tighter drop-shadow-sm ${won ? 'text-emerald-700' : 'text-rose-700'}`}
              >
                {rollResult.toFixed(2)}
              </motion.div>
            ) : (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-5xl md:text-8xl font-black font-mono text-slate-300 tracking-tighter"
              >
                100.00
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* The Precision Slider */}
        <div className="w-full relative mt-6 md:mt-12 mb-10 md:mb-16">
          
          {/* Slider Background Track */}
          <div className="h-4 w-full bg-red-100/50 rounded-full overflow-hidden relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]">
            {/* Green Win Zone */}
            <div 
              className="absolute top-0 left-0 h-full bg-[#0f766e] shadow-[0_0_12px_rgba(15,118,110,0.4)] transition-all duration-200"
              style={{ width: `${target}%` }}
            />
            {/* Red Loss Zone */}
            <div 
              className="absolute top-0 right-0 h-full bg-[#be123c] shadow-[0_0_12px_rgba(190,18,60,0.4)] transition-all duration-200"
              style={{ width: `${100 - target}%` }}
            />
          </div>

          {/* Slider Input */}
          <input 
            type="range" 
            min="2" 
            max="98" 
            step="0.01" 
            value={target}
            onChange={(e) => setTarget(parseFloat(e.target.value))}
            disabled={isRolling}
            className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-12 opacity-0 cursor-pointer z-20"
          />

          {/* Thumb / Handle UI */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 -ml-6 w-12 h-14 bg-white rounded-xl shadow-[0_8px_20px_rgba(224,87,62,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] border-2 border-[#e9e2d3] flex items-center justify-center pointer-events-none z-10 transition-transform duration-75"
            style={{ left: `${target}%`, transform: `translate(-50%, -50%) scale(${isRolling ? 0.9 : 1})` }}
          >
            <div className="w-1 h-6 bg-slate-350 rounded-full mx-0.5" />
            <div className="w-1 h-6 bg-slate-350 rounded-full mx-0.5" />
          </div>

          {/* Result Marker Overlay */}
          <AnimatePresence>
            {rollResult !== null && !isRolling && (
              <motion.div
                initial={{ opacity: 0, scale: 0, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-8 -ml-2 rounded-full border-2 border-white shadow-[0_0_12px_rgba(224,87,62,0.25)] z-30 pointer-events-none ${won ? 'bg-[#0f766e]' : 'bg-[#be123c]'}`}
                style={{ left: `${rollResult}%` }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Stats Readout */}
        <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-[#faf8f5] border border-[#e9e2d3] rounded-2xl p-2.5 md:p-4 text-center">
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">Multiplier</p>
            <p className="text-slate-900 text-lg md:text-xl font-black font-mono mt-0.5 md:mt-1">{winMultiplier}x</p>
          </div>
          <div className="hidden md:block bg-[#faf8f5] border border-[#e9e2d3] rounded-2xl p-4 text-center">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Roll Under</p>
            <p className="text-indigo-700 text-xl font-black font-mono mt-1">{target.toFixed(2)}</p>
          </div>
          <div className="bg-[#faf8f5] border border-[#e9e2d3] rounded-2xl p-2.5 md:p-4 text-center">
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider">Win Chance</p>
            <p className="text-emerald-700 text-lg md:text-xl font-black font-mono mt-0.5 md:mt-1">{winChance}%</p>
          </div>
        </div>

      </div>
    </div>
  );
}
