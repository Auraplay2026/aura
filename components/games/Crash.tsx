"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

type GameState = "idle" | "playing" | "crashed" | "cashed_out";

export function Crash() {
  const [betAmount, setBetAmount] = useState(10);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(0);
  const [cashoutAt, setCashoutAt] = useState<number | null>(null);

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startGame = () => {
    // Generate crash point (rigged to 2% win rate)
    const willWin = Math.random() < 0.02;
    const result = willWin ? parseFloat((Math.random() * 5 + 2.0).toFixed(2)) : 1.00;
    
    setCrashPoint(result);
    setMultiplier(1.00);
    setCashoutAt(null);
    setGameState("playing");
    startTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(updateMultiplier);
  };

  const updateMultiplier = (time: number) => {
    if (!startTimeRef.current) return;
    const elapsed = time - startTimeRef.current;
    
    // Non-linear acceleration for the crash curve
    const currentMult = Math.max(1.00, Math.pow(Math.E, 0.00006 * elapsed));
    
    if (currentMult >= crashPoint!) {
      setMultiplier(crashPoint!);
      setGameState(prevState => prevState === "playing" ? "crashed" : prevState);
      return; // Stop animation loop
    } else {
      setMultiplier(currentMult);
      if (gameState === "playing" || gameState === "cashed_out") {
        requestRef.current = requestAnimationFrame(updateMultiplier);
      }
    }
  };

  const handleAction = () => {
    if (gameState === "idle" || gameState === "crashed" || gameState === "cashed_out") {
      startGame();
    } else if (gameState === "playing") {
      // Cash out
      setCashoutAt(multiplier);
      setGameState("cashed_out");
      // Let the loop continue so the curve still crashes for "other players" visually
    }
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const payout = cashoutAt ? (betAmount * cashoutAt).toFixed(2) : "0.00";

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-[600px] bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Betting Controller */}
      <div className="w-full lg:w-80 bg-slate-900/50 p-6 flex flex-col gap-6 border-r border-slate-800 shrink-0 overflow-y-auto custom-scrollbar">
        <div>
          <label className="text-sm font-bold text-slate-400 mb-2 flex justify-between">
            <span>Bet Amount</span>
            <span className="text-slate-500">₹</span>
          </label>
          <div className="flex bg-slate-950 rounded-xl border border-slate-800 p-1">
            <input 
              type="number" 
              value={betAmount} 
              disabled={gameState === "playing" || gameState === "cashed_out"}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full bg-transparent text-white font-bold px-3 focus:outline-none disabled:opacity-50"
            />
            <button disabled={gameState === "playing" || gameState === "cashed_out"} onClick={() => setBetAmount(Math.max(1, betAmount / 2))} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold disabled:opacity-50">1/2</button>
            <div className="w-[1px] bg-slate-800 mx-1"></div>
            <button disabled={gameState === "playing" || gameState === "cashed_out"} onClick={() => setBetAmount(betAmount * 2)} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold disabled:opacity-50">2x</button>
          </div>
        </div>

        <div className="mt-auto">
          <button 
            onClick={handleAction}
            className={`w-full py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 shadow-lg ${
              gameState === "playing" ? "bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-[0_0_20px_rgba(249,115,22,0.3)]" :
              "bg-neon-green hover:bg-green-400 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            }`}
          >
            {gameState === "playing" ? `Cash Out (₹${(betAmount * multiplier).toFixed(2)})` : gameState === "cashed_out" ? "Waiting for Crash..." : "Start Game"}
          </button>
        </div>
      </div>

      {/* Interactive Game Canvas */}
      <div className={`flex-1 relative flex flex-col items-center justify-center p-8 transition-colors duration-500 overflow-hidden ${
        gameState === "crashed" && !cashoutAt ? "bg-red-950/20" :
        gameState === "cashed_out" ? "bg-green-950/10" : "bg-slate-900"
      }`}>
        
        {/* Dynamic Chart Background Line (SVG) */}
        <div className="absolute bottom-0 left-0 w-full h-[80%] opacity-30 pointer-events-none">
           <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
             <motion.path 
               d={`M0,100 Q${Math.min(100, (multiplier-1)*20)},${100 - Math.min(100, (multiplier-1)*20)} 100,${100 - Math.min(100, (multiplier-1)*15)}`}
               fill="none" 
               stroke={gameState === "crashed" ? "#ef4444" : "#eab308"} 
               strokeWidth="2" 
             />
             <motion.path 
               d={`M0,100 Q${Math.min(100, (multiplier-1)*20)},${100 - Math.min(100, (multiplier-1)*20)} 100,${100 - Math.min(100, (multiplier-1)*15)} L100,100 Z`}
               fill={gameState === "crashed" ? "url(#grad-red)" : "url(#grad-yellow)"}
             />
             <defs>
               <linearGradient id="grad-yellow" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="0%" stopColor="#eab308" stopOpacity="0.5" />
                 <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
               </linearGradient>
               <linearGradient id="grad-red" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
                 <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
               </linearGradient>
             </defs>
           </svg>
        </div>

        <motion.div 
          className={`text-[5rem] md:text-[8rem] font-black drop-shadow-2xl tabular-nums tracking-tighter z-10 ${
            gameState === "crashed" ? "text-red-500" : 
            gameState === "cashed_out" ? "text-neon-green" : "text-white"
          }`}
        >
          {multiplier.toFixed(2)}<span className="text-3xl md:text-4xl opacity-50 ml-2">x</span>
        </motion.div>

        {gameState === "crashed" && (
          <div className="text-red-500 font-bold text-2xl uppercase tracking-widest mt-4 z-10 bg-slate-950/80 px-6 py-2 rounded-full border border-red-500/30">Crashed @ {crashPoint.toFixed(2)}x</div>
        )}

        {cashoutAt && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="absolute top-10 bg-green-500/20 border border-green-500/50 text-neon-green px-6 py-2 rounded-full font-bold text-lg z-10 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
          >
            Cashed Out: {cashoutAt.toFixed(2)}x (Won ₹{payout})
          </motion.div>
        )}
      </div>
    </div>
  );
}
