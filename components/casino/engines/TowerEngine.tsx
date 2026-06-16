"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTradingStore } from "@/lib/store";
import { ShieldCheck, Skull, Star } from "lucide-react";

interface TowerEngineProps {
  isPlaying: boolean;
  betAmount?: number;
  onLiveTick?: (multiplier: number, clickCount: number) => void;
  onComplete: (multiplier: number, won: boolean) => void;
}

const ROWS = 9;
const COLS = 3;

// Multipliers for Normal difficulty (1 bomb, 2 safe per row)
const MULTIPLIERS = [
  1.42, 2.13, 3.20, 4.80, 7.20, 10.8, 16.2, 24.3, 36.4
];

type TileState = 'hidden' | 'safe' | 'bomb';

export function TowerEngine({ isPlaying, betAmount = 10, onLiveTick, onComplete }: TowerEngineProps) {
  const houseEdge = useTradingStore(state => state.houseEdge);
  
  const [activeRow, setActiveRow] = useState(0);
  const [grid, setGrid] = useState<TileState[][]>(Array(ROWS).fill(Array(COLS).fill('hidden')));
  // Pre-generate the bombs for this round. One bomb per row.
  const [bombPositions, setBombPositions] = useState<number[]>([]);
  const [isCrashed, setIsCrashed] = useState(false);
  const [isCashedOut, setIsCashedOut] = useState(false);
  
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const onLiveTickRef = useRef(onLiveTick);
  useEffect(() => {
    onLiveTickRef.current = onLiveTick;
  }, [onLiveTick]);

  // Reset or initialize game
  useEffect(() => {
    if (!isPlaying) {
      setActiveRow(0);
      setGrid(Array(ROWS).fill(Array(COLS).fill('hidden')));
      setIsCrashed(false);
      setIsCashedOut(false);
      onLiveTickRef.current?.(1.0, 0);
      return;
    }

    // Generate bombs
    const newBombs = [];
    for (let i = 0; i < ROWS; i++) {
      newBombs.push(Math.floor(Math.random() * COLS));
    }
    setBombPositions(newBombs);
    
    // Create new fresh grid (deep copy so rows are independent)
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill('hidden')));
    onLiveTickRef.current?.(1.0, 0);
  }, [isPlaying]);

  const handleTileClick = (rowIndex: number, colIndex: number) => {
    if (!isPlaying || isCrashed || isCashedOut) return;
    if (rowIndex !== activeRow) return;

    const isBomb = bombPositions[rowIndex] === colIndex;

    const newGrid = [...grid];
    const newRow = [...newGrid[rowIndex]];
    newRow[colIndex] = isBomb ? 'bomb' : 'safe';
    newGrid[rowIndex] = newRow;
    setGrid(newGrid);

    if (isBomb) {
      // Reveal all other bombs on this row
      const revealedRow = [...newRow];
      for (let i = 0; i < COLS; i++) {
        if (i !== colIndex && bombPositions[rowIndex] === i) {
          revealedRow[i] = 'bomb';
        } else if (i !== colIndex) {
          revealedRow[i] = 'safe';
        }
      }
      newGrid[rowIndex] = revealedRow;
      setGrid(newGrid);
      setIsCrashed(true);
      onLiveTickRef.current?.(0, 0);
      onCompleteRef.current(0, false);
    } else {
      // Advance to next row
      if (rowIndex === ROWS - 1) {
        setIsCashedOut(true);
        onLiveTickRef.current?.(MULTIPLIERS[ROWS - 1], 0);
        onCompleteRef.current(MULTIPLIERS[ROWS - 1], true);
      } else {
        const nextMult = MULTIPLIERS[activeRow];
        setActiveRow(activeRow + 1);
        onLiveTickRef.current?.(nextMult, activeRow + 1);
      }
    }
  };

  const handleCashout = () => {
    if (!isPlaying || isCrashed || isCashedOut || activeRow === 0) return;
    setIsCashedOut(true);
    const mult = MULTIPLIERS[activeRow - 1];
    onLiveTickRef.current?.(mult, 0);
    onCompleteRef.current(mult, true);
  };

  // Keyboard and event cashout hotkeys
  useEffect(() => {
    const handleTriggerCashout = () => {
      if (isPlaying && !isCrashed && !isCashedOut && activeRow > 0) {
        handleCashout();
      }
    };
    window.addEventListener("trigger-cashout", handleTriggerCashout);
    window.addEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    return () => {
      window.removeEventListener("trigger-cashout", handleTriggerCashout);
      window.removeEventListener("sidebar-trigger-cashout", handleTriggerCashout);
    };
  }, [isPlaying, isCrashed, isCashedOut, activeRow]);

  const currentMultiplier = activeRow > 0 ? MULTIPLIERS[activeRow - 1] : 1.0;

  return (
    <div className="w-full h-full min-h-[500px] md:min-h-[600px] bg-slate-950 rounded-3xl border border-slate-800 relative flex flex-col md:flex-row items-center justify-center overflow-hidden p-6 gap-8 shadow-2xl">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Multiplier Tower Display */}
      <div className="hidden md:flex flex-col-reverse justify-between h-[450px] w-24 z-10">
        {MULTIPLIERS.map((mult, idx) => (
          <motion.div 
            key={idx}
            animate={{ 
              scale: activeRow === idx ? 1.1 : 1,
              opacity: activeRow >= idx ? 1 : 0.3
            }}
            className={`w-full text-right font-mono font-bold text-lg transition-colors duration-300 ${activeRow === idx ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]' : activeRow > idx ? 'text-emerald-400' : 'text-slate-500'}`}
          >
            {mult.toFixed(2)}x
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="relative z-10 flex flex-col-reverse gap-2 h-auto max-w-[400px] w-full mx-auto flex-1 justify-center">
        {grid.map((row, rIndex) => {
          const isActive = rIndex === activeRow && !isCrashed && !isCashedOut && isPlaying;
          const isPassed = rIndex < activeRow;

          return (
            <div key={rIndex} className={`grid grid-cols-3 gap-2 w-full transition-all duration-300 ${!isActive && !isPassed ? 'opacity-40' : 'opacity-100'}`}>
              {row.map((tile, cIndex) => {
                
                let tileContent = null;
                let bgClass = "bg-slate-800 hover:bg-slate-700 border-slate-700";
                
                if (tile === 'safe') {
                  bgClass = "bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                  tileContent = <Star className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" />;
                } else if (tile === 'bomb') {
                  bgClass = "bg-red-500/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]";
                  tileContent = <Skull className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />;
                }

                if ((isCrashed || isCashedOut) && tile === 'hidden') {
                  const wasBomb = bombPositions[rIndex] === cIndex;
                  if (wasBomb) {
                    bgClass = "bg-red-500/5 border-red-500/10 opacity-50";
                    tileContent = <Skull className="w-5 h-5 text-red-500/30" />;
                  } else {
                    bgClass = "bg-emerald-500/5 border-emerald-500/10 opacity-50";
                    tileContent = <Star className="w-5 h-5 text-emerald-400/30" />;
                  }
                }

                return (
                  <button
                    key={cIndex}
                    disabled={!isActive}
                    onClick={() => handleTileClick(rIndex, cIndex)}
                    className={`relative h-14 md:h-16 rounded-xl border flex items-center justify-center transition-all duration-300 ${isActive ? 'cursor-pointer hover:scale-[1.02] active:scale-95 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:border-blue-500/50' : 'cursor-default'} ${bgClass}`}
                  >
                    {isActive && tile === 'hidden' && (
                      <div className="absolute inset-0 bg-blue-400/10 rounded-xl animate-pulse" />
                    )}
                    <AnimatePresence>
                      {tileContent && (
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="z-10"
                        >
                          {tileContent}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Game State Overlays */}
      <AnimatePresence>
        {isCrashed && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm pointer-events-none"
          >
            <div className="bg-slate-900 border border-red-500/30 p-8 rounded-3xl flex flex-col items-center shadow-[0_0_50px_rgba(239,68,68,0.2)]">
              <Skull className="w-16 h-16 text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
              <h2 className="text-3xl font-black text-white tracking-wider">BUSTED</h2>
              <p className="text-slate-400 mt-2 font-mono">Row {activeRow + 1} Failed</p>
            </div>
          </motion.div>
        )}

        {isCashedOut && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm pointer-events-none"
          >
            <div className="bg-slate-900 border border-emerald-500/30 p-8 rounded-3xl flex flex-col items-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-16 h-16 text-emerald-400 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
              <h2 className="text-3xl font-black text-white tracking-wider">SECURED</h2>
              <p className="text-emerald-400 mt-2 font-mono text-xl">{currentMultiplier.toFixed(2)}x</p>
              <p className="text-slate-300 mt-1 font-bold">₹{(betAmount * currentMultiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cashout Button Panel */}
      <AnimatePresence>
        {isPlaying && !isCrashed && !isCashedOut && activeRow > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[300px] z-30"
          >
            <button
              onClick={handleCashout}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-900 font-black text-xl rounded-2xl shadow-[0_10px_30px_rgba(52,211,153,0.3),inset_0_2px_0_rgba(255,255,255,0.5)] transition-all uppercase tracking-widest border border-emerald-300 flex items-center justify-center gap-3 active:scale-95"
            >
              <span>Cashout</span>
              <span className="bg-slate-900/20 px-3 py-1 rounded-lg">₹{(betAmount * currentMultiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
