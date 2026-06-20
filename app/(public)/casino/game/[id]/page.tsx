"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GAMES } from "@/lib/games";
import { ArrowLeft, AlertCircle, Zap, Minus, Plus, RefreshCw, Gamepad2, Play, Circle, Power, Clock, Flame, Activity, Users, Coins, Shield, Lock, Hand, BadgeInfo, MessageSquare, Sparkles } from "lucide-react";
import { recordGameRound } from "@/lib/recordRound";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { playGameSound } from "@/lib/audio";
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
import { TowerEngine } from "@/components/casino/engines/TowerEngine";
import { LiveRouletteEngine } from "@/components/casino/engines/LiveRouletteEngine";
import { RouletteEngine } from "@/components/casino/engines/RouletteEngine";
import { DiceEngine } from "@/components/casino/engines/DiceEngine";
import { BilliardsEngine } from "@/components/casino/engines/BilliardsEngine";
import { CoinflipEngine } from "@/components/casino/engines/CoinflipEngine";
import { LiveWheelEngine } from "@/components/casino/engines/LiveWheelEngine";
import { LimboEngine } from "@/components/casino/engines/LimboEngine";
import { MinesEngine } from "@/components/casino/engines/MinesEngine";
import { KenoEngine } from "@/components/casino/engines/KenoEngine";
import { PlinkoEngine } from "@/components/casino/engines/PlinkoEngine";
import { GAME_STRATEGIES, getGameStrategyKey } from "@/lib/game-strategies";
import { TradeXEngine } from "@/components/casino/engines/TradeXEngine";
import { HiLoEngine } from "@/components/casino/engines/HiLoEngine";
import { PenaltyEngine } from "@/components/casino/engines/PenaltyEngine";
import { ExternalEngine } from "@/components/casino/engines/ExternalEngine";
import { GameTutorialOverlay } from "@/components/GameTutorialOverlay";
import { RoyalGamingEngine } from "@/components/casino/engines/RoyalGamingEngine";
import { NeonHorizon3DEngine } from "@/components/casino/engines/NeonHorizon3DEngine";
import { LudoEngine } from "@/components/casino/engines/LudoEngine";
import { LudoFusionEngine } from "@/components/casino/engines/LudoFusionEngine";

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

interface ActivityLog {
  id: string;
  username: string;
  bet: number;
  multiplier: number | null;
  crashPoint: number;
  payout: number;
  status: "playing" | "cashed_out" | "crashed";
  time: string;
}

const NAMES = [
  "PhantomBet", "SharpShooter", "WhaleAlert", "DeltaWhale", "MoonShot", "AbsoluteUnit",
  "AbsurdStake", "ExactCashout", "TimingGod", "ChaosTrader", "SilverBullet", "CrorepathiPro",
  "LunaticBet", "HighStakeHustler", "ZeroGravity", "DegenZero", "AceViper", "ViperStrike",
  "TitanWager", "OverkillMax", "NovaCrash", "IronStake", "AuraElite", "GodTier",
  "ZeroLoss", "CrashSniper", "SlotWizard", "MegaWhale", "PlatinumRaj", "RajaBetting",
  "EliteRoller", "CosmicDegen", "MumbaiKing", "NeonTrader", "NoSleep", "DiamondHands",
  "GoldRush", "AceHigh", "AlphaVIP", "TokenLord", "NeverHedge", "NabobWager",
  "GigaChancer", "ApexPredator", "ThunderBolt", "OmegaWhale", "ShadowFox", "SureShotVIP",
  "LaserFocus", "BiggestBet", "FullSend", "BrokenStop", "RocketFuel", "PureCringe",
  "CryptoGamer", "LuckyJack", "BlitzKing", "YOLOKing", "CrystalEdge", "SpeedrunBet",
  "NightOwlDegen", "UltraVIP", "MadGambler", "AlphaBet", "ZenRoll", "TriggerFast",
  "RecklessRaj", "DelhiBull", "ClockworkBet", "BullRun", "RiskTaker", "CleanExit",
  "StormChaser", "SatoshiKing", "AllInAlways", "SpinNinja", "BullseyeBet", "GoaHighRoller",
  "PrecisionAce", "MaxRiskMax", "OneShot", "CarpeDegen", "BombayWhale", "InfinityStake",
  "RooVIP", "BurnItAll", "NailIt", "QuantumBet", "GigaStake", "PerfectTiming",
  "JackpotGuru", "CroreKing", "InfinityBet", "Ruler", "VelvetAce", "TopGunBet"
];

const INITIAL_HIGH_REACHES: HighReachOutcome[] = [
  { id: "hr-1 ", user: "BullRun_VIP"      , bet:    200, cashout:   569.44, crashPoint:   674.40, payout:    113888, time: "09:52 PM", isTopOnePercent: true },
  { id: "hr-2 ", user: "Private"          , bet:    200, cashout:   555.87, crashPoint:   685.19, payout:    111174, time: "09:29 PM", isTopOnePercent: true },
  { id: "hr-3 ", user: "AlphaVIP_X"       , bet:   1111, cashout:   543.52, crashPoint:   655.71, payout:    603851, time: "08:26 PM", isTopOnePercent: true },
  { id: "hr-4 ", user: "🐋 OmegaWhale_95"  , bet: 100000, cashout:   456.11, crashPoint:   920.80, payout:  45611000, time: "10:12 PM", isTopOnePercent: true },
  { id: "hr-5 ", user: "BlitzKing"        , bet:   1000, cashout:   335.85, crashPoint:   351.21, payout:    335850, time: "08:19 PM", isTopOnePercent: true },
  { id: "hr-6 ", user: "💀 OverkillMax_672", bet:    950, cashout:   305.86, crashPoint:  1022.50, payout:    290567, time: "04:14 AM", isTopOnePercent: true },
  { id: "hr-7 ", user: "🚀 RecklessRaj_42" , bet:  10000, cashout:   275.10, crashPoint:   286.71, payout:   2751000, time: "10:36 PM", isTopOnePercent: true },
  { id: "hr-8 ", user: "MaxRiskMax_VIP"   , bet:   3000, cashout:   272.44, crashPoint:   277.75, payout:    817320, time: "09:21 PM", isTopOnePercent: true },
  { id: "hr-9 ", user: "Anon_***"         , bet:    200, cashout:   254.04, crashPoint:   262.95, payout:     50808, time: "04:26 PM", isTopOnePercent: true },
  { id: "hr-10", user: "CryptoGamer_VIP"  , bet:     50, cashout:   224.92, crashPoint:   225.68, payout:     11246, time: "10:41 PM", isTopOnePercent: true },
  { id: "hr-11", user: "CleanExit_Pro"    , bet:    100, cashout:   172.07, crashPoint:   294.54, payout:     17207, time: "01:24 PM", isTopOnePercent: true },
  { id: "hr-12", user: "SharpShooter_Pro" , bet:   1050, cashout:   157.49, crashPoint:   295.85, payout:    165364, time: "08:15 PM", isTopOnePercent: true },
  { id: "hr-13", user: "DeltaWhale_55"    , bet:  20000, cashout:   146.88, crashPoint:   228.80, payout:   2937600, time: "12:45 AM", isTopOnePercent: true },
  { id: "hr-14", user: "🚀 MaxRiskMax"     , bet:  10000, cashout:   114.37, crashPoint:   136.92, payout:   1143700, time: "09:37 PM", isTopOnePercent: true },
  { id: "hr-15", user: "GoldRush"         , bet:   1500, cashout:   112.95, crashPoint:   205.11, payout:    169425, time: "09:59 PM", isTopOnePercent: true }
];

interface ThemeProfile {
  cols?: number;
  rows?: number;
  symbols?: string[];
  primaryColor: string;
  bgGradient: string;
  buttonGradient: string;
  buttonHover: string;
  borderClass: string;
  shadowClass: string;
  animationType: string;
  slotBg?: string;
}

// THEME ENGINE CONFIGURATION
const THEME_PROFILES: Record<string, ThemeProfile> = {
  "sweet-bonanza": { cols: 6, rows: 5, symbols: ["🍬", "🍭", "🍇", "🍉", "🍎", "❤️", "⭐"], primaryColor: "pink-500", bgGradient: "from-pink-100/30 via-purple-50/80 to-[#fdfbf7]", buttonGradient: "from-pink-400 via-pink-500 to-purple-500", buttonHover: "hover:from-pink-300 hover:to-purple-400", borderClass: "border-pink-500/40", shadowClass: "shadow-[0_0_80px_rgba(236,72,153,0.2)]", animationType: "tumble", slotBg: "bg-pink-100" },
  "sweet-bonanza-1000": { cols: 6, rows: 6, symbols: ["🍬", "🍭", "🍇", "🍉", "🍒", "🍩", "✨"], primaryColor: "pink-600", bgGradient: "from-pink-50/40 via-fuchsia-50/80 to-[#fdfbf7]", buttonGradient: "from-pink-500 via-fuchsia-600 to-pink-600", buttonHover: "hover:from-pink-400 hover:to-fuchsia-500", borderClass: "border-pink-500/50", shadowClass: "shadow-[0_0_80px_rgba(236,72,153,0.3)]", animationType: "tumble", slotBg: "bg-fuchsia-100" },
  "gates-of-olympus": { cols: 6, rows: 5, symbols: ["👑", "🏺", "💍", "💎", "⚡", "🏛️", "🔴"], primaryColor: "yellow-500", bgGradient: "from-red-50 via-slate-100/90 to-[#fdfbf7]", buttonGradient: "from-yellow-600 via-yellow-500 to-amber-600", buttonHover: "hover:from-yellow-400 hover:to-yellow-500", borderClass: "border-yellow-500/40", shadowClass: "shadow-[0_0_80px_rgba(234,179,8,0.2)]", animationType: "tumble", slotBg: "bg-red-100" },
  "book-of-dead": { cols: 5, rows: 3, symbols: ["📖", "🏺", "🪲", "💀", "👑", "🐪", "⚜️"], primaryColor: "amber-600", bgGradient: "from-amber-50/30 via-slate-100/90 to-[#fdfbf7]", buttonGradient: "from-amber-600 via-yellow-600 to-yellow-500", buttonHover: "hover:from-amber-500 hover:to-yellow-500", borderClass: "border-amber-600/40", shadowClass: "shadow-[0_0_80px_rgba(217,119,6,0.2)]", animationType: "spin", slotBg: "bg-amber-100" },
  "the-dog-house": { cols: 5, rows: 3, symbols: ["🐶", "🦴", "🥩", "🐾", "🐕", "A", "K"], primaryColor: "green-500", bgGradient: "from-green-50/40 via-[#fdfbf7] to-[#fdfbf7]", buttonGradient: "from-green-500 via-emerald-500 to-green-600", buttonHover: "hover:from-green-400 hover:to-emerald-400", borderClass: "border-green-600/40", shadowClass: "shadow-[0_0_80px_rgba(34,197,94,0.2)]", animationType: "spin", slotBg: "bg-amber-100" },
  "the-dog-house-megaways": { cols: 6, rows: 4, symbols: ["🐶", "🦴", "🥩", "🐾", "🐕", "🏠", "🍖"], primaryColor: "emerald-500", bgGradient: "from-emerald-50/40 via-green-50/80 to-[#fdfbf7]", buttonGradient: "from-emerald-500 via-green-600 to-emerald-600", buttonHover: "hover:from-emerald-400 hover:to-green-500", borderClass: "border-emerald-600/40", shadowClass: "shadow-[0_0_80px_rgba(16,185,129,0.2)]", animationType: "spin", slotBg: "bg-green-100" },
  "sugar-rush-1000": { cols: 7, rows: 6, symbols: ["🧸", "🍬", "🍭", "🍩", "🧁", "🍪", "🍓"], primaryColor: "fuchsia-500", bgGradient: "from-fuchsia-50/30 via-purple-100/80 to-[#fdfbf7]", buttonGradient: "from-fuchsia-400 via-fuchsia-500 to-pink-500", buttonHover: "hover:from-fuchsia-300 hover:to-pink-400", borderClass: "border-fuchsia-500/40", shadowClass: "shadow-[0_0_80px_rgba(217,70,239,0.3)]", animationType: "tumble", slotBg: "bg-fuchsia-100" },
  "starlight-princess-1000": { cols: 6, rows: 5, symbols: ["⭐", "✨", "👑", "💎", "🌙", "🔮", "🦄"], primaryColor: "purple-400", bgGradient: "from-red-50/40 via-rose-50/80 to-[#fdfbf7]", buttonGradient: "from-red-400 via-rose-500 to-amber-500", buttonHover: "hover:from-red-300 hover:to-rose-450", borderClass: "border-purple-400/40", shadowClass: "shadow-[0_0_80px_rgba(168,85,247,0.3)]", animationType: "tumble", slotBg: "bg-red-100" },
  "zeus-vs-hades-gods-of-war": { cols: 5, rows: 5, symbols: ["⚡", "🔥", "🔱", "🦅", "🐕", "🌋", "🔵"], primaryColor: "purple-500", bgGradient: "from-red-50/40 via-rose-50/40 to-[#fdfbf7]", buttonGradient: "from-red-600 via-rose-600 to-amber-600", buttonHover: "hover:from-red-500 hover:to-rose-500", borderClass: "border-purple-500/40", shadowClass: "shadow-[0_0_80px_rgba(239,68,68,0.2)]", animationType: "spin", slotBg: "bg-slate-50/40" },
  "madame-destiny-megaways": { cols: 6, rows: 4, symbols: ["🔮", "🃏", "🦉", "🐈", "🕯️", "🪙", "🧿"], primaryColor: "violet-500", bgGradient: "from-rose-50/50 via-[#fdfbf7] to-[#fdfbf7]", buttonGradient: "from-red-600 via-rose-700 to-red-700", buttonHover: "hover:from-red-500 hover:to-red-600", borderClass: "border-violet-500/40", shadowClass: "shadow-[0_0_80px_rgba(139,92,246,0.3)]", animationType: "spin", slotBg: "bg-red-100" },
  "gemhalla-xtreme": { cols: 6, rows: 5, symbols: ["🪓", "🛡️", "🍺", "🐺", "⚡", "🪙", "🍀"], primaryColor: "emerald-500", bgGradient: "from-emerald-50/40 via-slate-100/95 to-[#fdfbf7]", buttonGradient: "from-emerald-600 via-green-600 to-teal-500", buttonHover: "hover:from-emerald-500 hover:to-teal-400", borderClass: "border-emerald-500/40", shadowClass: "shadow-[0_0_80px_rgba(16,185,129,0.2)]", animationType: "tumble", slotBg: "bg-emerald-100" },
  "fishing-time-deluxe": { cols: 5, rows: 4, symbols: ["🐟", "🐠", "🐡", "🎣", "🛥️", "🪙", "🐙"], primaryColor: "teal-500", bgGradient: "from-teal-50/50 via-[#fdfbf7] to-[#fdfbf7]", buttonGradient: "from-teal-500 via-emerald-500 to-green-600", buttonHover: "hover:from-teal-400 hover:to-green-400", borderClass: "border-teal-500/40", shadowClass: "shadow-[0_0_80px_rgba(20,184,166,0.3)]", animationType: "spin", slotBg: "bg-teal-100" },
  "neon-horizon-3d": { primaryColor: "cyan-500", bgGradient: "from-cyan-50/40 via-purple-50/80 to-[#fdfbf7]", buttonGradient: "from-cyan-500 via-purple-500 to-fuchsia-500", buttonHover: "hover:from-cyan-400 hover:to-fuchsia-400", borderClass: "border-cyan-500/40", shadowClass: "shadow-[0_0_80px_rgba(6,182,212,0.35)]", animationType: "spin" }
};

const PROCEDURAL_COLORS = [
  { p: "cyan-500", grad: "from-red-100/30 via-rose-50/80 to-[#fdfbf7]", btn: "from-red-500 via-rose-500 to-red-600", hover: "hover:from-red-400 hover:to-rose-400", border: "border-red-500/40", shadow: "shadow-[0_0_80px_rgba(239,68,68,0.2)]", bg: "bg-red-100" },
  { p: "orange-500", grad: "from-orange-100/30 via-red-50/80 to-[#fdfbf7]", btn: "from-orange-500 via-red-500 to-orange-600", hover: "hover:from-orange-400 hover:to-red-400", border: "border-orange-500/40", shadow: "shadow-[0_0_80px_rgba(249,115,22,0.2)]", bg: "bg-orange-100" },
  { p: "emerald-500", grad: "from-emerald-100/30 via-green-50/80 to-[#fdfbf7]", btn: "from-emerald-500 via-green-500 to-emerald-600", hover: "hover:from-emerald-400 hover:to-green-400", border: "border-emerald-500/40", shadow: "shadow-[0_0_80px_rgba(16,185,129,0.2)]", bg: "bg-emerald-100" },
  { p: "fuchsia-500", grad: "from-fuchsia-100/30 via-purple-50/80 to-[#fdfbf7]", btn: "from-fuchsia-500 via-purple-500 to-fuchsia-600", hover: "hover:from-fuchsia-400 hover:to-purple-400", border: "border-fuchsia-500/40", shadow: "shadow-[0_0_80px_rgba(217,70,239,0.2)]", bg: "bg-fuchsia-100" }
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

const STAKE_PRESETS = [100, 500, 1000, 5000, 10000, 50000];

function SVGProfitChart({ history }: { history: number[] }) {
  if (history.length <= 1) {
    return (
      <div className="h-24 flex items-center justify-center border border-dashed border-white/10 rounded-xl text-[10px] text-slate-500 font-bold uppercase tracking-wider">
        No round history yet
      </div>
    );
  }

  const minProfit = Math.min(...history);
  const maxProfit = Math.max(...history);
  const profitRange = maxProfit - minProfit || 100;
  const padMin = minProfit - profitRange * 0.1;
  const padMax = maxProfit + profitRange * 0.1;
  const padRange = padMax - padMin;

  const width = 300;
  const height = 120;
  const points = history.map((val, idx) => {
    const x = (idx / (history.length - 1)) * width;
    const y = height - ((val - padMin) / padRange) * height;
    return `${x},${y}`;
  }).join(" ");

  const netProfit = history[history.length - 1] - history[0];

  return (
    <div className="relative w-full bg-slate-50 border border-slate-200/80 p-3 rounded-xl shadow-inner">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
        {padMin < 0 && padMax > 0 && (
          <line
            x1="0"
            y1={height - ((0 - padMin) / padRange) * height}
            x2={width}
            y2={height - ((0 - padMin) / padRange) * height}
            stroke="rgba(0,0,0,0.1)"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
        )}
        <polyline
          fill="none"
          stroke="url(#gradient-profit)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        <defs>
          <linearGradient id="gradient-profit" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <circle
          cx={width}
          cy={height - ((history[history.length - 1] - padMin) / padRange) * height}
          r="4.5"
          className="fill-yellow-400"
        />
      </svg>
      <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 mt-1 font-mono uppercase">
        <span>Min: ₹{minProfit.toFixed(0)}</span>
        <span className={netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}>
          Net: ₹{netProfit >= 0 ? "+" : ""}{netProfit.toFixed(0)}
        </span>
        <span>Max: ₹{maxProfit.toFixed(0)}</span>
      </div>
    </div>
  );
}

export default function GamePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [loadingStep, setLoadingStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [tutorialDismissed, setTutorialDismissed] = useState(true);
  const [rngSeed] = useState(() => Math.random().toString(36).substring(2, 15).toUpperCase());

  // Rental & Session state (Cloud Mode)
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [selectedHours, setSelectedHours] = useState(3);
  const [sessionHours, setSessionHours] = useState(3);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [customHoursVal, setCustomHoursVal] = useState("");

  // Casino Modal Hydration State
  const [hasTransferred, setHasTransferred] = useState(false);
  const [transferAmount, setTransferAmount] = useState(100);
  
  // Game UX State
  const { balance: rawBalance, playCasino, currentUser, sessionStats, recordSessionRound, setAmbientPreset } = useTradingStore();
  const balance = typeof rawBalance === 'number' ? rawBalance : (parseFloat(String(rawBalance)) || 0);
  const [betAmount, setBetAmount] = useState(100);
  const [customBetVal, setCustomBetVal] = useState("");
  const [playMode, setPlayMode] = useState<"manual" | "auto">("manual");
  const [autoplayWarning, setAutoplayWarning] = useState(false);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [autoCashoutVal, setAutoCashoutVal] = useState<number | "">("");
  const [liveMultiplier, setLiveMultiplier] = useState<number | null>(null);
  const [activePicksCount, setActivePicksCount] = useState(0);
  const [winAmount, setWinAmount] = useState<number | null>(null);
  const [isMegaWin, setIsMegaWin] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'stakes' | 'strategy'>('stakes');
  const [highReaches, setHighReaches] = useState<HighReachOutcome[]>(INITIAL_HIGH_REACHES);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [scoreboardTab, setScoreboardTab] = useState<"top-one-percent" | "recent-runs" | "platform-feed">("top-one-percent");
  const [platformBets, setPlatformBets] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [isLeaderboardExpanded, setIsLeaderboardExpanded] = useState(false);
  const [isMobileLeaderboardLimitExpanded, setIsMobileLeaderboardLimitExpanded] = useState(false);
  
  const [isDemoLimitReached, setIsDemoLimitReached] = useState(false);
  const [demoRentalsCount, setDemoRentalsCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
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
    }, 0);
    return () => clearTimeout(timer);
  }, [currentUser]);

  useEffect(() => {
    const fetchHypeData = async () => {
      try {
        const res = await fetch("/api/casino/high-rollers");
        if (res.ok) {
          const json = await res.json();
          const mappedBets = json.bets.map((b: any) => {
            return {
              user: b.user,
              bet: b.bet,
              mult: b.mult,
              win: b.win,
              color: b.color,
              game: b.game,
              type: b.type
            };
          });
          setPlatformBets(mappedBets);
        }
      } catch (err) {
        console.error("Failed to fetch platform VIP feed", err);
      }
    };

    fetchHypeData();
    const interval = setInterval(fetchHypeData, 30000);
    return () => clearInterval(interval);
  }, []);

  const game = GAMES.find(g => g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === id.toLowerCase() || g.id.toLowerCase() === id.toLowerCase());

  const isRoyalEngine = useMemo(() => {
    if (!game) return false;
    return game.id.startsWith("royal-") || game.provider === "Royal Gaming" || ["poker-1", "poker-3", "poker-4"].includes(game.id);
  }, [game]);

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
      setTimeout(() => setLoadingStep(1), 100),
      setTimeout(() => setLoadingStep(2), 200),
      setTimeout(() => setLoadingStep(3), 300),
      setTimeout(() => setIsLoading(false), 400)
    ];
    return () => steps.forEach(clearTimeout);
  }, [game]);

  // Rental timer countdown
  useEffect(() => {
    if (!isSessionActive || sessionTimeLeft <= 0) {
      if (sessionTimeLeft === 0 && isSessionActive) {
        const timer = setTimeout(() => {
          setIsSessionActive(false);
        }, 0);
        return () => clearTimeout(timer);
      }
      return;
    }
    const timer = setInterval(() => {
      setSessionTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSessionActive, sessionTimeLeft]);

  // Set ambient audio preset based on game category
  useEffect(() => {
    if (!game) return;
    const titleLower = game.title.toLowerCase();
    const isMinesOrLimbo = titleLower.includes("mines") || titleLower.includes("limbo") || game.id === "orig-4" || game.id === "orig-2";
    const isCrashOrSlots = game.categories.includes("crash") || game.categories.includes("slots") || titleLower.includes("crash") || titleLower.includes("slot");
    
    if (isMinesOrLimbo) {
      setAmbientPreset("tension");
    } else if (isCrashOrSlots) {
      setAmbientPreset("cyber");
    } else {
      setAmbientPreset("default");
    }
    
    return () => {
      setAmbientPreset("default");
    };
  }, [game, setAmbientPreset]);

  // Compute live session stats
  const stats = useMemo(() => {
    if (!game) {
      return {
        wagers: [],
        payouts: [],
        multipliers: [],
        totalWagered: 0,
        netProfit: 0,
        winsCount: 0,
        lossesCount: 0,
        maxMultiplier: 0,
        profitHistory: [0],
        winRatio: 0,
        lossRatio: 0,
        totalRounds: 0
      };
    }
    const gameStats = sessionStats?.[game.id] || { wagers: [], payouts: [], multipliers: [], timestamps: [] };
    const wagers = gameStats.wagers;
    const payouts = gameStats.payouts;
    const multipliers = gameStats.multipliers;

    let totalWagered = 0;
    let totalPayout = 0;
    let winsCount = 0;
    let lossesCount = 0;
    let maxMultiplier = 0;
    const profitHistory: number[] = [0];

    for (let i = 0; i < wagers.length; i++) {
      const wager = wagers[i];
      const payout = payouts[i];
      const mult = multipliers[i];
      
      totalWagered += wager;
      totalPayout += payout;
      if (payout > 0) winsCount++;
      else lossesCount++;
      
      if (mult > maxMultiplier) maxMultiplier = mult;

      const currentProfit = totalPayout - totalWagered;
      profitHistory.push(currentProfit);
    }

    const netProfit = totalPayout - totalWagered;
    const totalRounds = winsCount + lossesCount;
    const winRatio = totalRounds > 0 ? (winsCount / totalRounds) * 100 : 0;
    const lossRatio = totalRounds > 0 ? (lossesCount / totalRounds) * 100 : 0;

    return {
      wagers,
      payouts,
      multipliers,
      totalWagered,
      netProfit,
      winsCount,
      lossesCount,
      maxMultiplier,
      profitHistory,
      winRatio,
      lossRatio,
      totalRounds
    };
  }, [sessionStats, game?.id]);

  // Cloud Mode Actions
  const rentCost = selectedHours * (game ? (game.hourlyRate || 0) : 0);

  const handleRent = () => {
    if (!game) return;
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
    if (!game) return;
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

  const handleLiveTick = useCallback((mult: number, picksCount?: number) => {
    setLiveMultiplier(mult);
    if (typeof picksCount === "number") {
      setActivePicksCount(picksCount);
    }
  }, []);

  const handleSidebarCashout = () => {
    window.dispatchEvent(new CustomEvent("sidebar-trigger-cashout"));
  };

  // Casino Mode Actions
  const handlePlay = () => {
    if (isSpinning || !game) return;
    const isLiveCasino = game.categories && game.categories.includes("live");
    const finalCost = isLiveCasino ? betAmount * 1.03 : betAmount;
    if (balance < finalCost) {
      alert(isLiveCasino 
        ? `Insufficient balance to place this bet (Stake: ₹${betAmount} + ₹${(betAmount * 0.03).toFixed(2)} Live Fee). Please deposit funds.`
        : "Insufficient balance to place this bet. Please deposit funds or adjust your stake."
      );
      window.dispatchEvent(new CustomEvent("open-cashier"));
      return;
    }
    setLiveMultiplier(1.0);
    setActivePicksCount(0);
    setIsSpinning(true);
    playGameSound('spin');
    setWinAmount(null);
    setIsMegaWin(false);
  };

  const handleEngineComplete = useCallback((multiplierOrWon: number | boolean, wonBool?: boolean) => {
    setIsSpinning(false);
    setLiveMultiplier(null);
    setActivePicksCount(0);
    if (!game) return;
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
    recordSessionRound(game.id, betAmount, payout, mult);

    // Record user wager to recent activities list
    const userActivity: ActivityLog = {
      id: `act-user-${Date.now()}`,
      username: "You",
      bet: betAmount,
      multiplier: won ? mult : null,
      crashPoint: mult,
      payout,
      status: won ? "cashed_out" : "crashed",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // If it's a crash/aviator game, simulate other player wagers and outcomes
    const roundActivities: ActivityLog[] = [];
    const isCrashGame = game.categories.includes("crash") || game.title.toLowerCase().includes("aviator") || game.id.includes("crash") || game.id === "aviator";
    if (isCrashGame) {
      const simulatedCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 other players
      for (let i = 0; i < simulatedCount; i++) {
        const username = NAMES[Math.floor(Math.random() * NAMES.length)] + "_" + Math.floor(Math.random() * 9000 + 1000);
        const simBet = Math.floor(Math.random() * 5) * 100 + 100;
        const simWon = Math.random() < 0.65; // 65% chance of cashing out
        const simMult = simWon ? parseFloat((1.05 + Math.random() * (Math.max(1.10, mult) - 1.05)).toFixed(2)) : 0;
        const simPayout = simWon ? simBet * simMult : 0;
        
        roundActivities.push({
          id: `act-sim-${Math.random()}`,
          username,
          bet: simBet,
          multiplier: simWon ? simMult : null,
          crashPoint: mult,
          payout: simPayout,
          status: simWon ? "cashed_out" : "crashed",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    }

    setRecentActivities(prev => [userActivity, ...roundActivities, ...prev].slice(0, 40));

    // Qualify for highest reach board
    if (isCrashGame && mult >= 100.00) {
      const newHighReaches: HighReachOutcome[] = [];
      
      // Add user record if user won
      if (won) {
        newHighReaches.push({
          id: `hr-user-${Date.now()}`,
          user: "You",
          bet: betAmount,
          cashout: mult,
          crashPoint: mult,
          payout,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isTopOnePercent: true
        });
      }
      
      // Also add 1-2 simulated players who hit high cashouts in this same high-crash round
      const simCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 players
      for (let i = 0; i < simCount; i++) {
        const username = NAMES[Math.floor(Math.random() * NAMES.length)] + "_" + Math.floor(Math.random() * 9000 + 1000);
        const simBet = Math.floor(Math.random() * 8) * 100 + 300; // ₹300 - ₹1000
        // Cashout multiplier is randomly between 100.00 and mult
        const simCashout = parseFloat((100.00 + Math.random() * (mult - 100.00)).toFixed(2));
        const simPayout = simBet * simCashout;
        
        newHighReaches.push({
          id: `hr-sim-${Math.random()}`,
          user: username,
          bet: simBet,
          cashout: simCashout,
          crashPoint: mult,
          payout: simPayout,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isTopOnePercent: true
        });
      }
      
      setHighReaches(prev => [...newHighReaches, ...prev].slice(0, 15));
    }

    if (won) {
      setWinAmount(payout);
      if (mult >= 10) {
        playGameSound('jackpot');
        setIsMegaWin(true);
      } else {
        playGameSound('win');
      }
      recordGameRound({
        gameId: game.id,
        userId: 'current-user',
        wager: betAmount,
        payout,
        multiplier: mult,
        won: true,
      });
    } else {
      playGameSound('lose');
      recordGameRound({
        gameId: game.id,
        userId: 'current-user',
        wager: betAmount,
        payout: 0,
        multiplier: 0,
        won: false,
      });
    }
  }, [betAmount, playCasino, game, isCloudRenting, recordSessionRound]);

  // Keyboard wagers & cashout shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        if (tagName === "input" || tagName === "textarea" || activeEl.hasAttribute("contenteditable")) {
          return;
        }
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (e.repeat) return; // Prevent hold-down auto-repeats
        handlePlay();
      } else if (e.code === "KeyC") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("trigger-cashout"));
      } else if (e.code === "Escape") {
        e.preventDefault();
        setIsAnalyticsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePlay]);

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

  // early return if game is not found
  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Gamepad2 className="w-16 h-16 text-slate-700 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Game Not Found</h1>
        <button onClick={() => router.push('/')} className="bg-neon-purple hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-bold">Back to Lobby</button>
      </div>
    );
  }

  // Inline betting panel — sidebar is disabled; all games use the inline bar below canvas
  const showLeftSidebar = false;

  // DYNAMIC ROUTER
  const isArcade = game.categories.some(cat => ["fps", "driving", "retro", "sports", "action", "puzzle", "racing", "adventure"].includes(cat)) &&
    !game.categories.includes("slots") &&
    !game.categories.includes("live") &&
    !game.categories.includes("shows") &&
    !game.categories.includes("table");

  const renderEngine = () => {
    // === EXTERNAL GAMES (Cinematic Loading Simulation) ===
    if (game.isExternal) {
      return <ExternalEngine isPlaying={isSpinning} onComplete={handleEngineComplete} game={game} />;
    }

    // === ORIGINALS — each gets its own unique engine ===
    if (game.id === "orig-7" || game.title.toLowerCase().includes("tower")) {
      return <TowerEngine isPlaying={isSpinning} betAmount={betAmount} onLiveTick={handleLiveTick} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-2" || game.title.toLowerCase().includes("limbo")) {
      return <LimboEngine isPlaying={isSpinning} betAmount={betAmount} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-3" || game.title.toLowerCase().includes("plinko")) {
      return <PlinkoEngine isPlaying={isSpinning} betAmount={betAmount} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-4" || game.title.toLowerCase().includes("mines")) {
      return <MinesEngine isPlaying={isSpinning} betAmount={betAmount} onLiveTick={handleLiveTick} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-6" || game.title.toLowerCase().includes("keno")) {
      return <KenoEngine isPlaying={isSpinning} betAmount={betAmount} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-11") {
      return <RouletteEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-5" || game.title.toLowerCase().includes("dice")) {
      return <DiceEngine isPlaying={isSpinning} betAmount={betAmount} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-9" || game.title.toLowerCase().includes("coin")) {
      return <CoinflipEngine isPlaying={isSpinning} onComplete={handleEngineComplete} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} />;
    }
    if (game.id === "orig-10" || game.categories.includes("shows") || game.title.toLowerCase().includes("wheel") || game.title.toLowerCase().includes("time") || game.title.toLowerCase().includes("funky") || game.title.toLowerCase().includes("monopoly") || game.title.toLowerCase().includes("dream catcher")) {
      return <LiveWheelEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-12" || game.title.toLowerCase().includes("tradex") || game.title.toLowerCase().includes("trade")) {
      return <TradeXEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-13" || game.title.toLowerCase().includes("hilo") || game.title.toLowerCase().includes("high")) {
      return <HiLoEngine isPlaying={isSpinning} onLiveTick={handleLiveTick} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-14" || game.title.toLowerCase().includes("penalty") || game.title.toLowerCase().includes("shootout")) {
      return <PenaltyEngine isPlaying={isSpinning} onLiveTick={handleLiveTick} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-15" || game.title.toLowerCase().includes("neon horizon")) {
      return <NeonHorizon3DEngine isPlaying={isSpinning} betAmount={betAmount} onLiveTick={handleLiveTick} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-16" || game.title.toLowerCase().includes("bowling")) {
      return <PenaltyEngine isPlaying={isSpinning} onLiveTick={handleLiveTick} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-17" || game.title.toLowerCase().includes("billiards")) {
      return <BilliardsEngine isPlaying={isSpinning} betAmount={betAmount} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-18" || game.title.toLowerCase().includes("space miner")) {
      return <MinesEngine isPlaying={isSpinning} betAmount={betAmount} onLiveTick={handleLiveTick} onComplete={handleEngineComplete} />;
    }
    if (game.id === "orig-19" || game.title.toLowerCase().includes("roulette")) {
      return (
        <LiveRouletteEngine 
          isPlaying={isSpinning} 
          betAmount={betAmount}
          onBetAmountChange={setBetAmount}
          onStartGame={handlePlay}
          onComplete={handleEngineComplete} 
        />
      );
    }
    if (game.id === "orig-20" || game.title.toLowerCase().includes("blackjack pro")) {
      return <BlackjackVIPEngine isPlaying={isSpinning} onComplete={handleEngineComplete} gameId={game.id} gameTitle={game.title} />;
    }
    if (game.id === "orig-22" || game.title.toLowerCase().includes("fusion")) {
      return (
        <LudoFusionEngine
          isPlaying={isSpinning}
          betAmount={betAmount}
          onBetAmountChange={setBetAmount}
          onStartGame={handlePlay}
          onComplete={handleEngineComplete}
          onLiveTick={handleLiveTick}
        />
      );
    }
    if (game.id === "orig-21" || game.title.toLowerCase().includes("ludo")) {
      return (
        <LudoEngine
          isPlaying={isSpinning}
          betAmount={betAmount}
          onBetAmountChange={setBetAmount}
          onStartGame={handlePlay}
          onComplete={handleEngineComplete}
          onLiveTick={handleLiveTick}
        />
      );
    }
    // === CRASH GAMES ===
    if (game.categories.includes("crash")) {
      if (game.id === "orig-1" || game.title.toLowerCase() === "crash") {
        return <CrashEngine isPlaying={isSpinning} betAmount={betAmount} onLiveTick={handleLiveTick} autoCashout={autoCashoutVal || undefined} onComplete={handleEngineComplete} />;
      }
      if (game.id === "crash-1" || game.title.toLowerCase().includes("aviator") || game.title.toLowerCase().includes("aviamasters")) {
        return <AviatorEngine isPlaying={isSpinning} betAmount={betAmount} onLiveTick={handleLiveTick} autoCashout={autoCashoutVal || undefined} onComplete={handleEngineComplete} />;
      }
      if (game.id === "live-6" || game.title.toLowerCase().includes("balloon")) {
        return <BalloonRaceEngine isPlaying={isSpinning} onComplete={handleEngineComplete} />;
      }
      if (game.title.toLowerCase().includes("coin flip") || game.title.toLowerCase().includes("crazy coin")) {
        return <CoinflipEngine isPlaying={isSpinning} onComplete={handleEngineComplete} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} />;
      }
      return <CrashEngine isPlaying={isSpinning} betAmount={betAmount} onLiveTick={handleLiveTick} autoCashout={autoCashoutVal || undefined} onComplete={handleEngineComplete} />;
    }
    // === TABLE / CARD GAMES ===
    if (game.categories.includes("poker") || game.categories.includes("table") || game.id.includes("blackjack") || game.id.includes("poker")) {
      if (isRoyalEngine) {
        return <RoyalGamingEngine isPlaying={isSpinning} betAmount={betAmount} onComplete={handleEngineComplete} gameId={game.id} gameTitle={game.title} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} />;
      }
      if (game.id.includes("blackjack") || game.title.toLowerCase().includes("blackjack") || game.id === "orig-8") {
        return <BlackjackVIPEngine isPlaying={isSpinning} onComplete={handleEngineComplete} gameId={game.id} gameTitle={game.title} />;
      }
      if (game.id.includes("baccarat") || game.title.toLowerCase().includes("baccarat") || game.id === "table-3") {
        return <BaccaratEngine isPlaying={isSpinning} onComplete={handleEngineComplete} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} />;
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

    return <SlotEngine isPlaying={isSpinning} isTurbo={playMode === "auto"} theme={theme} betAmount={betAmount} onComplete={handleEngineComplete} />;
  };

  const isCrashGame = game && game.categories && game.categories.includes("crash");
  const isMinesGame = game && (game.id === "orig-4" || game.title.toLowerCase().includes("mines") || game.id === "orig-18" || game.title.toLowerCase().includes("space miner"));
  const isTowerGame = game && (game.id === "orig-7" || game.title.toLowerCase().includes("tower"));
  const isHiLoGame = game && (game.id === "orig-13" || game.title.toLowerCase().includes("hilo") || game.title.toLowerCase().includes("high"));
  const isPenaltyGame = game && (game.id === "orig-14" || game.id === "orig-16" || game.title.toLowerCase().includes("penalty") || game.title.toLowerCase().includes("shootout") || game.title.toLowerCase().includes("bowling"));
  const isNeonHorizonGame = game && (game.id === "orig-15" || game.title.toLowerCase().includes("neon horizon"));
  const isCashoutGame = isCrashGame || isMinesGame || isTowerGame || isHiLoGame || isPenaltyGame || isNeonHorizonGame;

  const isCashoutActive = isSpinning && (
    isCrashGame || 
    (isMinesGame && activePicksCount > 0) || 
    (isTowerGame && activePicksCount > 0) ||
    (isHiLoGame && liveMultiplier && liveMultiplier > 1.0) ||
    (isPenaltyGame && liveMultiplier && liveMultiplier > 1.0) ||
    isNeonHorizonGame
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto p-1.5 pb-36 sm:p-6 sm:pb-4 md:pb-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 transition-colors shrink-0">
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <img 
            src={game.image} 
            className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-200/80 shrink-0" 
            alt={game.title}
          />
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-wide leading-tight">{game.title}</h1>
            <p className="text-[11px] text-slate-600 font-semibold leading-none mt-0.5">Publisher: <span className="text-neon-yellow">{game.provider}</span></p>
          </div>
        </div>

        {/* Mobile Header Quick Actions */}
        <div className="flex items-center gap-2 sm:hidden">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent("open-ai-concierge"))} 
            className="w-9 h-9 bg-white hover:bg-slate-50 rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-sm border border-red-200/60 cursor-pointer"
            title="Open AI Concierge"
          >
            <Sparkles className="w-4.5 h-4.5 text-red-600" />
          </button>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent("open-live-chat"))} 
            className="w-9 h-9 bg-red-600 hover:bg-red-500 rounded-xl flex items-center justify-center text-slate-100 transition-colors shrink-0 shadow-sm border border-red-500/25 cursor-pointer"
            title="Open Live Chat"
          >
            <MessageSquare className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        <div className="flex-1 w-full">

          {/* Game Container Wrapper */}
          <motion.div 
            animate={isMegaWin ? { x: [-10, 10, -10, 10, -5, 5, 0], y: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.6 }}
            className={`relative w-full h-auto md:h-auto ${!hasTransferred ? 'min-h-[460px]' : 'min-h-0'} md:min-h-[600px] bg-white rounded-2xl border border-slate-200 overflow-visible md:overflow-hidden ${theme.shadowClass} flex flex-col group`}
          >
            <AnimatePresence mode="wait">
              {currentUser && !hasTransferred ? (
                <motion.div 
                  key="modal"
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-slate-100/90 backdrop-blur-sm p-4 sm:p-0"
                >
                  <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-md rounded-2xl overflow-hidden my-auto">
                    <div className="p-4 md:p-6 text-center border-b border-slate-200">
                      <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wider">Sub-Wallet Transfer</h2>
                      <p className="text-slate-650 text-xs md:text-sm mt-1">Allocate funds from your Main Balance to play {game.title}.</p>
                    </div>
                    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                      <div className="flex justify-between items-center text-[10px] md:text-xs font-black text-slate-600 uppercase tracking-widest">
                        <div className="flex flex-col items-start">
                          <span className="text-[9px] md:text-[10px] text-slate-500">Main Balance</span>
                          <span className="text-slate-900 font-mono text-xs md:text-sm mt-0.5">₹{(rawBalance - transferAmount).toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] md:text-[10px] text-slate-500">Sub-Wallet</span>
                          <span className="text-red-650 font-mono text-xs md:text-sm mt-0.5">₹{transferAmount}</span>
                        </div>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max={Math.max(10, Math.floor(rawBalance))} 
                        step="10" 
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(Number(e.target.value))}
                        className="w-full accent-red-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      
                      {/* Percent shortcuts */}
                      <div className="flex justify-between gap-1.5 md:gap-2">
                        {[0.25, 0.50, 0.75, 1.00].map(pct => {
                          const amt = Math.max(10, Math.floor(rawBalance * pct));
                          return (
                            <button
                              key={pct}
                              onClick={() => setTransferAmount(amt)}
                              className="flex-1 py-1 px-1.5 border border-slate-200 hover:border-red-600 rounded text-[9px] md:text-[10px] font-black text-slate-700 hover:text-red-600 uppercase tracking-wider transition-colors"
                            >
                              {pct * 100}%
                            </button>
                          );
                        })}
                      </div>

                      <div className="text-center bg-slate-50 border border-slate-200/60 p-2 md:p-3 rounded-lg">
                        <span className="text-[10px] md:text-xs font-bold text-slate-600 block uppercase tracking-widest mb-0.5 md:mb-1">Allocated Amount</span>
                        <span className="text-2xl md:text-3xl font-black text-slate-900 font-mono tracking-tighter">₹{transferAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="p-3 md:p-4 bg-slate-50 flex gap-3 md:gap-4">
                      <button 
                        onClick={() => router.back()}
                        className="flex-1 py-2 md:py-3 font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider text-xs md:text-sm"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          if (rawBalance < transferAmount) {
                            alert("Insufficient balance.");
                            return;
                          }
                          setHasTransferred(true);
                        }}
                        className="flex-1 py-2 md:py-3 font-black text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors uppercase tracking-wider shadow-lg shadow-red-500/20 text-xs md:text-sm"
                      >
                        Transfer & Enter
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : isLoading ? (
                <motion.div key="loader" exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0 bg-slate-50 z-50 flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&q=80')] opacity-10 bg-cover bg-center mix-blend-screen" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#02050a] via-[#02050a]/80 to-transparent" />
                  
                  <div className="relative z-10 w-full max-w-md px-8 flex flex-col items-center">
                    <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
                      <div className="absolute inset-0 border border-slate-200 rounded-full" />
                      <div className="absolute inset-2 border border-slate-700/50 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-neon-purple border-t-transparent rounded-full shadow-[0_0_30px_rgba(168,85,247,0.4)]" />
                      <motion.div animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-4 border border-neon-green border-b-transparent rounded-full" />
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full backdrop-blur-sm">
                        <Gamepad2 className="w-10 h-10 text-slate-800 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
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
                <motion.div key="game" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative w-full flex-1 flex flex-col min-h-0">
                  
                  {/* Cinematic Background */}
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="w-full h-full opacity-30">
                      <img src={game.image} className="w-full h-full object-cover blur-md" />
                    </div>
                    <div className={`absolute inset-0 bg-gradient-to-t ${theme.bgGradient}`} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#fdfbf7_100%)] opacity-90" />
                  </div>

                  {/* Game UI Simulation - Inline Bet Mode */}
                  <div className="relative z-10 w-full flex-1 flex flex-col min-h-0">
                    
                    {/* LEFT SIDEBAR (Premium Command Center) */}
                    {showLeftSidebar && (
                      <div className="w-full md:w-[320px] lg:w-[350px] bg-white md:bg-slate-50 border-t md:border-t-0 md:border-r border-slate-200 flex flex-col order-2 md:order-1 relative z-20 shrink-0 shadow-[10px_0_30px_rgba(0,0,0,0.05)] h-auto md:h-full overflow-visible">
                        {isCloudRenting ? (
                          <div className="p-4 md:p-6 flex flex-col gap-6 h-full justify-between">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-1">Instance Cost</span>
                              <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-[#a855f7]" />
                                <span className="text-xl font-black text-slate-900">₹{STAKE_PRESETS[1]}</span>
                                <span className="text-xs text-slate-600 font-bold">/ hour</span>
                              </div>
                            </div>
                            <button 
                              onClick={handlePlay}
                              disabled={isSpinning || isSessionActive}
                              className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${isSessionActive ? 'bg-slate-200 text-slate-600' : isSpinning ? 'bg-slate-200 text-slate-600' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-950 hover:scale-[1.02] shadow-lg shadow-yellow-500/20'}`}
                            >
                              {isSessionActive ? "Active" : isSpinning ? "Booting..." : "Rent Instance"}
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col h-auto md:h-full overflow-visible md:overflow-hidden bg-white md:bg-slate-50">
                            {/* Scrollable Body */}
                            <div className="flex-1 overflow-visible md:overflow-y-auto p-3 sm:p-4 flex flex-col gap-3.5 sm:gap-5 min-h-0 custom-scrollbar pb-24 md:pb-4">
                              {/* Control Panel Tabs */}
                              <div className="flex border-b border-slate-200 gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                                {(['stakes', 'strategy'] as const).map((tab) => (
                                  <button
                                    key={tab}
                                    onClick={() => setSidebarTab(tab)}
                                    className={cn(
                                      "flex-1 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer",
                                      sidebarTab === tab
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-650 hover:text-slate-800"
                                    )}
                                  >
                                    {tab === 'stakes' ? 'Stake' : 'Strategy'}
                                  </button>
                                ))}
                              </div>

                              <div className="flex-1 flex flex-col gap-3.5 sm:gap-5">
                                {sidebarTab === 'stakes' ? (
                                  <>
                                    {/* Bet Amount Control */}
                                    <div className="flex flex-col gap-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-650 font-bold uppercase tracking-wider">Bet Amount</span>
                                        <span className="text-xs font-black text-slate-900">₹{betAmount.toLocaleString()}</span>
                                      </div>
                                      
                                      <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-neon-purple focus-within:border-neon-purple transition-all">
                                        <div className="flex items-center pl-3 pr-2 bg-slate-50 border-r border-slate-200 h-10 sm:h-12">
                                          <span className="text-slate-600 font-bold">₹</span>
                                        </div>
                                        <input 
                                          type="number" 
                                          value={betAmount} 
                                          onChange={(e) => setBetAmount(Number(e.target.value))}
                                          className="flex-1 bg-transparent border-none text-slate-900 font-black text-xs sm:text-sm px-3 py-2 h-10 sm:h-12 focus:outline-none focus:ring-0"
                                        />
                                        <div className="flex items-center bg-slate-50 border-l border-slate-200 h-10 sm:h-12">
                                          <button onClick={() => { setBetAmount(prev => prev / 2); playGameSound('click'); }} className="px-2.5 sm:px-3 h-full text-[10px] sm:text-xs font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900 border-r border-slate-200 transition-colors">1/2</button>
                                          <button onClick={() => { setBetAmount(prev => prev * 2); playGameSound('click'); }} className="px-2.5 sm:px-3 h-full text-[10px] sm:text-xs font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900 border-r border-slate-200 transition-colors">2x</button>
                                        </div>
                                      </div>
                                      
                                      <div className="flex justify-between items-center text-[9px] text-slate-650 font-bold uppercase tracking-wider mt-1 px-1">
                                        <span>Chip Selector</span>
                                        <span>Double click to 2x</span>
                                      </div>
                                      <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5 py-1.5">
                                        {[
                                          { amount: 100, label: "100", color: "from-red-650 to-red-700 border-red-500" },
                                          { amount: 500, label: "500", color: "from-teal-650 to-teal-700 border-teal-500" },
                                          { amount: 1000, label: "1k", color: "from-amber-500 to-amber-600 border-amber-400" },
                                          { amount: 5000, label: "5k", color: "from-pink-500 to-pink-650 border-pink-400" },
                                          { amount: 10000, label: "10k", color: "from-rose-500 to-rose-600 border-rose-450" },
                                          { amount: 50000, label: "50k", color: "from-red-800 to-red-100 border-red-700" }
                                        ].map((chip) => {
                                          const isSelected = betAmount === chip.amount;
                                          return (
                                            <button
                                              key={chip.amount}
                                              type="button"
                                              onClick={() => { setBetAmount(chip.amount); playGameSound('click'); }}
                                              onDoubleClick={() => { setBetAmount(chip.amount * 2); playGameSound('click'); }}
                                              className={cn(
                                                chip.amount === 1000 ? "relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex-shrink-0 flex items-center justify-center font-black text-slate-950 shadow-md transition-all duration-300 transform cursor-pointer border-[1.5px] border-white/90 select-none" : "relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex-shrink-0 flex items-center justify-center font-black text-slate-100 shadow-md transition-all duration-300 transform cursor-pointer border-[1.5px] border-white/90 select-none",

                                                isSelected ? "scale-110 ring-2 ring-slate-100 ring-offset-1 ring-offset-white z-10 opacity-100" : "hover:scale-105 opacity-80 hover:opacity-100",
                                                `bg-gradient-to-br ${chip.color}`
                                              )}
                                              title="Double click to double bet"
                                            >
                                              {/* Inner dotted ring to look like a real casino chip */}
                                              <div className="absolute inset-[2px] rounded-full border border-dashed border-white/45 flex items-center justify-center">
                                                <span className={cn("text-[9px] sm:text-[10px] font-black tracking-tight", chip.amount === 1000 ? "text-slate-950" : "text-white drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.6)]")}>
                                                  {chip.label}
                                                </span>
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Auto Cashout multiplier input (For Crash games only) */}
                                    {game.categories.includes("crash") && (
                                      <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-slate-650 font-bold uppercase tracking-wider">Auto Cashout</span>
                                          {autoCashoutVal !== "" && (
                                            <span className="text-xs font-black text-slate-900">{(autoCashoutVal as number).toFixed(2)}x</span>
                                          )}
                                        </div>
                                        <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 transition-all">
                                          <div className="flex items-center pl-3 pr-2 bg-slate-50 border-r border-slate-200 h-10 sm:h-12">
                                            <span className="text-slate-600 font-bold text-xs">Auto Cashout</span>
                                          </div>
                                          <input 
                                            type="number" 
                                            step="0.01"
                                            min="1.01"
                                            placeholder="1.01 (Optional)"
                                            value={autoCashoutVal} 
                                            onChange={(e) => {
                                              const v = e.target.value === "" ? "" : parseFloat(e.target.value);
                                              setAutoCashoutVal(v);
                                            }}
                                            disabled={isSpinning}
                                            className="flex-1 bg-transparent border-none text-slate-900 font-black text-xs sm:text-sm px-3 py-2 h-10 sm:h-12 focus:outline-none focus:ring-0 text-right pr-2"
                                          />
                                          <div className="flex items-center pr-3">
                                            <span className="text-slate-600 font-bold text-xs sm:text-sm">x</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Target Selector */}
                                    {(() => {
                                      const titleLower = game.title.toLowerCase();
                                      const idLower = game.id.toLowerCase();
                                      const isCoin = titleLower.includes("coin") || idLower.includes("coin");
                                      const isAndar = titleLower.includes("andar") || idLower.includes("andar");
                                      const isDragon = titleLower.includes("dragon") || idLower.includes("dragon");
                                      const isTeenPatti = titleLower.includes("teen patti") || idLower.includes("patti");
                                      const isRoulette = titleLower.includes("roulette");
                                      const isBaccarat = titleLower.includes("baccarat");
                                      const isDice = titleLower.includes("dice");
                                      
                                      let options: { id: string; name: string }[] = [];
                                      
                                      if (isCoin) {
                                        options = [
                                          { id: "AURA", name: "Aura" },
                                          { id: "SKULL", name: "Skull" }
                                        ];
                                      } else if (isAndar) {
                                        options = [
                                          { id: "andar", name: "Andar" },
                                          { id: "bahar", name: "Bahar" }
                                        ];
                                      } else if (isDragon) {
                                        options = [
                                          { id: "dragon", name: "Dragon" },
                                          { id: "tiger", name: "Tiger" },
                                          { id: "tie", name: "Tie" }
                                        ];
                                      } else if (isTeenPatti) {
                                        options = [
                                          { id: "player_a", name: "Player A" },
                                          { id: "player_b", name: "Player B" },
                                          { id: "tie", name: "Tie" }
                                        ];
                                      } else if (isRoulette) {
                                        options = [
                                          { id: "red", name: "Red" },
                                          { id: "black", name: "Black" },
                                          { id: "zero", name: "Zero" }
                                        ];
                                      } else if (isBaccarat) {
                                        options = [
                                          { id: "PLAYER", name: "Player" },
                                          { id: "BANKER", name: "Banker" },
                                          { id: "TIE", name: "Tie" }
                                        ];
                                      } else if (isDice) {
                                        options = [
                                          { id: "over", name: "Over 50.5" },
                                          { id: "under", name: "Under 50.5" }
                                        ];
                                      }

                                      if (options.length === 0) return null;

                                      return (
                                        <div className="flex flex-col gap-2">
                                          <span className="text-[10px] uppercase tracking-widest text-slate-650 font-black">Bet Target Selector</span>
                                          <div className="grid grid-cols-2 gap-2">
                                            {options.map((opt) => {
                                              const isActive = selectedTarget === opt.id;
                                              return (
                                                <button
                                                  key={opt.id}
                                                  type="button"
                                                  onClick={() => {
                                                    setSelectedTarget(opt.id);
                                                    playGameSound('click');
                                                  }}
                                                  className={cn(
                                                    "py-2 sm:py-3.5 px-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all border-2 text-center",
                                                    isActive 
                                                      ? `bg-gradient-to-br ${theme.buttonGradient} text-white border-red-500 shadow-md scale-[1.02]`
                                                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-350 hover:bg-slate-50"
                                                  )}
                                                >
                                                  {opt.name}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {/* Play Mode Control — Manual Only by Default */}
                                    <div className="relative">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] uppercase tracking-widest text-slate-650 font-black">Play Mode</span>
                                        <div className="flex items-center gap-1">
                                          <Shield className="w-3 h-3 text-emerald-500" />
                                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Protected</span>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        {/* Manual Mode — Always Active */}
                                        <button
                                          type="button"
                                          onClick={() => { setPlayMode("manual"); setAutoplayWarning(false); }}
                                          className={`relative overflow-hidden group flex flex-col items-center justify-center gap-1.5 py-2 sm:py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border-2 ${
                                            playMode === "manual"
                                              ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-[1.02]"
                                              : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
                                          }`}
                                        >
                                          {playMode === "manual" && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 animate-[shimmer_2s_infinite]" />
                                          )}
                                          <Hand className="w-5 h-5 relative z-10" />
                                          <span className="relative z-10">Manual</span>
                                          {playMode === "manual" && (
                                            <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-pulse" />
                                          )}
                                        </button>

                                        {/* Auto Mode — Locked with Warning */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setAutoplayWarning(true);
                                            setTimeout(() => setAutoplayWarning(false), 3000);
                                          }}
                                          className="relative flex flex-col items-center justify-center gap-1.5 py-2 sm:py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border-2 bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed opacity-60"
                                        >
                                          <Lock className="w-5 h-5" />
                                          <span>Auto</span>
                                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full leading-none shadow-md">OFF</span>
                                        </button>
                                      </div>

                                      {/* Autoplay Warning Toast */}
                                      <AnimatePresence>
                                        {autoplayWarning && (
                                          <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                            className="absolute -bottom-14 left-0 right-0 z-50 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-2 rounded-xl shadow-lg flex items-center gap-2"
                                          >
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            <span>Autoplay is disabled. Manual play only.</span>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </>
                                ) : (() => {
                                  const strategyKey = game ? getGameStrategyKey(game) : "default";
                                  const strategies = GAME_STRATEGIES[strategyKey] || GAME_STRATEGIES["default"];
                                  return (
                                    <div className="flex flex-col gap-5">
                                      {strategies.map((strat, idx) => {
                                        const riskBg = strat.risk === "Low" ? "bg-emerald-500" : strat.risk === "Med" ? "bg-amber-500" : "bg-rose-500";
                                        const recommendedBet = Math.max(10, Math.round((balance * strat.recommendedBetPercent) / 100));
                                        return (
                                          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 relative overflow-hidden">
                                            <div className={`absolute top-0 right-0 ${riskBg} text-white text-[7px] font-black uppercase px-2 py-0.5 rounded-bl-lg`}>
                                              {strat.risk} Risk
                                            </div>
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                                              <span>{strat.emoji}</span> {strat.name}
                                            </h4>
                                            <p className="text-[10px] text-slate-650 font-semibold leading-relaxed">
                                              {strat.description}
                                            </p>
                                            <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-xl space-y-1.5">
                                              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider block">Target / Tip</span>
                                              <p className="text-[10px] text-slate-700 font-medium leading-relaxed font-semibold">{strat.tip}</p>
                                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200/50 text-[9px] text-slate-600 font-bold uppercase tracking-wider">
                                                <span>Rec. Rounds: <strong className="text-slate-700 font-mono">{strat.recommendedRounds}</strong></span>
                                                <span>Rec. Bet: <strong className="text-slate-700 font-mono">₹{recommendedBet} ({strat.recommendedBetPercent}%)</strong></span>
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setBetAmount(recommendedBet);
                                                playGameSound('click');
                                              }}
                                              className="w-full py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                                            >
                                              Apply Recommended Bet (₹{recommendedBet})
                                            </button>
                                          </div>
                                        );
                                      })}
                                      
                                      {/* Info Disclaimer */}
                                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200/55 p-2 rounded-xl">
                                        <BadgeInfo className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-[9px] text-amber-700 font-semibold leading-normal">
                                          Strategies do not change game odds. Play responsibly and manage your bankroll.
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Session Analytics */}
                              {!isCloudRenting && !isRoyalEngine && (
                                <div className="border-t border-slate-200 pt-3 flex flex-col gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                                    className="flex items-center justify-between w-full text-slate-850 font-black text-xs uppercase tracking-widest py-1 hover:text-slate-900 cursor-pointer"
                                  >
                                    <span className="flex items-center gap-2">
                                      <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                                      Session Analytics
                                    </span>
                                    <span className="text-[9px] text-slate-650 font-bold font-mono flex items-center gap-1.5">
                                      {stats.totalRounds} ROUNDS
                                      <span className="text-[8px] transition-transform duration-200" style={{ transform: isStatsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                                    </span>
                                  </button>
                                  
                                  <div className={cn(
                                    "space-y-4 transition-all duration-300 overflow-hidden",
                                    isStatsExpanded ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 md:max-h-[500px] opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto"
                                  )}>
                                    {/* Line Chart */}
                                    <div className="space-y-2">
                                      <span className="text-[10px] text-slate-600 font-extrabold uppercase tracking-wider block">Profit/Loss Curve</span>
                                      <SVGProfitChart history={stats.profitHistory} />
                                    </div>

                                    {/* Ratio Bar */}
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-650 uppercase tracking-wider">
                                        <span>Win vs Loss Ratio</span>
                                        <span className="text-emerald-600">{stats.winRatio.toFixed(0)}% Win</span>
                                      </div>
                                      <div className="w-full h-3 bg-rose-200 rounded-full overflow-hidden flex">
                                        <div 
                                          className="h-full bg-emerald-500 transition-all duration-500" 
                                          style={{ width: `${stats.winRatio}%` }}
                                        />
                                      </div>
                                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-450 font-mono">
                                        <span>{stats.winsCount} WINS</span>
                                        <span>{stats.lossesCount} LOSSES</span>
                                      </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 text-center">
                                        <span className="text-[8px] text-slate-650 font-black uppercase tracking-wider block">Wagered</span>
                                        <span className="text-xs font-black text-slate-800 font-mono block mt-1">₹{stats.totalWagered.toLocaleString()}</span>
                                      </div>
                                      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 text-center">
                                        <span className="text-[8px] text-slate-650 font-black uppercase tracking-wider block">Net Profit</span>
                                        <span className={cn("text-xs font-black font-mono block mt-1", stats.netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                          ₹{stats.netProfit >= 0 ? "+" : ""}{stats.netProfit.toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 text-center col-span-2">
                                        <span className="text-[8px] text-slate-650 font-black uppercase tracking-wider block">Highest Multiplier</span>
                                        <span className="text-sm font-black text-emerald-650 font-mono block mt-1">{stats.maxMultiplier.toFixed(2)}x</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>
                        )}
                      </div>
                    )}

                    {/* FULL-WIDTH GAME CANVAS */}
                    <div className={cn(
                      "min-h-[300px] h-[calc(100dvh-280px)] sm:min-h-[480px] sm:h-[480px] md:h-[600px] lg:h-[680px] flex flex-col relative z-10",
                      isRoyalEngine ? "bg-transparent p-0" : "bg-[#faf8f2] border border-amber-200/30 rounded-3xl p-2 md:p-4 shadow-inner"
                    )}>
                      
                      {/* Central Canvas Area */}
                      <div className="flex-1 w-full flex flex-col md:flex-row gap-4 md:gap-6 relative z-10 min-h-[280px] sm:min-h-[400px] md:min-h-[600px]">
                        
                        <div className={cn(
                          "flex-1 flex flex-col items-center justify-start relative w-full overflow-y-auto scrollbar-none",
                          isRoyalEngine 
                            ? "bg-transparent border-none" 
                            : (game.id === "orig-21" || game.id === "orig-19" || game.title.toLowerCase().includes("ludo") || game.title.toLowerCase().includes("roulette"))
                              ? "bg-[#faf8f2] rounded-3xl shadow-[inset_0_0_20px_rgba(0,0,0,0.03)] border border-amber-200/40"
                              : "bg-[#faf8f2] rounded-3xl shadow-[inset_0_0_20px_rgba(0,0,0,0.03)] border border-amber-200/40"
                        )}>
                          {!isCloudRenting ? (
                            <div className="relative w-full flex-1 flex flex-col items-center py-4">
                              {renderEngine()}

                              {/* Win Overlay */}
                              <AnimatePresence>
                                {winAmount !== null && !isSpinning && (
                                  <motion.div 
                                    initial={{ scale: 0.5, opacity: 0 }} 
                                    animate={{ scale: 1, opacity: 1 }} 
                                    exit={{ scale: 1.5, opacity: 0 }} 
                                    onClick={() => setWinAmount(null)}
                                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md rounded-3xl cursor-pointer select-none"
                                  >
                                    <motion.h2 
                                      animate={isMegaWin ? { scale: [1, 1.2, 1] } : {}}
                                      transition={{ repeat: Infinity, duration: 1 }}
                                      className={`text-4xl sm:text-7xl font-black uppercase tracking-tighter transform -skew-x-6 drop-shadow-[0_0_40px_rgba(255,255,255,0.4)] ${isMegaWin ? `text-${theme.primaryColor} bg-clip-text text-transparent bg-gradient-to-b ${theme.buttonGradient}` : 'text-slate-900'}`}
                                    >
                                      {isMegaWin ? "MEGA WIN!" : "EPIC WIN!"}
                                    </motion.h2>
                                    <motion.div 
                                      className="text-5xl md:text-8xl font-black text-neon-yellow mt-4 drop-shadow-[0_0_30px_rgba(234,179,8,0.6)] font-mono tracking-tighter"
                                    >
                                      ₹<RollingCounter target={winAmount} />
                                    </motion.div>
                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-100/50 mt-6 animate-pulse">Tap anywhere to close</span>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Low Balance Overlay */}
                              <AnimatePresence>
                                {currentUser && balance < betAmount && !isSpinning && (
                                  <motion.div initial={{ opacity: 0, backdropFilter: "blur(0px)" }} animate={{ opacity: 1, backdropFilter: "blur(12px)" }} className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 rounded-3xl border border-red-500/30">
                                    <div className="text-center p-8 max-w-md">
                                      <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                                      <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 uppercase tracking-wider">Low Balance</h2>
                                      <p className="text-slate-700 mb-8 font-medium text-lg">Your balance (₹{balance.toLocaleString()}) is insufficient for a ₹{betAmount.toLocaleString()} bet.</p>
                                      <button 
                                        onClick={() => window.dispatchEvent(new CustomEvent("open-cashier"))}
                                        className={`w-full py-5 mb-3 bg-gradient-to-r ${theme.buttonGradient} text-white font-black text-xl uppercase tracking-widest rounded-xl shadow-sm transition-all transform hover:scale-105 active:scale-95`}
                                      >
                                        Deposit to Continue
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ) : (
                            isSessionActive ? (
                              <div className="relative w-full flex-1 flex flex-col items-center py-4">
                                {renderEngine()}
                                {/* Rental countdown HUD */}
                                <div className="absolute top-4 right-4 bg-white/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-right z-30 shadow-lg pointer-events-none">
                                  <p className="text-[10px] text-slate-650 uppercase tracking-widest font-black">Session Time Left</p>
                                  <p className="text-neon-yellow font-mono font-black text-base flex items-center justify-end gap-1.5 mt-0.5">
                                    <Clock className="w-4 h-4 text-neon-yellow animate-pulse" />
                                    {formatTime(sessionTimeLeft)}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
                              >
                                <Gamepad2 className="w-16 h-16 text-cyan-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
                                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-wide">Premium Cloud Streaming</h2>
                                <p className="text-slate-700 text-sm font-medium mb-6">
                                  Rent <span className="text-slate-900 font-bold">{game.title}</span> for cloud-native gaming at 60 FPS, with saves synced instantly to your profile.
                                </p>

                                <div className="bg-white/40 border border-white/10 rounded-2xl p-4 mb-6">
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
                                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
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
                                      className="w-24 px-2 py-1.5 rounded-xl bg-white border border-slate-200 focus:border-cyan-500 focus:outline-none text-slate-900 text-center text-xs font-black placeholder:text-slate-500 font-mono"
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between mb-6 px-1">
                                  <span className="text-sm text-slate-650 font-bold">Total Cost ({selectedHours} hrs)</span>
                                  <span className="text-2xl font-black text-slate-900 font-mono">₹{rentCost.toLocaleString()}</span>
                                </div>

                                {isDemoLimitReached ? (
                                  <button
                                    onClick={() => window.dispatchEvent(new CustomEvent("open-cashier"))}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-950 font-black uppercase text-sm tracking-wider shadow-lg transition-all"
                                  >
                                    Deposit & Activate
                                  </button>
                                ) : balance < rentCost ? (
                                  <button
                                    onClick={() => window.dispatchEvent(new CustomEvent("open-cashier"))}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-700 text-white font-black uppercase text-sm tracking-wider shadow-lg transition-all"
                                  >
                                    Insufficient Funds
                                  </button>
                                ) : (
                                  <button
                                    onClick={handleRent}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-black uppercase text-sm tracking-widest shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
                            className="w-full md:w-[280px] shrink-0 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col gap-4 shadow-2xl overflow-y-auto max-h-[500px]"
                          >
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                              <span className="text-slate-900 font-black text-xs uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-neon-green rounded-full animate-pulse" />
                                Lobby #91A-STAKE
                              </span>
                              <span className="text-[9px] text-slate-600 font-mono font-bold">4/8 Active</span>
                            </div>
                            
                            {/* List of mock players */}
                            <div className="space-y-3 flex-1 overflow-y-auto">
                              <div className="flex justify-between items-center bg-white/20 p-2.5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">U1</div>
                                  <span className="text-slate-800 font-bold text-xs">CryptoWhale</span>
                                </div>
                                <span className="text-neon-green text-[10px] font-black font-mono">₹1,500</span>
                              </div>
                              <div className="flex justify-between items-center bg-white/20 p-2.5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">U2</div>
                                  <span className="text-slate-800 font-bold text-xs">WagerGod</span>
                                </div>
                                <span className="text-neon-green text-[10px] font-black font-mono">₹4,200</span>
                              </div>
                              <div className="flex justify-between items-center bg-white/20 p-2.5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">ME</div>
                                  <span className="text-slate-900 font-black text-xs">You</span>
                                </div>
                                <span className="text-neon-yellow text-[10px] font-black font-mono font-bold">₹{balance.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Table Chat</span>
                              <div className="bg-white/30 rounded-xl p-2 h-32 overflow-y-auto text-[10px] space-y-2 font-medium custom-scrollbar">
                                <p className="text-slate-700"><span className="text-cyan-600 font-bold">CryptoWhale</span>: lets win this round guys</p>
                                <p className="text-slate-700"><span className="text-purple-600 font-bold">WagerGod</span>: going high stake next spin</p>
                                <p className="text-slate-650 italic">User joined the channel</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* ═══════ INLINE BETTING PANEL ═══════ */}
                    {!isCloudRenting && !isRoyalEngine && (
                      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-safe md:relative md:bottom-auto md:left-auto md:right-auto md:z-30 md:shadow-inner flex flex-col">
                        {!currentUser ? (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 md:p-6 bg-slate-900 text-white">
                            <div className="flex items-center gap-3">
                              <Lock className="w-5 h-5 text-red-500 animate-pulse shrink-0" />
                              <div className="text-left">
                                <p className="text-xs font-black uppercase tracking-wider text-slate-100">Guest Observation Mode</p>
                                <p className="text-[10px] font-semibold text-slate-400 leading-tight">Create an account or login to start wagering</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                              <button 
                                onClick={() => window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: 'login' } }))}
                                className="flex-1 sm:flex-none px-4 py-2.5 font-black text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all uppercase tracking-wider text-[10px] text-center cursor-pointer"
                              >
                                Sign In
                              </button>
                              <button 
                                onClick={() => window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: 'signup' } }))}
                                className="flex-1 sm:flex-none px-4 py-2.5 font-black text-white bg-red-650 hover:bg-red-700 rounded-xl transition-all uppercase tracking-wider text-[10px] text-center border border-red-500/25 cursor-pointer"
                              >
                                Register
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                        {/* Row 1: Bet input + BET button */}
                        <div className="flex items-stretch gap-2 px-3 pt-3 pb-2 md:px-5">
                          {/* Bet Amount */}
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shrink-0 h-12 focus-within:border-slate-300 transition-all">
                            <div className="px-3 border-r border-slate-200 h-full flex items-center">
                              <span className="text-slate-650 font-black text-lg leading-none">₹</span>
                            </div>
                            <input
                              type="number"
                              value={betAmount}
                              onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                              disabled={isSpinning}
                              className="w-20 sm:w-24 bg-transparent text-slate-900 font-black text-lg px-2.5 h-full focus:outline-none disabled:opacity-50 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <div className="flex flex-col h-full border-l border-slate-200">
                              <button onClick={() => { setBetAmount(prev => Math.max(1, Math.floor(prev / 2))); playGameSound('click'); }} disabled={isSpinning}
                                className="flex-1 px-2.5 text-[11px] font-black text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-b border-slate-200 transition-colors disabled:opacity-30">½</button>
                              <button onClick={() => { setBetAmount(prev => prev * 2); playGameSound('click'); }} disabled={isSpinning}
                                className="flex-1 px-2.5 text-[11px] font-black text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-30">2×</button>
                            </div>
                          </div>

                          {/* Auto Cashout — crash + desktop */}
                          {game.categories.includes("crash") && (
                            <div className="hidden sm:flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-12 shrink-0 focus-within:border-emerald-600/50 transition-colors">
                              <div className="px-2.5 h-full flex flex-col justify-center border-r border-white/10">
                                <span className="text-[8px] font-black text-slate-650 uppercase leading-none">Auto</span>
                                <span className="text-[8px] font-bold text-slate-600 leading-none mt-0.5">cashout</span>
                              </div>
                              <input type="number" step="0.01" min="1.01" placeholder="2.00" value={autoCashoutVal}
                                onChange={(e) => setAutoCashoutVal(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                disabled={isSpinning}
                                className="w-14 bg-transparent text-slate-900 font-black text-sm px-2 h-full focus:outline-none text-center disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
                              <span className="pr-2 text-slate-600 font-black">×</span>
                            </div>
                          )}

                          {/* Target selector — desktop */}
                          {(() => {
                            const tl = game.title.toLowerCase(), il = game.id.toLowerCase();
                            let opts: {id:string;name:string}[] = [];
                            if (tl.includes("coin")||il.includes("coin")) opts=[{id:"AURA",name:"Aura"},{id:"SKULL",name:"Skull"}];
                            else if (tl.includes("andar")) opts=[{id:"andar",name:"Andar"},{id:"bahar",name:"Bahar"}];
                            else if (tl.includes("dragon")) opts=[{id:"dragon",name:"Dragon"},{id:"tiger",name:"Tiger"},{id:"tie",name:"Tie"}];
                            else if (tl.includes("teen patti")||il.includes("patti")) opts=[{id:"player_a",name:"A"},{id:"player_b",name:"B"},{id:"tie",name:"Tie"}];
                            else if (tl.includes("roulette")) opts=[{id:"red",name:"Red"},{id:"black",name:"Black"},{id:"zero",name:"0"}];
                            else if (tl.includes("baccarat")) opts=[{id:"PLAYER",name:"Player"},{id:"BANKER",name:"Banker"},{id:"TIE",name:"Tie"}];
                            else if (tl.includes("dice")) opts=[{id:"over",name:"Over"},{id:"under",name:"Under"}];
                            if (!opts.length) return null;
                            return (
                              <div className="hidden sm:flex items-center gap-1 shrink-0">
                                {opts.map(o => (
                                  <button key={o.id} type="button" onClick={() => { setSelectedTarget(o.id); playGameSound('click'); }} disabled={isSpinning}
                                    className={`h-12 px-3 rounded-xl font-black text-xs uppercase tracking-wider border transition-all disabled:opacity-40 ${selectedTarget===o.id ? `bg-gradient-to-br ${theme.buttonGradient} text-white border-transparent shadow-lg` : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>
                                    {o.name}
                                  </button>
                                ))}
                              </div>
                            );
                          })()}

                          <div className="flex-1"/>

                          {/* BET / CASHOUT */}
                          <button
                            onClick={isSpinning && isCashoutGame ? handleSidebarCashout : handlePlay}
                            disabled={isSpinning && !isCashoutActive}
                            className={`h-12 px-5 sm:px-8 rounded-xl font-black text-sm uppercase tracking-widest transition-all shrink-0 whitespace-nowrap ${
                              isSpinning && isCashoutActive
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-black shadow-[0_0_25px_rgba(16,185,129,0.5)] animate-pulse cursor-pointer'
                                : isSpinning
                                  ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/10'
                                  : `bg-gradient-to-br ${theme.buttonGradient} text-white shadow-sm hover:scale-[1.02] active:scale-[0.97] cursor-pointer border border-white/10`
                            }`}>
                            {isSpinning && isCashoutActive
                              ? `💰 ₹${(betAmount * (liveMultiplier || 1.0)).toFixed(2)}`
                              : isSpinning ? '⏳ Playing...'
                              : game.title.toLowerCase().includes('slot') ? '🎰 SPIN' : '🚀 BET'}
                          </button>
                        </div>

                        {/* Row 2: Chips + mobile extras + balance */}
                        <div className="flex flex-wrap items-center gap-1.5 px-3 pb-6 md:px-5 md:pb-6">
                          {[
                            {amount:100, label:"₹100", color:"from-red-600 to-red-700"},
                            {amount:500, label:"₹500", color:"from-teal-600 to-teal-700"},
                            {amount:1000, label:"1k", color:"from-amber-500 to-amber-600"},
                            {amount:5000, label:"5k", color:"from-pink-500 to-pink-600"},
                            {amount:10000, label:"10k", color:"from-rose-600 to-rose-700"},
                            {amount:50000, label:"50k", color:"from-violet-700 to-violet-100"},
                          ].map(chip => (
                            <button key={chip.amount} type="button" onClick={() => { setBetAmount(chip.amount); playGameSound('click'); }} disabled={isSpinning}
                              className={`h-8 px-2.5 sm:px-3 rounded-lg shrink-0 text-[10px] transition-all border bg-gradient-to-br ${chip.color} ${chip.amount === 1000 ? 'text-slate-950 font-black' : 'text-white font-black'} ${
                                betAmount === chip.amount ? 'ring-2 ring-white/60 ring-offset-1 ring-offset-white scale-105 opacity-100 border-white/30' : 'opacity-55 hover:opacity-85 border-white/15'
                              } disabled:opacity-20`}>
                              {chip.label}
                            </button>
                          ))}

                          {/* Mobile: target selector */}
                          {(() => {
                            const tl = game.title.toLowerCase(), il = game.id.toLowerCase();
                            let opts: {id:string;name:string}[] = [];
                            if (tl.includes("coin")||il.includes("coin")) opts=[{id:"AURA",name:"Aura"},{id:"SKULL",name:"Skull"}];
                            else if (tl.includes("andar")) opts=[{id:"andar",name:"Andar"},{id:"bahar",name:"Bahar"}];
                            else if (tl.includes("dragon")) opts=[{id:"dragon",name:"Dragon"},{id:"tiger",name:"Tiger"},{id:"tie",name:"Tie"}];
                            else if (tl.includes("teen patti")||il.includes("patti")) opts=[{id:"player_a",name:"A"},{id:"player_b",name:"B"},{id:"tie",name:"Tie"}];
                            else if (tl.includes("roulette")) opts=[{id:"red",name:"Red"},{id:"black",name:"Black"},{id:"zero",name:"0"}];
                            else if (tl.includes("baccarat")) opts=[{id:"PLAYER",name:"Player"},{id:"BANKER",name:"Banker"},{id:"TIE",name:"Tie"}];
                            else if (tl.includes("dice")) opts=[{id:"over",name:"Over"},{id:"under",name:"Under"}];
                            if (!opts.length) return null;
                            return (
                              <div className="flex sm:hidden items-center gap-1 ml-1 shrink-0">
                                {opts.map(o => (
                                  <button key={o.id} type="button" onClick={() => { setSelectedTarget(o.id); playGameSound('click'); }} disabled={isSpinning}
                                    className={`h-8 px-2.5 rounded-lg font-black text-[9px] uppercase border transition-all disabled:opacity-40 ${selectedTarget===o.id ? `bg-gradient-to-br ${theme.buttonGradient} text-white border-transparent` : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>
                                    {o.name}
                                  </button>
                                ))}
                              </div>
                            );
                          })()}

                          {/* Mobile: auto cashout (crash) */}
                          {game.categories.includes("crash") && (
                            <div className="flex sm:hidden items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden h-8 shrink-0 ml-1">
                              <span className="px-2 text-[8px] font-black text-slate-650 border-r border-slate-200 h-full flex items-center whitespace-nowrap">Auto×</span>
                              <input type="number" step="0.01" min="1.01" placeholder="2.0" value={autoCashoutVal}
                                onChange={(e) => setAutoCashoutVal(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                disabled={isSpinning}
                                className="w-12 bg-transparent text-slate-900 font-black text-[10px] px-1.5 focus:outline-none text-center disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
                            </div>
                          )}

                          <div className="flex-1 min-w-2"/>
                          <span className="text-[9px] font-bold text-slate-650 whitespace-nowrap shrink-0">
                            Bal: <span className="text-slate-700 font-mono font-black">₹{balance.toLocaleString()}</span>
                            {stats.totalRounds > 0 && <span className={`ml-2 font-black ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{stats.netProfit >= 0 ? '+' : ''}₹{stats.netProfit.toFixed(0)}</span>}
                          </span>
                        </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Detailed Leaderboard & Scoreboards — Premium Mobile-First GPU-Accelerated */}
          {!isRoyalEngine && (() => {
            const isCrash = game.categories.includes("crash") || game.title.toLowerCase().includes("aviator") || game.id.includes("crash") || game.id === "aviator";
            const rankBadge = (idx: number) => {
              if (idx === 0) return { bg: "from-amber-400 to-yellow-600", text: "text-amber-50", glow: "shadow-[0_0_20px_rgba(251,191,36,0.5)]", label: "#1" };
              if (idx === 1) return { bg: "from-slate-300 to-slate-400", text: "text-slate-800", glow: "shadow-[0_0_14px_rgba(148,163,184,0.4)]", label: "#2" };
              if (idx === 2) return { bg: "from-amber-600 to-orange-700", text: "text-amber-100", glow: "shadow-[0_0_14px_rgba(217,119,6,0.4)]", label: "#3" };
              return { bg: "from-slate-700 to-slate-800", text: "text-slate-300", glow: "", label: `#${idx + 1}` };
            };
            return (
              <div className="w-full mt-6 flex flex-col gap-3">
                {/* Collapsible Header Button for Mobile */}
                <button
                  type="button"
                  onClick={() => setIsLeaderboardExpanded(!isLeaderboardExpanded)}
                  className="flex sm:hidden items-center justify-between w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-700 font-black text-xs uppercase tracking-widest shadow-lg cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                    {isCrash ? "🏆 Show Leaderboard & Crash Stats" : "🏆 Show Leaderboard & Activity Logs"}
                  </span>
                  <span>{isLeaderboardExpanded ? "▲" : "▼"}</span>
                </button>

                <div 
                  className={cn(
                    "bg-white border border-slate-200/80 rounded-[28px] p-4 sm:p-6 w-full relative overflow-hidden transition-all duration-300",
                    isLeaderboardExpanded ? "block" : "hidden sm:block"
                  )}
                  style={{ 
                    willChange: 'transform', 
                    transform: 'translateZ(0)', 
                    contentVisibility: 'auto',
                    containIntrinsicSize: '0 500px',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)'
                  } as React.CSSProperties}
                >
                {/* Multi-layer SVGator background with GPU compositing */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.06]" style={{ willChange: 'transform', transform: 'translateZ(0)' }}>
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="sb-grad-rose" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#e11d48" stopOpacity="0" />
                        <stop offset="50%" stopColor="#e11d48" stopOpacity="1" />
                        <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="sb-grad-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
                        <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="sb-grad-violet" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
                        <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M -100,80 C 120,30 280,130 420,60 S 700,100 900,50 T 1200,90" fill="none" stroke="url(#sb-grad-rose)" strokeWidth="2.5" className="sb-animate-draw" style={{ strokeDasharray: 1200, strokeDashoffset: 1200 }} />
                    <path d="M -60,140 C 180,60 320,200 480,100 S 750,160 950,80 T 1300,130" fill="none" stroke="url(#sb-grad-emerald)" strokeWidth="2" className="sb-animate-draw" style={{ strokeDasharray: 1000, strokeDashoffset: 1000, animationDelay: '-7s' }} />
                    <path d="M -30,50 C 200,120 350,20 500,90 S 800,30 1000,100 T 1400,60" fill="none" stroke="url(#sb-grad-violet)" strokeWidth="1.5" className="sb-animate-draw" style={{ strokeDasharray: 900, strokeDashoffset: 900, animationDelay: '-13s' }} />
                  </svg>
                </div>

                {/* Ambient glow */}
                <div className="absolute top-0 left-1/4 w-1/2 h-32 bg-gradient-to-b from-rose-500/[0.04] to-transparent rounded-full blur-3xl pointer-events-none z-0" />
                <div className="absolute bottom-0 right-1/4 w-1/3 h-24 bg-gradient-to-t from-emerald-500/[0.03] to-transparent rounded-full blur-3xl pointer-events-none z-0" />

                {/* Keyframes — GPU-optimized with transform-only animations */}
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes sbDrawPath {
                    0% { stroke-dashoffset: 1200; }
                    50% { stroke-dashoffset: 0; }
                    100% { stroke-dashoffset: -1200; }
                  }
                  @keyframes sbHeartbeat {
                    0%, 100% { transform: scale(1) translateZ(0); filter: drop-shadow(0 0 4px rgba(225,29,72,0.4)); }
                    50% { transform: scale(1.1) translateZ(0); filter: drop-shadow(0 0 14px rgba(225,29,72,0.7)); }
                  }
                  @keyframes sbSpinSlow {
                    from { transform: rotate(0deg) translateZ(0); }
                    to { transform: rotate(360deg) translateZ(0); }
                  }
                  @keyframes sbShimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                  }
                  @keyframes sbPulseGlow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(225,29,72,0.3); }
                    50% { box-shadow: 0 0 0 6px rgba(225,29,72,0); }
                  }
                  @keyframes sbFadeSlideUp {
                    from { opacity: 0; transform: translateY(16px) translateZ(0); }
                    to { opacity: 1; transform: translateY(0) translateZ(0); }
                  }
                  @keyframes sbSwipeHint {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(4px); }
                  }
                  .sb-animate-draw { animation: sbDrawPath 22s linear infinite; will-change: stroke-dashoffset; }
                  .sb-animate-heartbeat { animation: sbHeartbeat 2s ease-in-out infinite; will-change: transform, filter; }
                  .sb-animate-spin-slow { animation: sbSpinSlow 12s linear infinite; will-change: transform; }
                  .sb-shimmer-bar {
                    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 60%, transparent 100%);
                    background-size: 200% 100%;
                    animation: sbShimmer 3s ease-in-out infinite;
                  }
                  .sb-row-enter { animation: sbFadeSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards; will-change: transform, opacity; }
                  .sb-swipe-hint { animation: sbSwipeHint 2s ease-in-out infinite; }
                  @media (prefers-reduced-motion: reduce) {
                    .sb-animate-draw, .sb-animate-heartbeat, .sb-animate-spin-slow, .sb-shimmer-bar, .sb-row-enter, .sb-swipe-hint { animation: none !important; }
                  }
                  .sb-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                  .sb-scrollbar::-webkit-scrollbar-track { background: transparent; }
                  .sb-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
                  .sb-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
                `}} />

                {/* Header — responsive layout */}
                <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center justify-between border-b border-slate-800/50 pb-4 mb-4 sm:mb-6 relative z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    {scoreboardTab === "top-one-percent" ? (
                      <div className="relative flex items-center justify-center shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-rose-500/15 to-rose-100/10 border border-rose-500/25 text-[#e11d48] sb-animate-heartbeat">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C12 2 17 6.5 17 10.5C17 14.5 14 18 12 22C10 18 7 14.5 7 10.5C7 6.5 12 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(225, 29, 72, 0.15)" />
                          <path d="M12 9C12 9 14.5 11.5 14.5 13.5C14.5 15.5 13 17 12 19C11 17 9.5 15.5 9.5 13.5C9.5 11.5 12 9 12 9Z" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {/* Pulse ring */}
                        <div className="absolute inset-0 rounded-2xl border border-rose-500/20 animate-ping opacity-30" style={{ animationDuration: '3s' }} />
                      </div>
                    ) : (
                      <div className="relative flex items-center justify-center shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-100/10 border border-emerald-500/25 text-emerald-400">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" className="sb-animate-spin-slow" />
                          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="2" fill="currentColor" className="animate-ping" style={{ animationDuration: '2s' }} />
                        </svg>
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-black text-slate-900 truncate flex items-center gap-2">
                        {scoreboardTab === "top-one-percent" 
                          ? (isCrash ? "Crash High Reaches" : "Highest Multipliers") 
                          : scoreboardTab === "recent-runs" 
                            ? "Session Live Activities" 
                            : "Platform Live Hub Feed"}
                        {(scoreboardTab === "recent-runs" || scoreboardTab === "platform-feed") && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>
                            Live
                          </span>
                        )}
                      </h2>
                      <p className="text-[9px] sm:text-[10px] text-slate-650 font-bold uppercase tracking-wider mt-0.5 truncate">
                        {scoreboardTab === "top-one-percent" 
                          ? "Top payouts & outlier multipliers" 
                          : scoreboardTab === "recent-runs" 
                            ? "Your recent session wagers and rounds" 
                            : "Real-time wagers and game activity platform-wide"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Tab Switcher — touch-optimized with swipe hint */}
                  <div className="flex bg-slate-100 border border-slate-200 p-1 sm:p-1.5 rounded-2xl shrink-0 self-stretch sm:self-auto relative z-10 overflow-x-auto scrollbar-none flex-nowrap max-w-full">
                    <button 
                      onClick={() => setScoreboardTab("top-one-percent")}
                      className={cn(
                        "flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer relative min-h-[40px] sm:min-h-0 shrink-0",
                        scoreboardTab === "top-one-percent" 
                          ? "text-white" 
                          : "text-slate-650 hover:text-slate-800"
                      )}
                    >
                      {scoreboardTab === "top-one-percent" && (
                        <motion.div 
                          layoutId="activeScoreboardTab"
                          className="absolute inset-0 bg-gradient-to-r from-[#e11d48] to-[#be123c] rounded-xl -z-10"
                          style={{ boxShadow: '0 4px 12px rgba(225,29,72,0.25)' }}
                          transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        />
                      )}
                      {isCrash ? (
                        <>
                          <span className="hidden sm:inline">🏆 Top 1% Reach</span>
                          <span className="sm:hidden">🏆 Top 1%</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">🏆 Top Multipliers</span>
                          <span className="sm:hidden">🏆 Top Mults</span>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => setScoreboardTab("recent-runs")}
                      className={cn(
                        "flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer relative min-h-[40px] sm:min-h-0 shrink-0",
                        scoreboardTab === "recent-runs" 
                          ? "text-white" 
                          : "text-slate-650 hover:text-slate-800"
                      )}
                    >
                      {scoreboardTab === "recent-runs" && (
                        <motion.div 
                          layoutId="activeScoreboardTab"
                          className="absolute inset-0 bg-gradient-to-r from-[#e11d48] to-[#be123c] rounded-xl -z-10"
                          style={{ boxShadow: '0 4px 12px rgba(225,29,72,0.25)' }}
                          transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        />
                      )}
                      <span className="hidden sm:inline">⚡ Live Activities</span>
                      <span className="sm:hidden">⚡ Live</span>
                    </button>
                    <button 
                      onClick={() => setScoreboardTab("platform-feed")}
                      className={cn(
                        "flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer relative min-h-[40px] sm:min-h-0 shrink-0",
                        scoreboardTab === "platform-feed" 
                          ? "text-white" 
                          : "text-slate-650 hover:text-slate-800"
                      )}
                    >
                      {scoreboardTab === "platform-feed" && (
                        <motion.div 
                          layoutId="activeScoreboardTab"
                          className="absolute inset-0 bg-gradient-to-r from-[#e11d48] to-[#be123c] rounded-xl -z-10"
                          style={{ boxShadow: '0 4px 12px rgba(225,29,72,0.25)' }}
                          transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        />
                      )}
                      <span className="hidden sm:inline">🔥 Live Hub Feed</span>
                      <span className="sm:hidden">🔥 Hub Feed</span>
                    </button>
                  </div>
                </div>

                {/* Shimmer divider */}
                <div className="w-full h-px sb-shimmer-bar rounded-full mb-4 sm:mb-5" />

                <div className="relative z-10">
                  {scoreboardTab === "top-one-percent" && (
<>
                      {/* Desktop Table — hidden on mobile */}
                      <div className="hidden sm:block overflow-x-auto sb-scrollbar">
                        <table className="w-full text-left text-xs font-bold border-collapse" style={{ transform: 'translateZ(0)' }}>
                          <thead>
                            <tr className="text-slate-650 border-b border-slate-200 uppercase tracking-widest text-[9px]">
                              <th className="pb-3 pr-2 w-8 text-center">#</th>
                              <th className="pb-3 pr-4">User</th>
                              <th className="pb-3 pr-4 text-right">Bet Size</th>
                              <th className="pb-3 pr-4 text-center">{isCrash ? "Cashout ×" : "Win ×"}</th>
                              <th className="pb-3 pr-4 text-center">{isCrash ? "Max Crash" : "Game ×"}</th>
                              <th className="pb-3 pr-4 text-center">Time</th>
                              <th className="pb-3 text-right">Total Payout</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                            {highReaches.map((row, idx) => {
                              const badge = rankBadge(idx);
                              return (
                                <motion.tr 
                                  key={row.id} 
                                  initial={{ opacity: 0, x: -16 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.35, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                                  className={cn(
                                    "hover:bg-slate-50 transition-colors group", 
                                    row.user === "You" && "bg-gradient-to-r from-rose-50 to-transparent border-l-2 border-rose-500",
                                    idx < 3 && "relative"
                                  )}
                                >
                                  <td className="py-3.5 text-center">
                                    <span className={cn(
                                      "inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black bg-gradient-to-br",
                                      badge.bg, badge.text, badge.glow
                                    )}>
                                      {badge.label}
                                    </span>
                                  </td>
                                  <td className="py-3.5 pr-4">
                                    <div className="flex items-center gap-2.5">
                                      <div className="shrink-0 flex items-center justify-center">
                                        <svg className={cn("w-4.5 h-4.5", idx < 3 ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" : "text-slate-600")} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                          <path d="M2 19.5H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                          <path d="M3 19.5L5 8.5L9.5 13.5L12 5L14.5 13.5L19 8.5L21 19.5H3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={idx < 3 ? "rgba(251,191,36,0.15)" : "rgba(100,116,139,0.1)"} />
                                        </svg>
                                      </div>
                                      <span className={cn(
                                        "font-bold text-xs",
                                        row.user === "You" ? "text-rose-600 font-extrabold" : "text-slate-700"
                                      )}>
                                        {row.user}
                                        {row.user === "You" && <span className="ml-1.5 text-[8px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-full uppercase tracking-widest border border-rose-200">You</span>}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3.5 pr-4 text-right font-mono text-slate-600 text-[11px]">₹{row.bet.toLocaleString()}</td>
                                  <td className="py-3.5 pr-4 text-center font-mono">
                                    {row.cashout > 0 ? (
                                      <span className="inline-flex items-center text-emerald-600 bg-emerald-50 border border-emerald-200/40 px-2.5 py-1 rounded-lg font-mono font-bold text-[11px]" style={{ boxShadow: '0 0 12px rgba(16,185,129,0.08)' }}>{row.cashout.toFixed(2)}×</span>
                                    ) : (
                                      <span className="text-rose-650 bg-rose-50 border border-rose-200/40 px-2.5 py-1 rounded-lg font-mono font-bold text-[11px]">0.00×</span>
                                    )}
                                  </td>
                                  <td className="py-3.5 pr-4 text-center font-mono font-black text-amber-400">
                                    <span className="bg-amber-50 border border-amber-200/40 px-2.5 py-1 rounded-lg text-[11px]" style={{ boxShadow: '0 0 12px rgba(245,158,11,0.08)' }}>{row.crashPoint.toFixed(2)}×</span>
                                  </td>
                                  <td className="py-3.5 pr-4 text-center text-[10px] text-slate-650 font-mono">{row.time}</td>
                                  <td className="py-3.5 text-right font-mono font-black text-[11px]">
                                    <span className={cn(row.payout > 0 ? "text-emerald-600" : "text-slate-650")}>
                                      {row.payout > 0 ? `+₹${row.payout.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "₹0"}
                                    </span>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card Layout — visible only on small screens */}
                      <div className="sm:hidden space-y-2.5">
                        {highReaches.slice(0, isMobileLeaderboardLimitExpanded ? undefined : 5).map((row, idx) => {
                          const badge = rankBadge(idx);
                          return (
                            <motion.div 
                              key={row.id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                              className={cn(
                                "relative rounded-2xl p-3.5 border transition-colors",
                                row.user === "You"
                                  ? "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200"
                                  : idx < 3 
                                    ? "bg-gradient-to-br from-amber-50/50 via-slate-50 to-slate-100/30 border-slate-200"
                                    : "bg-slate-50 border-slate-200/80"
                              )}
                              style={{ willChange: 'transform', transform: 'translateZ(0)' }}
                            >
                              {/* Top row: rank + user + time */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className={cn(
                                    "inline-flex items-center justify-center w-7 h-7 rounded-xl text-[10px] font-black bg-gradient-to-br shrink-0",
                                    badge.bg, badge.text, badge.glow
                                  )}>
                                    {badge.label}
                                  </span>
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {idx < 3 && (
                                      <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 19.5L5 8.5L9.5 13.5L12 5L14.5 13.5L19 8.5L21 19.5H3Z" stroke="currentColor" strokeWidth="1.5" fill="rgba(251,191,36,0.15)" />
                                      </svg>
                                    )}
                                    <span className={cn(
                                      "text-xs font-bold truncate",
                                      row.user === "You" ? "text-rose-600 font-extrabold" : "text-slate-700"
                                    )}>
                                      {row.user}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[9px] text-slate-650 font-mono shrink-0">{row.time}</span>
                              </div>

                              {/* Data grid */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white/[0.02] rounded-xl px-3 py-2">
                                  <span className="text-[8px] text-slate-650 font-black uppercase tracking-widest block">Bet</span>
                                  <span className="text-xs font-bold font-mono text-slate-700 mt-0.5 block">₹{row.bet.toLocaleString()}</span>
                                </div>
                                <div className="bg-white/[0.02] rounded-xl px-3 py-2">
                                  <span className="text-[8px] text-slate-650 font-black uppercase tracking-widest block">{isCrash ? "Cashout" : "Win ×"}</span>
                                  <span className={cn(
                                    "text-xs font-black font-mono mt-0.5 block",
                                    row.cashout > 0 ? "text-emerald-400" : "text-rose-500"
                                  )}>
                                    {row.cashout > 0 ? `${row.cashout.toFixed(2)}×` : "0.00×"}
                                  </span>
                                </div>
                                <div className="bg-white/[0.02] rounded-xl px-3 py-2">
                                  <span className="text-[8px] text-slate-650 font-black uppercase tracking-widest block">{isCrash ? "Crash" : "Game ×"}</span>
                                  <span className="text-xs font-black font-mono text-amber-400 mt-0.5 block">{row.crashPoint.toFixed(2)}×</span>
                                </div>
                                <div className="bg-white/[0.02] rounded-xl px-3 py-2">
                                  <span className="text-[8px] text-slate-650 font-black uppercase tracking-widest block">Payout</span>
                                  <span className={cn(
                                    "text-xs font-black font-mono mt-0.5 block",
                                    row.payout > 0 ? "text-emerald-600" : "text-slate-650"
                                  )}>
                                    {row.payout > 0 ? `+₹${(row.payout / 1000).toFixed(1)}K` : "₹0"}
                                  </span>
                                </div>
                              </div>

                              {/* Shimmer overlay for top 3 */}
                              {idx < 3 && <div className="absolute inset-0 rounded-2xl sb-shimmer-bar pointer-events-none opacity-30" />}
                            </motion.div>
                          );
                        })}
                        {highReaches.length > 5 && (
                          <button
                            onClick={() => setIsMobileLeaderboardLimitExpanded(!isMobileLeaderboardLimitExpanded)}
                            className="w-full mt-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-700 transition-all cursor-pointer"
                          >
                            {isMobileLeaderboardLimitExpanded ? "Show Less" : `Show More (${highReaches.length - 5} more)`}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                  {scoreboardTab === "recent-runs" && (
<>
                      {/* Desktop Table for Live Activities */}
                      <div className="hidden sm:block overflow-x-auto sb-scrollbar">
                        <table className="w-full text-left text-xs font-bold border-collapse" style={{ transform: 'translateZ(0)' }}>
                          <thead>
                            <tr className="text-slate-650 border-b border-slate-200 uppercase tracking-widest text-[9px]">
                              <th className="pb-3 pr-4">Status</th>
                              <th className="pb-3 pr-4">User</th>
                              <th className="pb-3 pr-4 text-right">Wager</th>
                              <th className="pb-3 pr-4 text-center">Cashout Point</th>
                              <th className="pb-3 pr-4 text-center">{isCrash ? "Crash Point" : "Outcome"}</th>
                              <th className="pb-3 text-right">Payout</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                            {recentActivities.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-12 text-center">
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50/50 flex items-center justify-center">
                                      <Activity className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <span className="text-slate-650 text-xs font-bold">No session wagers yet. Place a bet to begin!</span>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              recentActivities.map((act, idx) => (
                                <motion.tr 
                                  key={act.id} 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.3), ease: [0.22, 1, 0.36, 1] }}
                                  className={cn(
                                    "hover:bg-slate-50 transition-colors", 
                                    act.username === "You" && "bg-gradient-to-r from-rose-50 to-transparent border-l-2 border-rose-500"
                                  )}
                                >
                                  <td className="py-3.5 pr-4">
                                    <div className={cn(
                                      "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",
                                      act.status === "cashed_out" 
                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200/40" 
                                        : "bg-rose-50 text-rose-600 border border-rose-200/40"
                                    )}>
                                      <span className="relative flex h-1.5 w-1.5">
                                        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-60", act.status === "cashed_out" ? "bg-emerald-400" : "bg-rose-400")} style={{ animationDuration: '2s' }} />
                                        <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", act.status === "cashed_out" ? "bg-emerald-400" : "bg-rose-400")} />
                                      </span>
                                      {act.status === "cashed_out" ? "Won" : "Lost"}
                                    </div>
                                  </td>
                                  <td className="py-3.5 pr-4">
                                    <span className={cn(
                                      "text-xs",
                                      act.username === "You" ? "text-rose-600 font-extrabold" : "text-slate-700 font-bold"
                                    )}>
                                      {act.username}
                                    </span>
                                  </td>
                                  <td className="py-3.5 pr-4 text-right font-mono text-slate-600 text-[11px]">₹{act.bet.toLocaleString()}</td>
                                  <td className="py-3.5 pr-4 text-center font-mono">
                                    {act.multiplier ? (
                                      <span className="text-emerald-600 bg-emerald-50 border border-emerald-200/40 px-2.5 py-1 rounded-lg font-black text-[11px]">{act.multiplier.toFixed(2)}×</span>
                                    ) : (
                                      <span className="text-rose-650 bg-rose-50 border border-rose-200/40 px-2.5 py-1 rounded-lg font-bold text-[11px]">Crashed</span>
                                    )}
                                  </td>
                                  <td className="py-3.5 pr-4 text-center font-mono text-slate-500 text-[11px]">
                                    {act.crashPoint ? `${act.crashPoint.toFixed(2)}×` : "—"}
                                  </td>
                                  <td className={cn("py-3.5 text-right font-mono font-black text-[11px]", act.payout > 0 ? "text-emerald-600" : "text-slate-650")}>
                                    {act.payout > 0 ? `+₹${act.payout.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "₹0"}
                                  </td>
                                </motion.tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card Layout for Live Activities */}
                      <div className="sm:hidden space-y-2">
                        {recentActivities.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50/50 flex items-center justify-center">
                              <Activity className="w-5 h-5 text-slate-600" />
                            </div>
                            <span className="text-slate-650 text-xs font-bold text-center">No session wagers yet.<br />Place a bet to begin!</span>
                          </div>
                        ) : (
                          recentActivities.slice(0, isMobileLeaderboardLimitExpanded ? undefined : 5).map((act, idx) => (
                            <motion.div
                              key={act.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.2), ease: [0.22, 1, 0.36, 1] }}
                              className={cn(
                                "relative rounded-2xl p-3 border transition-colors",
                                act.username === "You"
                                  ? "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200"
                                  : "bg-slate-50 border-slate-200/80"
                              )}
                              style={{ willChange: 'transform', transform: 'translateZ(0)' }}
                            >
                              {/* Header: status + user + time */}
                              <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0",
                                    act.status === "cashed_out"
                                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200/40"
                                      : "bg-rose-50 text-rose-600 border border-rose-200/40"
                                  )}>
                                    <span className={cn("w-1.5 h-1.5 rounded-full", act.status === "cashed_out" ? "bg-emerald-400" : "bg-rose-400")} />
                                    {act.status === "cashed_out" ? "Won" : "Lost"}
                                  </div>
                                  <span className={cn(
                                    "text-xs truncate",
                                    act.username === "You" ? "text-rose-600 font-extrabold" : "text-slate-700 font-bold"
                                  )}>
                                    {act.username}
                                  </span>
                                </div>
                                <span className="text-[9px] text-slate-650 font-mono shrink-0">{act.time}</span>
                              </div>

                              {/* Data row */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <span className="text-[8px] text-slate-650 font-black uppercase tracking-widest block">Wager</span>
                                    <span className="text-[11px] font-bold font-mono text-slate-700">₹{act.bet.toLocaleString()}</span>
                                  </div>
                                  <div className="w-px h-6 bg-slate-50/50" />
                                  <div>
                                    <span className="text-[8px] text-slate-650 font-black uppercase tracking-widest block">Cashout</span>
                                    <span className={cn("text-[11px] font-black font-mono", act.multiplier ? "text-emerald-600" : "text-rose-600")}>
                                      {act.multiplier ? `${act.multiplier.toFixed(2)}×` : "—"}
                                    </span>
                                  </div>
                                  {act.crashPoint > 0 && (
                                    <>
                                      <div className="w-px h-6 bg-slate-50/50" />
                                      <div>
                                        <span className="text-[8px] text-slate-650 font-black uppercase tracking-widest block">Crash</span>
                                        <span className="text-[11px] font-bold font-mono text-slate-650">{act.crashPoint.toFixed(2)}×</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[8px] text-slate-650 font-black uppercase tracking-widest block">Payout</span>
                                  <span className={cn("text-xs font-black font-mono", act.payout > 0 ? "text-emerald-600" : "text-slate-650")}>
                                    {act.payout > 0 ? `+₹${act.payout.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "₹0"}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                        {recentActivities.length > 5 && (
                          <button
                            onClick={() => setIsMobileLeaderboardLimitExpanded(!isMobileLeaderboardLimitExpanded)}
                            className="w-full mt-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-700 transition-all cursor-pointer"
                          >
                            {isMobileLeaderboardLimitExpanded ? "Show Less" : `Show More (${recentActivities.length - 5} more)`}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                  {scoreboardTab === "platform-feed" && (
                    <>
                      {/* Desktop Table for Platform Live Feed */}
                      <div className="hidden sm:block overflow-x-auto sb-scrollbar">
                        <table className="w-full text-left text-xs font-bold border-collapse" style={{ transform: 'translateZ(0)' }}>
                          <thead>
                            <tr className="text-slate-650 border-b border-slate-200 uppercase tracking-widest text-[9px]">
                              <th className="pb-3 pr-4">Game</th>
                              <th className="pb-3 pr-4">User</th>
                              <th className="pb-3 pr-4 text-center">Type</th>
                              <th className="pb-3 pr-4 text-right">Wager/Cost</th>
                              <th className="pb-3 pr-4 text-center">Mult/Rate</th>
                              <th className="pb-3 text-right">Total Payout</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                            {platformBets.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-12 text-center">
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                      <Activity className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <span className="text-slate-650 text-xs font-bold">No platform live wagers yet.</span>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              platformBets.map((act, idx) => (
                                <motion.tr 
                                  key={`${act.user}-${act.bet}-${idx}`} 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.3), ease: [0.22, 1, 0.36, 1] }}
                                  className={cn(
                                    "hover:bg-slate-50 transition-colors", 
                                    act.user === "You" && "bg-gradient-to-r from-rose-50 to-transparent border-l-2 border-rose-500"
                                  )}
                                >
                                  <td className="py-3.5 pr-4 text-purple-600 font-bold">🎮 {act.game}</td>
                                  <td className="py-3.5 pr-4">
                                    <span className={cn(
                                      "text-xs",
                                      act.user === "You" ? "text-rose-600 font-extrabold" : "text-slate-700 font-bold"
                                    )}>
                                      {act.user}
                                    </span>
                                  </td>
                                  <td className="py-3.5 pr-4 text-center">
                                    <span className={cn(
                                      "inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider",
                                      act.type === "rental" 
                                        ? "bg-amber-50 text-amber-700 border border-amber-200/40" 
                                        : "bg-emerald-50 text-emerald-600 border border-emerald-200/40"
                                    )}>
                                      {act.type === "rental" ? "Rent" : "Bet"}
                                    </span>
                                  </td>
                                  <td className="py-3.5 pr-4 text-right font-mono text-slate-600 text-[11px]">{act.bet}</td>
                                  <td className="py-3.5 pr-4 text-center font-mono text-slate-700 text-[11px]">{act.mult}</td>
                                  <td className={cn("py-3.5 text-right font-mono font-black text-[11px]", act.win !== "₹0" ? "text-emerald-600" : "text-slate-650")}>
                                    {act.win}
                                  </td>
                                </motion.tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card Layout for Platform Live Feed */}
                      <div className="sm:hidden space-y-2">
                        {platformBets.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                              <Activity className="w-5 h-5 text-slate-600" />
                            </div>
                            <span className="text-slate-650 text-xs font-bold text-center">No platform live wagers yet.</span>
                          </div>
                        ) : (
                          platformBets.slice(0, isMobileLeaderboardLimitExpanded ? undefined : 5).map((act, idx) => (
                            <motion.div
                              key={`${act.user}-${act.bet}-${idx}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.2), ease: [0.22, 1, 0.36, 1] }}
                              className={cn(
                                "relative rounded-2xl p-3 border transition-colors",
                                act.user === "You"
                                  ? "bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200"
                                  : "bg-slate-50 border-slate-200/80"
                              )}
                              style={{ willChange: 'transform', transform: 'translateZ(0)' }}
                            >
                              {/* Header: game + user */}
                              <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[10px] text-purple-600 font-black uppercase truncate">🎮 {act.game}</span>
                                  <span className={cn(
                                    "text-xs truncate",
                                    act.user === "You" ? "text-rose-600 font-extrabold" : "text-slate-700 font-bold"
                                  )}>
                                    {act.user}
                                  </span>
                                </div>
                                <span className={cn(
                                  "inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0",
                                  act.type === "rental"
                                    ? "bg-amber-50 text-amber-700 border border-amber-250/20"
                                    : "bg-emerald-50 text-emerald-600 border border-emerald-250/20"
                                )}>
                                  {act.type === "rental" ? "Rent" : "Bet"}
                                </span>
                              </div>

                              {/* Data row */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <span className="text-[8px] text-slate-650 font-black uppercase tracking-widest block">{act.type === "rental" ? "Cost" : "Wager"}</span>
                                    <span className="text-[11px] font-bold font-mono text-slate-700">{act.bet}</span>
                                  </div>
                                  <div className="w-px h-6 bg-slate-200" />
                                  <div>
                                    <span className="text-[8px] text-slate-650 font-black uppercase tracking-widest block">{act.type === "rental" ? "Rate" : "Mult"}</span>
                                    <span className="text-[11px] font-bold font-mono text-slate-700">{act.mult}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[8px] text-slate-650 font-black uppercase tracking-widest block">Payout</span>
                                  <span className={cn("text-xs font-black font-mono", act.win !== "₹0" ? "text-emerald-600" : "text-slate-650")}>
                                    {act.win}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                        {platformBets.length > 5 && (
                          <button
                            onClick={() => setIsMobileLeaderboardLimitExpanded(!isMobileLeaderboardLimitExpanded)}
                            className="w-full mt-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-700 transition-all cursor-pointer"
                          >
                            {isMobileLeaderboardLimitExpanded ? "Show Less" : `Show More (${platformBets.length - 5} more)`}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Bottom stats bar */}
                <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-800/40 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2 text-[9px] text-slate-650 font-bold uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5 text-slate-600" />
                    <span>Provably Fair · Verified</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-slate-650 font-mono font-bold">
                      {scoreboardTab === "top-one-percent" ? `${highReaches.length} Records` : scoreboardTab === "recent-runs" ? `${recentActivities.length} Wagers` : `${platformBets.length} Live Bets`}
                    </span>
                    <div className="w-1 h-1 bg-slate-100 rounded-full" />
                    <span className="text-[9px] text-slate-650 font-mono font-bold">24h Window</span>
                  </div>
                </div>
                </div>
              </div>
            );
          })()}
        </div> {/* End Main Content Col */}
        

        
      </div> {/* End Flex Row */}
    </div>
  );
}
