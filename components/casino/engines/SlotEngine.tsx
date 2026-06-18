"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useTradingStore } from "@/lib/store";

interface SlotEngineProps {
  isPlaying: boolean;
  isTurbo: boolean;
  theme: any;
  betAmount?: number;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function SlotEngine({ isPlaying, isTurbo, theme, betAmount = 10, onComplete }: SlotEngineProps) {
  const [spinStops, setSpinStops] = useState<boolean[]>(Array(theme.cols).fill(true));
  const generateGrid = () => Array(theme.cols).fill(0).map(() => Array(theme.rows).fill(0).map(() => theme.symbols[Math.floor(Math.random() * theme.symbols.length)]));
  const [reels, setReels] = useState<string[][]>(generateGrid());
  const [history, setHistory] = useState<{ mult: number; won: boolean }[]>([]);

  const currentUser = useTradingStore(state => state.currentUser);
  const email = currentUser?.email || "admin@aurabet.io";

  const hasStartedSpin = useRef(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isPlaying) {
      hasStartedSpin.current = false;
      return;
    }

    if (hasStartedSpin.current) return;
    hasStartedSpin.current = true;

    setSpinStops(Array(theme.cols).fill(false));
    const baseTime = isTurbo ? 400 : 800;
    const staggerTime = isTurbo ? 150 : 300;
    
    let active = true;
    let timeouts: NodeJS.Timeout[] = [];

    const executeBet = async () => {
      try {
        const res = await fetch('/api/casino/bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            gameId: `slot-${theme.primaryColor || 'default'}`,
            gameTitle: "Slots",
            betAmount
          })
        });
        const data = await res.json();
        if (!active) return;

        if (res.ok && data.success) {
          const isWin = data.isWin;
          const multiplier = data.multiplier;
          
          const newReels = generateGrid();
          if (isWin) {
            const winSymbol = theme.symbols[Math.floor(Math.random() * theme.symbols.length)];
            const middleRow = Math.floor(theme.rows / 2);
            for (let c = 0; c < Math.min(4, theme.cols); c++) newReels[c][middleRow] = winSymbol;
          } else {
            // Check if near miss (from server, e.g. multiplier > 0 but less than win)
            // or just make a near miss randomly for visual flair
            const isNearMiss = Math.random() < 0.4;
            if (isNearMiss) {
              const winSymbol = theme.symbols[Math.floor(Math.random() * theme.symbols.length)];
              const middleRow = Math.floor(theme.rows / 2);
              for (let c = 0; c < Math.min(3, theme.cols); c++) newReels[c][middleRow] = winSymbol;
              if (theme.cols > 3) {
                 let diffSymbol = theme.symbols[Math.floor(Math.random() * theme.symbols.length)];
                 while(diffSymbol === winSymbol) diffSymbol = theme.symbols[Math.floor(Math.random() * theme.symbols.length)];
                 newReels[3][middleRow] = diffSymbol;
              }
            }
          }
          setReels(newReels);

          Array.from({ length: theme.cols }).forEach((_, i) => {
            const t = setTimeout(() => {
              if (!active) return;
              setSpinStops(prev => {
                const next = [...prev];
                next[i] = true;
                return next;
              });
            }, baseTime + (i * staggerTime));
            timeouts.push(t);
          });

          const timer = setTimeout(() => {
            if (!active) return;
            onCompleteRef.current(multiplier, isWin);
            setHistory(prev => [{ mult: multiplier, won: isWin }, ...prev].slice(0, 8));
          }, baseTime + (theme.cols * staggerTime) + 300);
          timeouts.push(timer);

        } else {
          setSpinStops(Array(theme.cols).fill(true));
          onCompleteRef.current(0, false);
          alert(data.error || "Wager placement failed.");
        }
      } catch (err) {
        console.error("Slots bet initiation failed", err);
        setSpinStops(Array(theme.cols).fill(true));
        onCompleteRef.current(0, false);
      }
    };

    executeBet();

    return () => {
      active = false;
      timeouts.forEach(clearTimeout);
    };
  }, [isPlaying, isTurbo, theme, betAmount]);

  return (
    <div className={`w-full max-w-5xl mx-auto h-full min-h-[500px] md:min-h-[600px] bg-gradient-to-b from-slate-800 to-[#09090b] rounded-[3rem] border-8 ${theme.borderClass} p-4 md:p-8 shadow-[0_40px_100px_rgba(0,0,0,0.8),inset_0_2px_10px_rgba(255,255,255,0.2)] relative overflow-hidden flex flex-col justify-center perspective-[1200px]`}>
      
      {/* Neon Gold Cabinet Overlay during Spin */}
      {!spinStops.every(v => v) && (
        <div className="absolute inset-0 border-[6px] border-yellow-400/30 rounded-[3rem] pointer-events-none z-30 animate-[heartbeat-glow_1s_infinite_ease-in-out]" />
      )}

      {/* Premium Metallic Cabinet Illusion */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.1),_transparent_50%)] pointer-events-none z-0" />
      <div className="absolute inset-2 border-2 border-slate-700/50 rounded-[2.5rem] pointer-events-none z-0 shadow-inner" />

      {/* Ticker History */}
      <div className="flex gap-2 justify-center mb-4 z-10 shrink-0 h-6">
        {history.map((h, idx) => (
          <div
            key={idx}
            className={`px-3 py-0.5 rounded-full text-[9px] font-black font-mono border shadow-sm ${
              h.won
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                : "bg-slate-800/60 text-slate-400 border-slate-700"
            }`}
          >
            {h.mult.toFixed(1)}x
          </div>
        ))}
      </div>

      {/* Reel Container */}
      <div 
        className="grid gap-2 md:gap-4 h-[350px] md:h-[450px] relative z-10 p-4 md:p-6 bg-[#000] rounded-2xl border-4 border-[#18181b] shadow-[inset_0_20px_50px_rgba(0,0,0,1)] transform-style-3d rotate-x-[5deg]" 
        style={{ gridTemplateColumns: `repeat(${theme.cols}, minmax(0, 1fr))` }}
      >
        {reels.map((col, cIdx) => (
          <div key={cIdx} className={`${theme.slotBg} rounded-xl overflow-hidden relative border-x-2 border-slate-800 shadow-[inset_0_0_30px_rgba(0,0,0,1)] flex justify-center bg-[#09090b]`}>
            {/* Dark gradient mask on top and bottom for realistic cylindrical drum effect */}
            <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-black via-black/80 to-transparent z-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black via-black/80 to-transparent z-20 pointer-events-none" />
            
            {/* Dust puff effect below reel stop */}
            {spinStops[cIdx] && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-white/10 rounded-full blur-sm animate-[particle-fade_0.4s_ease-out] z-30 pointer-events-none" />
            )}
            
            {/* Spinning Reel Content */}
            <motion.div 
              animate={!spinStops[cIdx] ? (theme.animationType === "tumble" ? { y: [-800, 0] } : { y: [0, -2000] }) : { y: 0 }}
              transition={!spinStops[cIdx] 
                ? { repeat: Infinity, duration: isTurbo ? 0.08 : 0.15, ease: "linear" }
                : { type: "spring", stiffness: 300, damping: 15, mass: 1 }
              }
              className="h-full w-full flex flex-col justify-around items-center absolute inset-0 z-10"
            >
              {col.map((sym, rIdx) => (
                <div 
                  key={rIdx} 
                  className={`text-5xl md:text-7xl lg:text-[6rem] flex items-center justify-center w-full h-1/3 relative transition-all duration-75 
                    ${!spinStops[cIdx] 
                      ? (theme.animationType === "tumble" ? "blur-[2px]" : "blur-[4px] opacity-80 scale-y-125") 
                      : "scale-y-100 blur-0"
                    }
                  `}
                >
                  <span className={`relative z-10 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] filter ${!spinStops[cIdx] ? "brightness-150" : ""}`}>
                    {sym}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        ))}

        {/* Win Line Illusion */}
        {spinStops.every(v => v) && isPlaying === false && (
          <motion.div 
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,1)] z-30 pointer-events-none origin-center" 
          />
        )}
      </div>
    </div>
  );
}
