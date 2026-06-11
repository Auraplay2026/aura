"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTradingStore } from "@/lib/store";

interface CoinflipEngineProps {
  isPlaying: boolean;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function CoinflipEngine({ isPlaying, onComplete }: CoinflipEngineProps) {
  const houseEdge = useTradingStore(state => state.houseEdge);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<"HEADS" | "TAILS" | null>(null);
  const [rotationX, setRotationX] = useState(0);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      setFlipping(false);
      setResult(null);
      return;
    }

    setFlipping(true);
    // Math-correct Coinflip win chance (50% fair rate adjusted for houseEdge)
    const winChance = 0.50 * (1 - houseEdge / 100);
    const won = Math.random() < winChance;
    const finalResult = won ? "HEADS" : "TAILS";

    const extraSpins = 1800 + (finalResult === "HEADS" ? 0 : 180);
    setRotationX(prev => prev + extraSpins);

    const timer = setTimeout(() => {
      setResult(finalResult);
      setFlipping(false);
      onCompleteRef.current(2.0, won);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isPlaying]);

  return (
    <div className="w-full h-full min-h-[500px] bg-gradient-to-br from-amber-950 via-slate-900 to-black rounded-3xl border border-slate-200 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
      
      <div className="text-center mb-8 z-10">
        <h3 className="text-slate-900 font-black text-xl uppercase tracking-widest">Aura Gold Coinflip</h3>
        <p className="text-amber-500 text-xs font-bold uppercase tracking-wider mt-1">Guess Coinflip Outcome to Double Up</p>
      </div>

      <div className="h-48 flex items-center justify-center relative z-10 select-none">
        <motion.div
          animate={flipping ? { 
            rotateY: rotationX,
            y: [-50, -150, -50, 0],
            scale: [1, 1.3, 0.9, 1]
          } : { rotateY: rotationX % 360, y: 0, scale: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 border-4 border-yellow-300 shadow-[0_0_50px_rgba(234,179,8,0.5)] flex items-center justify-center text-white relative font-black"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Heads Side */}
          <div className="absolute inset-0 rounded-full flex flex-col items-center justify-center backface-hidden" style={{ backfaceVisibility: "hidden" }}>
            <span className="text-4xl text-amber-950">👑</span>
            <span className="text-[10px] text-amber-950 uppercase font-black tracking-widest mt-1">HEADS</span>
          </div>

          {/* Tails Side */}
          <div 
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center bg-gradient-to-br from-yellow-500 via-amber-600 to-yellow-700"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span className="text-4xl text-amber-950">🪙</span>
            <span className="text-[10px] text-amber-950 uppercase font-black tracking-widest mt-1">TAILS</span>
          </div>
        </motion.div>
      </div>

      {/* Result HUD Overlay */}
      <AnimatePresence>
        {result && !flipping && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white/60 border border-slate-200 px-8 py-3 rounded-2xl text-center"
          >
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Result Outcome</span>
            <p className="text-3xl font-black text-neon-yellow font-mono mt-0.5">{result}</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
