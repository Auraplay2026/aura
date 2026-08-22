"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, MessageSquare, Radio } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { calculateGameOutcome } from "@/lib/fair-casino-math";
import { playGameSound } from "@/lib/audio";
import { cn } from "@/lib/utils";

export interface LiveDealerStudioEngineProps {
  onBetPlaced?: (amount: number) => void;
}

interface BetSpot {
  id: string;
  label: string;
  multiplier: number;
  color: string;
  bgGradient: string;
  borderColor: string;
  chipColor: string;
  probability: number;
}

const BET_SPOTS: BetSpot[] = [
  { id: "1x", label: "1x", multiplier: 1, color: "text-blue-700", bgGradient: "from-blue-50 to-blue-100", borderColor: "border-blue-200", chipColor: "bg-blue-600 text-white", probability: 0.40 },
  { id: "2x", label: "2x", multiplier: 2, color: "text-emerald-700", bgGradient: "from-emerald-50 to-emerald-100", borderColor: "border-emerald-200", chipColor: "bg-emerald-600 text-white", probability: 0.25 },
  { id: "5x", label: "5x", multiplier: 5, color: "text-purple-700", bgGradient: "from-purple-50 to-purple-100", borderColor: "border-purple-200", chipColor: "bg-purple-600 text-white", probability: 0.15 },
  { id: "10x", label: "10x", multiplier: 10, color: "text-amber-700", bgGradient: "from-amber-50 to-amber-100", borderColor: "border-amber-200", chipColor: "bg-amber-600 text-white", probability: 0.10 },
  { id: "20x", label: "20x", multiplier: 20, color: "text-rose-700", bgGradient: "from-rose-50 to-rose-100", borderColor: "border-rose-200", chipColor: "bg-rose-600 text-white", probability: 0.06 },
  { id: "40x", label: "40x MEGA", multiplier: 40, color: "text-red-700 font-black", bgGradient: "from-yellow-50 via-amber-50 to-red-50", borderColor: "border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]", chipColor: "bg-amber-500 text-white font-black", probability: 0.04 }
];

const WHEEL_SEGMENTS = [
  { val: "1x", mult: 1, color: "#2563EB", text: "#FFFFFF" },
  { val: "2x", mult: 2, color: "#059669", text: "#FFFFFF" },
  { val: "1x", mult: 1, color: "#2563EB", text: "#FFFFFF" },
  { val: "5x", mult: 5, color: "#7C3AED", text: "#FFFFFF" },
  { val: "1x", mult: 1, color: "#2563EB", text: "#FFFFFF" },
  { val: "2x", mult: 2, color: "#059669", text: "#FFFFFF" },
  { val: "10x", mult: 10, color: "#D97706", text: "#FFFFFF" },
  { val: "1x", mult: 1, color: "#2563EB", text: "#FFFFFF" },
  { val: "2x", mult: 2, color: "#059669", text: "#FFFFFF" },
  { val: "20x", mult: 20, color: "#E11D48", text: "#FFFFFF" },
  { val: "1x", mult: 1, color: "#2563EB", text: "#FFFFFF" },
  { val: "5x", mult: 5, color: "#7C3AED", text: "#FFFFFF" },
  { val: "2x", mult: 2, color: "#059669", text: "#FFFFFF" },
  { val: "40x", mult: 40, color: "#F59E0B", text: "#000000" }
];

const CHIP_VALUES = [10, 50, 100, 500, 1000, 5000];

const SIMULATED_PLAYERS = ["GoldenAce", "VIP_Roller", "Rafi_77", "LuckySpins", "DanishBet", "RenderHype", "BetPro_99", "AuraKing", "CryptoWhale", "Shadow77"];

type GamePhase = "BETTING" | "SPINNING" | "WINNER";

export function LiveDealerStudioEngine({ onBetPlaced }: LiveDealerStudioEngineProps) {
  const { balance, playCasino } = useTradingStore();

  // Round State
  const [roundId, setRoundId] = useState(() => Math.floor(Math.random() * 900000) + 100000);
  const [phase, setPhase] = useState<GamePhase>("BETTING");
  const [countdown, setCountdown] = useState(15);
  const [selectedChip, setSelectedChip] = useState<number>(100);
  const [userBets, setUserBets] = useState<Record<string, number>>({});
  const [previousBets, setPreviousBets] = useState<Record<string, number>>({});
  
  // Wheel State
  const [rotation, setRotation] = useState(0);
  const [winningSegment, setWinningSegment] = useState<typeof WHEEL_SEGMENTS[0] | null>(null);
  const [pointerTick, setPointerTick] = useState(0);
  
  // Table History
  const [history, setHistory] = useState<number[]>([1, 2, 1, 5, 10, 2, 1, 20]);
  
  // Live Chat & Feed
  const [chatMessages] = useState<{ id: string; user: string; text: string; time: string }[]>([
    { id: "c1", user: "VIP_Roller", text: "Hey Valentina! Let's hit 40x this round! 🚀", time: "Just now" },
    { id: "c2", user: "GoldenAce", text: "Big bets placed on 10x and 20x!", time: "Just now" },
    { id: "c3", user: "Dealer Valentina", text: "Welcome everyone to Studio 01! Bets are open ✨", time: "Just now" }
  ]);
  const [liveBetFeed, setLiveBetFeed] = useState<{ id: string; user: string; spot: string; amount: number }[]>([]);

  // Dealer Speech Bubble
  const [dealerSpeech, setDealerSpeech] = useState("✨ Welcome VIPs! Place your bets on the wheel — 15 seconds remaining!");

  // Dealer Eye Blink
  const [dealerBlink, setDealerBlink] = useState(false);
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setDealerBlink(true);
      setTimeout(() => setDealerBlink(false), 200);
    }, 4000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Total Bet Placed by User
  const totalUserBet = Object.values(userBets).reduce((a, b) => a + b, 0);

  // Place Chip on Bet Spot
  const handlePlaceChip = (spotId: string) => {
    if (phase !== "BETTING") return;
    if (balance < selectedChip) {
      alert("Insufficient wallet balance to place this chip.");
      return;
    }

    playCasino(selectedChip, 0, "AURA Live Dream Wheel");
    playGameSound("chip");

    setUserBets(prev => ({
      ...prev,
      [spotId]: (prev[spotId] || 0) + selectedChip
    }));

    if (onBetPlaced) onBetPlaced(selectedChip);
  };

  const handleClearBets = () => {
    if (phase !== "BETTING" || totalUserBet === 0) return;
    playCasino(0, totalUserBet, "AURA Live Dream Wheel Refund");
    setUserBets({});
    playGameSound("chip");
  };

  const handleDoubleBets = () => {
    if (phase !== "BETTING" || totalUserBet === 0) return;
    if (balance < totalUserBet) {
      alert("Insufficient balance to double all bets.");
      return;
    }
    playCasino(totalUserBet, 0, "AURA Live Dream Wheel");
    setUserBets(prev => {
      const doubled: Record<string, number> = {};
      for (const k in prev) {
        doubled[k] = prev[k] * 2;
      }
      return doubled;
    });
    playGameSound("chip");
  };

  const handleRepeatBets = () => {
    if (phase !== "BETTING" || Object.keys(previousBets).length === 0) return;
    const prevTotal = Object.values(previousBets).reduce((a, b) => a + b, 0);
    if (balance < prevTotal) {
      alert("Insufficient balance to repeat previous bets.");
      return;
    }
    playCasino(prevTotal, 0, "AURA Live Dream Wheel");
    setUserBets(previousBets);
    playGameSound("chip");
  };

  // Main Round Loop (15s Countdown -> Spin -> Settle -> Next Round)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (phase === "BETTING") {
      setDealerSpeech("✨ Round #" + roundId + ": Place your bets on the wheel — " + countdown + "s remaining!");

      if (countdown % 3 === 0 && countdown > 2) {
        const randUser = SIMULATED_PLAYERS[Math.floor(Math.random() * SIMULATED_PLAYERS.length)];
        const randSpot = BET_SPOTS[Math.floor(Math.random() * BET_SPOTS.length)].id;
        const randAmt = [50, 100, 500, 1000, 2000][Math.floor(Math.random() * 5)];
        setLiveBetFeed(prev => [{ id: "bf-" + Date.now() + "-" + Math.random(), user: randUser, spot: randSpot, amount: randAmt }, ...prev.slice(0, 5)]);
      }

      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      } else {
        setPhase("SPINNING");
        setPreviousBets(userBets);
        setDealerSpeech("🔒 Bets closed! Good luck to all VIPs, spinning the dream wheel!");
        playGameSound("spin");

        const outcome = calculateGameOutcome("TABLE");
        const targetMult = outcome.multiplier;
        
        let targetSegmentIdx = WHEEL_SEGMENTS.findIndex(s => s.mult === targetMult);
        if (targetSegmentIdx === -1) {
          targetSegmentIdx = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
        }

        const chosenSegment = WHEEL_SEGMENTS[targetSegmentIdx];
        const segAngle = 360 / WHEEL_SEGMENTS.length;
        const finalRotation = rotation + 3600 + (360 - (targetSegmentIdx * segAngle));
        setRotation(finalRotation);

        let tickDelay = 50;
        let keepTicking = true;
        const triggerTick = () => {
          if (!keepTicking) return;
          setPointerTick(prev => (prev === 0 ? -12 : 0));
          playGameSound("tick");
          tickDelay = tickDelay * 1.12;
          if (tickDelay < 700) {
            setTimeout(triggerTick, tickDelay);
          } else {
            setPointerTick(0);
          }
        };
        setTimeout(triggerTick, tickDelay);

        setTimeout(() => {
          keepTicking = false;
          setPointerTick(0);
          setWinningSegment(chosenSegment);
          setPhase("WINNER");
          setHistory(prev => [chosenSegment.mult, ...prev.slice(0, 9)]);

          const matchingBet = userBets[chosenSegment.val] || userBets[chosenSegment.mult + "x"] || 0;
          let userWonAmount = 0;
          if (matchingBet > 0) {
            userWonAmount = matchingBet + (matchingBet * chosenSegment.mult);
            playCasino(0, userWonAmount, "AURA Live Dream Wheel Payout");
            playGameSound("win");
            setDealerSpeech("🎉 Congratulations! Multiplier " + chosenSegment.val + " WON! You won ₹" + userWonAmount.toLocaleString('en-IN') + "!");
          } else {
            setDealerSpeech("🌟 Multiplier " + chosenSegment.val + " won this round! Next spin starting soon!");
          }

          setTimeout(() => {
            setRoundId(Math.floor(Math.random() * 900000) + 100000);
            setUserBets({});
            setWinningSegment(null);
            setCountdown(15);
            setPhase("BETTING");
          }, 5000);

        }, 6500);
      }
    }

    return () => clearTimeout(timer);
  }, [phase, countdown, roundId, rotation, userBets, playCasino]);

  return (
    <div className="w-full max-w-7xl mx-auto rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden text-slate-900 select-none">
      
      {/* Studio Broadcast Top HUD */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 font-extrabold text-[11px] uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span>1080p 60FPS • LIVE STUDIO</span>
          </div>
          <span className="text-xs font-bold text-slate-500">Hostess: <strong className="text-amber-600">Valentina</strong></span>
          <span className="hidden sm:inline-block text-xs font-mono text-slate-400">Table #01</span>
        </div>

        {/* History Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">History:</span>
          {history.map((h, i) => (
            <span
              key={i}
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-black border font-mono shadow-xs",
                h === 40 ? "bg-yellow-500 text-black border-yellow-300 animate-pulse" :
                h === 20 ? "bg-rose-600 text-white border-rose-400" :
                h === 10 ? "bg-amber-600 text-white border-amber-400" :
                h === 5 ? "bg-purple-600 text-white border-purple-400" :
                h === 2 ? "bg-emerald-600 text-white border-emerald-400" :
                "bg-blue-600 text-white border-blue-400"
              )}
            >
              {h}x
            </span>
          ))}
        </div>
      </div>

      {/* Main Stage Area — Light themed with soft warm tones */}
      <div className="relative min-h-[380px] sm:min-h-[440px] flex flex-col md:flex-row items-center justify-between p-4 sm:p-8 bg-gradient-to-b from-white via-slate-50 to-amber-50/30 overflow-hidden">
        
        {/* Soft ambient glow — warm and inviting */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

        {/* Left Side: AI Presenter Stage */}
        <div className="relative flex flex-col items-center justify-center w-full md:w-1/2 z-10 py-2">
          
          {/* Dealer Speech Bubble */}
          <motion.div 
            key={dealerSpeech}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-4 py-2.5 rounded-2xl bg-white border border-amber-200 text-slate-700 text-xs sm:text-sm font-semibold text-center max-w-sm shadow-sm"
          >
            {dealerSpeech}
          </motion.div>

          {/* AI Virtual Dealer Visual Canvas */}
          <div className="relative w-48 h-64 sm:w-56 sm:h-72 rounded-3xl overflow-hidden border-2 border-amber-200 shadow-md bg-gradient-to-b from-amber-50 to-white flex items-center justify-center group">
            
            <svg viewBox="0 0 200 280" className="w-full h-full object-cover">
              <defs>
                <radialGradient id="studioGlow" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#eef2ff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#fefce8" stopOpacity="0.8" />
                </radialGradient>
                <linearGradient id="gownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="50%" stopColor="#b45309" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>
                <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e1b18" />
                  <stop offset="100%" stopColor="#0a0908" />
                </linearGradient>
                <radialGradient id="skinGrad" cx="50%" cy="40%" r="50%">
                  <stop offset="0%" stopColor="#ffdfcb" />
                  <stop offset="80%" stopColor="#f3be9b" />
                  <stop offset="100%" stopColor="#d69b76" />
                </radialGradient>
              </defs>

              <rect width="200" height="280" fill="url(#studioGlow)" />
              <path d="M 30 280 Q 100 20 170 280" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.15" />
              <path d="M 45 280 Q 100 40 155 280" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.1" />

              <g style={{ transform: dealerBlink ? "scale(1.01)" : "scale(1)" }}>
                <path d="M 40 280 L 60 170 Q 100 185 140 170 L 160 280 Z" fill="url(#gownGrad)" stroke="#fbbf24" strokeWidth="1" />
                <path d="M 80 175 Q 100 195 120 175" fill="none" stroke="#fef08a" strokeWidth="3" />
                <rect x="88" y="140" width="24" height="35" rx="4" fill="url(#skinGrad)" />
                <path d="M 60 90 Q 40 160 55 240 Q 100 260 145 240 Q 160 160 140 90 Z" fill="url(#hairGrad)" />
                <ellipse cx="100" cy="115" rx="30" ry="38" fill="url(#skinGrad)" />

                {dealerBlink ? (
                  <>
                    <line x1="84" y1="110" x2="94" y2="110" stroke="#262626" strokeWidth="2" strokeLinecap="round" />
                    <line x1="106" y1="110" x2="116" y2="110" stroke="#262626" strokeWidth="2" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <ellipse cx="89" cy="110" rx="5" ry="3.5" fill="#FFFFFF" />
                    <circle cx="89" cy="110" r="2.5" fill="#1e3a8a" />
                    <circle cx="90" cy="109" r="1" fill="#FFFFFF" />
                    <path d="M 83 105 Q 89 102 95 105" fill="none" stroke="#171717" strokeWidth="1.5" />

                    <ellipse cx="111" cy="110" rx="5" ry="3.5" fill="#FFFFFF" />
                    <circle cx="111" cy="110" r="2.5" fill="#1e3a8a" />
                    <circle cx="112" cy="109" r="1" fill="#FFFFFF" />
                    <path d="M 105 105 Q 111 102 117 105" fill="none" stroke="#171717" strokeWidth="1.5" />
                  </>
                )}

                <path d="M 100 115 L 98 126 L 102 126" fill="none" stroke="#c27d53" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M 91 135 Q 100 145 109 135" fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />

                <path d="M 68 95 Q 100 65 132 95 Q 115 80 100 80 Q 85 80 68 95 Z" fill="url(#hairGrad)" />
                <path d="M 68 95 Q 60 125 65 160 Q 75 120 78 100 Z" fill="url(#hairGrad)" />
                <path d="M 132 95 Q 140 125 135 160 Q 125 120 122 100 Z" fill="url(#hairGrad)" />
                
                <circle cx="67" cy="125" r="3" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
                <circle cx="133" cy="125" r="3" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
              </g>
            </svg>

            {/* Live Camera Watermark */}
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/80 backdrop-blur-md border border-slate-200 text-[9px] font-mono text-emerald-600">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              CAM 01
            </div>

            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider">
              VALENTINA
            </div>
          </div>
        </div>

        {/* Right Side: The Wheel Stage */}
        <div className="relative flex flex-col items-center justify-center w-full md:w-1/2 z-10 py-4">
          
          {/* Wheel Pointer */}
          <div className="relative z-30 -mb-5 flex flex-col items-center">
            <motion.div 
              animate={{ rotate: pointerTick }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-red-500 drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
            />
          </div>

          {/* Spinning Wheel */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full p-2 bg-gradient-to-tr from-amber-200 via-yellow-100 to-amber-200 shadow-lg border-4 border-amber-300/60">
            <div 
              className="w-full h-full rounded-full overflow-hidden relative shadow-inner"
              style={{
                transform: "rotate(" + rotation + "deg)",
                transition: phase === "SPINNING" ? "transform 6.5s cubic-bezier(0.12, 0.8, 0.15, 1)" : "none"
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {WHEEL_SEGMENTS.map((seg, idx) => {
                  const segCount = WHEEL_SEGMENTS.length;
                  const angle = 360 / segCount;
                  const startAngle = idx * angle;
                  const endAngle = startAngle + angle;

                  const rad1 = (startAngle - 90) * (Math.PI / 180);
                  const rad2 = (endAngle - 90) * (Math.PI / 180);

                  const x1 = 50 + 50 * Math.cos(rad1);
                  const y1 = 50 + 50 * Math.sin(rad1);
                  const x2 = 50 + 50 * Math.cos(rad2);
                  const y2 = 50 + 50 * Math.sin(rad2);

                  const midRad = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180);
                  const textX = 50 + 35 * Math.cos(midRad);
                  const textY = 50 + 35 * Math.sin(midRad);

                  return (
                    <g key={idx}>
                      <path
                        d={"M 50 50 L " + x1 + " " + y1 + " A 50 50 0 0 1 " + x2 + " " + y2 + " Z"}
                        fill={seg.color}
                        stroke="#FFFFFF"
                        strokeWidth="0.8"
                      />
                      <text
                        x={textX}
                        y={textY}
                        fill={seg.text}
                        fontSize="5.5"
                        fontWeight="900"
                        textAnchor="middle"
                        dominantBaseline="central"
                        transform={"rotate(" + ((startAngle + endAngle) / 2) + ", " + textX + ", " + textY + ")"}
                      >
                        {seg.val}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-4 border-amber-400 shadow-lg flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black tracking-widest text-amber-600">AURA</span>
              <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-tighter">STUDIO</span>
            </div>
          </div>

          {/* Round Timer HUD */}
          <div className="mt-4 flex items-center gap-3">
            {phase === "BETTING" ? (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm">
                <span className="animate-pulse font-mono text-base">⏱️ {countdown}s</span>
                <span className="text-xs uppercase tracking-wide">Place Your Bets</span>
              </div>
            ) : phase === "SPINNING" ? (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-sm animate-pulse">
                <span>🎡 WHEEL SPINNING...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-50 border border-yellow-300 text-yellow-700 font-black text-sm animate-bounce">
                <Trophy className="w-4 h-4 text-yellow-600" />
                <span>WINNER: {winningSegment?.val}!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Multi-Betting Table Grid */}
      <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {BET_SPOTS.map((spot) => {
            const currentBet = userBets[spot.id] || 0;
            const isWinner = phase === "WINNER" && winningSegment?.val === spot.id;

            return (
              <button
                key={spot.id}
                onClick={() => handlePlaceChip(spot.id)}
                disabled={phase !== "BETTING"}
                className={cn(
                  "relative flex flex-col items-center justify-center p-3.5 rounded-xl border bg-gradient-to-b transition-all duration-200 cursor-pointer overflow-hidden group",
                  spot.bgGradient,
                  spot.borderColor,
                  phase === "BETTING" ? "hover:scale-105 active:scale-95 hover:shadow-md shadow-sm" : "opacity-70 cursor-not-allowed",
                  isWinner && "ring-4 ring-yellow-400 ring-offset-2 ring-offset-white animate-pulse scale-105"
                )}
              >
                {isWinner && (
                  <div className="absolute inset-0 bg-yellow-400/20 animate-ping pointer-events-none" />
                )}

                <span className={cn("text-lg sm:text-xl font-black mb-0.5", spot.color)}>
                  {spot.label}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Pays {spot.multiplier}:1
                </span>

                {currentBet > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "mt-2 px-2.5 py-0.5 rounded-full text-xs font-black shadow-md",
                      spot.chipColor
                    )}
                  >
                    ₹{currentBet.toLocaleString("en-IN")}
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        {/* Chip Selector & Quick Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200">
          
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Chip:</span>
            {CHIP_VALUES.map((val) => (
              <button
                key={val}
                onClick={() => {
                  setSelectedChip(val);
                  playGameSound("chip");
                }}
                className={cn(
                  "w-10 h-10 sm:w-11 sm:h-11 rounded-full font-black text-xs flex items-center justify-center border-2 transition-all cursor-pointer shadow-sm",
                  selectedChip === val
                    ? "scale-110 border-amber-400 ring-2 ring-amber-300/50 shadow-amber-200/50"
                    : "border-slate-300 hover:scale-105 opacity-80",
                  val === 10 ? "bg-blue-600 text-white" :
                  val === 50 ? "bg-emerald-600 text-white" :
                  val === 100 ? "bg-purple-600 text-white" :
                  val === 500 ? "bg-amber-600 text-white" :
                  val === 1000 ? "bg-rose-600 text-white" :
                  "bg-gradient-to-tr from-yellow-400 to-amber-500 text-white font-black"
                )}
              >
                ₹{val >= 1000 ? (val / 1000) + "k" : val}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDoubleBets}
              disabled={phase !== "BETTING" || totalUserBet === 0}
              className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 transition-all border border-slate-200 cursor-pointer shadow-sm"
            >
              2X Double
            </button>
            <button
              onClick={handleRepeatBets}
              disabled={phase !== "BETTING" || Object.keys(previousBets).length === 0}
              className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 transition-all border border-slate-200 cursor-pointer shadow-sm"
            >
              Repeat
            </button>
            <button
              onClick={handleClearBets}
              disabled={phase !== "BETTING" || totalUserBet === 0}
              className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 disabled:opacity-40 text-red-600 text-xs font-bold transition-all border border-red-200 cursor-pointer shadow-sm"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end leading-none">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Total Bet</span>
              <span className="text-sm sm:text-base font-black font-mono text-amber-600">
                ₹{totalUserBet.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Community Stream Ticker & Live Chat Drawer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white border-t border-slate-200 text-xs">
        <div>
          <div className="flex items-center gap-1.5 font-bold text-slate-500 mb-2 uppercase tracking-wider text-[10px]">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span>Live Table Bets (1,248 Online)</span>
          </div>
          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {liveBetFeed.map((bf) => (
              <div key={bf.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
                <span className="font-semibold text-slate-700">{bf.user}</span>
                <span className="text-slate-500">bet <strong className="text-amber-600">₹{bf.amount}</strong> on <strong className="text-slate-800">{bf.spot}</strong></span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 font-bold text-slate-500 mb-2 uppercase tracking-wider text-[10px]">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>Studio Chat</span>
          </div>
          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {chatMessages.map((cm) => (
              <div key={cm.id} className="flex items-start gap-1.5 text-[11px]">
                <strong className={cm.user.includes("Valentina") ? "text-amber-600" : "text-blue-600"}>{cm.user}:</strong>
                <span className="text-slate-600">{cm.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
