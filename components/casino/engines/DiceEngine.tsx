"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateGameOutcome } from "@/lib/casino-math";
import { useTradingStore } from "@/lib/store";

interface DiceEngineProps {
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
}

const DIE_FACES = [
  "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"
];

export function DiceEngine({ isPlaying, onComplete }: DiceEngineProps) {
  const houseEdge = useTradingStore(state => state.houseEdge);
  const [rolling, setRolling] = useState(false);
  const [die1, setDie1] = useState(5); // Default 6
  const [die2, setDie2] = useState(5); // Default 6

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setRolling(false);
      return;
    }

    setRolling(true);
    const outcome = calculateGameOutcome("ORIGINAL");
    const won = outcome.isWin;
    
    // Choose winning faces
    let f1 = Math.floor(Math.random() * 6);
    let f2 = Math.floor(Math.random() * 6);
    
    // If win, force a high total
    if (won && (f1 + f2 + 2 < 8)) {
      f1 = 4; // 5
      f2 = 5; // 6
    } else if (!won && (f1 + f2 + 2 >= 8)) {
      f1 = 0; // 1
      f2 = 1; // 2
    }

    const timer = setTimeout(() => {
      setDie1(f1);
      setDie2(f2);
      setRolling(false);
      
      const total = f1 + f2 + 2;
      const mult = total >= 8 ? 2.0 : 0.0;
      onCompleteRef.current(mult, won);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isPlaying]);

  return (
    <div className="w-full h-full min-h-[500px] bg-gradient-to-br from-indigo-950 via-slate-900 to-black rounded-3xl border border-slate-200 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
      
      <div className="text-center mb-8 z-10">
        <h3 className="text-slate-900 font-black text-xl uppercase tracking-widest">Neon Over-Under Dice</h3>
        <p className="text-indigo-600 text-xs font-bold uppercase tracking-wider mt-1">Roll 8 or Higher to Double Your Bet</p>
      </div>

      <div className="flex gap-12 items-center justify-center relative z-10 h-48">
        {/* Die 1 */}
        <motion.div
          animate={rolling ? { 
            rotateX: [0, 360, 720, 1080], 
            rotateY: [0, 180, 540, 900],
            scale: [1, 1.2, 0.9, 1]
          } : { rotateX: 0, rotateY: 0, scale: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center text-7xl text-white font-black border-4 border-cyan-300 shadow-[0_0_40px_rgba(6,182,212,0.5)] select-none cursor-pointer"
        >
          {DIE_FACES[die1]}
        </motion.div>

        {/* Die 2 */}
        <motion.div
          animate={rolling ? { 
            rotateX: [0, -360, -720, -1080], 
            rotateY: [0, -180, -540, -900],
            scale: [1, 1.2, 0.9, 1]
          } : { rotateX: 0, rotateY: 0, scale: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="w-24 h-24 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-3xl flex items-center justify-center text-7xl text-white font-black border-4 border-fuchsia-300 shadow-[0_0_40px_rgba(217,70,239,0.5)] select-none cursor-pointer"
        >
          {DIE_FACES[die2]}
        </motion.div>
      </div>

      {/* Result HUD Overlay */}
      <AnimatePresence>
        {!rolling && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white/60 border border-slate-200 px-8 py-3 rounded-2xl text-center"
          >
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Dice Sum Total</span>
            <p className="text-3xl font-black text-slate-900 font-mono mt-0.5">{die1 + die2 + 2}</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
