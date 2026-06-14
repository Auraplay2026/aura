"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, Zap, ShieldCheck } from "lucide-react";

export function ExternalEngine({ isPlaying, onComplete, game }: { isPlaying: boolean; onComplete: (mult: number, won: boolean) => void; game: any }) {
  const [loadingPhase, setLoadingPhase] = useState(0);

  useEffect(() => {
    if (isPlaying) {
      setLoadingPhase(1);
      
      const t1 = setTimeout(() => setLoadingPhase(2), 1500);
      const t2 = setTimeout(() => setLoadingPhase(3), 3000);
      const t3 = setTimeout(() => {
        setLoadingPhase(0);
        // Random outcome for the "external" game
        const isWin = Math.random() > 0.7;
        const mult = isWin ? 1.5 + Math.random() * 8.5 : 0;
        onComplete(mult, isWin);
      }, 5000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setLoadingPhase(0);
    }
  }, [isPlaying, onComplete]);

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-black overflow-hidden rounded-3xl">
      {/* Cinematic Background */}
      <div className="absolute inset-0 opacity-40">
        <img src={game.image} className="w-full h-full object-cover blur-sm scale-110" alt={game.title} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#02050a] via-[#02050a]/80 to-transparent" />

      {/* Launcher UI */}
      <div className="relative z-10 w-full max-w-md p-8 flex flex-col items-center">
        <div className="w-24 h-24 rounded-2xl overflow-hidden mb-6 shadow-[0_0_40px_rgba(255,255,255,0.2)] border border-white/20">
          <img src={game.image} className="w-full h-full object-cover" />
        </div>

        <h2 className="text-2xl font-black text-white uppercase tracking-widest text-center mb-1">{game.title}</h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mb-12 flex items-center gap-2">
          <Server className="w-3 h-3 text-neon-green" />
          {game.provider} Network
        </p>

        {!isPlaying ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-slate-500 text-xs font-mono">STANDBY FOR SECURE CONNECTION</p>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="flex justify-between items-end mb-2">
              <AnimatePresence mode="wait">
                <motion.p key={loadingPhase} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="text-neon-purple font-mono font-bold text-[10px] tracking-widest uppercase">
                  {loadingPhase === 1 && "CONTACTING PROVIDER API..."}
                  {loadingPhase === 2 && "DOWNLOADING ASSETS (84MB)..."}
                  {loadingPhase === 3 && "AWAITING GAME ROUND HASH..."}
                </motion.p>
              </AnimatePresence>
            </div>
            
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-neon-purple to-neon-green shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                initial={{ width: "0%" }}
                animate={{ width: loadingPhase === 1 ? "30%" : loadingPhase === 2 ? "75%" : loadingPhase === 3 ? "98%" : "0%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
