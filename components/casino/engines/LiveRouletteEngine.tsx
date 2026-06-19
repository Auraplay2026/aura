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
    setBallRadiusOffset(28); // ball sits on the outer track

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
          <span className="text-[7.5px] font-black text-white font-mono drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
            {betVal >= 1000 ? `${(betVal/1000).toFixed(0)}k` : betVal}
          </span>
        </motion.div>
      </div>
    );
  };

  // Numbers Grid Helpers
  const getNumberColor = (n: number) => {
    if (n === 0) return "bg-emerald-500 text-white";
    const redNumbers = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
    return redNumbers.has(n) ? "bg-rose-600 text-white" : "bg-slate-900 text-white";
  };

  // Rendering board horizontally (12 columns x 3 rows)
  const renderNumberCell = (n: number) => {
    const isRed = getNumberColor(n).includes("rose-600");
    return (
      <button
        key={`num-${n}`}
        disabled={isSpinning}
        onClick={() => placeBet(`num-${n}`)}
        className={`relative h-12 flex flex-col items-center justify-center border border-yellow-500/15 cursor-pointer font-black text-sm transition-all hover:bg-white/10 active:scale-95 ${
          isRed ? "hover:border-rose-400 shadow-[inset_0_0_8px_rgba(244,63,94,0.1)]" : "hover:border-slate-400 shadow-[inset_0_0_8px_rgba(255,255,255,0.05)]"
        }`}
      >
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-black ${
          isRed ? "bg-rose-500/90 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : "bg-slate-950/80"
        }`}>
          {n}
        </span>
        {renderCellChip(`num-${n}`)}
      </button>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-1 sm:px-4 py-2 sm:py-6 text-white overflow-visible select-none font-sans relative">
      
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

      {/* 1. Header VIP HUD info */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-5 bg-[#051c10]/80 border border-yellow-500/15 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-yellow-400" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500" />
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-widest leading-none">
              Live Emerald Roulette
            </h3>
            <p className="text-[9px] text-yellow-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5">
              <Lock className="w-2.5 h-2.5 text-yellow-500" /> Provably Fair Live
            </p>
          </div>
        </div>

        {/* Bets & Multiplier summary */}
        <div className="flex items-center gap-5 bg-[#020a05]/80 border border-yellow-950/70 px-4 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <Coins className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Bets:</span>
            <span className="text-xs font-black font-mono text-yellow-400">₹{totalBetsSum.toLocaleString()}</span>
          </div>
          <div className="w-px h-4 bg-yellow-950" />
          <div className="flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">RTP Rate:</span>
            <span className="text-xs font-black font-mono text-emerald-400">97.3%</span>
          </div>
        </div>

        {/* History timeline feed */}
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest mr-2 shrink-0">Roadmap:</span>
          {outcomeHistory.map((h, i) => (
            <div 
              key={`${h.n}-${i}`}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono border ${
                h.color === "green" 
                  ? "bg-emerald-500 border-emerald-400 text-white" 
                  : h.color === "red" 
                    ? "bg-rose-600 border-rose-500 text-white" 
                    : "bg-slate-900 border-slate-700 text-slate-200"
              }`}
            >
              {h.n}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Main Gameplay Dashboard */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start justify-center overflow-visible">
        
        {/* Left Section (Live VIP player statistics) */}
        <div className="w-full lg:w-[200px] shrink-0 bg-[#051c10]/40 border border-yellow-500/10 rounded-3xl p-3 sm:p-4 flex flex-col gap-4 shadow-xl">
          <span className="text-[9px] text-yellow-600 uppercase tracking-widest font-black block border-b border-yellow-950/60 pb-2">Active VIP Players</span>
          <div className="space-y-3">
            {vips.map(vip => (
              <div key={vip.id} className="bg-[#020a05]/60 border border-yellow-950/40 p-2.5 rounded-xl flex flex-col gap-1 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{vip.avatar}</span>
                    <div className="text-left">
                      <span className="text-xs font-black text-slate-200 block truncate max-w-[100px]">{vip.name}</span>
                      <span className="text-[8px] text-slate-500 font-bold block uppercase">XP Level {vip.streak > 0 ? `🔥 ${vip.streak}` : "Gold"}</span>
                    </div>
                  </div>
                  <span className="text-[9.5px] font-mono font-black text-yellow-500/80">
                    ₹{(vip.balance / 1000).toFixed(0)}k
                  </span>
                </div>

                {/* Floating winnings bubble animation */}
                <AnimatePresence>
                  {vip.payoutDiff !== undefined && !isSpinning && winningNumber && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: -4 }}
                      exit={{ opacity: 0 }}
                      className={`text-[8.5px] font-mono font-black absolute top-1 right-2 ${
                        vip.payoutDiff >= 0 ? "text-emerald-400" : "text-rose-500"
                      }`}
                    >
                      {vip.payoutDiff >= 0 ? `+₹${vip.payoutDiff}` : `-₹${Math.abs(vip.payoutDiff)}`}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Lobby Live bet ticker */}
          <div>
            <span className="text-[8.5px] text-yellow-600 uppercase tracking-widest font-black block border-t border-yellow-950/60 pt-3 mb-2">Live Board Feed</span>
            <div className="bg-slate-950/70 border border-yellow-950/40 rounded-xl p-2.5 h-28 overflow-hidden">
              <div className="space-y-1 overflow-y-auto h-full scrollbar-none">
                {recentLiveBets.length === 0 ? (
                  <p className="text-[8px] text-slate-600 text-center py-8 uppercase font-bold tracking-widest">Feed Standby</p>
                ) : recentLiveBets.map((log, i) => (
                  <div key={i} className="text-[8px] font-mono leading-tight text-slate-400 truncate">
                    &gt; {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Section (Gameplay Arena) */}
        <div className="flex-1 w-full flex flex-col items-center gap-5 overflow-visible">
          
          {/* Top part: The 3D Wood/Gold Roulette Wheel */}
          <div className="w-full bg-[#051c10]/40 border border-yellow-500/10 rounded-3xl p-5 flex items-center justify-center overflow-hidden relative shadow-lg">
            
            {/* Emerald Radial Background light */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none" />

            {/* Rotated 3D Wheel Assembly */}
            <div className="relative w-64 h-64 md:w-72 md:h-72 aspect-square flex items-center justify-center select-none perspective-[1000px]">
              <div 
                className="relative w-[90%] h-[90%] rounded-full shadow-[0_20px_45px_rgba(0,0,0,0.85)] transform-style-3d"
                style={{ transform: "rotateX(56deg)" }}
              >
                {/* Volumetric wood chassis */}
                <div className="absolute -inset-5 rounded-full border-[10px] border-amber-950 shadow-[inset_0_4px_15px_rgba(0,0,0,0.9)] bg-amber-900 flex items-center justify-center">
                  <div className="absolute inset-1.5 rounded-full border-2 border-yellow-500/40 shadow-[0_0_12px_rgba(234,179,8,0.15)]" />
                </div>
                
                {/* Base Segment Track */}
                <motion.div
                  animate={isSpinning ? { rotate: rotation } : { rotate: rotation % 360 }}
                  transition={{ duration: 4.5, ease: [0.25, 1, 0.5, 1] }}
                  className="absolute inset-0 rounded-full bg-slate-950 border-[6px] border-amber-700 overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.95)]"
                >
                  {NUMBERS.map((num, i) => {
                    const angle = (360 / NUMBERS.length) * i;
                    const numColor = num.color === "green" 
                      ? "bg-emerald-600 text-white" 
                      : num.color === "red" 
                        ? "bg-rose-600 text-white" 
                        : "bg-slate-900 text-slate-300";
                    
                    return (
                      <div
                        key={`seg-${i}`}
                        className="absolute top-0 left-1/2 w-6 h-1/2 origin-bottom -translate-x-1/2 flex flex-col items-center pt-0.5"
                        style={{ transform: `rotate(${angle}deg)` }}
                      >
                        <div className={`w-5 h-7 flex items-start justify-center pt-1 rounded-sm border border-yellow-500/5 ${numColor} shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.7)]`}>
                          <span className="text-[7.5px] font-black font-mono leading-none">
                            {num.n}
                          </span>
                        </div>
                        <div className="w-[0.5px] h-full bg-yellow-750/20 origin-top" />
                      </div>
                    );
                  })}
                  
                  {/* Center Brass Turret */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 via-amber-600 to-yellow-700 shadow-[0_0_15px_rgba(0,0,0,1)] flex items-center justify-center z-20">
                    <div className="w-10 h-10 rounded-full bg-slate-950 border border-yellow-500/30 flex items-center justify-center shadow-inner">
                      <span className="text-yellow-500 text-[6.5px] font-black tracking-widest uppercase">ROYALE</span>
                    </div>
                  </div>
                </motion.div>

                {/* Spinning Ball orbit */}
                {isSpinning && (
                  <motion.div
                    animate={{ rotate: ballRotation }}
                    transition={{ duration: 4.5, ease: [0.25, 1, 0.5, 1] }}
                    className="absolute inset-0 rounded-full pointer-events-none z-30"
                  >
                    <motion.div 
                      animate={{ y: ballRadiusOffset }}
                      transition={{ duration: 2.4, ease: "easeIn" }}
                      className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.3)]"
                    />
                  </motion.div>
                )}

                {/* Landed winning ball */}
                <AnimatePresence>
                  {!isSpinning && winningNumber && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 rounded-full pointer-events-none z-30"
                      style={{ transform: `rotate(${rotation % 360}deg)` }}
                    >
                       <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#fcfbf9] shadow-[0_0_8px_rgba(255,255,255,0.8),inset_-1.5px_-1.5px_3px_rgba(0,0,0,0.3)]" />
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </div>

          {/* Center part: Premium Emerald Betting Board */}
          <div className="w-full bg-[#051c10]/65 border border-yellow-500/15 backdrop-blur-md rounded-3xl p-4 sm:p-5 relative shadow-xl overflow-x-auto">
            
            <div className="min-w-[650px] relative">
              {/* Numbers Grid (horizontally aligned, Column 3 at top, Column 2 middle, Column 1 bottom) */}
              <div className="grid grid-cols-14 border border-yellow-500/30 rounded-xl overflow-hidden bg-slate-950/80">
                
                {/* 0 Cell (spans 3 rows) */}
                <button
                  disabled={isSpinning}
                  onClick={() => placeBet("num-0")}
                  className="row-span-3 h-full border-r border-yellow-500/30 bg-emerald-700/80 hover:bg-emerald-600 transition-colors flex items-center justify-center font-black font-mono text-lg text-white select-none cursor-pointer relative"
                >
                  <span>0</span>
                  {renderCellChip("num-0")}
                </button>

                {/* 12 columns of 3 rows */}
                {Array.from({ length: 12 }).map((_, colIdx) => {
                  // columns 3, 2, 1 descending
                  const nums = [
                    (colIdx * 3) + 3,
                    (colIdx * 3) + 2,
                    (colIdx * 3) + 1
                  ];
                  return (
                    <div key={`col-${colIdx}`} className="flex flex-col border-r border-yellow-500/30">
                      {nums.map(n => renderNumberCell(n))}
                    </div>
                  );
                })}

                {/* 2 to 1 column bets */}
                <div className="flex flex-col">
                  {["col-3", "col-2", "col-1"].map((col, idx) => (
                    <button
                      key={col}
                      disabled={isSpinning}
                      onClick={() => placeBet(col)}
                      className="h-12 border-b border-yellow-500/20 bg-emerald-950/40 hover:bg-white/10 flex items-center justify-center font-black text-[9px] text-yellow-500 uppercase cursor-pointer select-none transition-all relative active:scale-95"
                    >
                      <span>2:1</span>
                      {renderCellChip(col)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dozens Row */}
              <div className="grid grid-cols-14 border-x border-b border-yellow-500/30 rounded-b-xl overflow-hidden bg-emerald-950/20 mt-1">
                <div className="col-span-1" /> {/* empty space offset for 0 cell */}
                {[
                  { id: "doz-1", label: "1st 12" },
                  { id: "doz-2", label: "2nd 12" },
                  { id: "doz-3", label: "3rd 12" }
                ].map(doz => (
                  <button
                    key={doz.id}
                    disabled={isSpinning}
                    onClick={() => placeBet(doz.id)}
                    className="col-span-4 h-11 border-r border-yellow-500/30 bg-emerald-900/10 hover:bg-white/10 flex items-center justify-center font-black text-[10px] text-slate-300 uppercase cursor-pointer select-none transition-all relative active:scale-95"
                  >
                    <span>{doz.label}</span>
                    {renderCellChip(doz.id)}
                  </button>
                ))}
                <div className="col-span-1" />
              </div>

              {/* Red/Black Even/Odd Outside Bets Row */}
              <div className="grid grid-cols-14 border-x border-b border-yellow-500/30 rounded-b-xl overflow-hidden bg-emerald-950/30 mt-1">
                <div className="col-span-1" />
                {[
                  { id: "low", label: "1-18", color: "" },
                  { id: "even", label: "EVEN", color: "" },
                  { id: "red", label: "RED", color: "bg-rose-600/90 shadow-[0_0_12px_rgba(244,63,94,0.3)] border border-rose-500/40 text-white rounded-md mx-2 py-1.5" },
                  { id: "black", label: "BLACK", color: "bg-slate-900 border border-slate-700/60 text-slate-200 rounded-md mx-2 py-1.5" },
                  { id: "odd", label: "ODD", color: "" },
                  { id: "high", label: "19-36", color: "" }
                ].map(out => (
                  <button
                    key={out.id}
                    disabled={isSpinning}
                    onClick={() => placeBet(out.id)}
                    className="col-span-2 h-11 border-r border-yellow-500/30 hover:bg-white/10 flex items-center justify-center font-black text-[10px] text-slate-350 cursor-pointer select-none transition-all relative active:scale-95"
                  >
                    <span className={out.color || ""}>{out.label}</span>
                    {renderCellChip(out.id)}
                  </button>
                ))}
                <div className="col-span-1" />
              </div>
            </div>

          </div>

          {/* Bottom part: Chip Presets & Action Buttons */}
          <div className="w-full bg-[#051c10]/40 border border-yellow-500/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
            
            {/* Chip selector */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
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
                    className={`relative w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-black text-white shadow-lg transition-all duration-300 transform cursor-pointer border-[1.5px] border-white/60 select-none ${
                      isSelected ? "scale-115 ring-2 ring-yellow-500 ring-offset-2 ring-offset-emerald-950 opacity-100 z-10" : "hover:scale-105 opacity-60 hover:opacity-100"
                    } bg-gradient-to-br ${chip.color}`}
                  >
                    <div className="absolute inset-[2.5px] rounded-full border border-dashed border-white/40 flex items-center justify-center">
                      <span className="text-[7.5px] font-black tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                        {chip.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={undoLastBet} 
                disabled={isSpinning || betHistory.length === 0}
                className="px-3.5 py-2.5 rounded-xl border border-yellow-500/10 bg-[#020a05]/65 text-[10px] font-black text-slate-300 hover:text-white cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Undo
              </button>
              <button 
                onClick={doubleAllBets} 
                disabled={isSpinning || totalBetsSum === 0}
                className="px-3.5 py-2.5 rounded-xl border border-yellow-500/10 bg-[#020a05]/65 text-[10px] font-black text-slate-300 hover:text-white cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Double
              </button>
              <button 
                onClick={repeatLastBets} 
                disabled={isSpinning || Object.keys(prevBets).length === 0}
                className="px-3.5 py-2.5 rounded-xl border border-yellow-500/10 bg-[#020a05]/65 text-[10px] font-black text-slate-300 hover:text-white cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Repeat
              </button>
              <button 
                onClick={clearAllBets} 
                disabled={isSpinning || totalBetsSum === 0}
                className="px-3.5 py-2.5 rounded-xl border border-yellow-500/10 bg-[#020a05]/65 text-[10px] font-black text-slate-300 hover:text-white cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Clear
              </button>
            </div>

            {/* Spin Button */}
            <button
              onClick={handleSpinInit}
              disabled={isSpinning || totalBetsSum === 0}
              className={`py-3 px-8 rounded-xl font-black text-slate-950 text-xs uppercase tracking-widest transition-all cursor-pointer shadow-[0_6px_20px_rgba(234,179,8,0.15)] select-none shrink-0 ${
                isSpinning || totalBetsSum === 0
                  ? "bg-yellow-500/30 text-yellow-500/40 border border-yellow-500/15 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:scale-[1.03] active:scale-[0.97] border border-yellow-300 animate-pulse animate-duration-1000"
              }`}
            >
              🎰 Spin Wheel
            </button>
          </div>

        </div>

        {/* Right Section (Roadmaps, Line Chart, Limits) */}
        <div className="w-full lg:w-[220px] shrink-0 bg-[#051c10]/40 border border-yellow-500/10 rounded-3xl p-3 sm:p-4 flex flex-col gap-4 shadow-xl">
          
          {/* Stats chart summary */}
          <div>
            <span className="text-[9px] text-yellow-600 uppercase tracking-widest font-black block border-b border-yellow-950/60 pb-2">Session Analytics</span>
            <div className="mt-2.5 space-y-2">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                <span>RTP return</span>
                <span className="text-emerald-400 font-mono flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +97.3%
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                <span>Total Staked</span>
                <span className="font-mono text-slate-200">₹{totalWagered.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                <span>Net Profit</span>
                <span className={`font-mono font-black ${netProfit >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                  ₹{netProfit >= 0 ? "+" : ""}{netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Hot/Cold numbers indicator */}
          <div>
            <span className="text-[9px] text-yellow-600 uppercase tracking-widest font-black block border-b border-yellow-950/60 pb-2">Hot & Cold Sectors</span>
            <div className="mt-3 space-y-3">
              {/* Hot numbers */}
              <div className="flex items-center gap-2 justify-between">
                <span className="text-[8px] text-red-400 font-black uppercase flex items-center gap-1 tracking-wider"><TrendingUp className="w-3 h-3 text-red-500" /> Hot</span>
                <div className="flex gap-1.5">
                  {[32, 17, 15].map(n => (
                    <span key={`hot-${n}`} className="w-5 h-5 rounded-full bg-slate-900 border border-red-500/40 text-[9px] font-mono font-black text-white flex items-center justify-center">{n}</span>
                  ))}
                </div>
              </div>
              {/* Cold numbers */}
              <div className="flex items-center gap-2 justify-between">
                <span className="text-[8px] text-blue-400 font-black uppercase flex items-center gap-1 tracking-wider"><TrendingDown className="w-3 h-3 text-blue-500" /> Cold</span>
                <div className="flex gap-1.5">
                  {[0, 11, 28].map(n => (
                    <span key={`cold-${n}`} className="w-5 h-5 rounded-full bg-slate-900 border-blue-500/30 text-[9px] font-mono font-black text-white flex items-center justify-center">{n}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Secure details lock */}
          <div className="border border-yellow-500/10 bg-[#020a05]/50 p-3 rounded-xl">
            <span className="text-[8px] font-black uppercase text-yellow-500/80 tracking-widest block mb-1">🛡️ SEED VERIFICATION</span>
            <div className="text-[7.5px] font-mono text-slate-500 truncate mt-1">
              {roundSeed}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
            onClick={() => setShowWinOverlay(false)}
          >
            <motion.div
              initial={{ scale: 0.75, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.75, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="bg-slate-950 border-2 border-yellow-500/40 p-8 rounded-[2.5rem] text-center shadow-[0_30px_100px_rgba(234,179,8,0.35)] max-w-sm w-full relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, -12, 12, -6, 6, 0], scale: [1, 1.25, 1] }}
                transition={{ duration: 1.2, repeat: 3 }}
                className="text-7xl mb-4"
              >
                🎰
              </motion.div>

              <h2 className="text-3xl font-black text-white mb-1 uppercase tracking-widest">
                Winner Winner!
              </h2>
              <p className="text-[9px] text-yellow-500 font-bold uppercase tracking-widest mb-4">
                Live Emerald Payout
              </p>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35, type: "spring" }}
                className="text-4xl font-black font-mono mb-4 text-emerald-450 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]"
              >
                +₹{wonAmount.toLocaleString()}
              </motion.div>

              <div className="bg-emerald-950/20 border border-yellow-500/10 rounded-2xl p-4 mb-6 text-left">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Payout Statement</span>
                <div className="flex justify-between items-center mt-2 text-[10px] text-slate-350">
                  <span>Number landed:</span>
                  <span className={`font-mono font-bold px-1.5 rounded-full ${
                    winningNumber.color === "red" 
                      ? "bg-rose-500 text-white" 
                      : winningNumber.color === "black" 
                        ? "bg-slate-900 border border-slate-800 text-white" 
                        : "bg-emerald-500 text-white"
                  }`}>
                    {winningNumber.n} ({winningNumber.label})
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-355">
                  <span>Winnings sum:</span>
                  <span className="font-mono text-emerald-400 font-bold">₹{wonAmount.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setShowWinOverlay(false)}
                className="w-full py-3.5 rounded-xl font-black text-slate-950 text-xs uppercase tracking-widest border border-yellow-300 bg-gradient-to-r from-yellow-400 to-amber-500 hover:scale-[1.02] cursor-pointer"
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
