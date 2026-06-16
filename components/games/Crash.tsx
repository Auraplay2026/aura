"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@/hooks/useWallet";
import { Users, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type GameState = "idle" | "playing" | "crashed" | "cashed_out";

interface HighReachOutcome {
  id: string;
  user: string;
  bet: number;
  cashout: number;
  crashPoint: number;
  payout: number;
  time: string;
  isTopOnePercent: boolean;
}

interface ActivePlayer {
  username: string;
  bet: number;
  targetCashout: number;
  cashoutMultiplier: number | null;
  status: "playing" | "cashed_out" | "crashed";
}

interface ActivityLog {
  id: string;
  username: string;
  bet: number;
  multiplier: number | null;
  payout: number;
  status: "playing" | "cashed_out" | "crashed";
  time: string;
}

const NAMES = ["Roo_VIP", "AlphaBet", "CryptoGamer", "LuckyJack", "ZenRoll", "SpinNinja", "DegenZero", "DiceQueen", "RiskTaker", "BullRun", "CrashSniper", "HighMultiplier"];

const INITIAL_HIGH_REACHES: HighReachOutcome[] = [
  { id: "hr-1", user: "RooKing_88", bet: 500, cashout: 320.40, crashPoint: 324.50, payout: 160200, time: "08:42 AM", isTopOnePercent: true },
  { id: "hr-2", user: "AlphaTrader", bet: 1000, cashout: 250.00, crashPoint: 256.40, payout: 250000, time: "07:15 AM", isTopOnePercent: true },
  { id: "hr-3", user: "Hidden", bet: 250, cashout: 114.80, crashPoint: 114.80, payout: 28700, time: "06:30 AM", isTopOnePercent: true },
  { id: "hr-4", user: "AuraVibe", bet: 1200, cashout: 200.00, crashPoint: 204.80, payout: 240000, time: "05:12 AM", isTopOnePercent: true },
  { id: "hr-5", user: "RooSuper", bet: 100, cashout: 412.50, crashPoint: 412.50, payout: 41250, time: "02:19 AM", isTopOnePercent: true },
];

export function Crash() {
  const [betAmount, setBetAmount] = useState(10);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(0);
  const [cashoutAt, setCashoutAt] = useState<number | null>(null);
  
  // History lists
  const [recentMultipliers, setRecentMultipliers] = useState<number[]>([1.45, 2.10, 1.05, 4.20, 1.12, 324.50, 1.89, 1.02, 10.45, 1.25, 2.05, 114.80, 1.00, 1.62, 256.40]);
  const [highReaches, setHighReaches] = useState<HighReachOutcome[]>(INITIAL_HIGH_REACHES);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  
  // Simulated Multiplayer players
  const [simulatedPlayers, setSimulatedPlayers] = useState<ActivePlayer[]>([]);
  const [activeTab, setActiveTab] = useState<"top-one-percent" | "recent-runs">("top-one-percent");

  const { processBet, processWin } = useWallet();

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Avoid stale closures in animation loop
  const cashoutAtRef = useRef<number | null>(null);
  const betAmountRef = useRef<number>(betAmount);
  const simulatedPlayersRef = useRef<ActivePlayer[]>([]);
  const gameStateRef = useRef<GameState>(gameState);

  useEffect(() => { cashoutAtRef.current = cashoutAt; }, [cashoutAt]);
  useEffect(() => { betAmountRef.current = betAmount; }, [betAmount]);
  useEffect(() => { simulatedPlayersRef.current = simulatedPlayers; }, [simulatedPlayers]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const generateCrashPoint = () => {
    const rand = Math.random();
    if (rand < 0.04) return 1.00; // 4% instant crash
    if (rand < 0.50) return parseFloat((1.01 + Math.random() * 0.98).toFixed(2)); // 1.01x to 1.99x
    if (rand < 0.85) return parseFloat((2.00 + Math.random() * 7.99).toFixed(2)); // 2.00x to 9.99x
    if (rand < 0.985) return parseFloat((10.00 + Math.random() * 89.99).toFixed(2)); // 10.00x to 99.99x
    // Top 1.5% - huge reach!
    return parseFloat((100.00 + Math.random() * 500.00).toFixed(2));
  };

  const startSimulatedPlayers = (point: number) => {
    const count = Math.floor(Math.random() * 4) + 4; // 4 to 7 simulated players
    const players: ActivePlayer[] = [];
    for (let i = 0; i < count; i++) {
      const username = NAMES[Math.floor(Math.random() * NAMES.length)] + "_" + Math.floor(Math.random() * 9000 + 1000);
      const bet = Math.floor(Math.random() * 5) * 100 + 100; // 100 to 500
      // 70% chance they cash out before crash point, 30% chance they crash
      const willCrash = Math.random() < 0.30;
      const target = willCrash 
        ? point + 1.00 
        : parseFloat((1.05 + Math.random() * (point - 1.05)).toFixed(2));
      
      players.push({
        username,
        bet,
        targetCashout: target,
        cashoutMultiplier: null,
        status: "playing"
      });
    }
    setSimulatedPlayers(players);
  };

  const startGame = () => {
    // Generate crash point
    const point = generateCrashPoint();
    setCrashPoint(point);
    setMultiplier(1.00);
    setCashoutAt(null);
    setGameState("playing");

    // Deduct bet amount
    try {
      processBet(betAmount, "Originals: Crash");
    } catch (error: any) {
      alert(error.message || "Insufficient balance");
      setGameState("idle");
      return;
    }

    startSimulatedPlayers(point);

    startTimeRef.current = performance.now();
    requestRef.current = requestAnimationFrame(updateMultiplier);
  };

  const updateMultiplier = (time: number) => {
    if (!startTimeRef.current) return;
    const elapsed = time - startTimeRef.current;
    
    // Non-linear acceleration for the crash curve
    const currentMult = Math.max(1.00, Math.pow(Math.E, 0.000075 * elapsed));
    
    // Update simulated players in real-time
    setSimulatedPlayers(prev => 
      prev.map(p => {
        if (p.status === "playing" && currentMult >= p.targetCashout) {
          return {
            ...p,
            status: "cashed_out",
            cashoutMultiplier: p.targetCashout
          };
        }
        return p;
      })
    );

    if (currentMult >= crashPoint) {
      setMultiplier(crashPoint);
      setGameState(prevState => {
        if (prevState === "playing") {
          return "crashed";
        }
        return prevState;
      });

      // Add to recent multipliers history
      setRecentMultipliers(prev => [crashPoint, ...prev].slice(0, 15));

      // Finalize simulated players
      setSimulatedPlayers(prev => 
        prev.map(p => {
          if (p.status === "playing") {
            return { ...p, status: "crashed" };
          }
          return p;
        })
      );

      // Log this round's activities
      const roundActivities: ActivityLog[] = simulatedPlayersRef.current.map(p => ({
        id: `act-${Math.random()}`,
        username: p.username,
        bet: p.bet,
        multiplier: p.status === "cashed_out" ? p.cashoutMultiplier : null,
        payout: p.status === "cashed_out" && p.cashoutMultiplier ? p.bet * p.cashoutMultiplier : 0,
        status: p.status === "cashed_out" ? "cashed_out" : "crashed",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      const userActivity: ActivityLog = {
        id: `act-user-${Date.now()}`,
        username: "You",
        bet: betAmountRef.current,
        multiplier: cashoutAtRef.current,
        payout: cashoutAtRef.current ? betAmountRef.current * cashoutAtRef.current : 0,
        status: cashoutAtRef.current ? "cashed_out" : "crashed",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setRecentActivities(prev => [userActivity, ...roundActivities, ...prev].slice(0, 40));

      // Qualify for highest reach board
      if (crashPoint >= 100.00) {
        const newHighReach: HighReachOutcome = {
          id: `hr-${Date.now()}`,
          user: cashoutAtRef.current ? "You" : `Hidden_${Math.floor(Math.random() * 9000 + 1000)}`,
          bet: cashoutAtRef.current ? betAmountRef.current : Math.floor(Math.random() * 5 + 1) * 100,
          cashout: cashoutAtRef.current || 0,
          crashPoint,
          payout: cashoutAtRef.current ? betAmountRef.current * cashoutAtRef.current : 0,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isTopOnePercent: true
        };
        setHighReaches(prev => [newHighReach, ...prev].slice(0, 10));
      }

      return; // Stop animation loop
    } else {
      setMultiplier(currentMult);
      if (gameStateRef.current === "playing" || gameStateRef.current === "cashed_out") {
        requestRef.current = requestAnimationFrame(updateMultiplier);
      }
    }
  };

  const handleAction = () => {
    if (gameState === "idle" || gameState === "crashed" || gameState === "cashed_out") {
      startGame();
    } else if (gameState === "playing") {
      // Cash out
      const cashoutVal = multiplier;
      setCashoutAt(cashoutVal);
      setGameState("cashed_out");
      processWin(betAmount, cashoutVal, "Originals: Crash");
    }
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const payout = cashoutAt ? (betAmount * cashoutAt).toFixed(2) : "0.00";

  // Calculate jet coordinates for animation
  const jetX = Math.min(85, (multiplier - 1) * 8); 
  const jetY = Math.min(80, (multiplier - 1) * 6); 

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Game Card */}
      <div className="flex flex-col lg:flex-row gap-6 w-full h-[550px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-2xl relative">
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
                disabled={gameState === "playing" || gameState === "cashed_out"}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="w-full bg-transparent text-slate-900 font-bold px-3 focus:outline-none disabled:opacity-50"
              />
              <button disabled={gameState === "playing" || gameState === "cashed_out"} onClick={() => setBetAmount(Math.max(1, betAmount / 2))} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold disabled:opacity-50 transition-colors">1/2</button>
              <div className="w-[1px] bg-slate-100 mx-1"></div>
              <button disabled={gameState === "playing" || gameState === "cashed_out"} onClick={() => setBetAmount(betAmount * 2)} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold disabled:opacity-50 transition-colors">2x</button>
            </div>
          </div>

          {/* Multiplayer Active Ticker */}
          {gameState === "playing" && simulatedPlayers.length > 0 && (
            <div className="flex flex-col gap-2 bg-slate-900/5 p-4 rounded-xl border border-slate-200/50">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <span>Active Players</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {simulatedPlayers.filter(p => p.status === "playing").length} left</span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                {simulatedPlayers.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-slate-700 truncate max-w-[120px]">{p.username}</span>
                    {p.status === "cashed_out" ? (
                      <span className="text-green-600 font-black">Cashed {p.cashoutMultiplier?.toFixed(2)}x</span>
                    ) : p.status === "crashed" ? (
                      <span className="text-red-500 font-bold">Crashed</span>
                    ) : (
                      <span className="text-slate-400 font-mono">₹{p.bet}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto">
            <button 
              onClick={handleAction}
              disabled={gameState === "cashed_out" && multiplier < crashPoint}
              className={cn(
                "w-full py-4 rounded-xl font-black text-lg transition-all transform active:scale-95 shadow-lg select-none",
                gameState === "playing" 
                  ? "bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-[0_0_20px_rgba(249,115,22,0.3)]" 
                  : "bg-neon-green hover:bg-green-400 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {gameState === "playing" ? `Cash Out (₹${(betAmount * multiplier).toFixed(2)})` : gameState === "cashed_out" ? "Waiting..." : "Start Game"}
            </button>
          </div>
        </div>

        {/* Interactive Game Canvas */}
        <div className={cn(
          "flex-1 relative flex flex-col items-center justify-center p-8 transition-colors duration-500 overflow-hidden",
          gameState === "crashed" && !cashoutAt ? "bg-red-50" :
          gameState === "cashed_out" ? "bg-green-50" : "bg-slate-50"
        )}>
          {/* Top Multiplier History Tape */}
          <div className="absolute top-4 left-4 right-4 z-20 flex gap-2 items-center overflow-x-auto custom-scrollbar pb-2">
            {recentMultipliers.map((m, i) => (
              <span 
                key={i} 
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black shrink-0 shadow-sm border",
                  m < 2.00 
                    ? "bg-slate-100 border-slate-200 text-slate-600" 
                    : m < 10.00 
                      ? "bg-green-50 border-green-200 text-green-600" 
                      : m < 100.00 
                        ? "bg-purple-50 border-purple-200 text-purple-600" 
                        : "bg-amber-100 border-amber-300 text-amber-700 animate-pulse font-extrabold shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                )}
              >
                {m.toFixed(2)}x
              </span>
            ))}
          </div>

          {/* Airplane Jet following the path */}
          {(gameState === "playing" || gameState === "cashed_out") && (
            <motion.div 
              className="absolute z-20 pointer-events-none flex items-center gap-1.5"
              style={{ 
                bottom: `${jetY}%`, 
                left: `${jetX}%`, 
                transform: "translate(-50%, 50%)" 
              }}
            >
              <span className="text-3xl animate-pulse">✈️</span>
              <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping shrink-0" />
            </motion.div>
          )}

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

          {/* Multiplier Display */}
          <motion.div 
            className={cn(
              "text-[5.5rem] md:text-[8rem] font-black drop-shadow-2xl tabular-nums tracking-tighter z-10",
              gameState === "crashed" ? "text-red-500" : 
              gameState === "cashed_out" ? "text-green-600" : "text-slate-900"
            )}
          >
            {multiplier.toFixed(2)}<span className="text-3xl md:text-4xl opacity-50 ml-2">x</span>
          </motion.div>

          {gameState === "crashed" && (
            <div className="text-red-600 font-black text-xl uppercase tracking-widest mt-4 z-10 bg-white/90 px-6 py-2.5 rounded-full border border-red-500/20 shadow-md">
              💥 Crashed @ {crashPoint.toFixed(2)}x
            </div>
          )}

          {cashoutAt && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="absolute top-16 bg-green-500/10 border border-green-500/30 text-green-600 px-6 py-2.5 rounded-full font-black text-base z-10 shadow-[0_0_20px_rgba(34,197,94,0.15)] flex items-center gap-2"
            >
              <span>🎉 Cashed Out: {cashoutAt.toFixed(2)}x</span>
              <span className="opacity-40 font-normal">|</span>
              <span className="text-green-700">Won ₹{parseFloat(payout).toLocaleString()}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Stats Scoreboard */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-violet-600 animate-pulse animate-bounce" />
            <div>
              <h2 className="text-base font-black text-slate-950">Crash Activities & High Reaches</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Top 1% crash outliers & live session wagers</p>
            </div>
          </div>
          
          <div className="flex bg-slate-100 border border-slate-200/50 p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <button 
              onClick={() => setActiveTab("top-one-percent")}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black transition-all",
                activeTab === "top-one-percent" 
                  ? "bg-white text-slate-950 shadow-sm font-black" 
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              🏆 Top 1% Reach (24h)
            </button>
            <button 
              onClick={() => setActiveTab("recent-runs")}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black transition-all",
                activeTab === "recent-runs" 
                  ? "bg-white text-slate-950 shadow-sm font-black" 
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              ⚡ Live Activities
            </button>
          </div>
        </div>

        {activeTab === "top-one-percent" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-bold border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 uppercase tracking-widest text-[9px]">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4 text-right">Wager</th>
                  <th className="pb-3 pr-4 text-center">Cashout Point</th>
                  <th className="pb-3 pr-4 text-center">Crash Target</th>
                  <th className="pb-3 text-right">Total Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-755">
                {highReaches.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3.5 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center text-[10px] font-black shrink-0">👑</div>
                      <span className={cn(row.user === "You" ? "text-violet-600 font-extrabold" : "text-slate-900")}>{row.user}</span>
                    </td>
                    <td className="py-3.5 text-right font-mono text-slate-500">₹{row.bet.toLocaleString()}</td>
                    <td className="py-3.5 text-center font-mono">
                      {row.cashout > 0 ? (
                        <span className="text-green-600 bg-green-500/10 px-2 py-0.5 rounded-sm">{row.cashout.toFixed(2)}x</span>
                      ) : (
                        <span className="text-red-500 bg-red-500/10 px-2 py-0.5 rounded-sm">0.00x</span>
                      )}
                    </td>
                    <td className="py-3.5 text-center font-mono font-black text-amber-600">{row.crashPoint.toFixed(2)}x</td>
                    <td className="py-3.5 text-right font-mono font-black text-green-600">
                      {row.payout > 0 ? `+₹${row.payout.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "₹0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-bold border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 uppercase tracking-widest text-[9px]">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4 text-right">Wager</th>
                  <th className="pb-3 pr-4 text-center">Cashout</th>
                  <th className="pb-3 text-right">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-755">
                {recentActivities.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-450">No session wagers yet. Place a bet to begin!</td>
                  </tr>
                ) : (
                  recentActivities.map((act) => (
                    <tr key={act.id} className={cn("hover:bg-slate-50/40 transition-colors", act.username === "You" && "bg-violet-50/10")}>
                      <td className="py-3 pr-4 flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full shrink-0", act.status === "cashed_out" ? "bg-green-500" : "bg-red-500")} />
                        <span className={cn(act.username === "You" ? "text-violet-600 font-extrabold" : "text-slate-900")}>{act.username}</span>
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-slate-500">₹{act.bet.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-center font-mono">
                        {act.multiplier ? (
                          <span className="text-green-600 font-black">{act.multiplier.toFixed(2)}x</span>
                        ) : (
                          <span className="text-red-400 font-bold">Crashed</span>
                        )}
                      </td>
                      <td className={cn("py-3 text-right font-mono font-black", act.payout > 0 ? "text-green-600" : "text-slate-400")}>
                        {act.payout > 0 ? `₹${act.payout.toFixed(2)}` : "₹0.00"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
