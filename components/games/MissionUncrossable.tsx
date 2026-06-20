"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Bomb, CircleDollarSign } from "lucide-react";

type GameState = "idle" | "playing" | "busted" | "cashed_out";
type Difficulty = "low" | "medium" | "high";

const DIFFICULTY_SETTINGS = {
  low: { bombsPerRow: 1, cols: 4, rows: 10 },
  medium: { bombsPerRow: 2, cols: 4, rows: 10 },
  high: { bombsPerRow: 3, cols: 4, rows: 10 },
};

export function MissionUncrossable() {
  const [betAmount, setBetAmount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameState, setGameState] = useState<GameState>("idle");
  const [activeRow, setActiveRow] = useState(0); // 0 is bottom row, 9 is top row
  
  // Grid state: [row][col] -> null (hidden), true (safe), false (bomb)
  const [gridState, setGridState] = useState<(boolean | null)[][]>(Array(10).fill(Array(4).fill(null)));
  const [bombLocations, setBombLocations] = useState<number[][]>([]); // Array of rows, each containing bomb column indices

  const activeMultiplier = useMemo(() => {
    if (activeRow === 0) return 1.00;
    // Mock multiplier compounding
    const safeTilesPer = DIFFICULTY_SETTINGS[difficulty].cols - DIFFICULTY_SETTINGS[difficulty].bombsPerRow;
    return Math.pow(1 + (DIFFICULTY_SETTINGS[difficulty].bombsPerRow / safeTilesPer) * 0.95, activeRow);
  }, [activeRow, difficulty]);

  const startGame = () => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const newBombLocations: number[][] = [];
    
    for (let r = 0; r < settings.rows; r++) {
      const rowBombs: number[] = [];
      while (rowBombs.length < settings.bombsPerRow) {
        const c = Math.floor(Math.random() * settings.cols);
        if (!rowBombs.includes(c)) rowBombs.push(c);
      }
      newBombLocations.push(rowBombs);
    }
    
    setBombLocations(newBombLocations);
    setGridState(Array(10).fill(Array(4).fill(null)));
    setActiveRow(0);
    setGameState("playing");
  };

  const handleTileClick = (row: number, col: number) => {
    if (gameState !== "playing" || row !== activeRow) return;

    // Rigged check: 98% chance to lose by placing a bomb under the player's choice
    let currentBombs = [...bombLocations[row]];
    const isRigged = Math.random() > 0.02;
    if (isRigged && !currentBombs.includes(col)) {
      currentBombs.push(col);
      const newBombLocations = [...bombLocations];
      newBombLocations[row] = currentBombs;
      setBombLocations(newBombLocations);
    }

    const isBomb = currentBombs.includes(col);
    
    // Deep copy grid state to update
    const newGrid = gridState.map(r => [...r]);
    newGrid[row][col] = !isBomb;
    setGridState(newGrid);

    if (isBomb) {
      setGameState("busted");
      // Reveal rest of the row's bombs
      const finalGrid = gridState.map(r => [...r]);
      for (let c = 0; c < 4; c++) {
        if (currentBombs.includes(c)) {
          finalGrid[row][c] = false;
        }
      }
      setGridState(finalGrid);
    } else {
      if (activeRow === 9) {
        setActiveRow(10); // Finished!
        setGameState("cashed_out");
      } else {
        setActiveRow(r => r + 1);
      }
    }
  };

  const cashOut = () => {
    if (gameState === "playing" && activeRow > 0) {
      setGameState("cashed_out");
    }
  };

  const payout = (betAmount * activeMultiplier).toFixed(2);
  const rows = [...Array(10)].map((_, i) => 9 - i); // Render top to bottom (9 down to 0)

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto h-[600px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-2xl">
      {/* Betting Controller */}
      <div className="w-full lg:w-80 bg-slate-50/50 p-6 flex flex-col gap-6 border-r border-slate-200 shrink-0 overflow-y-auto custom-scrollbar">
        <div>
          <label className="text-sm font-bold text-slate-600 mb-2 flex justify-between">
            <span>Bet Amount</span>
            <span className="text-slate-500">₹</span>
          </label>
          <div className="flex bg-white rounded-xl border border-slate-200 p-1">
            <input 
              type="number" 
              value={betAmount} 
              disabled={gameState === "playing"}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full bg-transparent text-slate-900 font-bold px-3 focus:outline-none disabled:opacity-50"
            />
            <button disabled={gameState === "playing"} onClick={() => setBetAmount(Math.max(1, betAmount / 2))} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold disabled:opacity-50">1/2</button>
            <div className="w-[1px] bg-slate-100 mx-1"></div>
            <button disabled={gameState === "playing"} onClick={() => setBetAmount(betAmount * 2)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold disabled:opacity-50">2x</button>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-600 mb-2 block">Difficulty</label>
          <div className="grid grid-cols-3 gap-2">
            {(["low", "medium", "high"] as Difficulty[]).map(d => (
              <button 
                key={d}
                disabled={gameState === "playing"}
                onClick={() => setDifficulty(d)}
                className={`py-2 rounded-lg font-bold text-sm capitalize transition-colors ${
                  difficulty === d ? "bg-slate-100 text-slate-900" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          {gameState === "playing" && activeRow > 0 ? (
            <button 
              onClick={cashOut}
              className="w-full py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 shadow-lg bg-neon-green hover:bg-green-400 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              Cash Out (₹{payout})
            </button>
          ) : (
            <button 
              onClick={startGame}
              disabled={gameState === "playing"}
              className="w-full py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 shadow-lg bg-neon-purple hover:bg-purple-500 text-slate-900 shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50"
            >
              Start Game
            </button>
          )}
        </div>
      </div>

      {/* Interactive Game Canvas */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-6 bg-white overflow-hidden">
        
        {gameState === "cashed_out" && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            className="absolute top-8 z-20 bg-green-500/20 border border-green-500/50 text-neon-green px-8 py-3 rounded-full font-black text-xl shadow-[0_0_30px_rgba(34,197,94,0.3)]"
          >
            {activeMultiplier.toFixed(2)}x (Won ₹{payout})
          </motion.div>
        )}

        {gameState === "busted" && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            className="absolute top-8 z-20 bg-red-500/20 border border-red-500/50 text-red-500 px-8 py-3 rounded-full font-black text-xl shadow-[0_0_30px_rgba(239,68,68,0.3)]"
          >
            Busted!
          </motion.div>
        )}

        {/* Tower Grid */}
        <div className="flex flex-col gap-2 w-full max-w-sm">
          {rows.map((rowIdx) => {
            const isRowActive = gameState === "playing" && activeRow === rowIdx;
            const isRowPassed = activeRow > rowIdx || gameState === "cashed_out";
            
            return (
              <div key={rowIdx} className={`grid grid-cols-4 gap-2 h-10 ${isRowActive ? 'opacity-100' : isRowPassed ? 'opacity-70' : 'opacity-40'}`}>
                {[0, 1, 2, 3].map(colIdx => {
                  const state = gridState[rowIdx][colIdx];
                  
                  return (
                    <motion.button
                      key={colIdx}
                      disabled={!isRowActive}
                      onClick={() => handleTileClick(rowIdx, colIdx)}
                      whileHover={isRowActive ? { scale: 1.05 } : {}}
                      whileTap={isRowActive ? { scale: 0.95 } : {}}
                      className={`relative w-full h-full rounded-md border ${
                        state === true ? "bg-green-500/20 border-green-500/50 flex items-center justify-center" :
                        state === false ? "bg-red-500 border-red-400 flex items-center justify-center z-10" :
                        isRowActive ? "bg-slate-100 hover:bg-slate-100 border-slate-600 shadow-[0_0_15px_rgba(255,255,255,0.1)]" :
                        "bg-slate-100 border-slate-700"
                      }`}
                    >
                      {state === true && <CircleDollarSign className="w-5 h-5 text-neon-green" />}
                      {state === false && <Bomb className="w-5 h-5 text-slate-950" />}
                    </motion.button>
                  );
                })}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
