"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Coinflip() {
  const [betAmount, setBetAmount] = useState(10);
  const [selectedSide, setSelectedSide] = useState<"heads" | "tails" | null>(null);
  const [gameState, setGameState] = useState<"idle" | "flipping" | "resolved">("idle");
  const [result, setResult] = useState<"heads" | "tails" | null>(null);

  const handleFlip = () => {
    if (!selectedSide || gameState === "flipping") return;
    setGameState("flipping");
    setResult(null);

    setTimeout(() => {
      const willWin = Math.random() < 0.02;
      const outcome = willWin ? selectedSide : (selectedSide === "heads" ? "tails" : "heads");
      setResult(outcome);
      setGameState("resolved");
    }, 2000);
  };

  const isWin = result === selectedSide;
  const payout = isWin ? (betAmount * 1.98).toFixed(2) : "0.00";

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-[600px] bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Betting Controller */}
      <div className="w-full lg:w-80 bg-slate-900/50 p-6 flex flex-col gap-6 border-r border-slate-800 shrink-0">
        <div>
          <label className="text-sm font-bold text-slate-400 mb-2 flex justify-between">
            <span>Bet Amount</span>
            <span className="text-slate-500">₹</span>
          </label>
          <div className="flex bg-slate-950 rounded-xl border border-slate-800 p-1">
            <input 
              type="number" 
              value={betAmount} 
              disabled={gameState === "flipping"}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full bg-transparent text-white font-bold px-3 focus:outline-none disabled:opacity-50"
            />
            <button disabled={gameState === "flipping"} onClick={() => setBetAmount(Math.max(1, betAmount / 2))} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold disabled:opacity-50">1/2</button>
            <div className="w-[1px] bg-slate-800 mx-1"></div>
            <button disabled={gameState === "flipping"} onClick={() => setBetAmount(betAmount * 2)} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold disabled:opacity-50">2x</button>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-400 mb-2 block">Select Side</label>
          <div className="flex gap-2">
            <button 
              disabled={gameState === "flipping"}
              onClick={() => setSelectedSide("heads")}
              className={`flex-1 py-4 rounded-xl font-black text-lg transition-all border-2 ${
                selectedSide === "heads" ? "bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]" : "bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900"
              }`}
            >
              HEADS
            </button>
            <button 
              disabled={gameState === "flipping"}
              onClick={() => setSelectedSide("tails")}
              className={`flex-1 py-4 rounded-xl font-black text-lg transition-all border-2 ${
                selectedSide === "tails" ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900"
              }`}
            >
              TAILS
            </button>
          </div>
        </div>

        <div className="mt-auto">
          <button 
            onClick={handleFlip}
            disabled={gameState === "flipping" || !selectedSide}
            className={`w-full py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 shadow-lg ${
              gameState === "flipping" ? "bg-slate-800 text-slate-500" :
              !selectedSide ? "bg-slate-800 text-slate-500 cursor-not-allowed" :
              "bg-neon-green hover:bg-green-400 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            }`}
          >
            {gameState === "flipping" ? "Flipping..." : "Flip Coin (1.98x)"}
          </button>
        </div>
      </div>

      {/* Interactive Game Canvas */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-8 bg-slate-950 overflow-hidden perspective-1000">
        
        {/* Dynamic mesh gradient background */}
        <div className={`absolute inset-0 opacity-20 transition-all duration-1000 ${
          gameState === "resolved" ? (isWin ? "bg-[radial-gradient(circle,rgba(34,197,94,0.4)_0%,transparent_70%)]" : "bg-[radial-gradient(circle,rgba(239,68,68,0.4)_0%,transparent_70%)]") : "bg-transparent"
        }`} />

        <div className="relative w-64 h-64 mb-10" style={{ transformStyle: "preserve-3d" }}>
          <motion.div
            animate={{
              rotateX: gameState === "flipping" ? [0, 1080 + (result === "tails" ? 180 : 0)] : (result === "tails" ? 180 : 0),
              y: gameState === "flipping" ? [0, -150, 0] : 0,
            }}
            transition={{
              duration: gameState === "flipping" ? 2 : 0.5,
              ease: gameState === "flipping" ? "easeInOut" : "easeOut",
            }}
            className="w-full h-full relative"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Heads (Front) */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-8 border-yellow-300 flex items-center justify-center shadow-2xl backface-hidden" style={{ backfaceVisibility: "hidden" }}>
              <div className="w-48 h-48 rounded-full border-4 border-yellow-300/50 flex flex-col items-center justify-center text-yellow-100">
                <span className="font-black text-4xl tracking-widest">HEADS</span>
              </div>
            </div>

            {/* Tails (Back) */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border-8 border-blue-400 flex items-center justify-center shadow-2xl backface-hidden" style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}>
              <div className="w-48 h-48 rounded-full border-4 border-blue-400/50 flex flex-col items-center justify-center text-blue-100">
                <span className="font-black text-4xl tracking-widest">TAILS</span>
              </div>
            </div>
            
            {/* Edge (3D illusion layer) */}
            <div className="absolute inset-0 rounded-full bg-yellow-800 -z-10 translate-z-[-2px] border-8 border-transparent" style={{ transform: "translateZ(-2px)" }} />
          </motion.div>
        </div>

        <AnimatePresence>
          {gameState === "resolved" && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className={`px-8 py-3 rounded-full font-black text-2xl z-10 border shadow-2xl ${
                isWin ? "bg-green-500/20 text-neon-green border-green-500/50" : "bg-red-500/20 text-red-500 border-red-500/50"
              }`}
            >
              {isWin ? `You Won ₹${payout}` : "You Lost"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
