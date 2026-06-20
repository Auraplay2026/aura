"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTradingStore } from "@/lib/store";

interface ClassicCrashEngineProps {
  isPlaying: boolean;
  betAmount?: number;
  autoCashout?: number;
  onLiveTick?: (multiplier: number) => void;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function ClassicCrashEngine({ isPlaying, betAmount = 10, autoCashout, onLiveTick, onComplete }: ClassicCrashEngineProps) {
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashed, setCrashed] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const currentUser = useTradingStore(state => state.currentUser);
  const email = currentUser?.email || "admin@aurabet.io";

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const [hasCashedOut, setHasCashedOut] = useState(false);
  const hasCashedOutRef = useRef(hasCashedOut);
  useEffect(() => {
    hasCashedOutRef.current = hasCashedOut;
  }, [hasCashedOut]);

  const onLiveTickRef = useRef(onLiveTick);
  useEffect(() => {
    onLiveTickRef.current = onLiveTick;
  }, [onLiveTick]);

  useEffect(() => {
    if (!isPlaying) {
      setMultiplier(1.0);
      setCrashed(false);
      setHasCashedOut(false);
      setPoints([]);
      setSessionId(null);
      return;
    }

    let active = true;
    let interval: any = null;

    const executeBet = async () => {
      try {
        const res = await fetch('/api/casino/bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            gameId: "orig-1",
            gameTitle: "Crash",
            betAmount
          })
        });
        const data = await res.json();
        if (!active) return;

        if (res.ok && data.success) {
          setSessionId(data.sessionId);
          const target = data.crashPoint;

          let current = 1.0;
          let tick = 0;
          interval = setInterval(() => {
            tick++;
            current += 0.01 + (current * 0.012);
            
            const width = containerRef.current?.clientWidth || 500;
            const height = containerRef.current?.clientHeight || 300;
            const x = Math.min(width, (tick / 120) * width);
            const y = Math.min(height, Math.log10(current) * height * 1.5);
            
            setPoints(prev => [...prev, { x, y: height - y }]);

            if (current >= target) {
              clearInterval(interval);
              setMultiplier(target);
              setCrashed(true);
              if (!hasCashedOutRef.current) {
                onCompleteRef.current(target, false);
              }
            } else {
              setMultiplier(current);
              onLiveTickRef.current?.(current);

              // Auto cashout check
              if (autoCashout && current >= autoCashout && !hasCashedOutRef.current) {
                clearInterval(interval);
                handleCashout(current);
              }
            }
          }, 60);

        } else {
          onCompleteRef.current(0, false);
          alert(data.error || "Wager placement failed.");
        }
      } catch (err) {
        console.error("Crash bet initiation failed", err);
        onCompleteRef.current(0, false);
      }
    };

    executeBet();

    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, autoCashout, betAmount]);

  const handleCashout = async (cashoutMultiplier?: number) => {
    if (crashed || hasCashedOut || !isPlaying || !sessionId) return;
    const targetMultiplier = cashoutMultiplier || multiplier;
    setHasCashedOut(true);

    try {
      const res = await fetch('/api/casino/mines/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cashout',
          email,
          sessionId,
          clientMultiplier: targetMultiplier
        })
      });
      const data = await res.json();
      if (res.ok && data.success && !data.isBust) {
        onCompleteRef.current(targetMultiplier, true);
      } else {
        // Crashed or server rejected
        onCompleteRef.current(0, false);
      }
    } catch (err) {
      console.error("Cashout failed", err);
      onCompleteRef.current(0, false);
    }
  };

  // Keyboard and event cashout hotkey
  useEffect(() => {
    const handleTriggerCashout = () => {
      if (isPlaying && !crashed && !hasCashedOut) {
        handleCashout();
      }
    };
    window.addEventListener("trigger-cashout", handleTriggerCashout);
    window.addEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    return () => {
      window.removeEventListener("trigger-cashout", handleTriggerCashout);
      window.removeEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    };
  }, [isPlaying, crashed, hasCashedOut, multiplier, sessionId]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[440px] bg-slate-50 rounded-3xl border border-slate-200 relative flex flex-col items-center justify-center overflow-hidden shadow-inner">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(234,179,8,0.05)_0%,_transparent_100%)] pointer-events-none" />

      {/* Numerical HUD */}
      <div className="absolute top-10 flex flex-col items-center z-20">
        <span className="text-[10px] text-yellow-500/60 tracking-[0.3em] font-black uppercase mb-1">STAKE MULTIPLIER</span>
        <h1 className={`text-7xl md:text-9xl font-black font-mono tracking-tighter ${crashed ? "text-red-500" : "text-slate-900"}`}>
          {multiplier.toFixed(2)}x
        </h1>
        {crashed && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 bg-red-100 border border-red-500/20 px-4 py-1 rounded-full text-red-500 font-bold text-xs uppercase tracking-wider animate-pulse"
          >
            💥 crashed @ {multiplier.toFixed(2)}x
          </motion.div>
        )}
        
        {hasCashedOut && !crashed && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-12 bg-emerald-500 text-slate-900 font-black px-4 py-1 rounded-full text-sm animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            CASHED OUT
          </div>
        )}
      </div>

      <AnimatePresence>
        {isPlaying && !crashed && !hasCashedOut && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[300px]"
          >
            <button
              onClick={() => handleCashout()}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-900 font-black text-xl md:text-2xl rounded-2xl shadow-[0_10px_50px_rgba(52,211,153,0.5),inset_0_2px_0_rgba(255,255,255,0.5)] transition-all uppercase tracking-widest border border-emerald-300 flex items-center justify-center gap-3 active:scale-95"
            >
              <span>Cashout</span>
              <span className="bg-white/20 px-3 py-1 rounded-lg">₹{(betAmount * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SVG Exponential Graph Line */}
      <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
        {points.length > 1 && (
          <path
            d={`M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="6"
            strokeLinecap="round"
            className="drop-shadow-[0_4px_10px_rgba(245,158,11,0.5)]"
          />
        )}
      </svg>
    </div>
  );
}
