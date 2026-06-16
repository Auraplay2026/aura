"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock, Zap, RotateCcw, AlertTriangle, RefreshCw, Volume2, Shield } from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { validateTransactionIdempotency } from "@/lib/mathEngine";

interface RoyalGamingProps {
  isPlaying: boolean;
  onComplete: (won: boolean) => void;
  gameId: string;
  gameTitle: string;
}

interface PlacedChip {
  id: string;
  targetId: string;
  value: number;
  x: number;
  y: number;
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
      { id: "player_a", name: "Player A", odds: 1.98, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "player_b", name: "Player B", odds: 1.98, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "tie", name: "Tie", odds: 9.00, color: "bg-white border-[#E2E8F0] text-[#0F172A]" }
    ],
    historyGenerator: () => Math.random() > 0.5 ? "A" : "B"
  },
  "royal-1-20": { // Teen Patti 20-20
    label: "Teen Patti 20-20",
    targets: [
      { id: "player_a", name: "Player A", odds: 1.95, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "player_b", name: "Player B", odds: 1.95, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "tie", name: "Tie", odds: 8.50, color: "bg-white border-[#E2E8F0] text-[#0F172A]" }
    ],
    historyGenerator: () => Math.random() > 0.5 ? "A" : "B"
  },
  "royal-2": { // Super Over Fusion
    label: "Super Over Fusion (Cricket)",
    targets: [
      { id: "runs_over", name: "Runs Over 3.5", odds: 1.85, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "runs_under", name: "Runs Under 3.5", odds: 1.85, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "boundary", name: "Boundary Ball 1", odds: 3.50, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "wicket", name: "Wicket in Over", odds: 4.50, color: "bg-white border-[#E2E8F0] text-[#0F172A]" }
    ],
    historyGenerator: () => {
      const outcomes = ["O", "U", "B", "W"];
      return outcomes[Math.floor(Math.random() * outcomes.length)];
    }
  },
  "royal-3": { // Andar Bahar Traditional
    label: "Andar Bahar Traditional",
    targets: [
      { id: "andar", name: "Andar", odds: 1.90, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "bahar", name: "Bahar", odds: 1.90, color: "bg-white border-[#E2E8F0] text-[#0F172A]" }
    ],
    historyGenerator: () => Math.random() > 0.5 ? "A" : "B"
  },
  "royal-3-vr": { // Andar Bahar VR
    label: "Andar Bahar VR",
    targets: [
      { id: "andar", name: "Andar VR", odds: 1.90, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "bahar", name: "Bahar VR", odds: 1.90, color: "bg-white border-[#E2E8F0] text-[#0F172A]" }
    ],
    historyGenerator: () => Math.random() > 0.5 ? "A" : "B"
  },
  "royal-4": { // 32 Cards Fusion
    label: "32 Cards Fusion",
    targets: [
      { id: "player_8", name: "Player 8", odds: 12.00, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "player_9", name: "Player 9", odds: 5.50, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "player_10", name: "Player 10", odds: 3.20, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "player_11", name: "Player 11", odds: 2.10, color: "bg-white border-[#E2E8F0] text-[#0F172A]" }
    ],
    historyGenerator: () => {
      const players = ["8", "9", "10", "11"];
      return players[Math.floor(Math.random() * players.length)];
    }
  },
  "royal-5": { // Lightning 7 Up & Down Fusion
    label: "Lightning 7 Up & Down Fusion",
    targets: [
      { id: "seven_down", name: "7 Down", odds: 2.10, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "seven_up", name: "7 Up", odds: 2.10, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "seven_exact", name: "Lucky 7", odds: 5.80, color: "bg-white border-[#E2E8F0] text-[#0F172A]" }
    ],
    historyGenerator: () => {
      const sum = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
      return sum === 7 ? "7" : sum > 7 ? "U" : "D";
    }
  },
  "royal-6": { // Dragon Tiger Fusion
    label: "Dragon Tiger Fusion",
    targets: [
      { id: "dragon", name: "Dragon", odds: 1.95, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "tiger", name: "Tiger", odds: 1.95, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "tie", name: "Tie", odds: 11.00, color: "bg-white border-[#E2E8F0] text-[#0F172A]" }
    ],
    historyGenerator: () => Math.random() > 0.5 ? "D" : "T"
  },
  "royal-7": { // European Roulette
    label: "European Roulette",
    targets: [
      { id: "red", name: "Red", odds: 2.00, color: "bg-white border-[#E2E8F0] text-[#BE185D]" },
      { id: "black", name: "Black", odds: 2.00, color: "bg-[#0F172A] border-[#E2E8F0] text-white" },
      { id: "zero", name: "Zero (0)", odds: 35.00, color: "bg-white border-[#E2E8F0] text-emerald-700" }
    ],
    historyGenerator: () => {
      const colors = ["R", "B", "Z"];
      const rand = Math.random();
      return rand < 0.48 ? "R" : rand < 0.96 ? "B" : "Z";
    }
  }
};

const COIN_VALUES = [50, 100, 500, 1000, 5000, 10000];

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
  const [placedChips, setPlacedChips] = useState<PlacedChip[]>([]);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  
  // Scroller matrix loop tracking past round outputs
  const [historyList, setHistoryList] = useState<string[]>([]);
  
  // Simulation visual elements (zero-reflow Dealer Text & Feed)
  const [feedMsg, setFeedMsg] = useState("PLACE YOUR CHIPS");
  const [payoutOverlay, setPayoutOverlay] = useState<{ active: boolean; profit: number; won: boolean }>({ active: false, profit: 0, won: false });

  // Exception Modals State
  const [showLowBalance, setShowLowBalance] = useState(false);
  const [showConnectionLost, setShowConnectionLost] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);

  // WebRTC & Canvas Refs
  const streamRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Simulate intermittent connectivity lost once in a while to showcase alert
  useEffect(() => {
    const timer = setInterval(() => {
      setShowConnectionLost(true);
      setTimeout(() => setShowConnectionLost(false), 4000);
    }, 75000);
    return () => clearInterval(timer);
  }, []);

  // WebRTC Stream Receiver Connection (WHIP/WHEP Ingestion Layer)
  useEffect(() => {
    const video = streamRef.current;
    if (!video) return;

    let pc: RTCPeerConnection | null = null;
    const whepUrl = process.env.WEBRTC_STREAM_URL || "https://live.aurabet.io/whep/dealer_stream_702";

    const connectWHEP = async () => {
      try {
        pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });

        pc.ontrack = (event) => {
          if (video && event.streams && event.streams[0]) {
            video.srcObject = event.streams[0];
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const response = await fetch(whepUrl, {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: pc.localDescription?.sdp
        });

        if (response.ok) {
          const answerSdp = await response.text();
          await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: answerSdp }));
        } else {
          // Fallback to high-quality unbuffered loop video
          video.src = "https://assets.mixkit.co/videos/preview/mixkit-dealer-shuffling-and-dealing-cards-39958-large.mp4";
          video.loop = true;
          video.play().catch(() => {});
        }
      } catch (e) {
        // Fallback
        video.src = "https://assets.mixkit.co/videos/preview/mixkit-dealer-shuffling-and-dealing-cards-39958-large.mp4";
        video.loop = true;
        video.play().catch(() => {});
      }
    };

    connectWHEP();

    return () => {
      if (pc) {
        pc.close();
      }
    };
  }, []);

  // requestAnimationFrame Canvas Draw Loop (60FPS chip stacks and OCR card overlays)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Adjust size for screen scale
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render Floating Chips coordinate overlays
      placedChips.forEach(chip => {
        // Chip circular container
        ctx.beginPath();
        ctx.arc(chip.x, chip.y, 16, 0, 2 * Math.PI);
        ctx.fillStyle = chip.value === 50 ? "#1E293B" :
                        chip.value === 100 ? "#0284C7" :
                        chip.value === 500 ? "#059669" :
                        chip.value === 1000 ? "#D97706" :
                        chip.value === 5000 ? "#DC2626" : "#7C3AED";
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner dashed ring
        ctx.beginPath();
        ctx.arc(chip.x, chip.y, 11, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.setLineDash([3, 2]);
        ctx.stroke();
        ctx.setLineDash([]); // reset

        // Chip text value
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "black 9px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const label = chip.value >= 1000 ? `${chip.value / 1000}K` : `${chip.value}`;
        ctx.fillText(label, chip.x, chip.y);
      });

      // Render digital OCR drawn card representation during closed/dealing phase
      if (phase === "closed") {
        const cWidth = 70;
        const cHeight = 100;
        const cX = canvas.width / 2 - cWidth / 2;
        const cY = canvas.height / 2 - cHeight / 2 - 30;

        // Card white base
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(cX, cY, cWidth, cHeight, 10);
        ctx.fill();
        ctx.strokeStyle = "#E2E8F0";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Card suite icon (e.g. Ace of Spades)
        ctx.fillStyle = "#0F172A"; // High-contrast charcoal
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("A ♠", cX + 8, cY + 20);

        ctx.font = "36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("♠", cX + cWidth / 2, cY + cHeight / 2 + 10);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [placedChips, phase]);

  // Initialize history list
  useEffect(() => {
    const list: string[] = [];
    for (let i = 0; i < 15; i++) {
      list.push(currentConfig.historyGenerator());
    }
    setHistoryList(list);
  }, [configKey]);

  // Master live table countdown loop
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
              playCasino(totalWager, totalPayout, currentConfig.label);
              setPayoutOverlay({
                active: true,
                profit: Math.round(netProfit),
                won: didWin
              });
            }

            setHistoryList(prev => [...prev.slice(1), winningTarget.name.charAt(0)]);
            return 5; // 5 seconds settle overlay
          } else if (phase === 'settled') {
            setPhase('open');
            setRoundWinner(null);
            setBets({});
            setPlacedChips([]);
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

  // Tactile chip placement handle
  const handleBetPlacement = (targetId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (phase !== 'open') {
      setFeedMsg("BETS CLOSED FOR THIS ROUND");
      setTimeout(() => setFeedMsg("BETS CLOSED • DEALING CARDS"), 1000);
      return;
    }

    const currentTotalPlaced = Object.values(bets).reduce((a, b) => a + b, 0);
    const target = currentConfig.targets.find(t => t.id === targetId);
    const odds = target ? target.odds : 2.0;

    const validation = validateTransactionIdempotency(balance - currentTotalPlaced, selectedCoin, odds, 'back');
    if (!validation.success) {
      setShowLowBalance(true);
      return;
    }

    // Capture click coordinate offsets relative to the main container
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const chipX = event.clientX - rect.left;
      const chipY = event.clientY - rect.top;

      setPlacedChips(prev => [
        ...prev,
        {
          id: `chip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          targetId,
          value: selectedCoin,
          x: chipX,
          y: chipY
        }
      ]);
    }

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
    setPlacedChips(prev => prev.slice(0, -1));
    setBetHistory(prev => prev.slice(0, -1));
  };

  const handleDouble = () => {
    if (phase !== 'open') return;
    const currentTotal = Object.values(bets).reduce((a, b) => a + b, 0);
    const validation = validateTransactionIdempotency(balance - currentTotal, currentTotal, 2.0, 'back');
    if (!validation.success) {
      setShowLowBalance(true);
      return;
    }

    setBetHistory(prev => [...prev, { ...bets }]);

    // Double numerical wagers
    setBets(prev => {
      const doubled: Record<string, number> = {};
      Object.entries(prev).forEach(([key, val]) => {
        doubled[key] = val * 2;
      });
      return doubled;
    });

    // Double visual chips representation
    setPlacedChips(prev => 
      prev.map(chip => ({
        ...chip,
        id: `chip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        value: chip.value * 2
      }))
    );
  };

  const handleClearAll = () => {
    setBets({});
    setPlacedChips([]);
    setBetHistory([]);
  };

  const totalActiveBet = Object.values(bets).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full h-full min-h-[580px] bg-white border border-[#E2E8F0] rounded-2xl relative flex flex-col justify-between overflow-hidden p-4 font-sans text-[#0F172A]">
      
      {/* 1. Header Information Status Row (Pure White Light Theme) */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <Activity onClick={() => setShowMaintenance(true)} className="w-4 h-4 text-[#0F172A] animate-pulse cursor-pointer" />
          <span className="text-xs font-black tracking-widest text-[#0F172A] uppercase">{currentConfig.label}</span>
          <span className="bg-[#E2E8F0] text-[#0F172A] text-[8px] font-black uppercase px-2 py-0.5 rounded leading-none">
            WHIP WHEP Live
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Total Bet</span>
            <span className="text-xs font-black text-[#0F172A] leading-none">₹{totalActiveBet.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#F8F9FA] px-2.5 py-1.5 rounded-lg border border-[#E2E8F0]">
            <Clock className={cn("w-3.5 h-3.5", phase === 'open' ? 'text-indigo-600' : 'text-rose-500 animate-spin')} />
            <span className="text-xs font-black tracking-widest leading-none min-w-[15px]">
              {countdown}s
            </span>
          </div>
        </div>
      </div>

      {/* 2. WebRTC Live Video Stream & Interactive Canvas overlay */}
      <div ref={containerRef} className="relative flex-1 w-full bg-slate-100 border border-[#E2E8F0] rounded-xl my-3 flex flex-col justify-between p-4 shadow-sm overflow-hidden min-h-[240px]">
        {/* HTML5 WebRTC Video Node */}
        <video
          ref={streamRef}
          autoPlay
          playsInline
          muted
          controls={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden', willChange: "transform, opacity" }}
        />

        {/* 2D Interactive Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* HUD Layer content */}
        <div className="flex justify-between items-center z-20 w-full relative">
          <span className="text-[9px] font-bold text-white bg-black/40 px-2 py-0.5 rounded uppercase tracking-widest">
            Dealer Room: Kylie #702
          </span>
          <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Sub-300ms WHIP</span>
          </div>
        </div>

        {/* Deal visual center based on phase */}
        <div className="flex flex-col items-center justify-center text-center my-auto z-20 relative">
          <AnimatePresence mode="wait">
            {phase === 'open' && (
              <motion.div
                key="open"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="text-xs font-black uppercase text-white bg-black/60 px-3 py-1.5 rounded-lg tracking-wider">
                  {feedMsg}
                </div>
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
                <div className="text-xs font-black text-rose-500 uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-lg animate-pulse">
                  {feedMsg}
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
                <div className="text-xs font-black text-indigo-400 uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-lg">
                  {feedMsg}
                </div>
                {payoutOverlay.active && (
                  <div className={cn(
                    "px-4 py-1.5 rounded-full font-black text-xs uppercase shadow-lg border leading-none mt-1.5",
                    payoutOverlay.won 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  )}>
                    {payoutOverlay.won ? `Payout: +₹${payoutOverlay.profit}` : `Settled: -₹${Math.abs(payoutOverlay.profit)}`}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Statistical Scorecard Roadmap Grid */}
        <div className="border-t border-white/20 pt-2 shrink-0 flex items-center gap-2 justify-between z-20 w-full relative bg-black/40 px-3 py-1 rounded-lg">
          <span className="text-[8px] font-black text-slate-350 uppercase tracking-wider">Statistical Roadmap scorecard</span>
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

      {/* 3. Interactive Betting Matrix Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 shrink-0 my-1">
        {currentConfig.targets.map(target => {
          const activeWager = bets[target.id] || 0;
          const isWinner = phase === 'settled' && roundWinner === target.id;
          
          return (
            <button
              key={target.id}
              onClick={(e) => handleBetPlacement(target.id, e)}
              className={cn(
                "border rounded-xl p-3 flex flex-col justify-between items-center transition-all relative overflow-hidden h-[74px] bg-canvas border-[#E2E8F0] text-[#0F172A]",
                isWinner && "ring-4 ring-[#0F172A] scale-102 font-black",
                phase !== 'open' && "opacity-85"
              )}
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-xs font-black uppercase tracking-wider">{target.name}</span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">x{target.odds.toFixed(2)}</span>
              </div>
              
              <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">
                {activeWager > 0 ? `Bet: ₹${activeWager}` : "Bet Here"}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Bottom-Docked Tactile Coin Selector Carousel */}
      <div className="border-t border-[#E2E8F0] pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        
        {/* Fast Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={handleUndo}
            disabled={phase !== 'open' || betHistory.length === 0}
            className="flex items-center gap-1 border border-[#E2E8F0] hover:bg-[#F8F9FA] disabled:opacity-40 disabled:hover:bg-transparent rounded px-3 py-2 text-[10px] font-black text-[#0F172A] uppercase leading-none tracking-wider transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Undo
          </button>
          <button
            onClick={handleDouble}
            disabled={phase !== 'open' || totalActiveBet === 0}
            className="flex items-center gap-1 border border-[#E2E8F0] hover:bg-[#F8F9FA] disabled:opacity-40 disabled:hover:bg-transparent rounded px-3 py-2 text-[10px] font-black text-[#0F172A] uppercase leading-none tracking-wider transition-colors"
          >
            <Zap className="w-3 h-3" />
            Double (2x)
          </button>
          <button
            onClick={handleClearAll}
            disabled={phase !== 'open' || totalActiveBet === 0}
            className="flex items-center gap-1 border border-rose-200 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:hover:bg-transparent rounded px-3 py-2 text-[10px] font-black text-rose-700 uppercase leading-none tracking-wider transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Token selection tray */}
        <div className="flex items-center gap-2 shrink-0 overflow-x-auto py-1 max-w-full custom-scrollbar">
          {COIN_VALUES.map(val => (
            <button
              key={val}
              onClick={() => {
                if (balance < val) {
                  setShowLowBalance(true);
                  return;
                }
                setSelectedCoin(val);
              }}
              style={{ willChange: "transform" }}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-[9px] font-black border shadow shrink-0 transition-transform active:scale-95 leading-none",
                selectedCoin === val
                  ? "scale-110 ring-4 ring-[#0F172A]/20 shadow-[0_0_12px_rgba(0,0,0,0.15)] z-10 font-black border-[#0F172A]"
                  : "hover:scale-105 border-[#E2E8F0]",
                val === 50 && "bg-[#F8F9FA] text-[#0F172A]",
                val === 100 && "bg-[#E2E8F0] text-[#0F172A]",
                val === 500 && "bg-[#E0F2FE] text-[#0369A1] border-blue-200",
                val === 1000 && "bg-[#FCE7F3] text-[#BE185D] border-pink-200",
                val === 5000 && "bg-amber-50 text-yellow-800 border-yellow-200",
                val === 10000 && "bg-emerald-50 text-emerald-800 border-emerald-200"
              )}
            >
              ₹{val >= 1000 ? `${(val/1000).toFixed(0)}K` : val}
            </button>
          ))}
        </div>

      </div>

      {/* Exception Warning Dialog Modals */}
      <AnimatePresence>
        {/* 1. Low Balance Alert Modal */}
        {showLowBalance && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[50] flex items-center justify-center p-4">
            <div className="bg-white border border-[#E2E8F0] max-w-sm w-full p-6 rounded-2xl shadow-2xl text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-[#BE185D] mx-auto animate-bounce" />
              <h4 className="text-sm font-black text-[#0F172A] uppercase tracking-wider">Low Balance</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Low Balance: Your balance is low, please visit the cashier.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowLowBalance(false)} className="flex-1 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-[10px] font-black uppercase text-slate-700 hover:bg-[#E2E8F0]">Cancel</button>
                <button 
                  onClick={() => {
                    setShowLowBalance(false);
                    window.dispatchEvent(new CustomEvent("open-cashier"));
                  }} 
                  className="flex-1 py-2 bg-[#0F172A] hover:bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider"
                >
                  Deposit
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. Connection Lost Alert Modal */}
        {showConnectionLost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[50] flex items-center justify-center p-4">
            <div className="bg-white border border-[#E2E8F0] max-w-sm w-full p-6 rounded-2xl shadow-2xl text-center space-y-4">
              <RefreshCw className="w-12 h-12 text-indigo-600 mx-auto animate-spin" />
              <h4 className="text-sm font-black text-[#0F172A] uppercase tracking-wider">Connection Lost</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Connection Lost: Attempting to reconnect to live dealer room...
              </p>
            </div>
          </motion.div>
        )}

        {/* 3. Server Maintenance Alert Modal */}
        {showMaintenance && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[50] flex items-center justify-center p-4">
            <div className="bg-white border border-[#E2E8F0] max-w-sm w-full p-6 rounded-2xl shadow-2xl text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-[#D97706] mx-auto animate-pulse" />
              <h4 className="text-sm font-black text-[#0F172A] uppercase tracking-wider">Notice</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Notice: Game is under maintenance. Returning to primary game vault selection.
              </p>
              <button 
                onClick={() => {
                  setShowMaintenance(false);
                  window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: 'login' } }));
                }}
                className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider"
              >
                Okay
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
