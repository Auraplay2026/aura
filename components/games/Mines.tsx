"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Bomb, CircleDollarSign } from "lucide-react";

type GameState = "idle" | "playing" | "busted" | "cashed_out";

export function Mines() {
  const [betAmount, setBetAmount] = useState(10);
  const [minesCount, setMinesCount] = useState(3);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [mineLocations, setMineLocations] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>(Array(25).fill(false));
  const [activeMultiplier, setActiveMultiplier] = useState(1.00);

  // Simple mock progression for multiplier based on mines count and revealed safe tiles
  const nextMultiplier = useMemo(() => {
    const safeRevealed = revealed.filter((v, i) => v && !mineLocations.includes(i)).length;
    // Base math: Total Safe = 25 - minesCount. 
    // This is a simplified edge calculation for front-end demonstration.
    return activeMultiplier * (1 + (minesCount / (25 - safeRevealed)) * 0.95);
  }, [revealed, mineLocations, minesCount, activeMultiplier]);

  const startGame = () => {
    // Generate mines
    const newMines: number[] = [];
    while (newMines.length < minesCount) {
      const r = Math.floor(Math.random() * 25);
      if (!newMines.includes(r)) newMines.push(r);
    }
    setMineLocations(newMines);
    setRevealed(Array(25).fill(false));
    setActiveMultiplier(1.00);
    setGameState("playing");
  };

  const handleTileClick = (index: number) => {
    if (gameState !== "playing" || revealed[index]) return;

    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);

    if (mineLocations.includes(index)) {
      setGameState("busted");
    } else {
      setActiveMultiplier(nextMultiplier);
      // Check if all safe tiles revealed (Auto Cash Out)
      const safeRevealedCount = newRevealed.filter((v, i) => v && !mineLocations.includes(i)).length;
      if (safeRevealedCount === 25 - minesCount) {
        setGameState("cashed_out");
      }
    }
  };

  const cashOut = () => {
    if (gameState === "playing") {
      setGameState("cashed_out");
    }
  };

  const payout = (betAmount * activeMultiplier).toFixed(2);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto h-[600px] bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
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
              disabled={gameState === "playing"}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full bg-transparent text-white font-bold px-3 focus:outline-none disabled:opacity-50"
            />
            <button disabled={gameState === "playing"} onClick={() => setBetAmount(Math.max(1, betAmount / 2))} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold disabled:opacity-50">1/2</button>
            <div className="w-[1px] bg-slate-800 mx-1"></div>
            <button disabled={gameState === "playing"} onClick={() => setBetAmount(betAmount * 2)} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold disabled:opacity-50">2x</button>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-400 mb-2 block">Mines</label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 3, 5, 10, 24].map(n => (
              <button 
                key={n}
                disabled={gameState === "playing"}
                onClick={() => setMinesCount(n)}
                className={`py-2 rounded-lg font-bold text-sm transition-colors ${
                  minesCount === n ? "bg-slate-700 text-white" : "bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800 disabled:opacity-50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          {gameState === "playing" ? (
            <button 
              onClick={cashOut}
              className="w-full py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 shadow-lg bg-neon-green hover:bg-green-400 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              Cash Out (₹{payout})
            </button>
          ) : (
            <button 
              onClick={startGame}
              className="w-full py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 shadow-lg bg-neon-purple hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            >
              Start Game
            </button>
          )}
        </div>
      </div>

      {/* Interactive Game Canvas */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-8 bg-slate-900 overflow-hidden">
        
        {gameState === "cashed_out" && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="absolute top-10 z-20 bg-green-500/20 border border-green-500/50 text-neon-green px-8 py-3 rounded-full font-black text-xl shadow-[0_0_30px_rgba(34,197,94,0.3)]"
          >
            {activeMultiplier.toFixed(2)}x (Won ₹{payout})
          </motion.div>
        )}

        {gameState === "busted" && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="absolute top-10 z-20 bg-red-500/20 border border-red-500/50 text-red-500 px-8 py-3 rounded-full font-black text-xl shadow-[0_0_30px_rgba(239,68,68,0.3)]"
          >
            Busted!
          </motion.div>
        )}

        <div className="grid grid-cols-5 gap-3 w-full max-w-[400px] aspect-square relative z-10">
          {Array(25).fill(null).map((_, i) => {
            const isRevealed = revealed[i] || gameState === "busted" || gameState === "cashed_out";
            const isMine = mineLocations.includes(i);
            // Highlight the mine that blew us up
            const isBustMine = gameState === "busted" && isMine && revealed[i];

            return (
              <motion.button
                key={i}
                disabled={gameState !== "playing" || revealed[i]}
                onClick={() => handleTileClick(i)}
                whileHover={gameState === "playing" && !revealed[i] ? { scale: 1.05 } : {}}
                whileTap={gameState === "playing" && !revealed[i] ? { scale: 0.95 } : {}}
                className="relative w-full h-full rounded-xl"
                style={{ perspective: 1000 }}
              >
                <motion.div
                  className="w-full h-full relative preserve-3d"
                  animate={{ rotateY: isRevealed ? 180 : 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Front (Hidden state) */}
                  <div className="absolute inset-0 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 shadow-md flex items-center justify-center backface-hidden" style={{ backfaceVisibility: "hidden" }} />
                  
                  {/* Back (Revealed state) */}
                  <div 
                    className={`absolute inset-0 rounded-xl border shadow-inner flex items-center justify-center backface-hidden ${
                      isBustMine ? "bg-red-500 border-red-400 z-20" :
                      isMine ? "bg-slate-800 border-slate-700 opacity-60" :
                      "bg-slate-700 border-slate-600"
                    }`} 
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    {isMine ? (
                      <Bomb className={`w-8 h-8 ${isBustMine ? "text-slate-950" : "text-slate-500"}`} />
                    ) : (
                      <CircleDollarSign className="w-8 h-8 text-neon-yellow drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                    )}
                  </div>
                </motion.div>
              </motion.button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
