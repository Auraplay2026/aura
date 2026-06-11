"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GAMES } from "@/lib/games";
import { ArrowLeft, AlertCircle, Zap, Minus, Plus, RefreshCw, Gamepad2, Play, Circle, Power, Clock, Flame, Activity, Users } from "lucide-react";
import { recordGameRound } from "@/lib/recordRound";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { SlotEngine } from "@/components/casino/engines/SlotEngine";
import { SlotEngineClassic } from "@/components/casino/engines/SlotEngineClassic";
import { SlotEngineCascade } from "@/components/casino/engines/SlotEngineCascade";
import { SlotEngineBubble } from "@/components/casino/engines/SlotEngineBubble";
import { CrashEngine } from "@/components/casino/engines/CrashEngine";
import { ClassicCrashEngine } from "@/components/casino/engines/ClassicCrashEngine";
import { AviatorEngine } from "@/components/casino/engines/AviatorEngine";
import { BalloonRaceEngine } from "@/components/casino/engines/BalloonRaceEngine";
import { BlackjackVIPEngine } from "@/components/casino/engines/BlackjackVIPEngine";
import { BaccaratEngine } from "@/components/casino/engines/BaccaratEngine";
import { CardEngine } from "@/components/casino/engines/CardEngine";
import { ArcadeEngine } from "@/components/casino/engines/ArcadeEngine";
import { FlappyChickenEngine } from "@/components/casino/engines/FlappyChickenEngine";
import { RouletteEngine } from "@/components/casino/engines/RouletteEngine";
import { DiceEngine } from "@/components/casino/engines/DiceEngine";
import { CoinflipEngine } from "@/components/casino/engines/CoinflipEngine";
import { LiveWheelEngine } from "@/components/casino/engines/LiveWheelEngine";
import { LimboEngine } from "@/components/casino/engines/LimboEngine";
import { MinesEngine } from "@/components/casino/engines/MinesEngine";
import { KenoEngine } from "@/components/casino/engines/KenoEngine";
import { PlinkoEngine } from "@/components/casino/engines/PlinkoEngine";
import { GameTutorialOverlay } from "@/components/GameTutorialOverlay";

// VIP LIVE RENTERS & BETS SIDEBAR
function VIPLiveBetsFeed({ gameTitle }: { gameTitle: string }) {
  const [data, setData] = useState<{
    bets: { user: string; bet: string; mult: string; win: string; color: string; game?: string; type?: string }[];
    stats: { totalWagered: string; maxWin: string; activePlayers: string };
  }>({
    bets: [
      { user: "CryptoWhale", bet: "5 hrs", mult: "₹399/hr", win: "₹1,995", color: "text-emerald-600", game: "Cyberpunk 2077", type: "rental" },
      { user: "Anon_77", bet: "₹12,500", mult: "12.5x", win: "₹156,250", color: "text-neon-purple animate-pulse", game: "Sweet Bonanza", type: "bet" },
      { user: "SatoshiFan", bet: "1 hr", mult: "₹199/hr", win: "₹199", color: "text-slate-500", game: "Valorant", type: "rental" },
      { user: "VIP_Diamond", bet: "12 hrs", mult: "₹499/hr", win: "₹5,988", color: "text-emerald-600", game: "Elden Ring", type: "rental" },
      { user: "LuckBox", bet: "₹3,450", mult: "0.0x", win: "₹0", color: "text-slate-500", game: "Plinko", type: "bet" },
    ],
    stats: {
      totalWagered: "14,802 hrs / ₹4.2M",
      maxWin: "24 hrs / 250x",
      activePlayers: "842"
    }
  });

  useEffect(() => {
    const fetchHypeData = async () => {
      try {
        const res = await fetch("/api/casino/high-rollers");
        if (res.ok) {
          const json = await res.json();
          // Map raw data from background minute generator
          const mappedBets = json.bets.map((b: any) => {
            const isRental = b.type === 'rental';
            return {
              user: b.user,
              bet: b.bet, // "X hrs" or "₹X"
              mult: b.mult, // "₹X/hr" or "Xx"
              win: b.win, // total total
              color: b.color,
              game: b.game,
              type: b.type
            };
          });
          
          setData({
            bets: mappedBets,
            stats: {
              totalWagered: json.stats.totalWagered.replace('₹', '').replace('M', 'k'),
              maxWin: json.stats.maxWin.replace('₹', '').replace('M', 'k'),
              activePlayers: json.stats.activePlayers
            }
          });
        }
      } catch (err) {
        console.error("Failed to fetch VIP feed", err);
      }
    };

    fetchHypeData();
    // Update every minute (60 seconds)
    const interval = setInterval(fetchHypeData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden xl:flex w-[350px] shrink-0 flex-col gap-6 relative">
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-slate-200 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-neon-purple/20 blur-[50px] rounded-full pointer-events-none" />
        
        <h3 className="text-slate-900 font-black uppercase tracking-widest text-sm flex items-center gap-3 mb-6">
          <Flame className="w-5 h-5 text-orange-500 animate-pulse" /> Live Hub Feed
        </h3>
        
        <div className="space-y-4">
          <div className="relative min-h-[350px] flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {data.bets.map((bet, i) => (
                <motion.div 
                  key={`${bet.user}-${bet.bet}-${bet.mult}-${bet.win}-${i}`} 
                  layout
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex flex-col gap-2 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/50 hover:bg-slate-100/50 transition-colors shadow-inner"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-900 font-bold text-xs">{bet.user}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">
                          {bet.type === 'rental' ? '⚡ Rent' : '🎰 Bet'}
                        </span>
                        <span className="text-[10px] text-purple-600 font-semibold tracking-wide">
                          🎮 {bet.game}
                        </span>
                      </div>
                    </div>
                    <span className="text-slate-600 text-[10px] font-mono font-semibold">{bet.bet}</span>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <span className={`text-[10px] font-black ${bet.color} bg-white px-2 py-0.5 rounded shadow-inner border border-slate-200`}>{bet.mult}</span>
                    <span className="text-neon-green font-black font-mono tracking-tight text-sm drop-shadow-[0_2px_8px_rgba(34,197,94,0.3)]">{bet.win}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Session Stats */}
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-slate-200 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <h3 className="text-slate-900 font-black uppercase tracking-widest text-sm flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5 text-cyan-600" /> Platform Stats
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/50 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Vol / Streamed</p>
            <p className="text-slate-900 font-mono font-black text-sm">{data.stats.totalWagered}</p>
          </div>
          <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/50 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Max Win / Session</p>
            <p className="text-neon-green font-mono font-black text-sm">{data.stats.maxWin}</p>
          </div>
          <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/80 text-center col-span-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Active Streams & players</p>
            <p className="text-neon-yellow font-mono font-black text-xl tracking-widest">{data.stats.activePlayers}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// THEME ENGINE CONFIGURATION
const THEME_PROFILES: Record<string, any> = {
  "sweet-bonanza": { cols: 6, rows: 5, symbols: ["🍬", "🍭", "🍇", "🍉", "🍎", "❤️", "⭐"], primaryColor: "pink-500", bgGradient: "from-pink-900/30 via-purple-950/80 to-[#050914]", buttonGradient: "from-pink-400 via-pink-500 to-purple-500", buttonHover: "hover:from-pink-300 hover:to-purple-400", borderClass: "border-pink-500/40", shadowClass: "shadow-[0_0_80px_rgba(236,72,153,0.2)]", animationType: "tumble", slotBg: "bg-pink-100" },
  "sweet-bonanza-1000": { cols: 6, rows: 6, symbols: ["🍬", "🍭", "🍇", "🍉", "🍒", "🍩", "✨"], primaryColor: "pink-600", bgGradient: "from-pink-950/40 via-fuchsia-950/80 to-[#050914]", buttonGradient: "from-pink-500 via-fuchsia-600 to-pink-600", buttonHover: "hover:from-pink-400 hover:to-fuchsia-500", borderClass: "border-pink-500/50", shadowClass: "shadow-[0_0_80px_rgba(236,72,153,0.3)]", animationType: "tumble", slotBg: "bg-fuchsia-100" },
  "gates-of-olympus": { cols: 6, rows: 5, symbols: ["👑", "🏺", "💍", "💎", "⚡", "🏛️", "🔴"], primaryColor: "yellow-500", bgGradient: "from-blue-950 via-slate-900/90 to-[#050914]", buttonGradient: "from-yellow-600 via-yellow-500 to-amber-600", buttonHover: "hover:from-yellow-400 hover:to-yellow-500", borderClass: "border-yellow-500/40", shadowClass: "shadow-[0_0_80px_rgba(234,179,8,0.2)]", animationType: "tumble", slotBg: "bg-blue-100" },
  "book-of-dead": { cols: 5, rows: 3, symbols: ["📖", "🏺", "🪲", "💀", "👑", "🐪", "⚜️"], primaryColor: "amber-600", bgGradient: "from-amber-950/30 via-slate-900/90 to-[#050914]", buttonGradient: "from-amber-600 via-yellow-600 to-yellow-500", buttonHover: "hover:from-amber-500 hover:to-yellow-500", borderClass: "border-amber-600/40", shadowClass: "shadow-[0_0_80px_rgba(217,119,6,0.2)]", animationType: "spin", slotBg: "bg-amber-100" },
  "the-dog-house": { cols: 5, rows: 3, symbols: ["🐶", "🦴", "🥩", "🐾", "🐕", "A", "K"], primaryColor: "green-500", bgGradient: "from-green-950/40 via-[#050914] to-black", buttonGradient: "from-green-500 via-emerald-500 to-green-600", buttonHover: "hover:from-green-400 hover:to-emerald-400", borderClass: "border-green-600/40", shadowClass: "shadow-[0_0_80px_rgba(34,197,94,0.2)]", animationType: "spin", slotBg: "bg-amber-100" },
  "the-dog-house-megaways": { cols: 6, rows: 4, symbols: ["🐶", "🦴", "🥩", "🐾", "🐕", "🏠", "🍖"], primaryColor: "emerald-500", bgGradient: "from-emerald-950/40 via-green-950/80 to-[#050914]", buttonGradient: "from-emerald-500 via-green-600 to-emerald-600", buttonHover: "hover:from-emerald-400 hover:to-green-500", borderClass: "border-emerald-600/40", shadowClass: "shadow-[0_0_80px_rgba(16,185,129,0.2)]", animationType: "spin", slotBg: "bg-green-100" },
  "sugar-rush-1000": { cols: 7, rows: 6, symbols: ["🧸", "🍬", "🍭", "🍩", "🧁", "🍪", "🍓"], primaryColor: "fuchsia-500", bgGradient: "from-fuchsia-950/30 via-purple-900/80 to-[#050914]", buttonGradient: "from-fuchsia-400 via-fuchsia-500 to-pink-500", buttonHover: "hover:from-fuchsia-300 hover:to-pink-400", borderClass: "border-fuchsia-500/40", shadowClass: "shadow-[0_0_80px_rgba(217,70,239,0.3)]", animationType: "tumble", slotBg: "bg-fuchsia-100" },
  "starlight-princess-1000": { cols: 6, rows: 5, symbols: ["⭐", "✨", "👑", "💎", "🌙", "🔮", "🦄"], primaryColor: "purple-400", bgGradient: "from-indigo-950/40 via-purple-950/80 to-[#050914]", buttonGradient: "from-indigo-400 via-purple-500 to-pink-400", buttonHover: "hover:from-indigo-350 hover:to-purple-400", borderClass: "border-purple-400/40", shadowClass: "shadow-[0_0_80px_rgba(168,85,247,0.3)]", animationType: "tumble", slotBg: "bg-indigo-100" },
  "zeus-vs-hades-gods-of-war": { cols: 5, rows: 5, symbols: ["⚡", "🔥", "🔱", "🦅", "🐕", "🌋", "🔵"], primaryColor: "purple-500", bgGradient: "from-blue-950/40 via-red-950/40 to-[#050914]", buttonGradient: "from-blue-600 via-purple-600 to-red-600", buttonHover: "hover:from-blue-500 hover:to-red-500", borderClass: "border-purple-500/40", shadowClass: "shadow-[0_0_80px_rgba(239,68,68,0.2)]", animationType: "spin", slotBg: "bg-slate-50/40" },
  "madame-destiny-megaways": { cols: 6, rows: 4, symbols: ["🔮", "🃏", "🦉", "🐈", "🕯️", "🪙", "🧿"], primaryColor: "violet-500", bgGradient: "from-violet-950/50 via-[#050914] to-black", buttonGradient: "from-violet-600 via-fuchsia-700 to-indigo-600", buttonHover: "hover:from-violet-500 hover:to-indigo-500", borderClass: "border-violet-500/40", shadowClass: "shadow-[0_0_80px_rgba(139,92,246,0.3)]", animationType: "spin", slotBg: "bg-violet-100" },
  "gemhalla-xtreme": { cols: 6, rows: 5, symbols: ["🪓", "🛡️", "🍺", "🐺", "⚡", "🪙", "🍀"], primaryColor: "emerald-500", bgGradient: "from-emerald-950/40 via-slate-900/95 to-[#050914]", buttonGradient: "from-emerald-600 via-green-600 to-teal-500", buttonHover: "hover:from-emerald-500 hover:to-teal-400", borderClass: "border-emerald-500/40", shadowClass: "shadow-[0_0_80px_rgba(16,185,129,0.2)]", animationType: "tumble", slotBg: "bg-emerald-100" },
  "fishing-time-deluxe": { cols: 5, rows: 4, symbols: ["🐟", "🐠", "🐡", "🎣", "🛥️", "🪙", "🐙"], primaryColor: "teal-500", bgGradient: "from-teal-950/50 via-[#050914] to-black", buttonGradient: "from-teal-500 via-cyan-500 to-blue-500", buttonHover: "hover:from-teal-400 hover:to-blue-400", borderClass: "border-teal-500/40", shadowClass: "shadow-[0_0_80px_rgba(20,184,166,0.3)]", animationType: "spin", slotBg: "bg-teal-100" }
};

const PROCEDURAL_COLORS = [
  { p: "cyan-500", grad: "from-cyan-900/30 via-blue-950/80 to-[#050914]", btn: "from-cyan-500 via-blue-500 to-cyan-600", hover: "hover:from-cyan-400 hover:to-blue-400", border: "border-cyan-500/40", shadow: "shadow-[0_0_80px_rgba(6,182,212,0.2)]", bg: "bg-cyan-100" },
  { p: "orange-500", grad: "from-orange-900/30 via-red-950/80 to-[#050914]", btn: "from-orange-500 via-red-500 to-orange-600", hover: "hover:from-orange-400 hover:to-red-400", border: "border-orange-500/40", shadow: "shadow-[0_0_80px_rgba(249,115,22,0.2)]", bg: "bg-orange-100" },
  { p: "emerald-500", grad: "from-emerald-900/30 via-green-950/80 to-[#050914]", btn: "from-emerald-500 via-green-500 to-emerald-600", hover: "hover:from-emerald-400 hover:to-green-400", border: "border-emerald-500/40", shadow: "shadow-[0_0_80px_rgba(16,185,129,0.2)]", bg: "bg-emerald-100" },
  { p: "fuchsia-500", grad: "from-fuchsia-900/30 via-purple-950/80 to-[#050914]", btn: "from-fuchsia-500 via-purple-500 to-fuchsia-600", hover: "hover:from-fuchsia-400 hover:to-purple-400", border: "border-fuchsia-500/40", shadow: "shadow-[0_0_80px_rgba(217,70,239,0.2)]", bg: "bg-fuchsia-100" }
];

const PROCEDURAL_SYMBOLS = [
  ["⚔️", "🛡️", "🐉", "🏰", "👑", "A", "K"],
  ["👽", "🛸", "🚀", "👾", "☄️", "🪐", "⭐"],
  ["🤠", "🌵", "🐎", "🔫", "💰", "A", "J"],
  ["🌶️", "🌮", "🎸", "🌵", "🎉", "🔥", "⭐"]
];

function getProceduralTheme(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  hash = Math.abs(hash);
  const c = PROCEDURAL_COLORS[hash % PROCEDURAL_COLORS.length];
  const s = PROCEDURAL_SYMBOLS[hash % PROCEDURAL_SYMBOLS.length];
  return { cols: [5, 6, 7][hash % 3], rows: [3, 4, 5][hash % 3], symbols: s, primaryColor: c.p, bgGradient: c.grad, buttonGradient: c.btn, buttonHover: c.hover, borderClass: c.border, shadowClass: c.shadow, animationType: hash % 2 === 0 ? "tumble" : "spin", slotBg: c.bg };
}

function RollingCounter({ target }: { target: number }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCurrent(target);
        clearInterval(timer);
      } else setCurrent(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <>{current.toFixed(2)}</>;
}

export default function GamePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [loadingStep, setLoadingStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [tutorialDismissed, setTutorialDismissed] = useState(false);
  const [rngSeed, setRngSeed] = useState("INITIALIZING");

  // Rental & Session state (Cloud Mode)
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [selectedHours, setSelectedHours] = useState(3);
  const [sessionHours, setSessionHours] = useState(3);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [customHoursVal, setCustomHoursVal] = useState("");

  useEffect(() => {
    setRngSeed(Math.random().toString(36).substring(2, 15).toUpperCase());
  }, []);
  
  // Game UX State
  const { balance: rawBalance, playCasino, currentUser } = useTradingStore();
  const balance = typeof rawBalance === 'number' ? rawBalance : 0;
  const [betAmount, setBetAmount] = useState(100);
  const [customBetVal, setCustomBetVal] = useState("");
  const [isTurbo, setIsTurbo] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winAmount, setWinAmount] = useState<number | null>(null);
  const [isMegaWin, setIsMegaWin] = useState(false);

  const [isDemoLimitReached, setIsDemoLimitReached] = useState(false);
  const [demoRentalsCount, setDemoRentalsCount] = useState(0);

  useEffect(() => {
    const isDemo = !currentUser || currentUser.accountType === 'demo';
    if (isDemo) {
      const count = parseInt(localStorage.getItem("demo_rentals_count") || "0");
      setDemoRentalsCount(count);
      if (count >= 3) {
        setIsDemoLimitReached(true);
      }
    } else {
      setIsDemoLimitReached(false);
      setDemoRentalsCount(0);
    }
  }, [currentUser]);

  const game = GAMES.find(g => g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === id || g.id === id);

  const theme = useMemo(() => {
    if (!game) return getProceduralTheme(id);
    const titleKey = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (THEME_PROFILES[titleKey]) return THEME_PROFILES[titleKey];
    if (THEME_PROFILES[id]) return THEME_PROFILES[id];
    
    if (game.title.toLowerCase().includes("dog house")) return THEME_PROFILES["the-dog-house"];
    if (game.title.toLowerCase().includes("sweet bonanza")) return THEME_PROFILES["sweet-bonanza"];
    if (game.title.toLowerCase().includes("olympus")) return THEME_PROFILES["gates-of-olympus"];
    
    return getProceduralTheme(id);
  }, [id, game]);

  // Mode Classification: Cloud Renting vs Casino Betting
  const isCloudRenting = game ? (game.hourlyRate !== undefined && game.hourlyRate > 0) : false;

  // Initialization Hook
  useEffect(() => {
    if (!game) return;
    const steps = [
      setTimeout(() => setLoadingStep(1), 600),
      setTimeout(() => setLoadingStep(2), 1200),
      setTimeout(() => setLoadingStep(3), 2000),
      setTimeout(() => setIsLoading(false), 2800)
    ];
    return () => steps.forEach(clearTimeout);
  }, [game]);

  // Rental timer countdown
  useEffect(() => {
    if (!isSessionActive || sessionTimeLeft <= 0) {
      if (sessionTimeLeft === 0 && isSessionActive) {
        setIsSessionActive(false);
      }
      return;
    }
    const timer = setInterval(() => {
      setSessionTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSessionActive, sessionTimeLeft]);

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Gamepad2 className="w-16 h-16 text-slate-700 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Game Not Found</h1>
        <button onClick={() => router.push('/')} className="bg-neon-purple hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-bold">Back to Lobby</button>
      </div>
    );
  }

  // Cloud Mode Actions
  const rentCost = selectedHours * (game.hourlyRate || 0);

  const handleRent = () => {
    const isDemo = !currentUser || currentUser.accountType === 'demo';
    if (isDemo) {
      if (demoRentalsCount >= 3) {
        alert("You have reached the limit of 3 free trials in Demo mode. Please deposit money to switch to a Real Account and continue playing.");
        window.dispatchEvent(new CustomEvent("open-cashier"));
        return;
      }
      const nextCount = demoRentalsCount + 1;
      localStorage.setItem("demo_rentals_count", nextCount.toString());
      setDemoRentalsCount(nextCount);
      if (nextCount >= 3) {
        setIsDemoLimitReached(true);
      }
    }

    if (balance < rentCost) return;
    playCasino(rentCost, 0, game.title);
    setSessionHours(selectedHours);
    setSessionTimeLeft(selectedHours * 3600);
    setIsSessionActive(true);
    
    recordGameRound({
      gameId: game.id,
      userId: 'current-user',
      wager: rentCost,
      payout: 0,
      multiplier: selectedHours,
      won: false
    });
  };

  const handleExtend = () => {
    const cost = game.hourlyRate || 0;
    if (balance < cost) return;
    playCasino(cost, 0, game.title);
    setSessionTimeLeft(prev => prev + 3600);
    setSessionHours(prev => prev + 1);
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    setSessionTimeLeft(0);
  };

  // Casino Mode Actions
  const handlePlay = () => {
    if (isSpinning) return;
    if (balance < betAmount) {
      alert("Insufficient balance to place this bet. Please deposit funds or adjust your stake.");
      window.dispatchEvent(new CustomEvent("open-cashier"));
      return;
    }
    setIsSpinning(true);
    setWinAmount(null);
    setIsMegaWin(false);
  };

  const handleEngineComplete = useCallback((multiplierOrWon: number | boolean, wonBool?: boolean) => {
    setIsSpinning(false);
    if (isCloudRenting) return; // Cloud streams don't credit/wager payouts
    
    let won = false;
    let mult = 0;

    if (typeof multiplierOrWon === "number") {
      mult = multiplierOrWon;
      won = wonBool ?? false;
    } else {
      won = multiplierOrWon;
      mult = 2.0; 
    }

    const payout = won ? betAmount * mult : 0;
    playCasino(betAmount, payout, game.title);

    if (won) {
      setWinAmount(payout);
      if (mult >= 10) setIsMegaWin(true);
      recordGameRound({
        gameId: game.id,
        userId: 'current-user',
        wager: betAmount,
        payout,
        multiplier: mult,
        won: true,
      });
    } else {
      recordGameRound({
        gameId: game.id,
        userId: 'current-user',
        wager: betAmount,
        payout: 0,
        multiplier: 0,
        won: false,
      });
    }
  }, [betAmount, playCasino, game, isCloudRenting]);

  const handleLaunchStream = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWinAmount(null);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // DYNAMIC ROUTER
  const isArcade = game.categories.some(cat => ["fps", "driving", "retro", "sports", "action", "puzzle", "racing", "adventure"].includes(cat));

  const renderEngine = () => {
    // === ORIGINALS — each gets its own unique engine ===
    if (game.id === "orig-7" || game.title.toLowerCase().includes("tower")) {
      return <FlappyChickenEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-2" || game.title.toLowerCase().includes("limbo")) {
      return <LimboEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-3" || game.title.toLowerCase().includes("plinko")) {
      return <PlinkoEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-4" || game.title.toLowerCase().includes("mines")) {
      return <MinesEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-6" || game.title.toLowerCase().includes("keno")) {
      return <KenoEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-11" || game.title.toLowerCase().includes("roulette")) {
      return <RouletteEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-5" || game.title.toLowerCase().includes("dice")) {
      return <DiceEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-9" || game.title.toLowerCase().includes("coin")) {
      return <CoinflipEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-10" || game.categories.includes("shows") || game.title.toLowerCase().includes("wheel") || game.title.toLowerCase().includes("time") || game.title.toLowerCase().includes("funky") || game.title.toLowerCase().includes("monopoly") || game.title.toLowerCase().includes("dream catcher")) {
      return <LiveWheelEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
    }
    // === CRASH GAMES ===
    if (game.categories.includes("crash")) {
      if (game.id === "orig-1" || game.title.toLowerCase() === "crash") {
        return <ClassicCrashEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
      }
      if (game.id === "crash-1" || game.title.toLowerCase().includes("aviator") || game.title.toLowerCase().includes("aviamasters")) {
        return <AviatorEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
      }
      if (game.id === "live-6" || game.title.toLowerCase().includes("balloon")) {
        return <BalloonRaceEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
      }
      if (game.title.toLowerCase().includes("coin flip") || game.title.toLowerCase().includes("crazy coin")) {
        return <CoinflipEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
      }
      return <CrashEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
    }
    // === TABLE / CARD GAMES ===
    if (game.categories.includes("poker") || game.categories.includes("table") || game.id.includes("blackjack") || game.id.includes("poker")) {
      if (game.id.includes("blackjack") || game.title.toLowerCase().includes("blackjack") || game.id === "orig-8") {
        return <BlackjackVIPEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
      }
      if (game.id.includes("baccarat") || game.title.toLowerCase().includes("baccarat") || game.id === "table-3") {
        return <BaccaratEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
      }
      return <CardEngine isPlaying={isSpinning} onComplete={handleEngineComplete} gameId={game.id} gameTitle={game.title} />;
    }
    // === CLOUD / ARCADE ===
    if (isCloudRenting || isArcade) {
      return <ArcadeEngine gameId={game.id} isPlaying={isSpinning} onComplete={handleEngineComplete} />;
    }
    // === SLOTS — differentiated by theme ===
    const isClassic = game.title.toLowerCase().includes("dog house") || game.title.toLowerCase().includes("book") || game.title.toLowerCase().includes("bonanza 1000");
    const isCascade = game.title.toLowerCase().includes("sweet bonanza") || game.title.toLowerCase().includes("sugar rush") || game.title.toLowerCase().includes("gemhalla");
    const isBubble = game.title.toLowerCase().includes("fish");

    if (isClassic) return <SlotEngineClassic isPlaying={isSpinning} theme={theme} onComplete={handleEngineComplete} />;
    if (isCascade) return <SlotEngineCascade isPlaying={isSpinning} theme={theme} onComplete={handleEngineComplete} />;
    if (isBubble) return <SlotEngineBubble isPlaying={isSpinning} theme={theme} onComplete={handleEngineComplete} />;

    return <SlotEngine isPlaying={isSpinning} isTurbo={isTurbo} theme={theme} onComplete={handleEngineComplete} />;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-wide">{game.title}</h1>
            <p className="text-sm text-slate-600 font-medium">Publisher: <span className="text-neon-yellow">{game.provider}</span></p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 w-full">

          {/* Game Container Wrapper */}
          <motion.div 
            animate={isMegaWin ? { x: [-10, 10, -10, 10, -5, 5, 0], y: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.6 }}
            className={`relative w-full h-[calc(100vh-120px)] md:h-[calc(100vh-100px)] min-h-[450px] md:min-h-[600px] bg-white rounded-2xl border border-slate-200 overflow-hidden ${theme.shadowClass} flex flex-col group`}
          >
            <AnimatePresence>
              {isLoading ? (
                <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0 bg-slate-50 z-50 flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&q=80')] opacity-10 bg-cover bg-center mix-blend-screen" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#02050a] via-[#02050a]/80 to-transparent" />
                  
                  <div className="relative z-10 w-full max-w-md px-8 flex flex-col items-center">
                    <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
                      <div className="absolute inset-0 border border-slate-200 rounded-full" />
                      <div className="absolute inset-2 border border-slate-700/50 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-neon-purple border-t-transparent rounded-full shadow-[0_0_30px_rgba(168,85,247,0.4)]" />
                      <motion.div animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-4 border border-neon-green border-b-transparent rounded-full" />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-full backdrop-blur-sm">
                        <Gamepad2 className="w-10 h-10 text-slate-900 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                      </div>
                    </div>

                    <div className="w-full space-y-4">
                      <div className="flex justify-between items-end mb-2">
                        <div className="h-6 overflow-hidden">
                          <AnimatePresence mode="wait">
                            <motion.p key={loadingStep} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="text-neon-green font-mono font-bold tracking-widest text-xs uppercase">
                              {loadingStep === 0 && "INITIALIZING SYSTEM ALLOY"}
                              {loadingStep === 1 && `ESTABLISHING SOCKET HANDSHAKE`}
                              {loadingStep === 2 && "MOUNTING GRAPHICS HYPERVISOR"}
                              {loadingStep === 3 && "PIPELINE BUFFER ESTABLISHED"}
                            </motion.p>
                          </AnimatePresence>
                        </div>
                        <span className="text-slate-500 font-mono text-[10px] font-bold">
                          {loadingStep === 0 && "12%"}
                          {loadingStep === 1 && "48%"}
                          {loadingStep === 2 && "76%"}
                          {loadingStep === 3 && "99%"}
                        </span>
                      </div>
                      
                      <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden border border-slate-200">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-neon-purple to-neon-green"
                          initial={{ width: "0%" }}
                          animate={{ 
                            width: loadingStep === 0 ? "12%" : 
                                   loadingStep === 1 ? "48%" : 
                                   loadingStep === 2 ? "76%" : "100%" 
                          }}
                          transition={{ duration: 0.5, ease: "circOut" }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute inset-0 w-full h-full flex flex-col">
                  
                  {/* Cinematic Background */}
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="w-full h-full">
                      <img src={game.image} className="w-full h-full object-cover blur-[12px] opacity-20 mix-blend-screen" />
                    </motion.div>
                    <div className={`absolute inset-0 bg-gradient-to-t ${theme.bgGradient}`} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050914_100%)] opacity-90" />
                  </div>

                  {/* Game UI Simulation */}
                  <div className="relative z-10 w-full h-full flex flex-col p-4 sm:p-6 lg:p-10 overflow-hidden">
                    
                    {/* Header Overlay */}
                    <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 shrink-0 z-20">
                      <div className={`bg-white/60 backdrop-blur-md border ${theme.borderClass} px-3 py-2 md:px-4 md:py-2 rounded-xl flex items-center gap-3 shadow-2xl w-full sm:w-auto`}>
                        <img src={game.image} className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover border border-white/20 shadow-md shrink-0" />
                        <div className="flex-1">
                          <p className="text-slate-900 font-black text-xs md:text-sm md:text-base uppercase tracking-wider leading-none truncate max-w-[150px] sm:max-w-none">{game.title}</p>
                          <p className="text-cyan-600 text-[9px] md:text-[10px] md:text-xs font-black uppercase tracking-widest mt-1 flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            {isCloudRenting ? "Cloud Stream" : "Live Betting"}
                          </p>
                        </div>
                      </div>

                      {/* Multiplayer Toggle Mode */}
                      <div className="flex items-center justify-between w-full sm:w-auto gap-3 bg-white/60 backdrop-blur-md border border-slate-200 px-3 py-2 md:px-4 md:py-2 rounded-xl shadow-2xl">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-cyan-600" />
                          <span className="text-[10px] md:text-xs font-black uppercase text-slate-700">Lobby</span>
                        </div>
                        <button 
                          onClick={() => setIsMultiplayer(!isMultiplayer)}
                          className={cn(
                            "relative w-12 h-6 rounded-full p-1 transition-colors duration-300 shrink-0",
                            isMultiplayer ? "bg-neon-green" : "bg-slate-850"
                          )}
                        >
                          <motion.div 
                            layout
                            className="w-4 h-4 bg-white rounded-full"
                            style={{ marginLeft: isMultiplayer ? '24px' : '0px' }}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Central Canvas Area */}
                    <div className="flex-1 min-h-0 w-full flex flex-col md:flex-row gap-6 max-w-5xl mx-auto my-4 relative z-10">
                      
                      <div className="flex-1 h-full flex items-center justify-center relative">
                        {!isCloudRenting ? (
                          /* ================= CASINO ENGINE VIEW ================= */
                          <div className="relative w-full h-full flex items-center justify-center">
                            {renderEngine()}

                            {/* Win Overlay */}
                            <AnimatePresence>
                              {winAmount !== null && !isSpinning && (
                                <motion.div 
                                  initial={{ scale: 0.5, opacity: 0 }} 
                                  animate={{ scale: 1, opacity: 1 }} 
                                  exit={{ scale: 1.5, opacity: 0 }} 
                                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-3xl"
                                >
                                  <motion.h2 
                                    animate={isMegaWin ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className={`text-4xl sm:text-7xl font-black uppercase tracking-tighter transform -skew-x-6 drop-shadow-[0_0_40px_rgba(255,255,255,0.4)] ${isMegaWin ? `text-${theme.primaryColor} bg-clip-text text-transparent bg-gradient-to-b ${theme.buttonGradient}` : 'text-white'}`}
                                  >
                                    {isMegaWin ? "MEGA WIN!" : "EPIC WIN!"}
                                  </motion.h2>
                                  <motion.div 
                                    className="text-5xl md:text-8xl font-black text-neon-yellow mt-4 drop-shadow-[0_0_30px_rgba(234,179,8,0.6)] font-mono tracking-tighter"
                                  >
                                    ₹<RollingCounter target={winAmount} />
                                  </motion.div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Low Balance Overlay */}
                            <AnimatePresence>
                              {balance < betAmount && !isSpinning && (
                                <motion.div initial={{ opacity: 0, backdropFilter: "blur(0px)" }} animate={{ opacity: 1, backdropFilter: "blur(12px)" }} className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 rounded-3xl border border-red-500/30">
                                  <div className="text-center p-8 max-w-md">
                                    <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 uppercase tracking-wider">Low Balance</h2>
                                    <p className="text-slate-600 mb-8 font-medium text-lg">Your balance (₹{balance.toLocaleString()}) is insufficient for a ₹{betAmount.toLocaleString()} bet. Please deposit to continue.</p>
                                    <button 
                                      onClick={() => window.dispatchEvent(new CustomEvent("open-cashier"))}
                                      className={`w-full py-5 bg-gradient-to-r ${theme.buttonGradient} text-white font-black text-xl uppercase tracking-widest rounded-xl shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all transform hover:scale-105 active:scale-95`}
                                    >
                                      Deposit to Continue
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          /* ================= CLOUD RENTAL VIEW ================= */
                          isSessionActive ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                              {renderEngine()}
                              {/* Rental countdown HUD */}
                              <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-xl text-right z-30 shadow-lg pointer-events-none">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Session Time Left</p>
                                <p className="text-neon-yellow font-mono font-black text-base flex items-center justify-end gap-1.5 mt-0.5">
                                  <Clock className="w-4 h-4 text-neon-yellow animate-pulse" />
                                  {formatTime(sessionTimeLeft)}
                                </p>
                              </div>
                            </div>
                          ) : (
                            /* Lock screen asking to subscribe */
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 text-center shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
                            >
                              <Gamepad2 className="w-16 h-16 text-cyan-600 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
                              {(!currentUser || currentUser.accountType === 'demo') && !isDemoLimitReached && (
                                <div className="mb-4 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-2xl text-[10px] font-black text-[#a855f7] uppercase tracking-widest inline-block select-none">
                                  ⚡ Free Trials Left: {3 - demoRentalsCount} of 3
                                </div>
                              )}
                              <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-wide">Premium Cloud Streaming</h2>
                              <p className="text-slate-600 text-sm font-medium mb-6">
                                Rent <span className="text-slate-900 font-bold">{game.title}</span> for cloud-native gaming at 60 FPS, with saves synced instantly to your profile.
                              </p>

                              <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 mb-6">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">Hourly Rental Rate</span>
                                  <span className="text-base font-black text-neon-green">₹{game.hourlyRate}/hr</span>
                                </div>

                                <div className="flex items-center gap-2 justify-center">
                                  {[1, 3, 5, 10].map(hrs => (
                                    <button
                                      key={hrs}
                                      onClick={() => { setSelectedHours(hrs); setCustomHoursVal(""); }}
                                      className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all border
                                        ${selectedHours === hrs && !customHoursVal
                                          ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-700"
                                        }`}
                                    >
                                      {hrs}h
                                    </button>
                                  ))}
                                  {/* Custom Hours Input */}
                                  <input 
                                    type="number"
                                    placeholder="Custom hrs"
                                    min="1"
                                    max="24"
                                    value={customHoursVal}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      setCustomHoursVal(e.target.value);
                                      if (!isNaN(val) && val >= 1 && val <= 24) {
                                        setSelectedHours(val);
                                      }
                                    }}
                                    className="w-24 px-2 py-1.5 rounded-xl bg-white border border-slate-200 focus:border-neon-cyan focus:outline-none text-slate-900 text-center text-xs font-black placeholder:text-slate-600 font-mono"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between mb-6 px-1">
                                <span className="text-sm text-slate-600 font-bold">Total Cost ({selectedHours} hrs)</span>
                                <span className="text-2xl font-black text-slate-900 font-mono">₹{rentCost.toLocaleString()}</span>
                              </div>

                              {isDemoLimitReached ? (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl text-left">
                                    <AlertCircle className="w-5 h-5 shrink-0 text-yellow-500" />
                                    <p className="text-xs font-semibold">
                                      You have used all 3 free trials in Demo mode. Please deposit to switch to a Real Account and enjoy unlimited premium games!
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => window.dispatchEvent(new CustomEvent("open-cashier"))}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-slate-950 font-black uppercase text-sm tracking-wider shadow-lg transition-all"
                                  >
                                    Deposit & Activate Real Account
                                  </button>
                                </div>
                              ) : balance < rentCost ? (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl text-left">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-xs font-semibold">Insufficient funds (Balance: ₹{balance.toLocaleString()}). Please deposit to rent.</p>
                                  </div>
                                  <button
                                    onClick={() => window.dispatchEvent(new CustomEvent("open-cashier"))}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-slate-950 font-black uppercase text-sm tracking-wider shadow-lg transition-all"
                                  >
                                    Deposit Funds
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={handleRent}
                                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black uppercase text-sm tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                  Rent & Stream Game
                                </button>
                              )}
                            </motion.div>
                          )
                        )}
                      </div>

                      {/* Multiplayer Lobby Side Panel */}
                      {isMultiplayer && (
                        <motion.div 
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 280, opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          className="w-full md:w-[280px] shrink-0 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-4 flex flex-col gap-4 shadow-2xl overflow-y-auto max-h-[500px]"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-900 font-black text-xs uppercase tracking-wider flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-neon-green rounded-full animate-pulse" />
                              Lobby #91A-STAKE
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono font-bold">4/8 Active</span>
                          </div>
                          
                          {/* List of mock players */}
                          <div className="space-y-3 flex-1 overflow-y-auto">
                            <div className="flex justify-between items-center bg-slate-50/40 p-2.5 rounded-xl border border-slate-200">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-600 flex items-center justify-center text-[10px] font-bold">U1</div>
                                <span className="text-slate-700 font-bold text-xs">CryptoWhale</span>
                              </div>
                              <span className="text-neon-green text-[10px] font-black font-mono">₹1,500</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50/40 p-2.5 rounded-xl border border-slate-200">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-600 flex items-center justify-center text-[10px] font-bold">U2</div>
                                <span className="text-slate-700 font-bold text-xs">WagerGod</span>
                              </div>
                              <span className="text-neon-green text-[10px] font-black font-mono">₹4,200</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50/40 p-2.5 rounded-xl border border-slate-200">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center text-[10px] font-bold">U3</div>
                                <span className="text-slate-700 font-bold text-xs">LuckyLady</span>
                              </div>
                              <span className="text-neon-green text-[10px] font-black font-mono">₹2,800</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50/40 p-2.5 rounded-xl border border-slate-200">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-[10px] font-bold">ME</div>
                                <span className="text-slate-900 font-black text-xs">You</span>
                              </div>
                              <span className="text-neon-yellow text-[10px] font-black font-mono font-bold">₹{balance.toLocaleString()}</span>
                            </div>
                          </div>
{/* Live Chat inside multiplayer lobby */}
                          <div className="border-t border-slate-200 pt-3 flex flex-col gap-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Table Chat</span>
                            <div className="bg-white/90 rounded-xl p-2 h-32 overflow-y-auto text-[10px] space-y-2 font-medium custom-scrollbar">
                              <p className="text-slate-600"><span className="text-cyan-600 font-bold">CryptoWhale</span>: lets win this round guys</p>
                              <p className="text-slate-600"><span className="text-purple-600 font-bold">WagerGod</span>: going high stake next spin</p>
                              <p className="text-slate-600"><span className="text-amber-600 font-bold">LuckyLady</span>: just hit a 10x! nice</p>
                              <p className="text-slate-500 italic">User joined the channel</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Game Container Wrapper */}
                    <motion.div 
                      animate={isMegaWin ? { x: [-10, 10, -10, 10, -5, 5, 0], y: [-5, 5, -5, 5, 0] } : {}}
                      transition={{ duration: 0.6 }}
                      className={`relative w-full h-[65vh] md:h-[calc(100vh-100px)] min-h-[400px] md:min-h-[600px] bg-white rounded-2xl border border-slate-200 overflow-hidden ${theme.shadowClass} flex flex-col group`}
                    >
                      <AnimatePresence>
                        {isLoading ? (
                          <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0 bg-slate-50 z-50 flex flex-col items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&q=80')] opacity-10 bg-cover bg-center mix-blend-screen" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#02050a] via-[#02050a]/80 to-transparent" />
                            
                            <div className="relative z-10 w-full max-w-md px-8 flex flex-col items-center">
                              <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
                                <div className="absolute inset-0 border border-slate-200 rounded-full" />
                                <div className="absolute inset-2 border border-slate-700/50 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-neon-purple border-t-transparent rounded-full shadow-[0_0_30px_rgba(168,85,247,0.4)]" />
                                <motion.div animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-4 border border-neon-green border-b-transparent rounded-full" />
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-full backdrop-blur-sm">
                                  <Gamepad2 className="w-10 h-10 text-slate-900 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                                </div>
                              </div>

                              <div className="w-full space-y-4">
                                <div className="flex justify-between items-end mb-2">
                                  <div className="h-6 overflow-hidden">
                                    <AnimatePresence mode="wait">
                                      <motion.p key={loadingStep} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="text-neon-green font-mono font-bold tracking-widest text-xs uppercase">
                                        {loadingStep === 0 && "INITIALIZING SYSTEM ALLOY"}
                                        {loadingStep === 1 && `ESTABLISHING SOCKET HANDSHAKE`}
                                        {loadingStep === 2 && "MOUNTING GRAPHICS HYPERVISOR"}
                                        {loadingStep === 3 && "PIPELINE BUFFER ESTABLISHED"}
                                      </motion.p>
                                    </AnimatePresence>
                                  </div>
                                  <span className="text-slate-500 font-mono text-[10px] font-bold">
                                    {loadingStep === 0 && "12%"}
                                    {loadingStep === 1 && "48%"}
                                    {loadingStep === 2 && "76%"}
                                    {loadingStep === 3 && "99%"}
                                  </span>
                                </div>
                                
                                <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden border border-slate-200">
                                  <motion.div 
                                    className="h-full bg-gradient-to-r from-neon-purple to-neon-green"
                                    initial={{ width: "0%" }}
                                    animate={{ 
                                      width: loadingStep === 0 ? "12%" : 
                                             loadingStep === 1 ? "48%" : 
                                             loadingStep === 2 ? "76%" : "100%" 
                                    }}
                                    transition={{ duration: 0.5, ease: "circOut" }}
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute inset-0 w-full h-full flex flex-col">
                            
                            {/* Cinematic Background */}
                            <div className="absolute inset-0 z-0 pointer-events-none">
                              <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="w-full h-full">
                                <img src={game.image} className="w-full h-full object-cover blur-[12px] opacity-20 mix-blend-screen" />
                              </motion.div>
                              <div className={`absolute inset-0 bg-gradient-to-t ${theme.bgGradient}`} />
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050914_100%)] opacity-90" />
                            </div>

                            {/* Top Bar inside game view */}
                            <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-start z-20 pointer-events-none">
                              <div className="flex gap-3 pointer-events-auto">
                                <div className="bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                  <span className="text-white text-xs font-bold tracking-widest uppercase">Live Node</span>
                                </div>
                                <div className="bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 hidden sm:flex">
                                  <Users className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-white text-xs font-bold tracking-widest uppercase">{Math.floor(Math.random() * 5000 + 1000)} Online</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-2 pointer-events-auto">
                                <div className="bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                                  <Activity className="w-3.5 h-3.5 text-neon-yellow" />
                                  <span className="text-white text-xs font-bold font-mono">1.2ms</span>
                                </div>
                                {game.rtp && (
                                  <div className="bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                                    <Flame className="w-3.5 h-3.5 text-neon-purple" />
                                    <span className="text-white text-xs font-bold font-mono">{game.rtp}% RTP</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* GAME ENGINE AREA */}
                            <div className="flex-1 relative z-10 flex flex-col justify-center items-center w-full mt-12 md:mt-16 overflow-hidden">
                              
                              {/* Win Celebration Banner */}
                              <AnimatePresence>
                                {winAmount && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.5, y: -50 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                    className="absolute top-[10%] md:top-[15%] z-50 pointer-events-none"
                                  >
                                    <div className={`px-8 py-4 md:px-12 md:py-6 rounded-2xl bg-slate-900/80 backdrop-blur-xl border-2 flex flex-col items-center shadow-2xl ${
                                      isMegaWin ? "border-neon-yellow shadow-neon-yellow/30" : "border-neon-purple shadow-neon-purple/30"
                                    }`}>
                                      <span className={`text-[10px] md:text-xs font-black uppercase tracking-[0.4em] mb-2 md:mb-3 ${
                                        isMegaWin ? "text-neon-yellow" : "text-neon-purple"
                                      }`}>
                                        {isMegaWin ? "Mega Win!" : "Winner"}
                                      </span>
                                      <motion.p 
                                        animate={isMegaWin ? { scale: [1, 1.1, 1] } : {}}
                                        transition={{ duration: 0.5, repeat: Infinity }}
                                        className="text-4xl md:text-6xl font-black text-white font-mono tracking-tighter"
                                      >
                                        ₹{winAmount.toLocaleString()}
                                      </motion.p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Actual Engine Render */}
                              <div className="relative w-full h-full flex flex-col items-center justify-center p-2 md:p-4">
                                {isCloudRenting ? (
                                  isSessionActive ? (
                                    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative bg-black">
                                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80')] opacity-30 bg-cover bg-center" />
                                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                        <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="px-6 py-3 rounded-full bg-black/50 border border-white/10 backdrop-blur-md">
                                          <span className="text-white font-mono text-sm tracking-widest font-bold">LIVE STREAMING — {game.title}</span>
                                        </motion.div>
                                      </div>
                                      {renderEngine()}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center text-center max-w-lg p-6 bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/10">
                                      <Gamepad2 className="w-16 h-16 text-slate-400 mb-6" />
                                      <h2 className="text-2xl md:text-3xl font-black text-white mb-4">{game.title}</h2>
                                      <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">Subscribe and rent a high-performance cloud gaming instance to play directly in your browser. Hourly rates apply.</p>
                                    </div>
                                  )
                                ) : (
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div> {/* End Main Content Col */}
        
        {/* Right Sidebar: VIP Live Feed */}
        <VIPLiveBetsFeed gameTitle={game.title} />
        
      </div> {/* End Flex Row */}
    </div>
  );
}
