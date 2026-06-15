"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock, Zap, RotateCcw, AlertTriangle, RefreshCw } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { validateTransactionIdempotency } from "@/lib/mathEngine";

interface RoyalGamingProps {
  isPlaying: boolean;
  onComplete: (won: boolean) => void;
  gameId: string;
  gameTitle: string;
}

// 9 Royal Gaming Categories Config
const GAME_CONFIGS: Record<string, {
  label: string;
  targets: { id: string; name: string; odds: number; color: string }[];
  historyGenerator: () => string;
}> = {
  "royal-1": { // Teen Patti One Day Fusion
    label: "Teen Patti One Day Fusion",
    targets: [
      { id: "player_a", name: "Player A", odds: 1.98, color: "bg-blue-50 border-blue-200 text-blue-800" },
      { id: "player_b", name: "Player B", odds: 1.98, color: "bg-red-50 border-red-200 text-red-800" },
      { id: "tie", name: "Tie", odds: 9.00, color: "bg-slate-50 border-slate-200 text-slate-700" }
    ],
    historyGenerator: () => Math.random() > 0.5 ? "A" : "B"
  },
  "royal-1-20": { // Teen Patti 20-20
    label: "Teen Patti 20-20",
    targets: [
      { id: "player_a", name: "Player A", odds: 1.95, color: "bg-blue-50 border-blue-200 text-blue-800" },
      { id: "player_b", name: "Player B", odds: 1.95, color: "bg-red-50 border-red-200 text-red-800" },
      { id: "tie", name: "Tie", odds: 8.50, color: "bg-slate-50 border-slate-200 text-slate-700" }
    ],
    historyGenerator: () => Math.random() > 0.5 ? "A" : "B"
  },
  "royal-2": { // Super Over Fusion
    label: "Super Over Fusion (Cricket)",
    targets: [
      { id: "runs_over", name: "Runs Over 3.5", odds: 1.85, color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
      { id: "runs_under", name: "Runs Under 3.5", odds: 1.85, color: "bg-amber-50 border-amber-200 text-amber-800" },
      { id: "boundary", name: "Boundary Ball 1", odds: 3.50, color: "bg-indigo-50 border-indigo-200 text-indigo-800" },
      { id: "wicket", name: "Wicket in Over", odds: 4.50, color: "bg-red-50 border-red-200 text-red-800" }
    ],
    historyGenerator: () => {
      const outcomes = ["O", "U", "B", "W"];
      return outcomes[Math.floor(Math.random() * outcomes.length)];
    }
  },
  "royal-3": { // Andar Bahar Traditional
    label: "Andar Bahar Traditional",
    targets: [
      { id: "andar", name: "Andar", odds: 1.90, color: "bg-sky-50 border-sky-200 text-sky-800" },
      { id: "bahar", name: "Bahar", odds: 1.90, color: "bg-pink-50 border-pink-200 text-pink-800" }
    ],
    historyGenerator: () => Math.random() > 0.5 ? "A" : "B"
  },
  "royal-3-vr": { // Andar Bahar VR
    label: "Andar Bahar VR",
    targets: [
      { id: "andar", name: "Andar VR", odds: 1.90, color: "bg-sky-50 border-sky-200 text-sky-800" },
      { id: "bahar", name: "Bahar VR", odds: 1.90, color: "bg-pink-50 border-pink-200 text-pink-800" }
    ],
    historyGenerator: () => Math.random() > 0.5 ? "A" : "B"
  },
  "royal-4": { // 32 Cards Fusion
    label: "32 Cards Fusion",
    targets: [
      { id: "player_8", name: "Player 8", odds: 12.00, color: "bg-slate-50 border-slate-200 text-slate-800" },
      { id: "player_9", name: "Player 9", odds: 5.50, color: "bg-slate-50 border-slate-200 text-slate-800" },
      { id: "player_10", name: "Player 10", odds: 3.20, color: "bg-slate-50 border-slate-200 text-slate-800" },
      { id: "player_11", name: "Player 11", odds: 2.10, color: "bg-slate-50 border-slate-200 text-slate-800" }
    ],
    historyGenerator: () => {
      const players = ["8", "9", "10", "11"];
      return players[Math.floor(Math.random() * players.length)];
    }
  },
  "royal-5": { // Lightning 7 Up & Down Fusion
    label: "Lightning 7 Up & Down Fusion",
    targets: [
      { id: "seven_down", name: "7 Down", odds: 2.10, color: "bg-indigo-50 border-indigo-200 text-indigo-800" },
      { id: "seven_up", name: "7 Up", odds: 2.10, color: "bg-purple-50 border-purple-200 text-purple-800" },
      { id: "seven_exact", name: "Lucky 7", odds: 5.80, color: "bg-yellow-50 border-yellow-200 text-yellow-800" }
    ],
    historyGenerator: () => {
      const sum = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
      return sum === 7 ? "7" : sum > 7 ? "U" : "D";
    }
  },
  "royal-6": { // Dragon Tiger Fusion
    label: "Dragon Tiger Fusion",
    targets: [
      { id: "dragon", name: "Dragon", odds: 1.95, color: "bg-red-50 border-red-200 text-red-800" },
      { id: "tiger", name: "Tiger", odds: 1.95, color: "bg-yellow-50 border-yellow-200 text-yellow-800" },
      { id: "tie", name: "Tie", odds: 11.00, color: "bg-slate-50 border-slate-200 text-slate-800" }
    ],
    historyGenerator: () => Math.random() > 0.5 ? "D" : "T"
  },
  "royal-7": { // European Roulette
    label: "European Roulette",
    targets: [
      { id: "red", name: "Red", odds: 2.00, color: "bg-red-50 border-red-200 text-red-800" },
      { id: "black", name: "Black", odds: 2.00, color: "bg-slate-800 border-slate-700 text-white" },
      { id: "zero", name: "Zero (0)", odds: 35.00, color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
      { id: "even", name: "Even", odds: 2.00, color: "bg-slate-50 border-slate-200 text-slate-700" }
    ],
    historyGenerator: () => {
      const colors = ["R", "B", "Z"];
      const rand = Math.random();
      return rand < 0.48 ? "R" : rand < 0.96 ? "B" : "Z";
    }
  }
};

const COIN_VALUES = [50, 100, 500, 1000, 5000, 10000, 25000, 50000];

export function RoyalGamingEngine({ isPlaying, onComplete, gameId, gameTitle }: RoyalGamingProps) {
  const { balance: rawBalance, playCasino } = useTradingStore();
  const balance = typeof rawBalance === 'number' ? rawBalance : (parseFloat(String(rawBalance)) || 0);

  const configKey = GAME_CONFIGS[gameId] ? gameId : "royal-6";
  const currentConfig = GAME_CONFIGS[configKey];

  // Game Loop States: "Open" (bets active), "Closed" (deal happening), "Settle" (winner payout), "Cooldown"
  const [phase, setPhase] = useState<'open' | 'closed' | 'settled' | 'cooldown'>('open');
  const [countdown, setCountdown] = useState(15);
  
  // Chip selection & Bet placements
  const [selectedCoin, setSelectedCoin] = useState<number>(100);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [betHistory, setBetHistory] = useState<Record<string, number>[]>([]);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  
  // Scroller matrix loop tracking past round outputs
  const [historyList, setHistoryList] = useState<string[]>([]);
  
  // Simulation visual elements (zero-reflow Dealer Text & Feed)
  const [feedMsg, setFeedMsg] = useState("PLACE YOUR CHIPS");
  const [payoutOverlay, setPayoutOverlay] = useState<{ active: boolean; profit: number; won: boolean }>({ active: false, profit: 0, won: false });

  // Staggered dealer feed refs/timers to simulate zero-reflow socket broadcast
  const dealerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize history list
  useEffect(() => {
    const list: string[] = [];
    for (let i = 0; i < 15; i++) {
      list.push(currentConfig.historyGenerator());
    }
    setHistoryList(list);
  }, [configKey]);

  // Master live table countdown loop (automatically replicates live casino stream timelines)
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          // Transition phases
          if (phase === 'open') {
            setPhase('closed');
            setFeedMsg("BETS CLOSED • DEALING CARDS");
            return 5; // 5 seconds dealing phase
          } else if (phase === 'closed') {
            setPhase('settled');
            
            // Randomly select winning target
            const winningTarget = currentConfig.targets[Math.floor(Math.random() * currentConfig.targets.length)];
            setRoundWinner(winningTarget.id);
            setFeedMsg(`ROUND WINNER: ${winningTarget.name.toUpperCase()}`);

            // Calculate wagers & payouts
            let totalWager = 0;
            let totalPayout = 0;
            Object.entries(bets).forEach(([targetId, stake]) => {
              totalWager += stake;
              const target = currentConfig.targets.find(t => t.id === targetId);
              if (targetId === winningTarget.id && target) {
                totalPayout += stake * target.odds;
              }
            });

            const netProfit = totalPayout - totalWager;
            const didWin = totalPayout > 0;

            if (totalWager > 0) {
              // Commit transaction instantly to Zustand database
              playCasino(totalWager, totalPayout, currentConfig.label);
              setPayoutOverlay({
                active: true,
                profit: Math.round(netProfit),
                won: didWin
              });
            }

            // Append winner to statistical matrix ticker
            setHistoryList(prev => [...prev.slice(1), winningTarget.name.charAt(0)]);

            return 5; // 5 seconds settle overlay
          } else if (phase === 'settled') {
            setPhase('open');
            setRoundWinner(null);
            setBets({});
            setBetHistory([]);
            setPayoutOverlay({ active: false, profit: 0, won: false });
            setFeedMsg("PLACE YOUR CHIPS");
            return 15; // 15 seconds open bets phase
          }
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, bets, configKey, playCasino]);

  // Tactile chip placement
  const placeChip = (targetId: string) => {
    if (phase !== 'open') {
      setFeedMsg("BETS ARE CLOSED FOR THIS ROUND");
      setTimeout(() => setFeedMsg("BETS CLOSED • DEALING CARDS"), 1000);
      return;
    }

    const currentTotalPlaced = Object.values(bets).reduce((a, b) => a + b, 0);
    const target = currentConfig.targets.find(t => t.id === targetId);
    const odds = target ? target.odds : 2.0;

    const validation = validateTransactionIdempotency(balance - currentTotalPlaced, selectedCoin, odds, 'back');
    if (!validation.success) {
      setFeedMsg(validation.error || "INSUFFICIENT BALANCE");
      setTimeout(() => setFeedMsg("PLACE YOUR CHIPS"), 1500);
      return;
    }

    // Save previous state for Undo modifiers
    setBetHistory(prev => [...prev, { ...bets }]);

    setBets(prev => ({
      ...prev,
      [targetId]: (prev[targetId] || 0) + selectedCoin
    }));
  };

  // Modifier Actions
  const handleUndo = () => {
    if (phase !== 'open') return;
    if (betHistory.length === 0) return;
    const previous = betHistory[betHistory.length - 1];
    setBets(previous);
    setBetHistory(prev => prev.slice(0, -1));
  };

  const handleDouble = () => {
    if (phase !== 'open') return;
    const currentTotal = Object.values(bets).reduce((a, b) => a + b, 0);
    const validation = validateTransactionIdempotency(balance - currentTotal, currentTotal, 2.0, 'back');
    if (!validation.success) {
      setFeedMsg("INSUFFICIENT BALANCE TO DOUBLE BETS");
      setTimeout(() => setFeedMsg("PLACE YOUR CHIPS"), 1500);
      return;
    }

    setBetHistory(prev => [...prev, { ...bets }]);

    setBets(prev => {
      const doubled: Record<string, number> = {};
      Object.entries(prev).forEach(([key, val]) => {
        doubled[key] = val * 2;
      });
      return doubled;
    });
  };

  const totalActiveBet = Object.values(bets).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full h-full min-h-[580px] bg-slate-50 border-8 border-slate-300 rounded-[2.5rem] relative flex flex-col justify-between overflow-hidden shadow-2xl p-4 font-sans text-slate-800">
      
      {/* 1. Header Information Status Row */}
      <div className="flex items-center justify-between border-b pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span className="text-xs font-black tracking-widest text-slate-800 uppercase">{currentConfig.label}</span>
          <span className="bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded leading-none">
            Live Stream
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Total Bet</span>
            <span className="text-xs font-black text-slate-900 leading-none">₹{totalActiveBet.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/5 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <Clock className={cn("w-3.5 h-3.5", phase === 'open' ? 'text-indigo-600' : 'text-rose-500 animate-spin')} />
            <span className="text-sm font-black tracking-widest leading-none min-w-[15px]">
              {countdown}s
            </span>
          </div>
        </div>
      </div>

      {/* 2. Simulated Dealer Live Video Feed Wrapper */}
      <div className="relative flex-1 w-full bg-slate-100 border border-slate-200/80 rounded-2xl my-3.5 flex flex-col justify-between p-4 shadow-inner overflow-hidden min-h-[220px]">
        {/* Ambient reflection */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />

        {/* Dealer Tag Overlay */}
        <div className="flex justify-between items-center z-10 w-full">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Dealer ID: #702_Kylie
          </span>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Live HD Feed</span>
          </div>
        </div>

        {/* Deal visual center based on phase */}
        <div className="flex flex-col items-center justify-center text-center my-auto z-10 relative">
          <AnimatePresence mode="wait">
            {phase === 'open' && (
              <motion.div
                key="open"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="text-sm font-extrabold uppercase text-slate-900 tracking-wider">
                  {feedMsg}
                </div>
                <div className="h-0.5 w-16 bg-indigo-500 rounded-full animate-pulse" />
              </motion.div>
            )}

            {phase === 'closed' && (
              <motion.div
                key="closed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="text-xs font-black text-rose-600 uppercase tracking-widest animate-pulse">
                  {feedMsg}
                </div>
                {/* Simulated Dealer Staggered Hands Cards */}
                <div className="flex gap-2.5 mt-2 justify-center">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: -100, rotate: 45, opacity: 0 }}
                      animate={{ y: 0, rotate: 0, opacity: 1 }}
                      transition={{ delay: i * 0.3 }}
                      className="w-10 h-14 bg-white rounded border border-slate-300 shadow-md flex items-center justify-center text-slate-900 font-bold text-xs"
                    >
                      🂠
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {phase === 'settled' && (
              <motion.div
                key="settled"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="text-sm font-black text-indigo-700 uppercase tracking-widest animate-bounce">
                  {feedMsg}
                </div>
                {payoutOverlay.active && (
                  <div className={cn(
                    "px-4 py-1.5 rounded-full font-black text-xs uppercase shadow border leading-none mt-1",
                    payoutOverlay.won 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  )}>
                    {payoutOverlay.won ? `You Won: +₹${payoutOverlay.profit}` : `Round Settled: -₹${Math.abs(payoutOverlay.profit)}`}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Statistical Matrix Ticker (Past Outcome Vectors) */}
        <div className="border-t border-slate-200/80 pt-2 shrink-0 flex items-center gap-2 justify-between z-10 w-full">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Roadmap Ticker</span>
          <div className="flex gap-1 overflow-x-hidden max-w-[80%] items-center">
            {historyList.map((val, idx) => (
              <span 
                key={idx}
                className={cn(
                  "w-4 h-4 rounded-full text-[8.5px] font-black flex items-center justify-center border shadow-sm shrink-0",
                  val === 'A' || val === '8' || val === 'D' || val === 'U' || val === '7'
                    ? "bg-blue-100 border-blue-200 text-blue-800" 
                    : val === 'B' || val === '9' || val === 'T' || val === 'W'
                    ? "bg-red-100 border-red-200 text-red-800"
                    : "bg-slate-100 border-slate-200 text-slate-800"
                )}
              >
                {val}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Betting Canvas Matrix (Interactive Layout) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 shrink-0 my-1">
        {currentConfig.targets.map(target => {
          const activeWager = bets[target.id] || 0;
          const isWinner = phase === 'settled' && roundWinner === target.id;
          
          return (
            <button
              key={target.id}
              onClick={() => placeChip(target.id)}
              className={cn(
                "border rounded-xl p-3 flex flex-col justify-between items-center transition-all relative overflow-hidden h-[74px] shadow-sm",
                target.color,
                isWinner && "ring-4 ring-indigo-500 scale-102 border-indigo-300 font-black",
                phase !== 'open' && "opacity-85"
              )}
            >
              {/* Highlight flash for winners */}
              {isWinner && (
                <div className="absolute inset-0 bg-indigo-500/10 animate-pulse pointer-events-none" />
              )}
              
              <div className="flex justify-between items-center w-full">
                <span className="text-xs font-bold leading-none">{target.name}</span>
                <span className="text-[10px] font-black opacity-80 leading-none">x{target.odds.toFixed(2)}</span>
              </div>

              {/* Stacked Wagers Display */}
              <AnimatePresence>
                {activeWager > 0 ? (
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative w-8 h-8 rounded-full bg-slate-900 border-2 border-yellow-500 flex items-center justify-center text-[9px] font-black text-yellow-400 shadow-[0_0_8px_rgba(0,0,0,0.3)] z-10 leading-none"
                  >
                    {activeWager >= 1000 ? `${(activeWager/1000).toFixed(0)}K` : activeWager}
                  </motion.div>
                ) : (
                  <span className="text-[8.5px] text-slate-400 font-medium leading-none mb-1">Click to place bet</span>
                )}
              </AnimatePresence>

            </button>
          );
        })}
      </div>

      {/* 4. Bottom-Docked Tactile Coin Carousel Tray */}
      <div className="border-t border-slate-200 pt-3.5 mt-2 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        
        {/* Fast Action Modifiers */}
        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={handleUndo}
            disabled={phase !== 'open' || betHistory.length === 0}
            className="flex items-center gap-1 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent rounded px-3 py-2 text-[10px] font-black text-slate-700 uppercase leading-none tracking-wider transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Undo
          </button>
          <button
            onClick={handleDouble}
            disabled={phase !== 'open' || totalActiveBet === 0}
            className="flex items-center gap-1 border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent rounded px-3 py-2 text-[10px] font-black text-slate-700 uppercase leading-none tracking-wider transition-colors"
          >
            <Zap className="w-3 h-3" />
            Double (2x)
          </button>
        </div>

        {/* Carousel Coins Tray */}
        <div className="flex items-center gap-2 shrink-0 overflow-x-auto py-1 max-w-full custom-scrollbar">
          {COIN_VALUES.map(val => (
            <button
              key={val}
              onClick={() => setSelectedCoin(val)}
              style={{ willChange: "transform" }}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-[9px] font-black border-2 shadow-md shrink-0 transition-transform active:scale-95 leading-none",
                selectedCoin === val
                  ? "scale-110 ring-4 ring-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.3)] z-10 font-extrabold"
                  : "hover:scale-105",
                val === 50 && "bg-[#1E293B] border-slate-400 text-white",
                val === 100 && "bg-[#0284C7] border-sky-300 text-white",
                val === 500 && "bg-[#059669] border-emerald-300 text-white",
                val === 1000 && "bg-[#D97706] border-amber-300 text-white",
                val === 5000 && "bg-[#DC2626] border-rose-300 text-white",
                val === 10000 && "bg-[#7C3AED] border-violet-300 text-white",
                val === 25000 && "bg-[#B45309] border-amber-400 text-white",
                val === 50000 && "bg-[#1E1B4B] border-indigo-400 text-white"
              )}
            >
              {val >= 1000 ? `${(val/1000).toFixed(0)}K` : val}
            </button>
          ))}
        </div>

      </div>

    </div>
  );
}
