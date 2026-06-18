"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface AviatorEngineProps {
  isPlaying: boolean;
  betAmount?: number;
  autoCashout?: number;
  onLiveTick?: (multiplier: number) => void;
  onComplete: (multiplier: number, won: boolean) => void;
}

export function AviatorEngine({ isPlaying, betAmount = 100, autoCashout, onLiveTick, onComplete }: AviatorEngineProps) {
  const [multiplier, setMultiplier] = useState(1.0);
  const [fled, setFled] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [xPos, setXPos] = useState(0);
  const [yPos, setYPos] = useState(350);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const currentUser = useTradingStore(state => state.currentUser);
  const email = currentUser?.email || "admin@aurabet.io";

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const hasCashedOutRef = useRef(hasCashedOut);
  useEffect(() => {
    hasCashedOutRef.current = hasCashedOut;
  }, [hasCashedOut]);

  const onLiveTickRef = useRef(onLiveTick);
  useEffect(() => {
    onLiveTickRef.current = onLiveTick;
  }, [onLiveTick]);

  const handleCashout = useCallback(async (cashoutMultiplier?: number) => {
    if (fled || hasCashedOut || !isPlaying || !sessionId) return;
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
        // Reached crash point or server rejected
        onCompleteRef.current(0, false);
      }
    } catch (err) {
      console.error("Cashout failed", err);
      onCompleteRef.current(0, false);
    }
  }, [fled, hasCashedOut, isPlaying, sessionId, multiplier, email]);

  const handleCashoutRef = useRef(handleCashout);
  useEffect(() => {
    handleCashoutRef.current = handleCashout;
  }, [handleCashout]);

  useEffect(() => {
    if (!isPlaying) {
      const timer = setTimeout(() => {
        setMultiplier(1.0);
        setFled(false);
        setHasCashedOut(false);
        setXPos(0);
        setYPos(350);
        setSessionId(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    let active = true;
    let interval: NodeJS.Timeout | null = null;

    const executeBet = async () => {
      try {
        const res = await fetch('/api/casino/bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            gameId: "crash-1",
            gameTitle: "Aviator",
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
            current += 0.01 + (current * 0.015);
            
            const targetX = Math.min(300, (tick / 80) * 300);
            const targetY = Math.max(100, 350 - (Math.log10(current) * 200));

            setXPos(targetX);
            setYPos(targetY);

            if (current >= target) {
              if (interval) clearInterval(interval);
              setMultiplier(target);
              setFled(true);
              if (!hasCashedOutRef.current) {
                onCompleteRef.current(target, false);
              }
            } else {
              setMultiplier(current);
              onLiveTickRef.current?.(current);

              // Auto cashout check
              if (autoCashout && current >= autoCashout && !hasCashedOutRef.current) {
                if (interval) clearInterval(interval);
                handleCashoutRef.current(current);
              }
            }
          }, 60);

        } else {
          onCompleteRef.current(0, false);
          alert(data.error || "Wager placement failed.");
        }
      } catch (err) {
        console.error("Aviator bet initiation failed", err);
        onCompleteRef.current(0, false);
      }
    };

    executeBet();

    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, autoCashout, betAmount, email]);

  // Keyboard and event cashout hotkey
  useEffect(() => {
    const handleTriggerCashout = () => {
      if (isPlaying && !fled && !hasCashedOut) {
        handleCashoutRef.current();
      }
    };
    window.addEventListener("trigger-cashout", handleTriggerCashout);
    window.addEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    return () => {
      window.removeEventListener("trigger-cashout", handleTriggerCashout);
      window.removeEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    };
  }, [isPlaying, fled, hasCashedOut]);

  return (
    <div className="w-full h-full min-h-[400px] bg-[#0c0d14] rounded-3xl border border-rose-950/40 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_0_120px_rgba(0,0,0,0.95)]">
      
      {/* Inline styles for scrolling grid, custom flight propeller spin, and button pulsing */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scrollFlightGrid {
          0% { background-position: 0px 0px; }
          100% { background-position: -40px 40px; }
        }
        @keyframes propSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes btnPulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(245,158,11,0.45); }
          50% { box-shadow: 0 0 40px rgba(245,158,11,0.75), inset 0 1px 0 rgba(255,255,255,0.25); }
        }
        .animate-scroll-grid {
          animation: scrollFlightGrid 1.2s linear infinite;
        }
        .animate-propeller {
          animation: propSpin 0.08s linear infinite;
          transform-origin: 51px 36px;
        }
        .animate-btn-glow {
          animation: btnPulseGlow 2s ease-in-out infinite;
        }
      `}} />

      {/* Aviator Grid Background */}
      <div 
        className={cn(
          "absolute inset-0 z-0 opacity-15 transition-all duration-300",
          isPlaying && !fled && "animate-scroll-grid"
        )}
        style={{
          backgroundImage: `
            linear-gradient(rgba(244, 63, 94, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(244, 63, 94, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Ambient radial depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(225,29,72,0.12)_0%,transparent_50%)] pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-600/[0.04] blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Active Flight Header */}
      <div className="absolute top-8 text-center z-25 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 rounded-full backdrop-blur-md">
        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
        <span className="text-rose-400 font-extrabold text-[10px] uppercase tracking-[0.25em]">Flight Deck Active</span>
      </div>

      {/* Big Multiplier */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20 flex flex-col items-center w-full">
        <h1 className={`text-8xl md:text-9xl font-black font-mono tracking-tighter transition-all duration-300 ${
          fled ? "text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]" : 
          hasCashedOut ? "text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.6)]" : 
          "text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.35)]"
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
              <span className="text-green-400 font-black text-xl font-mono">₹{(betAmount * multiplier).toFixed(2)}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Propeller Plane Vector */}
      <div className="absolute inset-16 z-10 pointer-events-none">
        
        {/* Kinetic Shockwave vector on crash */}
        <AnimatePresence>
          {fled && (
            <motion.div 
              initial={{ scale: 0.1, opacity: 1 }}
              animate={{ scale: 3.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute w-24 h-24 rounded-full border-2 border-[#e11d48] z-30 pointer-events-none"
              style={{ 
                left: `${xPos}px`, 
                top: `${yPos}px`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 25px rgba(225,29,72,0.6)',
                backgroundColor: 'rgba(225,29,72,0.1)'
              }}
            />
          )}
        </AnimatePresence>

        {/* Curved Path Trace */}
        <svg className="absolute inset-0 w-full h-full overflow-visible">
          <defs>
            <linearGradient id="aviator-curve-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(225, 29, 72, 0.25)" />
              <stop offset="100%" stopColor="rgba(225, 29, 72, 0)" />
            </linearGradient>
          </defs>
          {/* Shaded area under flight path */}
          <path
            d={`M 0,350 Q ${xPos * 0.5},${(yPos + 350) * 0.5} ${xPos},${yPos} L ${xPos},350 Z`}
            fill="url(#aviator-curve-grad)"
            className="transition-all duration-75"
          />
          {/* Outer glow path */}
          <path
            d={`M 0,350 Q ${xPos * 0.5},${(yPos + 350) * 0.5} ${xPos},${yPos}`}
            fill="none"
            stroke="#e11d48"
            strokeWidth="5"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 10px rgba(225, 29, 72, 0.8))" }}
          />
          {/* Inner core path */}
          <path
            d={`M 0,350 Q ${xPos * 0.5},${(yPos + 350) * 0.5} ${xPos},${yPos}`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        {/* The Red Propeller Plane */}
        {!fled && isPlaying && (
          <motion.div
            style={{ left: `${xPos}px`, top: `${yPos}px` }}
            className="absolute w-16 h-16 -ml-8 -mt-8 flex items-center justify-center relative z-20"
          >
            <motion.div 
              animate={{ y: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 0.08 }}
              className="relative w-full h-full"
            >
              {/* Premium Vector Plane SVG */}
              <svg className="w-16 h-16 drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Wing */}
                <path d="M24 36 L30 18 L34 18 L30 36 Z" fill="#b91c1c" />
                {/* Fuselage */}
                <path d="M10 36 C10 32 46 28 50 36 C46 44 10 40 10 36 Z" fill="#e11d48" />
                {/* Tail fin */}
                <path d="M10 36 L4 20 L12 20 L14 36 Z" fill="#e11d48" />
                {/* Cockpit canopy */}
                <path d="M32 33 C32 33 36 29 40 33 Z" fill="#93c5fd" opacity="0.8" />
                {/* Propeller Hub */}
                <circle cx="51" cy="36" r="3" fill="#1e293b" />
                {/* Spinning Propeller blades */}
                <line x1="51" y1="20" x2="51" y2="52" stroke="#64748b" strokeWidth="2.5" className="animate-propeller" />
              </svg>

              {/* Pulsing Jet Flame Plume */}
              <div className="absolute right-[90%] top-[56%] -translate-y-1/2 flex items-center gap-0.5">
                <div className="w-4 h-2 bg-gradient-to-l from-orange-500 to-transparent rounded-full blur-[1px] animate-pulse" />
                <div className="w-2.5 h-1.5 bg-gradient-to-l from-yellow-400 to-transparent rounded-full blur-[1.5px]" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

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
              onClick={() => handleCashout()}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-slate-950 font-black text-xl md:text-2xl rounded-2xl transition-all uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer active:scale-95 border border-yellow-300/35 relative overflow-hidden animate-btn-glow"
            >
              <span>Cashout</span>
              <span className="bg-black/15 px-3 py-1 rounded-lg font-mono text-base">₹{(betAmount * multiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
