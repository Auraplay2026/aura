"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins } from "lucide-react";
import { playGameSound } from "@/lib/audio";
import { calculateGameOutcome } from "@/lib/fair-casino-math";
import { evaluateRoulettePayouts, EUROPEAN_NUMBERS, LIGHTNING_CONFIG } from "@/lib/roulette-math";
import { useTradingStore } from "@/lib/store";

// ═══════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════

interface RouletteEngineProps {
  isPlaying: boolean;
  betAmount: number;
  onBetAmountChange: (amount: number) => void;
  onStartGame: () => void;
  onComplete: (multiplier: number, won: boolean) => void;
  activeChip?: number;
  onActiveChipChange?: (chip: number) => void;
  balance?: number;
  gameId?: string;
  gameTitle?: string;
}

interface NumberConfig {
  n: number;
  color: "red" | "black" | "green";
  label?: string;
}

const NUMBERS: NumberConfig[] = [
  { n: 0, color: "green", label: "Green" },
  { n: 32, color: "red", label: "Red" },
  { n: 15, color: "black", label: "Black" },
  { n: 19, color: "red", label: "Red" },
  { n: 4, color: "black", label: "Black" },
  { n: 21, color: "red", label: "Red" },
  { n: 2, color: "black", label: "Black" },
  { n: 25, color: "red", label: "Red" },
  { n: 17, color: "black", label: "Black" },
  { n: 34, color: "red", label: "Red" },
  { n: 6, color: "black", label: "Black" },
  { n: 27, color: "red", label: "Red" },
  { n: 13, color: "black", label: "Black" },
  { n: 36, color: "red", label: "Red" },
  { n: 11, color: "black", label: "Black" },
  { n: 30, color: "red", label: "Red" },
  { n: 8, color: "black", label: "Black" },
  { n: 23, color: "red", label: "Red" },
  { n: 10, color: "black", label: "Black" },
  { n: 5, color: "red", label: "Red" },
  { n: 24, color: "black", label: "Black" },
  { n: 16, color: "red", label: "Red" },
  { n: 33, color: "black", label: "Black" },
  { n: 1, color: "red", label: "Red" },
  { n: 20, color: "black", label: "Black" },
  { n: 14, color: "red", label: "Red" },
  { n: 31, color: "black", label: "Black" },
  { n: 9, color: "red", label: "Red" },
  { n: 22, color: "black", label: "Black" },
  { n: 18, color: "red", label: "Red" },
  { n: 29, color: "black", label: "Black" },
  { n: 7, color: "red", label: "Red" },
  { n: 28, color: "black", label: "Black" },
  { n: 12, color: "red", label: "Red" },
  { n: 35, color: "black", label: "Black" },
  { n: 3, color: "red", label: "Red" },
  { n: 26, color: "black", label: "Black" }
];

interface VIPPlayer {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  streak: number;
  activeBet: number;
  lastOutcome?: "win" | "loss";
  payoutDiff?: number;
}

const INITIAL_VIP_PLAYERS: VIPPlayer[] = [
  { id: "vip1", name: "Viper_Queen", avatar: "🐍", balance: 754000, streak: 3, activeBet: 0 },
  { id: "vip2", name: "Cyber_Sovereign", avatar: "🌐", balance: 1432000, streak: 5, activeBet: 0 },
  { id: "vip3", name: "Aegis_Alpha", avatar: "🛡️", balance: 521000, streak: 0, activeBet: 0 }
];

export function LightningRoulette({ 
  isPlaying, 
  betAmount, 
  onBetAmountChange, 
  onStartGame, 
  onComplete,
  activeChip: propActiveChip,
  onActiveChipChange,
  balance = 0,
  gameId,
  gameTitle
}: RouletteEngineProps) {
  const currentUser = useTradingStore(state => state.currentUser);
  const email = currentUser?.email || "twintubrovquattro@gmail.com";
  
  // Game & Bets States
  const [localActiveChip, setLocalActiveChip] = useState<number>(100);
  const activeChip = propActiveChip !== undefined ? propActiveChip : localActiveChip;
  const setActiveChip = onActiveChipChange !== undefined ? onActiveChipChange : setLocalActiveChip;
  const [bets, setBets] = useState<Record<string, number>>({});
  const [betHistory, setBetHistory] = useState<{ cell: string; amount: number }[]>([]);
  const [prevBets, setPrevBets] = useState<Record<string, number>>({});
  
  // Wheel State
  const [rotation, setRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [ballRadiusOffset, setBallRadiusOffset] = useState(0);
  const [winningNumber, setWinningNumber] = useState<NumberConfig | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWheelOverlay, setShowWheelOverlay] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const [lightningNumbers, setLightningNumbers] = useState<Record<number, number>>({});

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // HUD & Lobby Simulation States
  const [vips, setVips] = useState<VIPPlayer[]>(INITIAL_VIP_PLAYERS);
  const [outcomeHistory, setOutcomeHistory] = useState<NumberConfig[]>([
    { n: 17, color: "black", label: "Black" },
    { n: 32, color: "red", label: "Red" },
    { n: 0, color: "green", label: "Green" },
    { n: 25, color: "red", label: "Red" },
    { n: 4, color: "black", label: "Black" }
  ]);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [wonAmount, setWonAmount] = useState(0);
  const [coinsShower, setCoinsShower] = useState<{id:number, x:number, rotate:number, duration:number, left:number}[]>([]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Calculate sum of active bets
  const totalBetsSum = Object.values(bets).reduce((acc, curr) => acc + curr, 0);

  // Sync stakes size back to page container
  useEffect(() => {
    if (totalBetsSum > 0) {
      onBetAmountChange(totalBetsSum);
    }
  }, [totalBetsSum, onBetAmountChange]);

  // VIP Bets Placement Simulation before spin
  const generateVIPBets = useCallback(() => {
    setVips(prev => prev.map(vip => {
      const places = ["red", "black", "even", "odd", "doz-1", "doz-2", "doz-3", "num-17", "num-32", "num-0"];
      const chosenPlace = places[Math.floor(Math.random() * places.length)];
      const betVal = Math.random() > 0.6 ? 5000 : 1000;
      
      return {
        ...vip,
        activeBet: betVal,
        balance: vip.balance - betVal
      };
    }));
  }, []);

  // VIP Winnings Processing on spin complete
  const processVIPWinnings = useCallback((winningNum: NumberConfig) => {
    setVips(prev => prev.map(vip => {
      let isWin = false;
      let multiplier = 0;
      
      // Rough simulation of their wins
      if (Math.random() > 0.65) {
        isWin = true;
        multiplier = Math.random() > 0.8 ? 35 : 2;
      }

      const payout = isWin ? vip.activeBet * multiplier : 0;
      const profitDiff = payout - vip.activeBet;

      return {
        ...vip,
        balance: vip.balance + payout,
        activeBet: 0,
        streak: isWin ? vip.streak + 1 : 0,
        lastOutcome: isWin ? "win" as const : "loss" as const,
        payoutDiff: profitDiff
      };
    }));
  }, []);

  // Place bet on board
  const placeBet = (cell: string) => {
    if (isSpinning) return;
    try { playGameSound("click"); } catch {}
    
    setBets(prev => ({
      ...prev,
      [cell]: (prev[cell] || 0) + activeChip
    }));
    
    setBetHistory(prev => [
      ...prev,
      { cell, amount: activeChip }
    ]);
  };

  // Undo last chip placed
  const undoLastBet = () => {
    if (isSpinning || betHistory.length === 0) return;
    try { playGameSound("click"); } catch {}
    
    const last = betHistory[betHistory.length - 1];
    setBets(prev => {
      const updated = { ...prev };
      updated[last.cell] = Math.max(0, (updated[last.cell] || 0) - last.amount);
      if (updated[last.cell] === 0) {
        delete updated[last.cell];
      }
      return updated;
    });
    setBetHistory(prev => prev.slice(0, -1));
  };

  // Double all bets on table
  const doubleAllBets = () => {
    if (isSpinning || totalBetsSum === 0) return;
    try { playGameSound("click"); } catch {}
    
    const doubledHistory: typeof betHistory = [];
    setBets(prev => {
      const doubled = { ...prev };
      for (const key in doubled) {
        doubledHistory.push({ cell: key, amount: doubled[key] });
        doubled[key] = doubled[key] * 2;
      }
      return doubled;
    });
    setBetHistory(prev => [...prev, ...doubledHistory]);
  };

  // Clear all chips from felt
  const clearAllBets = () => {
    if (isSpinning) return;
    try { playGameSound("click"); } catch {}
    setBets({});
    setBetHistory([]);
  };

  // Repeat Previous wagers
  const repeatLastBets = () => {
    if (isSpinning || Object.keys(prevBets).length === 0) return;
    try { playGameSound("click"); } catch {}
    setBets(prevBets);
    
    const repeatedHistory = Object.entries(prevBets).map(([cell, amount]) => ({ cell, amount }));
    setBetHistory(repeatedHistory);
  };

  // SPIN THE WHEEL TRIGGER
  const handleSpinInit = () => {
    if (isSpinning || totalBetsSum === 0) return;
    
    // Lock controls and start platform bet deductions
    generateVIPBets();
    onStartGame();
  };

  // NextJS/React sync platform isPlaying state
  useEffect(() => {
    if (!isPlaying) {
      setIsSpinning(false);
      return;
    }

    setIsSpinning(true);
    setShowWheelOverlay(true);
    setWinningNumber(null);
    setShowWinOverlay(false);
    const width = typeof window !== "undefined" ? window.innerWidth : 1024;
    const offsetVal = width >= 1024 ? 50 : width >= 768 ? 42 : width >= 640 ? 36 : 28;
    setBallRadiusOffset(offsetVal);

    let isActive = true;

    const executeBet = async () => {
      try {
        const res = await fetch('/api/casino/bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            gameId: gameId || "orig-r6",
            gameTitle: gameTitle || "Lightning Roulette",
            betAmount: totalBetsSum,
            bets: bets
          })
        });
        const data = await res.json();
        if (!isActive) return;

        if (res.ok && data.success) {
          const winningNumVal = data.winningNumber;
          const targetIdx = NUMBERS.findIndex(n => n.n === winningNumVal.n);
          if (targetIdx === -1) {
            setIsSpinning(false);
            onCompleteRef.current(0, false);
            return;
          }

          const result = NUMBERS[targetIdx];
          const segmentAngle = 360 / NUMBERS.length;
          const finalWheelRotation = rotation + 1800 + (360 - (targetIdx * segmentAngle));

          const strikes = data.lightningStrikes || {};
          setLightningNumbers(strikes);
          setRotation(finalWheelRotation);
          setBallRotation(-(2160 + 720)); // Orbit counter-rotation of ball

          // Ball falls into pocket
          setTimeout(() => {
            if (isActive) setBallRadiusOffset(0);
          }, 2400);

          // Spin completes
          setTimeout(() => {
            if (!isActive) return;
            setWinningNumber(result);
            setPrevBets(bets);

            const totalWon = data.payout;
            processVIPWinnings(result);

            if (totalWon > 0) {
              setWonAmount(totalWon);
              setShowWinOverlay(true);
              try { playGameSound("win"); } catch {}
              
              const numCoins = Math.min(80, Math.max(20, Math.floor(totalWon / 100)));
              setCoinsShower(Array.from({ length: numCoins }).map((_, i) => ({
                id: i,
                x: (Math.random() - 0.5) * 200,
                rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                duration: Math.random() * 1.5 + 1.2,
                left: Math.random() * 90
              })));
              setTimeout(() => setCoinsShower([]), 2800);
            } else {
              try { playGameSound("lose"); } catch {}
            }

            const computedMultiplier = totalBetsSum > 0 ? totalWon / totalBetsSum : 0;
            onCompleteRef.current(computedMultiplier, totalWon > 0);
            setBets({});
            setBetHistory([]);

            setTimeout(() => {
              if (isActive) setShowWheelOverlay(false);
            }, 4000);
          }, 4500);

        } else {
          setIsSpinning(false);
          onCompleteRef.current(0, false);
          alert(data.error || "Wager placement failed.");
        }
      } catch (err) {
        console.error("Lightning Roulette bet placement failed", err);
        setIsSpinning(false);
        onCompleteRef.current(0, false);
      }
    };

    executeBet();

    return () => {
      isActive = false;
    };
  }, [isPlaying]);


  // Render chip stack on board cell
  const renderCellChip = (cell: string) => {
    const betVal = bets[cell];
    if (!betVal) return null;

    // Determine colors
    const colorGrad = betVal >= 10000 
      ? "from-purple-600 to-fuchsia-800" 
      : betVal >= 5000 
        ? "from-rose-500 to-pink-700" 
        : betVal >= 1000 
          ? "from-yellow-400 to-amber-600" 
          : betVal >= 500 
            ? "from-teal-400 to-emerald-600" 
            : "from-blue-500 to-indigo-700";

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
        <motion.div
          initial={{ scale: 0.4, y: -10 }}
          animate={{ scale: 1, y: 0 }}
          className={`w-6 h-6 rounded-full bg-gradient-to-br ${colorGrad} border border-white/60 shadow-[0_3px_6px_rgba(0,0,0,0.6)] flex items-center justify-center`}
        >
          <span className="text-[7.5px] font-black text-slate-900 font-mono drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
            {betVal >= 1000 ? `${(betVal/1000).toFixed(0)}k` : betVal}
          </span>
        </motion.div>
      </div>
    );
  };

  // Rendering board horizontally (12 columns x 3 rows)
  const renderNumberCell = (n: number) => {
    const redNumbers = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
    const isRed = redNumbers.has(n);
    return (
      <button
        key={`num-${n}`}
        disabled={isSpinning}
        onClick={() => placeBet(`num-${n}`)}
        className={`relative h-12 flex flex-col items-center justify-center border border-yellow-500/10 cursor-pointer font-black text-sm transition-all active:scale-95 ${
          isRed 
            ? "bg-rose-700 hover:bg-rose-600 text-slate-900" 
            : "bg-white hover:bg-zinc-800 text-slate-900"
        }`}
      >
        <span className="font-mono font-black z-10">{n}</span>
        {lightningNumbers[n] && (
          <div className="absolute inset-0 bg-yellow-400/20 animate-pulse flex items-center justify-center pointer-events-none">
            <span className="text-yellow-400 font-black text-[10px] drop-shadow-[0_0_2px_rgba(0,0,0,1)] z-10 absolute bottom-0.5">
              {lightningNumbers[n]}x
            </span>
          </div>
        )}
        {renderCellChip(`num-${n}`)}
      </button>
    );
  };

  // Render vertical board for mobile touch targeting
  const renderVerticalBoard = () => {
    const redNumbers = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
    
    return (
      <div className="grid grid-cols-5 border-2 border-yellow-500/40 rounded-2xl overflow-hidden bg-[#020e08]/90 text-xs w-full max-w-[340px] xs:max-w-[360px] sm:max-w-xs mx-auto shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        
        {/* Row 1: Zero Cell (Spans Columns 3, 4, 5) */}
        <button
          disabled={isSpinning}
          onClick={() => placeBet("num-0")}
          className="col-start-3 col-span-3 row-start-1 h-[35px] xs:h-[38px] sm:h-11 bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-black font-mono text-base select-none cursor-pointer relative border-b border-yellow-500/40 transition-colors"
        >
          <span className="z-10">0</span>
          {lightningNumbers[0] && (
            <div className="absolute inset-0 bg-yellow-400/20 animate-pulse flex items-center justify-center pointer-events-none">
              <span className="text-yellow-400 font-black text-[10px] drop-shadow-[0_0_2px_rgba(0,0,0,1)] z-10 absolute bottom-0.5">
                {lightningNumbers[0]}x
              </span>
            </div>
          )}
          {renderCellChip("num-0")}
        </button>

        {/* Column 1: Outside Bets (Each spans 2 rows) */}
        {[
          { id: "low", label: "1-18", row: 2, btnClass: "bg-emerald-950/70 hover:bg-emerald-900 text-slate-800 border-r border-b border-yellow-500/40" },
          { id: "even", label: "EVEN", row: 4, btnClass: "bg-emerald-950/70 hover:bg-emerald-900 text-slate-800 border-r border-b border-yellow-500/40" },
          { id: "red", label: "RED", row: 6, btnClass: "bg-rose-700/90 hover:bg-rose-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.2)] border-r border-b border-yellow-500/40" },
          { id: "black", label: "BLACK", row: 8, btnClass: "bg-white hover:bg-zinc-800 text-slate-900 shadow-[inset_0_0_6px_rgba(255,255,255,0.05)] border-r border-b border-yellow-500/40" },
          { id: "odd", label: "ODD", row: 10, btnClass: "bg-emerald-950/70 hover:bg-emerald-900 text-slate-800 border-r border-b border-yellow-500/40" },
          { id: "high", label: "19-36", row: 12, btnClass: "bg-emerald-950/70 hover:bg-emerald-900 text-slate-800 border-r border-b border-yellow-500/40" }
        ].map(out => (
          <button
            key={out.id}
            disabled={isSpinning}
            onClick={() => placeBet(out.id)}
            style={{ gridColumnStart: 1, gridRowStart: out.row, gridRowEnd: out.row + 2 }}
            className={`flex items-center justify-center font-black text-[9px] uppercase tracking-wider cursor-pointer select-none transition-all relative active:scale-95 ${out.btnClass}`}
          >
            {out.id === "red" ? (
              <span className="w-4 h-4 rotate-45 bg-rose-600 border border-white/60 shadow-sm block" />
            ) : out.id === "black" ? (
              <span className="w-4 h-4 rotate-45 bg-white border border-slate-300 shadow-sm block" />
            ) : (
              <span className="-rotate-90 sm:rotate-0 tracking-widest">{out.label}</span>
            )}
            {renderCellChip(out.id)}
          </button>
        ))}

        {/* Column 2: Dozens (Each spans 4 rows) */}
        {[
          { id: "doz-1", label: "1st 12", row: 2 },
          { id: "doz-2", label: "2nd 12", row: 6 },
          { id: "doz-3", label: "3rd 12", row: 10 }
        ].map(doz => (
          <button
            key={doz.id}
            disabled={isSpinning}
            onClick={() => placeBet(doz.id)}
            style={{ gridColumnStart: 2, gridRowStart: doz.row, gridRowEnd: doz.row + 4 }}
            className="bg-emerald-950/60 hover:bg-emerald-900/80 text-slate-800 flex items-center justify-center font-black text-[9px] uppercase tracking-wider cursor-pointer select-none transition-all relative active:scale-95 border-r border-b border-yellow-500/40"
          >
            <span className="-rotate-90 sm:rotate-0 tracking-widest">{doz.label}</span>
            {doz.label && renderCellChip(doz.id)}
          </button>
        ))}

        {/* Columns 3, 4, 5: Numbers Grid (Rows 2 to 13) */}
        {Array.from({ length: 12 }).map((_, rowIdx) => {
          const baseNum = rowIdx * 3 + 1;
          const nums = [baseNum, baseNum + 1, baseNum + 2];
          
          return nums.map((n, colOffset) => {
            const isRed = redNumbers.has(n);
            const gridCol = colOffset + 3;
            const gridRow = rowIdx + 2;
            
            return (
              <button
                key={`num-${n}`}
                disabled={isSpinning}
                onClick={() => placeBet(`num-${n}`)}
                style={{ gridColumnStart: gridCol, gridRowStart: gridRow }}
                className={`h-[35px] xs:h-[38px] sm:h-11 flex items-center justify-center border-b border-yellow-500/10 cursor-pointer font-black text-xs transition-all active:scale-95 ${
                  colOffset < 2 ? "border-r border-yellow-500/10" : ""
                } ${
                  isRed 
                    ? "bg-rose-700/90 hover:bg-rose-600/90 text-slate-900" 
                    : "bg-white hover:bg-zinc-800 text-slate-900"
                }`}
              >
                <span className="font-mono z-10">{n}</span>
                {lightningNumbers[n] && (
                  <div className="absolute inset-0 bg-yellow-400/20 animate-pulse flex items-center justify-center pointer-events-none">
                    <span className="text-yellow-400 font-black text-[8px] drop-shadow-[0_0_2px_rgba(0,0,0,1)] z-10 absolute bottom-0.5">
                      {lightningNumbers[n]}x
                    </span>
                  </div>
                )}
                {renderCellChip(`num-${n}`)}
              </button>
            );
          });
        })}

        {/* Row 14: Column Bets (Col 3, 4, 5 at Row 14) */}
        {[
          { id: "col-1", col: 3 },
          { id: "col-2", col: 4 },
          { id: "col-3", col: 5 }
        ].map(colBet => (
          <button
            key={colBet.id}
            disabled={isSpinning}
            onClick={() => placeBet(colBet.id)}
            style={{ gridColumnStart: colBet.col, gridRowStart: 14 }}
            className={`h-8 xs:h-9 flex items-center justify-center font-black text-[9px] text-yellow-400 uppercase cursor-pointer select-none transition-all relative active:scale-95 bg-emerald-950/80 hover:bg-emerald-900 ${
              colBet.col < 5 ? "border-r border-yellow-500/40" : ""
            }`}
          >
            <span>2:1</span>
            {renderCellChip(colBet.id)}
          </button>
        ))}

      </div>
    );
  };

  const R = windowWidth >= 1024 ? 50 : windowWidth >= 768 ? 42 : windowWidth >= 640 ? 36 : 28;

  const ballRotateKeyframes = [0, -720, -1380, -2000, -2400, -2700, -2780, -2895, -2865, -2887, -2873, -2880];
  const ballYKeyframes = [R, R, R, R, R * 0.7, R * 0.4, R * 0.3, R * 0.1, R * 0.3, R * 0.05, R * 0.2, 0];
  const ballScaleKeyframes = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.9, 1.25, 0.92, 1.15, 1.0];
  const ballTimes = [0, 0.15, 0.3, 0.533, 0.62, 0.71, 0.75, 0.80, 0.83, 0.86, 0.90, 1.0];

  return (
    <div className="w-full max-w-6xl mx-auto px-1 sm:px-4 py-2 sm:py-4 text-slate-900 overflow-visible select-none font-sans relative">
      
      {/* 3D Gold Coins victory shower overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {coinsShower.map((c) => (
          <motion.div
            key={c.id}
            animate={{
              y: [0, 600],
              x: [0, c.x],
              rotate: [0, c.rotate],
            }}
            transition={{
              duration: c.duration,
              ease: "linear",
            }}
            className="absolute w-5 h-5 rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 border border-yellow-200/50 shadow-[0_2px_5px_rgba(0,0,0,0.5)]"
            style={{
              left: `${c.left}%`,
              top: `-30px`,
            }}
          />
        ))}
      </div>

      {/* 1. Sleek Super-Minimalist HUD Header */}
      <div className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-slate-50/80 border-b border-yellow-500/40 backdrop-blur-md rounded-t-2xl shadow-lg text-slate-800 h-12 select-none z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-450" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-black tracking-wider uppercase text-slate-900 truncate max-w-[120px] sm:max-w-none">
            ⚡ Lightning Roulette
          </span>
        </div>

        {/* Active Bets & Roadmap merged into one compact container */}
        <div className="flex items-center gap-4">
          {/* Balance Display */}
          <div className="flex items-center gap-1.5 px-2 bg-white/40 rounded border border-slate-200/50 py-0.5">
            <span className="text-[8px] text-slate-600 uppercase tracking-widest font-bold">Bal:</span>
            <span className="text-[10px] font-black font-mono text-slate-800">₹{balance.toLocaleString()}</span>
          </div>

          {/* Active Bets Counter */}
          <div className="flex items-center gap-1.5 ml-2">
            <Coins className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
            <span className="text-[10px] font-black font-mono text-yellow-400">₹{totalBetsSum.toLocaleString()}</span>
          </div>

          <div className="hidden sm:block w-px h-3 bg-emerald-800/60" />

          {/* Compact Roadmap timeline (only 5 items on mobile, 8 on desktop to save space) */}
          <div className="flex items-center gap-1 overflow-hidden">
            {outcomeHistory.slice(0, windowWidth < 640 ? 5 : 8).map((h, i) => (
              <div 
                key={`${h.n}-${i}`}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black font-mono border ${
                  h.color === "green" 
                    ? "bg-emerald-600 border-emerald-400 text-slate-900" 
                    : h.color === "red" 
                      ? "bg-rose-700 border-rose-500 text-slate-900" 
                      : "bg-white border-slate-200 text-slate-800"
                }`}
              >
                {h.n}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Unified Casino Felt Play Area */}
      <div className="w-full bg-gradient-to-b from-zinc-800 via-zinc-900 to-black rounded-b-2xl border-x border-b border-yellow-500/40 shadow-2xl p-3 sm:p-6 flex flex-col items-center gap-4 relative overflow-hidden">
        
        {/* Subtle felt texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(16,185,129,0.05)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />
        
        {/* Radial spotlight on the wheel */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Playfield Layout: board takes full width when wheel is overlay */}
        <div className="w-full flex flex-col items-center justify-center gap-6 z-10">

          {/* Cinematic Wheel Transition Overlay */}
          <AnimatePresence>
            {showWheelOverlay && (
              <motion.div
                initial={{ y: "100vh", scale: 0.2, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: "100vh", scale: 0.2, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                onClick={() => setShowWheelOverlay(false)}
                className="fixed inset-0 z-[60] bg-[#020e08]/95 backdrop-blur-md flex flex-col items-center justify-center py-4 cursor-pointer"
              >
                {/* Wheel Frame - Hero element, centered, borderless, no container box */}
                <div className="relative flex flex-col items-center justify-center shrink-0 py-2">
                  
                  {/* Landing/Result Display Overlay right above the wheel */}
                  <AnimatePresence>
                    {!isSpinning && winningNumber && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        className={`absolute -top-4 z-40 px-4 py-1.5 rounded-full border shadow-2xl flex items-center gap-2 ${
                          winningNumber.color === "red" 
                            ? "bg-rose-700/90 border-rose-500 text-slate-900" 
                            : winningNumber.color === "black" 
                              ? "bg-white/90 border-slate-200 text-slate-900" 
                              : "bg-emerald-600/90 border-emerald-400 text-slate-900"
                        }`}
                      >
                        <span className="text-[10px] font-black tracking-widest uppercase">RESULT</span>
                        <span className="text-sm font-black font-mono px-2 py-0.5 rounded bg-black/30">
                          {winningNumber.n}
                        </span>
                        <span className="text-[10px] font-bold uppercase">{winningNumber.label}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Rotated 3D Wheel Assembly */}
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-64 h-64 xs:w-72 xs:h-72 sm:w-80 sm:h-80 lg:w-[480px] lg:h-[480px] aspect-square flex items-center justify-center select-none perspective-[1000px]"
                  >
                    <div 
                      className="relative w-[95%] h-[95%] rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.9)] transform-style-3d"
                      style={{ transform: "rotateX(55deg)" }}
                    >
                      {/* Wood Wheel Rim outer ring */}
                      <div className="absolute -inset-4 rounded-full border-[8px] border-amber-950 bg-gradient-to-br from-amber-800 to-amber-950 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] flex items-center justify-center">
                        <div className="absolute inset-1 rounded-full border border-yellow-500/40" />
                      </div>
                      
                      {/* Wheel segment track */}
                      <motion.div
                        animate={isSpinning ? { rotate: rotation } : { rotate: rotation % 360 }}
                        transition={{ duration: 4.5, ease: [0.25, 1, 0.5, 1] }}
                        className="absolute inset-0 rounded-full bg-slate-50 border-[4px] border-amber-800 overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.95)]"
                      >
                        {NUMBERS.map((num, i) => {
                          const angle = (360 / NUMBERS.length) * i;
                          const numColor = num.color === "green" 
                            ? "bg-emerald-600 text-white" 
                            : num.color === "red" 
                              ? "bg-rose-700 text-white" 
                              : "bg-white text-slate-900";
                          
                          return (
                            <div
                              key={`seg-${i}`}
                              className="absolute top-0 left-1/2 w-5 h-1/2 origin-bottom -translate-x-1/2 flex flex-col items-center pt-0.5"
                              style={{ transform: `rotate(${angle}deg)` }}
                            >
                              <div className={`w-4 h-6 flex items-start justify-center pt-0.5 rounded-sm border border-yellow-500/5 ${numColor} shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]`}>
                                <span className="text-[7px] sm:text-[8px] font-black font-mono leading-none">
                                  {num.n}
                                </span>
                              </div>
                              <div className="w-[0.5px] h-full bg-yellow-750/10 origin-top" />
                            </div>
                          );
                        })}
                        
                        {/* Center Gold Turret */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 via-amber-600 to-yellow-755 shadow-[0_0_12px_rgba(0,0,0,0.95)] flex items-center justify-center z-20">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-yellow-500/40 flex items-center justify-center shadow-inner">
                            <span className="text-yellow-500 text-[6px] font-black tracking-widest uppercase">AURA</span>
                          </div>
                        </div>
                      </motion.div>

                      {/* Glass reflections */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none z-10 mix-blend-overlay" />

                      {/* Ball animation */}
                      {isSpinning && (
                        <>
                          <motion.div
                            animate={{ rotate: ballRotateKeyframes }}
                            transition={{ duration: 4.5, times: ballTimes, ease: "easeOut" }}
                            className="absolute inset-0 rounded-full pointer-events-none z-20"
                          >
                            <motion.div 
                              animate={{ 
                                y: ballYKeyframes.map(y => y + 3.5),
                                scale: ballScaleKeyframes.map(s => s * 0.95),
                                opacity: ballScaleKeyframes.map(s => s > 1.15 ? 0.35 : 0.65)
                              }}
                              transition={{ duration: 4.5, times: ballTimes, ease: "easeOut" }}
                              className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/60 blur-[1px]"
                            />
                          </motion.div>

                          <motion.div
                            animate={{ rotate: ballRotateKeyframes }}
                            transition={{ duration: 4.5, times: ballTimes, ease: "easeOut" }}
                            className="absolute inset-0 rounded-full pointer-events-none z-30"
                          >
                            <motion.div 
                              animate={{ y: ballYKeyframes, scale: ballScaleKeyframes }}
                              transition={{ duration: 4.5, times: ballTimes, ease: "easeOut" }}
                              className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1),inset_-1px_-1px_2px_rgba(0,0,0,0.3)]"
                            />
                          </motion.div>
                        </>
                      )}

                      {/* Landed ball */}
                      <AnimatePresence>
                        {!isSpinning && winningNumber && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 rounded-full pointer-events-none z-30"
                            style={{ transform: `rotate(${rotation % 360}deg)` }}
                          >
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white/50 blur-[0.5px] z-20" />
                            <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#fcfbf9] shadow-[0_0_6px_rgba(255,255,255,0.8),inset_-1px_-1px_2px_rgba(0,0,0,0.3)] z-30" />
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  </div>
                </div>

                {/* Tap helper text */}
                <span className="text-[10px] font-black text-yellow-500/80 uppercase tracking-widest mt-6 animate-pulse text-center">
                  Tap anywhere to return to board
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Betting Board & Controls */}
          <div className="w-full flex flex-col gap-4 overflow-visible">
            
            {/* Horizontal Felt Board for Desktop / Tablet */}
            <div className="hidden md:block w-full bg-[#03140a]/40 border border-emerald-500/10 rounded-2xl p-2.5 relative shadow-inner overflow-x-auto scrollbar-thin">
              <div className="min-w-[620px] relative">
                
                {/* Numbers Grid (horizontally aligned) */}
                <div className="grid grid-cols-14 border border-yellow-500/40 rounded-xl overflow-hidden bg-slate-50/40">
                  
                  {/* 0 Cell */}
                  <button
                    disabled={isSpinning}
                    onClick={() => placeBet("num-0")}
                    className="row-span-3 h-full border-r border-yellow-500/40 bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-black font-mono text-xl select-none cursor-pointer relative transition-colors"
                  >
                    <span className="z-10">0</span>
                    {lightningNumbers[0] && (
                      <div className="absolute inset-0 bg-yellow-400/20 animate-pulse flex items-center justify-center pointer-events-none">
                        <span className="text-yellow-400 font-black text-[10px] drop-shadow-[0_0_2px_rgba(0,0,0,1)] z-10 absolute bottom-0.5">
                          {lightningNumbers[0]}x
                        </span>
                      </div>
                    )}
                    {renderCellChip("num-0")}
                  </button>

                  {/* 12 columns of 3 rows */}
                  {Array.from({ length: 12 }).map((_, colIdx) => {
                    const nums = [
                      (colIdx * 3) + 3,
                      (colIdx * 3) + 2,
                      (colIdx * 3) + 1
                    ];
                    return (
                      <div key={`col-${colIdx}`} className="flex flex-col border-r border-yellow-500/40">
                        {nums.map(n => renderNumberCell(n))}
                      </div>
                    );
                  })}

                  {/* 2 to 1 columns */}
                  <div className="flex flex-col">
                    {["col-3", "col-2", "col-1"].map((col, idx) => (
                      <button
                        key={col}
                        disabled={isSpinning}
                        onClick={() => placeBet(col)}
                        className="h-12 border-b border-yellow-500/40 last:border-b-0 bg-emerald-950/80 hover:bg-emerald-900 text-yellow-400 flex items-center justify-center font-black text-xs uppercase cursor-pointer select-none transition-all relative active:scale-95"
                      >
                        <span>2:1</span>
                        {renderCellChip(col)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dozens Row */}
                <div className="grid grid-cols-14 border-x border-b border-yellow-500/40 rounded-b-xl overflow-hidden bg-emerald-950/40 mt-1">
                  <div className="col-span-1" />
                  {[
                    { id: "doz-1", label: "1st 12" },
                    { id: "doz-2", label: "2nd 12" },
                    { id: "doz-3", label: "3rd 12" }
                  ].map(doz => (
                    <button
                      key={doz.id}
                      disabled={isSpinning}
                      onClick={() => placeBet(doz.id)}
                      className="col-span-4 h-10 border-r border-yellow-500/40 bg-emerald-950/60 hover:bg-emerald-900/80 flex items-center justify-center font-black text-xs text-slate-800 uppercase cursor-pointer select-none transition-all relative active:scale-95"
                    >
                      <span>{doz.label}</span>
                      {renderCellChip(doz.id)}
                    </button>
                  ))}
                  <div className="col-span-1" />
                </div>

                {/* Even/Odd Red/Black outside bets */}
                <div className="grid grid-cols-14 border-x border-b border-yellow-500/40 rounded-b-xl overflow-hidden bg-emerald-950/50 mt-1">
                  <div className="col-span-1" />
                  {[
                    { id: "low", label: "1-18", btnClass: "bg-emerald-950/70 hover:bg-emerald-900 text-slate-800" },
                    { id: "even", label: "EVEN", btnClass: "bg-emerald-950/70 hover:bg-emerald-900 text-slate-800" },
                    { id: "red", label: "RED", btnClass: "bg-rose-700/90 hover:bg-rose-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.2)]" },
                    { id: "black", label: "BLACK", btnClass: "bg-white hover:bg-zinc-800 text-slate-900 shadow-[inset_0_0_6px_rgba(255,255,255,0.05)]" },
                    { id: "odd", label: "ODD", btnClass: "bg-emerald-950/70 hover:bg-emerald-900 text-slate-800" },
                    { id: "high", label: "19-36", btnClass: "bg-emerald-950/70 hover:bg-emerald-900 text-slate-800" }
                  ].map(out => (
                    <button
                      key={out.id}
                      disabled={isSpinning}
                      onClick={() => placeBet(out.id)}
                      className={`col-span-2 h-10 border-r border-yellow-500/40 last:border-r-0 flex items-center justify-center font-black text-xs cursor-pointer select-none transition-all relative active:scale-95 ${out.btnClass}`}
                    >
                      <span>{out.label}</span>
                      {renderCellChip(out.id)}
                    </button>
                  ))}
                  <div className="col-span-1" />
                </div>

              </div>
            </div>

            {/* Vertical Felt Board for Mobile */}
            <div className="block md:hidden w-full relative">
              {renderVerticalBoard()}
            </div>

            {/* Betting Controls: Action buttons only */}
            <div className="w-full flex flex-col gap-3 mt-2 pb-2">
              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1.5 bg-[#020e08]/60 border border-emerald-500/15 rounded-xl p-1.5 shadow-md flex-1">
                  <button 
                    onClick={undoLastBet} 
                    disabled={isSpinning || betHistory.length === 0}
                    className="flex-1 px-1 py-2 sm:py-2.5 rounded-lg border border-yellow-500/40 font-black text-[9px] sm:text-[10px] uppercase tracking-wider bg-emerald-950/40 text-yellow-400 hover:bg-emerald-900/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all text-center"
                  >
                    Undo
                  </button>
                  <button 
                    onClick={doubleAllBets} 
                    disabled={isSpinning || totalBetsSum === 0}
                    className="flex-1 px-1 py-2 sm:py-2.5 rounded-lg border border-yellow-500/40 font-black text-[9px] sm:text-[10px] uppercase tracking-wider bg-emerald-950/40 text-yellow-400 hover:bg-emerald-900/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all text-center"
                  >
                    Double
                  </button>
                  <button 
                    onClick={repeatLastBets} 
                    disabled={isSpinning || Object.keys(prevBets).length === 0}
                    className="flex-1 px-1 py-2 sm:py-2.5 rounded-lg border border-yellow-500/40 font-black text-[9px] sm:text-[10px] uppercase tracking-wider bg-emerald-950/40 text-yellow-400 hover:bg-emerald-900/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all text-center"
                  >
                    Repeat
                  </button>
                  <button 
                    onClick={clearAllBets} 
                    disabled={isSpinning || totalBetsSum === 0}
                    className="flex-1 px-1 py-2 sm:py-2.5 rounded-lg border border-yellow-500/40 font-black text-[9px] sm:text-[10px] uppercase tracking-wider bg-emerald-950/40 text-yellow-400 hover:bg-emerald-900/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all text-center"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>



      </div>

      {/* 3. Victory Grand Overlay */}
      <AnimatePresence>
        {showWinOverlay && winningNumber && !isSpinning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setShowWinOverlay(false)}
          >
            <motion.div
              initial={{ scale: 0.75, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.75, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="bg-emerald-50 border border-yellow-500/40 p-6 sm:p-8 rounded-[2rem] text-center shadow-[0_20px_50px_rgba(234,179,8,0.25)] max-w-sm w-full relative overflow-hidden text-slate-900"
              onClick={e => e.stopPropagation()}
            >
              {/* Confetti & Golden Sparkles decorative background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.1)_0,transparent_60%)] pointer-events-none" />

              <motion.div
                animate={{ rotate: [0, -12, 12, -6, 6, 0], scale: [1, 1.25, 1] }}
                transition={{ duration: 1.2, repeat: 3 }}
                className="text-6xl mb-3"
              >
                🏆
              </motion.div>

              <h2 className="text-2xl font-black text-slate-900 mb-0.5 uppercase tracking-widest">
                Winner Winner!
              </h2>
              <p className="text-[9px] text-yellow-500 font-bold uppercase tracking-widest mb-3">
                Live Emerald Payout
              </p>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.25, type: "spring" }}
                className="text-3xl font-black font-mono mb-4 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]"
              >
                +₹{wonAmount.toLocaleString()}
              </motion.div>

              <div className="bg-[#020e08]/60 border border-emerald-500/10 rounded-xl p-3.5 mb-5 text-left text-xs">
                <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest block mb-1.5">Payout Details</span>
                <div className="flex justify-between items-center text-[10px] text-slate-355 text-slate-700">
                  <span>Number landed:</span>
                  <span className={`font-mono font-black px-2 py-0.5 rounded-full text-[9px] ${
                    winningNumber.color === "red" 
                      ? "bg-rose-700 text-slate-900" 
                      : winningNumber.color === "black" 
                        ? "bg-white text-slate-800" 
                        : "bg-emerald-600 text-slate-900"
                  }`}>
                    {winningNumber.n} ({winningNumber.label})
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-355 text-slate-700">
                  <span>Total winnings:</span>
                  <span className="font-mono text-emerald-400 font-black">₹{wonAmount.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setShowWinOverlay(false)}
                className="w-full py-3 rounded-lg font-black text-slate-950 text-xs uppercase tracking-widest border border-yellow-300 bg-gradient-to-r from-yellow-400 to-amber-500 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg transition-transform"
              >
                Collect Winnings
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
