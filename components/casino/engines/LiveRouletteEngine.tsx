"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Star, RotateCcw, Shield, Coins, Sparkles, 
  Users, Activity, Wifi, Lock, ArrowUpRight, TrendingUp, TrendingDown 
} from "lucide-react";
import { playGameSound } from "@/lib/audio";
import { calculateGameOutcome } from "@/lib/casino-math";

// ═══════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════

interface RouletteEngineProps {
  isPlaying: boolean;
  betAmount: number;
  onBetAmountChange: (amount: number) => void;
  onStartGame: () => void;
  onComplete: (multiplier: number, won: boolean) => void;
}

interface NumberConfig {
  n: number;
  color: "red" | "black" | "green";
  label: string;
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

export function LiveRouletteEngine({ 
  isPlaying, 
  betAmount, 
  onBetAmountChange, 
  onStartGame, 
  onComplete 
}: RouletteEngineProps) {
  
  // Game & Bets States
  const [activeChip, setActiveChip] = useState<number>(100);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [betHistory, setBetHistory] = useState<{ cell: string; amount: number }[]>([]);
  const [prevBets, setPrevBets] = useState<Record<string, number>>({});
  
  // Wheel State
  const [rotation, setRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [ballRadiusOffset, setBallRadiusOffset] = useState(0);
  const [winningNumber, setWinningNumber] = useState<NumberConfig | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

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
  const [recentLiveBets, setRecentLiveBets] = useState<string[]>([]);
  const [totalWagered, setTotalWagered] = useState(128000);
  const [netProfit, setNetProfit] = useState(14600);
  
  // Victory FX states
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [wonAmount, setWonAmount] = useState(0);
  const [coinsShower, setCoinsShower] = useState<number[]>([]);
  const [roundSeed, setRoundSeed] = useState("sha256-b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
  const [activeTab, setActiveTab] = useState<"stats" | "feed" | "vips">("stats");

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
      
      setRecentLiveBets(prevLogs => [
        `🎲 ${vip.name} placed ₹${betVal.toLocaleString()} on ${chosenPlace.toUpperCase()}`,
        ...prevLogs.slice(0, 15)
      ]);
      
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
    setWinningNumber(null);
    setShowWinOverlay(false);
    const width = typeof window !== "undefined" ? window.innerWidth : 1024;
    const offsetVal = width >= 1024 ? 50 : width >= 768 ? 42 : width >= 640 ? 36 : 28;
    setBallRadiusOffset(offsetVal);

    const outcome = calculateGameOutcome("TABLE");
    const won = outcome.isWin;

    // Pick target wheel index
    const targetIdx = won 
      ? Math.floor(Math.random() * (NUMBERS.length - 1)) + 1 // red/black mostly
      : Math.floor(Math.random() * NUMBERS.length);

    const result = NUMBERS[targetIdx];
    const segmentAngle = 360 / NUMBERS.length;
    const finalWheelRotation = 1800 + (360 - (targetIdx * segmentAngle));
    
    setRotation(finalWheelRotation);
    setBallRotation(-(2160 + 720)); // Orbit counter-rotation of ball

    // Ball falls into pocket
    setTimeout(() => {
      setBallRadiusOffset(0);
    }, 2400);

    // Spin completes
    const completeTimer = setTimeout(() => {
      setIsSpinning(false);
      setWinningNumber(result);
      setPrevBets(bets);

      // Payout logic sum winnings across all bet configurations
      let totalWinnings = 0;
      
      for (const [cell, amount] of Object.entries(bets)) {
        // Straight up numbers
        if (cell.startsWith("num-")) {
          const numValue = parseInt(cell.split("-")[1]);
          if (winningNumMatch(numValue, result.n)) {
            totalWinnings += amount * 35;
          }
        }
        // Colors
        if (cell === "red" && result.color === "red") totalWinnings += amount * 1;
        if (cell === "black" && result.color === "black") totalWinnings += amount * 1;
        // Parities
        if (cell === "even" && result.n !== 0 && result.n % 2 === 0) totalWinnings += amount * 1;
        if (cell === "odd" && result.n !== 0 && result.n % 2 !== 0) totalWinnings += amount * 1;
        // Ranges
        if (cell === "low" && result.n >= 1 && result.n <= 18) totalWinnings += amount * 1;
        if (cell === "high" && result.n >= 19 && result.n <= 36) totalWinnings += amount * 1;
        // Dozens
        if (cell === "doz-1" && result.n >= 1 && result.n <= 12) totalWinnings += amount * 2;
        if (cell === "doz-2" && result.n >= 13 && result.n <= 24) totalWinnings += amount * 2;
        if (cell === "doz-3" && result.n >= 25 && result.n <= 36) totalWinnings += amount * 2;
        // Columns
        if (cell === "col-1" && result.n !== 0 && result.n % 3 === 1) totalWinnings += amount * 2;
        if (cell === "col-2" && result.n !== 0 && result.n % 3 === 2) totalWinnings += amount * 2;
        if (cell === "col-3" && result.n !== 0 && result.n % 3 === 0) totalWinnings += amount * 2;
      }

      // Outcome calculations
      const winSuccess = totalWinnings > 0;
      const computedMultiplier = totalBetsSum > 0 ? (totalWinnings + totalBetsSum) / totalBetsSum : 0;
      
      setWonAmount(totalWinnings + (winSuccess ? totalBetsSum : 0));
      
      // Update session statistics
      setTotalWagered(w => w + totalBetsSum);
      setNetProfit(p => p + (winSuccess ? totalWinnings : -totalBetsSum));
      
      // Dynamic outcome roadmap timeline
      setOutcomeHistory(h => [result, ...h.slice(0, 11)]);
      
      // Generate randomized round seed hash
      setRoundSeed(`sha256-${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`);

      // process VIP player changes
      processVIPWinnings(result);

      if (winSuccess) {
        try { playGameSound("win"); } catch {}
        setShowWinOverlay(true);
        // Coins shower burst
        setCoinsShower(Array.from({ length: 25 }).map((_, i) => i));
        setTimeout(() => setCoinsShower([]), 2800);
      } else {
        try { playGameSound("lose"); } catch {}
      }

      // Complete bet platform transaction
      onCompleteRef.current(computedMultiplier, winSuccess);
      setBets({});
      setBetHistory([]);
    }, 4500);

    return () => clearTimeout(completeTimer);
  }, [isPlaying]);

  const winningNumMatch = (betNum: number, winNum: number) => {
    return betNum === winNum;
  };

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
            ? "bg-rose-700 hover:bg-rose-600 text-white" 
            : "bg-slate-950 hover:bg-slate-900 text-slate-100"
        }`}
      >
        <span className="font-mono font-black">{n}</span>
        {renderCellChip(`num-${n}`)}
      </button>
    );
  };

  // Render vertical board for mobile touch targeting
  const renderVerticalBoard = () => {
    const redNumbers = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
    
    return (
      <div className="grid grid-cols-5 border-2 border-yellow-500/30 rounded-2xl overflow-hidden bg-[#020e08]/90 text-xs w-full max-w-[340px] xs:max-w-[360px] sm:max-w-xs mx-auto shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        
        {/* Row 1: Zero Cell (Spans Columns 3, 4, 5) */}
        <button
          disabled={isSpinning}
          onClick={() => placeBet("num-0")}
          className="col-start-3 col-span-3 row-start-1 h-[38px] xs:h-[42px] sm:h-11 bg-emerald-700/90 hover:bg-emerald-600 text-white flex items-center justify-center font-black font-mono text-base select-none cursor-pointer relative border-b border-yellow-500/20 transition-colors"
        >
          <span>0</span>
          {renderCellChip("num-0")}
        </button>

        {/* Column 1: Outside Bets (Each spans 2 rows) */}
        {[
          { id: "low", label: "1-18", row: 2, btnClass: "bg-emerald-950/70 hover:bg-emerald-900 text-slate-200 border-r border-b border-yellow-500/20" },
          { id: "even", label: "EVEN", row: 4, btnClass: "bg-emerald-950/70 hover:bg-emerald-900 text-slate-200 border-r border-b border-yellow-500/20" },
          { id: "red", label: "RED", row: 6, btnClass: "bg-rose-700/90 hover:bg-rose-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.2)] border-r border-b border-yellow-500/20" },
          { id: "black", label: "BLACK", row: 8, btnClass: "bg-slate-950 hover:bg-slate-900 text-slate-100 shadow-[inset_0_0_6px_rgba(255,255,255,0.05)] border-r border-b border-yellow-500/20" },
          { id: "odd", label: "ODD", row: 10, btnClass: "bg-emerald-950/70 hover:bg-emerald-900 text-slate-200 border-r border-b border-yellow-500/20" },
          { id: "high", label: "19-36", row: 12, btnClass: "bg-emerald-950/70 hover:bg-emerald-900 text-slate-200 border-r border-b border-yellow-500/20" }
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
              <span className="w-4 h-4 rotate-45 bg-slate-900 border border-white/45 shadow-sm block" />
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
            className="bg-emerald-950/60 hover:bg-emerald-900/80 text-slate-200 flex items-center justify-center font-black text-[9px] uppercase tracking-wider cursor-pointer select-none transition-all relative active:scale-95 border-r border-b border-yellow-500/20"
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
                className={`h-[38px] xs:h-[42px] sm:h-11 flex items-center justify-center border-b border-yellow-500/10 cursor-pointer font-black text-xs transition-all active:scale-95 ${
                  colOffset < 2 ? "border-r border-yellow-500/10" : ""
                } ${
                  isRed 
                    ? "bg-rose-700/90 hover:bg-rose-600/90 text-white" 
                    : "bg-slate-950 hover:bg-slate-900 text-slate-100"
                }`}
              >
                <span className="font-mono">{n}</span>
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
            className={`h-9 xs:h-10 flex items-center justify-center font-black text-[9px] text-yellow-400 uppercase cursor-pointer select-none transition-all relative active:scale-95 bg-emerald-950/80 hover:bg-emerald-900 ${
              colBet.col < 5 ? "border-r border-yellow-500/20" : ""
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
    <div className="w-full max-w-6xl mx-auto px-1 sm:px-4 py-2 sm:py-4 text-slate-100 overflow-visible select-none font-sans relative">
      
      {/* 3D Gold Coins victory shower overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {coinsShower.map((c) => (
          <motion.div
            key={c}
            animate={{
              y: [0, 600],
              x: [0, (Math.random() - 0.5) * 200],
              rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
            }}
            transition={{
              duration: Math.random() * 1.5 + 1.2,
              ease: "linear",
            }}
            className="absolute w-5 h-5 rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 border border-yellow-200/50 shadow-[0_2px_5px_rgba(0,0,0,0.5)]"
            style={{
              left: `${Math.random() * 90}%`,
              top: `-30px`,
            }}
          />
        ))}
      </div>

      {/* 1. Sleek Super-Minimalist HUD Header */}
      <div className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#02130a]/80 border-b border-emerald-500/20 backdrop-blur-md rounded-t-2xl shadow-lg text-slate-200 h-12 select-none z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-450" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-black tracking-wider uppercase text-slate-100 truncate max-w-[120px] sm:max-w-none">
            Emerald Roulette
          </span>
        </div>

        {/* Active Bets & Roadmap merged into one compact container */}
        <div className="flex items-center gap-4">
          {/* Active Bets Counter */}
          <div className="flex items-center gap-1.5">
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
                    ? "bg-emerald-600 border-emerald-400 text-white" 
                    : h.color === "red" 
                      ? "bg-rose-700 border-rose-500 text-white" 
                      : "bg-slate-900 border-slate-700 text-slate-200"
                }`}
              >
                {h.n}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Unified Casino Felt Play Area */}
      <div className="w-full bg-gradient-to-b from-[#0b3a20] via-[#052112] to-[#010e08] rounded-b-2xl border-x border-b border-emerald-500/20 shadow-2xl p-3 sm:p-6 flex flex-col items-center gap-4 relative overflow-hidden">
        
        {/* Subtle felt texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(16,185,129,0.05)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />
        
        {/* Radial spotlight on the wheel */}
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Playfield Layout: Wheel first, then board */}
        <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-6 z-10">
          
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
                      ? "bg-rose-700/90 border-rose-500 text-white" 
                      : winningNumber.color === "black" 
                        ? "bg-slate-900/90 border-slate-700 text-slate-100" 
                        : "bg-emerald-600/90 border-emerald-400 text-white"
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
            <div className="relative w-64 h-64 xs:w-72 xs:h-72 sm:w-80 sm:h-80 lg:w-[360px] lg:h-[360px] aspect-square flex items-center justify-center select-none perspective-[1000px]">
              <div 
                className="relative w-[95%] h-[95%] rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.9)] transform-style-3d"
                style={{ transform: "rotateX(55deg)" }}
              >
                {/* Wood Wheel Rim outer ring */}
                <div className="absolute -inset-4 rounded-full border-[8px] border-amber-950 bg-gradient-to-br from-amber-800 to-amber-950 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] flex items-center justify-center">
                  <div className="absolute inset-1 rounded-full border border-yellow-500/20" />
                </div>
                
                {/* Wheel segment track */}
                <motion.div
                  animate={isSpinning ? { rotate: rotation } : { rotate: rotation % 360 }}
                  transition={{ duration: 4.5, ease: [0.25, 1, 0.5, 1] }}
                  className="absolute inset-0 rounded-full bg-slate-950 border-[4px] border-amber-800 overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.95)]"
                >
                  {NUMBERS.map((num, i) => {
                    const angle = (360 / NUMBERS.length) * i;
                    const numColor = num.color === "green" 
                      ? "bg-emerald-600 text-white" 
                      : num.color === "red" 
                        ? "bg-rose-700 text-white" 
                        : "bg-slate-900 text-slate-100";
                    
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
                    <div className="w-8 h-8 rounded-full bg-[#051c10] border border-yellow-500/20 flex items-center justify-center shadow-inner">
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

          {/* Betting Board & Controls */}
          <div className="flex-1 w-full flex flex-col gap-4 overflow-visible">
            
            {/* Horizontal Felt Board for Desktop / Tablet */}
            <div className="hidden md:block w-full bg-[#03140a]/40 border border-emerald-500/10 rounded-2xl p-2.5 relative shadow-inner overflow-x-auto scrollbar-thin">
              <div className="min-w-[620px] relative">
                
                {/* Numbers Grid (horizontally aligned) */}
                <div className="grid grid-cols-14 border border-yellow-500/20 rounded-xl overflow-hidden bg-slate-950/40">
                  
                  {/* 0 Cell */}
                  <button
                    disabled={isSpinning}
                    onClick={() => placeBet("num-0")}
                    className="row-span-3 h-full border-r border-yellow-500/20 bg-emerald-700/90 hover:bg-emerald-600 text-white flex items-center justify-center font-black font-mono text-xl select-none cursor-pointer relative transition-colors"
                  >
                    <span>0</span>
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
                      <div key={`col-${colIdx}`} className="flex flex-col border-r border-yellow-500/20">
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
                        className="h-12 border-b border-yellow-500/20 last:border-b-0 bg-emerald-950/80 hover:bg-emerald-900 text-yellow-400 flex items-center justify-center font-black text-xs uppercase cursor-pointer select-none transition-all relative active:scale-95"
                      >
                        <span>2:1</span>
                        {renderCellChip(col)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dozens Row */}
                <div className="grid grid-cols-14 border-x border-b border-yellow-500/20 rounded-b-xl overflow-hidden bg-emerald-950/40 mt-1">
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
                      className="col-span-4 h-10 border-r border-yellow-500/20 bg-emerald-950/60 hover:bg-emerald-900/80 flex items-center justify-center font-black text-xs text-slate-200 uppercase cursor-pointer select-none transition-all relative active:scale-95"
                    >
                      <span>{doz.label}</span>
                      {renderCellChip(doz.id)}
                    </button>
                  ))}
                  <div className="col-span-1" />
                </div>

                {/* Even/Odd Red/Black outside bets */}
                <div className="grid grid-cols-14 border-x border-b border-yellow-500/20 rounded-b-xl overflow-hidden bg-emerald-950/50 mt-1">
                  <div className="col-span-1" />
                  {[
                    { id: "low", label: "1-18", btnClass: "bg-emerald-950/70 hover:bg-emerald-900 text-slate-200" },
                    { id: "even", label: "EVEN", btnClass: "bg-emerald-950/70 hover:bg-emerald-900 text-slate-200" },
                    { id: "red", label: "RED", btnClass: "bg-rose-700/90 hover:bg-rose-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.2)]" },
                    { id: "black", label: "BLACK", btnClass: "bg-slate-950 hover:bg-slate-900 text-slate-100 shadow-[inset_0_0_6px_rgba(255,255,255,0.05)]" },
                    { id: "odd", label: "ODD", btnClass: "bg-emerald-950/70 hover:bg-emerald-900 text-slate-200" },
                    { id: "high", label: "19-36", btnClass: "bg-emerald-950/70 hover:bg-emerald-900 text-slate-200" }
                  ].map(out => (
                    <button
                      key={out.id}
                      disabled={isSpinning}
                      onClick={() => placeBet(out.id)}
                      className={`col-span-2 h-10 border-r border-yellow-500/20 last:border-r-0 flex items-center justify-center font-black text-xs cursor-pointer select-none transition-all relative active:scale-95 ${out.btnClass}`}
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

            {/* Chip Selector Rack & Wagers Bar */}
            <div className="w-full bg-[#020e08]/60 border border-emerald-500/15 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
              
              {/* Luxury Casino Chip Selector */}
              <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 scrollbar-none bg-slate-950/50 px-3 py-1.5 rounded-full border border-emerald-500/10">
                {[
                  { amount: 100, label: "100", color: "from-blue-500 to-indigo-700 border-blue-400" },
                  { amount: 500, label: "500", color: "from-teal-400 to-emerald-600 border-teal-400" },
                  { amount: 1000, label: "1k", color: "from-yellow-400 to-amber-600 border-amber-300" },
                  { amount: 5000, label: "5k", color: "from-rose-500 to-pink-650 border-rose-450" },
                  { amount: 10000, label: "10k", color: "from-purple-600 to-fuchsia-800 border-purple-450" },
                  { amount: 50000, label: "50k", color: "from-slate-800 to-slate-900 border-slate-700" }
                ].map((chip) => {
                  const isSelected = activeChip === chip.amount;
                  return (
                    <button
                      key={chip.amount}
                      type="button"
                      onClick={() => setActiveChip(chip.amount)}
                      className={`relative w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-black text-slate-955 shadow-md transition-all duration-200 transform cursor-pointer border border-white/40 select-none ${
                        isSelected ? "scale-110 ring-2 ring-yellow-500 opacity-100 z-10" : "opacity-60 hover:opacity-100"
                      } bg-gradient-to-br ${chip.color}`}
                    >
                      <div className="absolute inset-[2px] rounded-full border border-dashed border-white/30 flex items-center justify-center">
                        <span className="text-[7.5px] font-black tracking-tighter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                          {chip.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons & Spin Trigger */}
              <div className="flex items-center gap-2 max-w-full overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button 
                  onClick={undoLastBet} 
                  disabled={isSpinning || betHistory.length === 0}
                  className="px-3 py-2 rounded-lg border border-emerald-500/20 font-black text-[10px] uppercase tracking-wider bg-emerald-950/40 text-yellow-400 hover:bg-emerald-900/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all"
                >
                  Undo
                </button>
                <button 
                  onClick={doubleAllBets} 
                  disabled={isSpinning || totalBetsSum === 0}
                  className="px-3 py-2 rounded-lg border border-emerald-500/20 font-black text-[10px] uppercase tracking-wider bg-emerald-950/40 text-yellow-400 hover:bg-emerald-900/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all"
                >
                  Double
                </button>
                <button 
                  onClick={repeatLastBets} 
                  disabled={isSpinning || Object.keys(prevBets).length === 0}
                  className="px-3 py-2 rounded-lg border border-emerald-500/20 font-black text-[10px] uppercase tracking-wider bg-emerald-950/40 text-yellow-400 hover:bg-emerald-900/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all"
                >
                  Repeat
                </button>
                <button 
                  onClick={clearAllBets} 
                  disabled={isSpinning || totalBetsSum === 0}
                  className="px-3 py-2 rounded-lg border border-emerald-500/20 font-black text-[10px] uppercase tracking-wider bg-emerald-950/40 text-yellow-400 hover:bg-emerald-900/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all"
                >
                  Clear
                </button>

                <div className="w-px h-6 bg-emerald-800/40" />

                <button
                  onClick={handleSpinInit}
                  disabled={isSpinning || totalBetsSum === 0}
                  className={`py-2 px-5 rounded-lg font-black text-[10px] uppercase tracking-widest border transition-all cursor-pointer ${
                    isSpinning || totalBetsSum === 0
                      ? "bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 border-yellow-300 text-slate-950 shadow-[0_0_15px_rgba(234,179,8,0.25)] hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-102 active:scale-98"
                  }`}
                >
                  Spin
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* 3. Compact Tabbed Dashboard for secondary elements (h-28) */}
        <div className="w-full bg-[#020e08]/80 border border-emerald-500/10 rounded-xl mt-2 overflow-hidden flex flex-col z-10 shrink-0">
          {/* Tab Selector Header */}
          <div className="flex border-b border-emerald-500/10 bg-slate-950/40">
            {[
              { id: "stats", label: "📊 Analytics" },
              { id: "feed", label: "📝 Live Feed" },
              { id: "vips", label: "👥 VIP Players" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? "border-yellow-500 bg-[#052112]/50 text-slate-100" 
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content (Height Fixed to 96px/h-24 to guarantee fit) */}
          <div className="h-24 p-2.5 overflow-y-auto scrollbar-thin text-left bg-slate-950/10">
            
            {activeTab === "vips" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {vips.map(vip => (
                  <div key={vip.id} className="bg-slate-950/50 border border-emerald-500/5 p-1.5 rounded-lg flex items-center justify-between relative text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-base shrink-0">{vip.avatar}</span>
                      <div className="min-w-0">
                        <span className="font-black text-slate-200 block truncate leading-tight text-[10px]">{vip.name}</span>
                        <span className="text-[7.5px] text-slate-500 font-bold block uppercase leading-none">
                          {vip.streak > 0 ? `🔥 Streak ${vip.streak}` : "Gold VIP"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-black text-yellow-500/80 shrink-0">
                      ₹{(vip.balance / 1000).toFixed(0)}k
                    </span>

                    {/* Mini inline result overlay */}
                    <AnimatePresence>
                      {vip.payoutDiff !== undefined && !isSpinning && winningNumber && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-[8px] font-mono font-black absolute -top-1 -right-1 px-1 rounded bg-slate-900 border border-slate-800 text-emerald-400"
                        >
                          {vip.payoutDiff >= 0 ? `+` : ``}{vip.payoutDiff.toLocaleString()}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "feed" && (
              <div className="space-y-1 font-mono text-[8px] leading-relaxed text-slate-400">
                {recentLiveBets.length === 0 ? (
                  <p className="text-center py-4 uppercase font-bold tracking-widest text-[8px] text-slate-650">Feed Standby</p>
                ) : (
                  recentLiveBets.slice(0, 10).map((log, i) => (
                    <div key={i} className="truncate">
                      &gt; {log}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "stats" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] uppercase font-bold text-slate-400 h-full items-center">
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-500 text-left font-bold">Total Wagered</span>
                  <span className="font-mono text-slate-200 font-black">₹{totalWagered.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-500 text-left font-bold">Net Profit</span>
                  <span className={`font-mono font-black ${netProfit >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                    ₹{netProfit >= 0 ? "+" : ""}{netProfit.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-red-500 shrink-0 uppercase flex items-center gap-0.5 tracking-wider"><TrendingUp className="w-2.5 h-2.5" /> Hot:</span>
                  <div className="flex gap-1">
                    {[32, 17].map(n => (
                      <span key={`hot-${n}`} className="w-4 h-4 rounded-full bg-rose-700 text-[8px] font-mono font-black text-white flex items-center justify-center border border-rose-500/30">{n}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-blue-400 shrink-0 uppercase flex items-center gap-0.5 tracking-wider"><TrendingDown className="w-2.5 h-2.5" /> Cold:</span>
                  <div className="flex gap-1">
                    {[0, 28].map(n => (
                      <span key={`cold-${n}`} className="w-4 h-4 rounded-full bg-slate-900 text-[8px] font-mono font-black text-slate-350 flex items-center justify-center border border-slate-700">{n}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Secure Details footer banner */}
          <div className="bg-slate-950/60 px-3 py-1 flex items-center justify-between text-[8px] font-mono border-t border-emerald-500/10 text-slate-500">
            <span className="flex items-center gap-1"><Shield className="w-2.5 h-2.5 text-emerald-500" /> Provably Fair Seed</span>
            <span className="truncate max-w-[200px] sm:max-w-xs">{roundSeed}</span>
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
              className="bg-[#052112] border border-yellow-500/30 p-6 sm:p-8 rounded-[2rem] text-center shadow-[0_20px_50px_rgba(234,179,8,0.25)] max-w-sm w-full relative overflow-hidden text-slate-100"
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

              <h2 className="text-2xl font-black text-slate-100 mb-0.5 uppercase tracking-widest">
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
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Payout Details</span>
                <div className="flex justify-between items-center text-[10px] text-slate-355 text-slate-300">
                  <span>Number landed:</span>
                  <span className={`font-mono font-black px-2 py-0.5 rounded-full text-[9px] ${
                    winningNumber.color === "red" 
                      ? "bg-rose-700 text-white" 
                      : winningNumber.color === "black" 
                        ? "bg-slate-900 text-slate-200" 
                        : "bg-emerald-600 text-white"
                  }`}>
                    {winningNumber.n} ({winningNumber.label})
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-355 text-slate-300">
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
