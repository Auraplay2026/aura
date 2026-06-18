"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  ArrowRight, Trophy, Zap, Gamepad2, TrendingUp, ShieldCheck, Flame, Star, 
  Activity, Crown, Percent, Gift, ChevronRight, ChevronLeft, X, CheckCircle2, AlertCircle,
  Cpu, Monitor, Wifi, Radio, Layers, Gamepad, Play, Shield, Copy, RefreshCw, Terminal, Check
} from "lucide-react";
import { getGamesByCategory, GAMES } from "@/lib/games";
import { ARCADE_GAMES } from "@/lib/arcade-games";
import { GameCard } from "@/components/casino/GameCard";
import { LiveActionFeed } from "@/components/casino/LiveActionFeed";
import { useTradingStore } from "@/lib/store";

interface LiveMatch {
  id: string;
  sport: "cricket" | "soccer" | "tennis";
  title: string;
  status: string;
  selections: {
    name: string;
    back: number;
    lay: number;
  }[];
}

const LIVE_MATCHES_DATA: LiveMatch[] = [
  {
    id: "m1",
    sport: "cricket",
    title: "RCB vs CSK (IPL Live)",
    status: "14.2 Overs • Target 186",
    selections: [
      { name: "Royal Challengers Bangalore", back: 1.90, lay: 1.91 },
      { name: "Chennai Super Kings", back: 1.96, lay: 1.97 }
    ]
  },
  {
    id: "m2",
    sport: "soccer",
    title: "Manchester City vs Real Madrid",
    status: "72' • 2 - 1",
    selections: [
      { name: "Manchester City", back: 2.10, lay: 2.12 },
      { name: "Real Madrid", back: 3.40, lay: 3.45 }
    ]
  },
  {
    id: "m3",
    sport: "tennis",
    title: "Novak Djokovic vs Carlos Alcaraz",
    status: "Set 3 • 4-4 (30-30)",
    selections: [
      { name: "Novak Djokovic", back: 1.75, lay: 1.76 },
      { name: "Carlos Alcaraz", back: 2.10, lay: 2.12 }
    ]
  }
];

const CAROUSEL_SLIDES = [
  {
    id: 1,
    title: "AuraPlay Exchange",
    subtitle: "Get Your Online ID",
    accent: "5% BONUS ON FIRST DEPOSIT",
    bgUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-red-950 via-slate-900 to-slate-900",
    buttonText: "Register Now",
    link: "/auth"
  },
  {
    id: 2,
    title: "Live Sports Arena",
    subtitle: "Unmatched Betting Margins",
    accent: "BET LIVE ON CRICKET, SOCCER, & TENNIS",
    bgUrl: "https://images.unsplash.com/photo-1518605368461-1e128014792c?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-purple-900 via-slate-900 to-slate-900",
    buttonText: "Enter Sportsbook",
    link: "/sportsbook"
  },
  {
    id: 3,
    title: "Instant Arcade Hub",
    subtitle: "Play Premium Games",
    accent: "NEON SURFER, SUGAR CASCADE & ZEN ARCHERY",
    bgUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-emerald-900 via-slate-900 to-slate-900",
    buttonText: "Play Instants",
    link: "/arcade"
  }
];

function HoverCanvasPreview({ type }: { type: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const isCoarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    if (isCoarse) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const handleEnter = () => setIsHovered(true);
    const handleLeave = () => setIsHovered(false);

    parent.addEventListener("mouseenter", handleEnter);
    parent.addEventListener("mouseleave", handleLeave);
    parent.addEventListener("touchstart", handleEnter);
    parent.addEventListener("touchend", handleLeave);
    
    return () => {
      parent.removeEventListener("mouseenter", handleEnter);
      parent.removeEventListener("mouseleave", handleLeave);
      parent.removeEventListener("touchstart", handleEnter);
      parent.removeEventListener("touchend", handleLeave);
    };
  }, []);

  useEffect(() => {
    if (!isHovered) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let frame = 0;
    
    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width || 200;
      canvas.height = rect.height || 250;
    };
    resize();

    const render = () => {
      frame++;
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      if (type === "crash" || type === "originals") {
        // Rocket path
        ctx.strokeStyle = "rgba(6, 182, 212, 0.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w * 0.1, h * 0.8);
        const curveHeight = h * 0.45;
        const progress = (frame % 120) / 120;
        
        ctx.bezierCurveTo(
          w * 0.3, h * 0.8,
          w * 0.6, h * 0.7 - progress * curveHeight,
          w * 0.1 + progress * w * 0.8, h * 0.8 - progress * curveHeight
        );
        ctx.stroke();

        if (progress < 0.94) {
          ctx.fillStyle = "#16a34a"; // readable green
          ctx.beginPath();
          ctx.arc(w * 0.1 + progress * w * 0.8, h * 0.8 - progress * curveHeight, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "#dc2626"; // readable red
          ctx.beginPath();
          ctx.arc(w * 0.1 + progress * w * 0.8, h * 0.8 - progress * curveHeight, 10 * ((frame % 8) / 8), 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === "mines") {
        // flipping cells
        const cols = 3, rows = 3, pad = 8;
        const cardW = (w - pad * (cols + 1)) / cols;
        const cardH = (h - pad * (rows + 1)) / rows;
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const x = pad + c * (cardW + pad);
            const y = pad + r * (cardH + pad);
            const idx = c + r * cols;
            const isFlipped = Math.floor(frame / 35) % 9 === idx;
            if (isFlipped) {
              ctx.fillStyle = idx % 4 === 0 ? "rgba(220, 38, 38, 0.15)" : "rgba(22, 163, 74, 0.15)";
              ctx.strokeStyle = idx % 4 === 0 ? "#dc2626" : "#16a34a";
            } else {
              ctx.fillStyle = "rgba(241, 245, 249, 0.9)";
              ctx.strokeStyle = "rgba(203, 213, 225, 0.6)";
            }
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x, y, cardW, cardH, 6);
            ctx.fill();
            ctx.stroke();
          }
        }
      } else if (type === "plinko") {
        // pegs (darker for light theme)
        ctx.fillStyle = "rgba(100, 116, 139, 0.4)";
        const pegRows = 6;
        for (let r = 0; r < pegRows; r++) {
          const count = r + 3;
          const startX = w / 2 - (count - 1) * 10;
          for (let i = 0; i < count; i++) {
            ctx.beginPath();
            ctx.arc(startX + i * 20, h * 0.15 + r * 16, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        // bounce ball
        const t = (frame % 70) / 70;
        let ballX = w / 2;
        let ballY = h * 0.1 + t * h * 0.65;
        if (t > 0.2) ballX += Math.sin(t * 12) * 10;
        ctx.fillStyle = "#db2777";
        ctx.beginPath();
        ctx.arc(ballX, ballY, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === "limbo") {
        ctx.fillStyle = "#16a34a"; // readable green
        ctx.font = "bold 22px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const val = (1.00 + (frame % 50) * 0.18).toFixed(2) + "x";
        ctx.fillText(val, w / 2, h / 2);
      } else {
        // Grid pattern
        ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 25) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
        }
        for (let i = 0; i < h; i += 25) {
          ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
        }
      }
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [isHovered, type]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-[1px]" />;
}

function NeonHorizonHeroPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const multiplierTextRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let frame = 0;
    let crashPoint = 2.0 + Math.random() * 4.0;
    let currMultiplier = 1.00;
    let state: "run" | "crash" = "run";

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width || 400;
      canvas.height = rect.height || 300;
    };
    resize();

    const render = () => {
      frame++;
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      
      // Light background gradient
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, w, h);

      if (state === "run") {
        currMultiplier += 0.008 + (currMultiplier * 0.006);
        
        // Update direct DOM Node content (Virtual DOM bypass)
        if (multiplierTextRef.current) {
          multiplierTextRef.current.textContent = currMultiplier.toFixed(2) + "x";
        }

        if (currMultiplier >= crashPoint) {
          state = "crash";
          
          if (multiplierTextRef.current) {
            multiplierTextRef.current.textContent = currMultiplier.toFixed(2) + "x";
            multiplierTextRef.current.classList.add("text-red-650", "scale-95");
            multiplierTextRef.current.classList.remove("text-sky-600", "scale-105");
          }
          if (labelRef.current) {
            labelRef.current.textContent = "CRASHED";
            labelRef.current.classList.add("text-red-500");
            labelRef.current.classList.remove("text-slate-500");
          }

          setTimeout(() => {
            state = "run";
            currMultiplier = 1.00;
            crashPoint = 1.8 + Math.random() * 5.0;
            if (multiplierTextRef.current) {
              multiplierTextRef.current.classList.remove("text-red-650", "scale-95");
              multiplierTextRef.current.classList.add("text-sky-600", "scale-105");
            }
            if (labelRef.current) {
              labelRef.current.textContent = "MULTIPLIER";
              labelRef.current.classList.remove("text-red-500");
              labelRef.current.classList.add("text-slate-500");
            }
          }, 2200);
        }

        // 3D Perspective Road lines
        ctx.strokeStyle = "rgba(14, 165, 233, 0.4)"; // Sky blue
        ctx.lineWidth = 1.5;
        const horizonY = h * 0.45;
        const horizonW = w * 0.15;
        const roadW = w * 0.8;

        // horizon
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(w, horizonY);
        ctx.stroke();

        // side lanes
        ctx.beginPath();
        ctx.moveTo(w / 2 - horizonW / 2, horizonY);
        ctx.lineTo(w / 2 - roadW / 2, h);
        ctx.moveTo(w / 2 + horizonW / 2, horizonY);
        ctx.lineTo(w / 2 + roadW / 2, h);
        ctx.stroke();

        // lane dash
        ctx.strokeStyle = "rgba(219, 39, 119, 0.6)"; // Pink
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 25]);
        ctx.beginPath();
        ctx.moveTo(w / 2 - horizonW / 6, horizonY);
        ctx.lineTo(w / 2 - roadW / 6, h);
        ctx.moveTo(w / 2 + horizonW / 6, horizonY);
        ctx.lineTo(w / 2 + roadW / 6, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // stars (darker specs in light sky)
        ctx.fillStyle = "rgba(100, 116, 139, 0.25)";
        for (let i = 0; i < 15; i++) {
          const sx = ((Math.sin(i * 85) + 1) / 2) * w;
          const sy = ((Math.cos(i * 45) + 1) / 2) * horizonY;
          ctx.fillRect(sx, sy, 1.5, 1.5);
        }

        // wireframe car
        const px = w / 2 + Math.sin(frame * 0.06) * 30;
        const py = h * 0.78;
        const cw = 50;
        const ch = 16;
        ctx.fillStyle = "rgba(14, 165, 233, 0.15)";
        ctx.strokeStyle = "#0ea5e9";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(px - cw / 2, py - ch / 2, cw, ch, 4);
        ctx.fill();
        ctx.stroke();

        // spoiler
        ctx.fillStyle = "#db2777";
        ctx.fillRect(px - cw / 2 + 4, py - ch / 2 - 3, cw - 8, 3);

        // grid horizontal bars
        ctx.strokeStyle = "rgba(14, 165, 233, 0.18)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 7; i++) {
          const t = ((i * 45 + frame * 3.5) % 250) / 250;
          const gy = horizonY + t * (h - horizonY);
          const gw = horizonW + t * (roadW - horizonW);
          ctx.beginPath();
          ctx.moveTo(w / 2 - gw / 2, gy);
          ctx.lineTo(w / 2 + gw / 2, gy);
          ctx.stroke();
        }
      } else {
        // crash flash (reddish light)
        ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#dc2626";
        ctx.font = "italic bold 26px font-black tracking-widest";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("CRASHED!", w / 2, h / 2 - 15);
        ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
        ctx.font = "bold 16px monospace";
        ctx.fillText(`@ ${currMultiplier.toFixed(2)}x`, w / 2, h / 2 + 18);
      }
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [isVisible]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-slate-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-t from-slate-100 via-slate-50/10 to-white/40 opacity-70 z-10" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 pointer-events-none">
        <span className="text-[9px] bg-sky-100 border border-sky-200 text-sky-700 font-bold px-2 py-0.5 rounded tracking-widest uppercase">
          AURA ENGINE v1.1
        </span>
        <span className="text-[8px] text-slate-500 font-mono">
          SEED SECURE | WEBGL 60FPS
        </span>
      </div>
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <span className="flex items-center gap-1.5 px-3 py-1 bg-white/80 border border-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-widest rounded-full backdrop-blur-md shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          ACTIVE TEST LAB
        </span>
      </div>
      <div className="absolute z-20 flex flex-col items-center pointer-events-none">
        <span ref={labelRef} className="text-[9px] text-slate-500 font-bold uppercase tracking-widest transition-colors duration-300">MULTIPLIER</span>
        <span ref={multiplierTextRef} className="text-4xl font-black font-mono tracking-tight drop-shadow-sm text-sky-600 scale-105 transition-all duration-300">
          1.00x
        </span>
      </div>
    </div>
  );
}

export default function GlobalHomepage() {
  const featuredCasino = getGamesByCategory("slots").slice(0, 8);
  const featuredArcade = ARCADE_GAMES.slice(0, 4);
  const originals = getGamesByCategory("originals").slice(0, 4);
  const liveDealers = getGamesByCategory("live").slice(0, 4);
  const inHouseOriginals = GAMES.filter(g => 
    ["orig-15", "orig-1", "orig-3", "orig-4", "orig-2", "orig-8", "orig-12", "orig-13"].includes(g.id)
  );
  const aaaCloudRentals = GAMES.filter(g => 
    ["aaa-7", "aaa-8", "aaa-9", "aaa-10", "aaa-11"].includes(g.id)
  );
  const slots3d = GAMES.filter(g => 
    ["slot-20", "slot-21", "slot-22", "slot-23", "slot-24"].includes(g.id)
  );
  const liveVR = GAMES.filter(g => 
    ["live-8", "live-9", "live-10", "live-11", "live-12"].includes(g.id)
  );

  // Live wins ticker simulation state
  const [liveWins, setLiveWins] = useState<Array<{
    id: string;
    username: string;
    gameTitle: string;
    multiplier: number;
    betAmount: number;
    profit: number;
    time: string;
  }>>([
    { id: "w1", username: "cr***on", gameTitle: "Neon Horizon 3D", multiplier: 2.40, betAmount: 500, profit: 1200, time: "Just Now" },
    { id: "w2", username: "pl***er", gameTitle: "Plinko Original", multiplier: 1.50, betAmount: 1000, profit: 1500, time: "2s ago" },
    { id: "w3", username: "ze***th", gameTitle: "Mines Pro", multiplier: 4.80, betAmount: 300, profit: 1440, time: "5s ago" },
    { id: "w4", username: "sh***ow", gameTitle: "Crash Multiplier", multiplier: 12.50, betAmount: 200, profit: 2500, time: "8s ago" },
    { id: "w5", username: "ki***er", gameTitle: "Blackjack Pro 3D", multiplier: 2.00, betAmount: 1500, profit: 3000, time: "12s ago" }
  ]);

  // Seed verifier state
  const [serverSeed, setServerSeed] = useState("bf12a67e890c23fa6e7b1029c83f12a938c01d90fa8f2371dbe48d7120aef130");
  const [clientSeed, setClientSeed] = useState("auraplay_client_nonce_82937");
  const [nonce, setNonce] = useState(1);
  const [calculatedHash, setCalculatedHash] = useState("");
  const [calculatedMultiplier, setCalculatedMultiplier] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Periodic win simulator
  useEffect(() => {
    const interval = setInterval(() => {
      const games = ["Neon Horizon 3D", "Crash Original", "Plinko", "Mines", "Limbo", "Dice Original", "HiLo Pro", "Blackjack 3D"];
      const prefixes = ["au", "ze", "vi", "lu", "sp", "st", "sh", "cr", "op", "no"];
      const suffixes = ["88", "king", "pro", "bet", "win", "x", "99", "vip", "play"];
      const randGame = games[Math.floor(Math.random() * games.length)];
      const randUser = prefixes[Math.floor(Math.random() * prefixes.length)] + "***" + suffixes[Math.floor(Math.random() * suffixes.length)];
      const randBet = Math.floor(Math.random() * 4) * 200 + 100;
      const randMult = parseFloat((99 / (100 - (Math.random() * 80 + 5))).toFixed(2));
      const profit = Math.round(randBet * randMult);

      setLiveWins(prev => [
        {
          id: "w-" + Math.random(),
          username: randUser,
          gameTitle: randGame,
          multiplier: randMult,
          betAmount: randBet,
          profit: profit,
          time: "Just Now"
        },
        ...prev.slice(0, 4)
      ]);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const msg = `${serverSeed}:${clientSeed}:${nonce}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(msg);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      setCalculatedHash(hashHex);
      const hexVal = hashHex.substring(0, 8);
      const num = parseInt(hexVal, 16);
      const percent = (num % 100);
      const outcome = percent === 0 ? 1.00 : parseFloat((99 / (100 - percent)).toFixed(2));
      setCalculatedMultiplier(Math.max(1.00, outcome));
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progressActive, setProgressActive] = useState(false);
  
  // Betslip state
  const { isLoggedIn, balance, placeSportsBet } = useTradingStore();
  const [selectedBet, setSelectedBet] = useState<{
    matchTitle: string;
    selectionName: string;
    odds: number;
    type: "back" | "lay";
  } | null>(null);
  const [stake, setStake] = useState<string>("500");
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [betSuccess, setBetSuccess] = useState(false);
  const [betError, setBetError] = useState("");

  // Slide rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Progress bar reset on slide change
  useEffect(() => {
    setProgressActive(false);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setProgressActive(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [currentSlide]);

  const handleOddsClick = (bet: { matchTitle: string; selectionName: string; odds: number; type: "back" | "lay" }) => {
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: 'login' } }));
      return;
    }
    setSelectedBet(bet);
  };

  const handlePlaceBet = async () => {
    if (!isLoggedIn) {
      setBetError("Please log in to place wagers.");
      // Open auth login modal
      window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: 'login' } }));
      return;
    }

    const stakeNum = parseFloat(stake);
    if (isNaN(stakeNum) || stakeNum <= 0) {
      setBetError("Invalid stake amount.");
      return;
    }

    if (stakeNum > balance) {
      setBetError("Insufficient balance.");
      return;
    }

    setIsPlacingBet(true);
    setBetError("");
    
    try {
      if (selectedBet) {
        // Zustand action
        placeSportsBet(
          selectedBet.matchTitle,
          selectedBet.selectionName,
          selectedBet.odds,
          stakeNum
        );
        setBetSuccess(true);
        setTimeout(() => {
          setSelectedBet(null);
          setBetSuccess(false);
        }, 1500);
      }
    } catch (err) {
      setBetError("Failed to place bet. Please try again.");
    } finally {
      setIsPlacingBet(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-20 w-full overflow-hidden px-4 sm:px-6 lg:px-8 mt-6">
      
      {/* 1. TOP PROMO BANNER CAROUSEL */}
      <div className="relative w-full rounded-md overflow-hidden aspect-[16/9] md:aspect-[6/1] lg:aspect-[8/1] flex items-center bg-slate-900 shadow-sm group">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${CAROUSEL_SLIDES[currentSlide].gradient} z-10`} />
            <div 
              className="absolute right-0 top-0 bottom-0 w-1/2 bg-cover bg-center opacity-30 mix-blend-luminosity z-0" 
              style={{ backgroundImage: `url('${CAROUSEL_SLIDES[currentSlide].bgUrl}')` }}
            />
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-transparent to-slate-900 z-10" />
            
            <div className="relative z-20 flex items-center justify-between w-full px-6 md:px-12">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-400 font-black tracking-widest uppercase text-sm md:text-base">
                    {CAROUSEL_SLIDES[currentSlide].title}
                  </span>
                </div>
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase italic">
                  {CAROUSEL_SLIDES[currentSlide].subtitle}
                </h2>
                <div className="mt-2 inline-block px-4 py-1 border-2 border-yellow-400 text-yellow-400 font-bold text-xs md:text-sm w-max uppercase tracking-wider">
                  {CAROUSEL_SLIDES[currentSlide].accent}
                </div>
              </div>
              <Link href={CAROUSEL_SLIDES[currentSlide].link} className="hidden md:flex bg-yellow-400 text-slate-900 font-black px-6 py-3 rounded uppercase items-center gap-2 hover:bg-yellow-300 transition-colors cursor-pointer shadow-md">
                {CAROUSEL_SLIDES[currentSlide].buttonText} <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {CAROUSEL_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${currentSlide === index ? 'bg-yellow-400 w-6' : 'bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 w-24 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full"
            style={{
              width: progressActive ? '100%' : '0%',
              transition: progressActive ? 'width 6s linear' : 'none',
            }}
          />
        </div>

        {/* Arrow Navigation */}
        <button 
          onClick={() => setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)}
          className="absolute left-4 z-20 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length)}
          className="absolute right-4 z-20 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 2. SECOND ROW: SPORTS LIVE MATCHES (60%) & BLOG (40%) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        
        {/* SPORTS LIVE ODDS WIDGET */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-md p-5 flex flex-col justify-between shadow-sm relative overflow-hidden ring-1 ring-red-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">Live Exchange Matches</h3>
            </div>
            <Link href="/sportsbook" className="text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest flex items-center gap-1 transition-colors">
              Full Sportsbook <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {LIVE_MATCHES_DATA.map((match) => (
              <div key={match.id} className="border border-slate-100 rounded p-3 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900 truncate max-w-[220px] sm:max-w-none">{match.title}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{match.status}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {match.selections.map((sel, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white border border-slate-200 rounded px-3 py-1.5 shadow-sm">
                      <span className="text-[11px] font-bold text-slate-800 truncate pr-2">{sel.name.split(" ").slice(-1)[0]}</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleOddsClick({ matchTitle: match.title, selectionName: sel.name, odds: sel.back, type: 'back' })}
                          className="w-12 py-1 bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 rounded text-center text-emerald-800 transition-colors"
                        >
                          <span className="block text-[8px] font-black uppercase text-emerald-700/80 leading-none">Back</span>
                          <span className="text-xs font-black font-mono leading-none">{sel.back.toFixed(2)}</span>
                        </button>
                        <button 
                          onClick={() => handleOddsClick({ matchTitle: match.title, selectionName: sel.name, odds: sel.lay, type: 'lay' })}
                          className="w-12 py-1 bg-pink-100 hover:bg-pink-200 border border-pink-200 rounded text-center text-pink-800 transition-colors"
                        >
                          <span className="block text-[8px] font-black uppercase text-pink-700/80 leading-none">Lay</span>
                          <span className="text-xs font-black font-mono leading-none">{sel.lay.toFixed(2)}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BLOG BANNER */}
        <Link href="/blog" className="md:col-span-2 relative w-full rounded-md overflow-hidden aspect-[16/9] md:aspect-auto md:h-auto bg-gradient-to-br from-yellow-400 to-amber-500 group cursor-pointer shadow-sm hover:shadow-xl transition-shadow duration-300 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />
          <div className="relative z-10 flex flex-col items-center w-full">
            <div className="bg-red-600 text-white font-black text-6xl md:text-7xl italic tracking-tighter px-6 py-2 rounded-xl shadow-xl transform -rotate-2 mb-4 border-4 border-white">
              BLOG
            </div>
            <p className="text-slate-900 font-black uppercase tracking-widest text-sm mb-6 bg-white px-3 py-1 rounded">News | Sporting Info | Etc.</p>
            
            <div className="flex justify-center gap-4 text-slate-900 w-full bg-slate-900/10 p-3 rounded-lg">
              <div className="flex flex-col items-center gap-1"><Trophy className="w-6 h-6" /><span className="text-[9px] font-bold uppercase">Cricket</span></div>
              <div className="flex flex-col items-center gap-1"><Activity className="w-6 h-6" /><span className="text-[9px] font-bold uppercase">Tennis</span></div>
              <div className="flex flex-col items-center gap-1"><Star className="w-6 h-6" /><span className="text-[9px] font-bold uppercase">Football</span></div>
            </div>
          </div>
        </Link>

      </div>

      {/* 3. THIRD ROW: PROVIDERS (33% each) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Betradar */}
        <Link href="/casino?provider=betradar" className="relative w-full rounded-md overflow-hidden aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/10] bg-rose-950 group cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700 opacity-60 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-rose-950 to-transparent" />
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-end p-6">
             <h3 className="text-3xl font-black text-white tracking-tighter mb-1">bet<span className="text-rose-400">radar</span></h3>
          </div>
        </Link>

        {/* Evolution */}
        <Link href="/casino?provider=evolution" className="relative w-full rounded-md overflow-hidden aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/10] bg-purple-900 group cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700 opacity-50 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900 to-transparent" />
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-end p-6">
             <div className="flex items-center gap-2 mb-1">
               <Flame className="w-8 h-8 text-white" />
               <h3 className="text-3xl font-black text-white tracking-tighter">Evolution</h3>
             </div>
          </div>
        </Link>

        {/* SmartSoft */}
        <Link href="/casino?provider=smartsoft" className="relative w-full rounded-md overflow-hidden aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/10] bg-slate-900 group cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518331647614-7a1f04cd34ce?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700 opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-end p-6">
             <div className="flex items-center gap-2 mb-1">
               <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black italic">S</div>
               <h3 className="text-3xl font-black text-white tracking-tighter">SmartSoft</h3>
             </div>
          </div>
        </Link>

      </div>

      <div className="h-6" /> {/* Spacer */}

      {/* 4. PREMIUM 3D & AAA HIGH-MOTION LOBBY (TOP 1% OVERHAUL) */}
       {/* 4. PREMIUM 3D & AAA HIGH-MOTION LOBBY (TOP 1% LIGHT OVERHAUL) */}
      
      {/* ========================================== */}
      {/* CATEGORY 1: AURA PLAY IN-HOUSE ORIGINALS */}
      {/* ========================================== */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.6 }} 
        className="w-full mt-4 bg-white border border-slate-200/80 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8 relative z-10 border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] bg-cyan-50 border border-cyan-200 text-cyan-700 font-black tracking-[0.25em] uppercase px-3 py-1 rounded-full w-max flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-cyan-600 animate-pulse" /> 99.0% RTP PROVABLY FAIR
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none mt-2">
              AuraPlay <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 drop-shadow-sm">In-House Originals</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Ultra High-Frame-Rate physics-based games operating on verifiably fair seed hashes.
            </p>
          </div>
          <Link href="/casino" className="text-xs font-black text-slate-400 hover:text-cyan-600 uppercase tracking-widest flex items-center gap-1 transition-colors">
            All Casino <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Flagship Hero Card & Originals Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          
          {/* Flagship Hero Panel (Neon Horizon 3D) */}
          <div className="col-span-1 lg:col-span-2 relative min-h-[300px] lg:min-h-auto rounded-[2rem] overflow-hidden border border-slate-200 bg-white flex flex-col md:flex-row group shadow-md">
            {/* Live 3D Canvas Preview */}
            <div className="w-full md:w-[60%] relative h-[200px] md:h-auto overflow-hidden border-b md:border-b-0 md:border-r border-slate-100">
              <NeonHorizonHeroPreview />
            </div>

            {/* Launch Settings Panel */}
            <div className="w-full md:w-[40%] p-6 flex flex-col justify-between bg-slate-50/60 relative z-20 backdrop-blur-md">
              <div>
                <span className="text-[8px] font-black text-cyan-600 tracking-[0.2em] uppercase">FLAGSHIP RELEASE</span>
                <h3 className="text-slate-900 font-black text-xl tracking-tight uppercase mt-1">Neon Horizon 3D</h3>
                <p className="text-slate-600 text-xs mt-2 leading-relaxed font-semibold">
                  Race a cyber supercar down a neon obstacle course. Outcomes sync with compliance math and trigger hyperspace cashouts.
                </p>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
                    <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">RTP RATE</span>
                    <span className="text-[11px] text-emerald-600 font-black font-mono">99.0%</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
                    <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">MAX WIN</span>
                    <span className="text-[11px] text-purple-600 font-black font-mono">10,000x</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link 
                  href="/casino/game/orig-15"
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_4px_15px_rgba(6,182,212,0.2)] hover:shadow-[0_4px_20px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  LAUNCH MISSION <Play className="w-3 h-3 fill-white" />
                </Link>
              </div>
            </div>
          </div>

          {/* Side Column: Other Originals Cards */}
          <div className="grid grid-cols-2 gap-4">
            {inHouseOriginals.filter(g => g.id !== "orig-15").slice(0, 4).map(game => {
              const textGrad = "from-cyan-600 to-blue-600";
              return (
                <div key={game.id} className="relative group">
                  <Link 
                    href={`/casino/game/${game.id}`}
                    className="block w-full aspect-[4/5] rounded-[1.8rem] overflow-hidden bg-slate-50 border border-slate-150 transition-all duration-500 hover:-translate-y-1.5 hover:border-cyan-400 hover:shadow-[0_10px_25px_rgba(0,0,0,0.05)] relative"
                  >
                    <HoverCanvasPreview type={game.id.split('-')[1]} />
                    <img 
                      src={game.image} 
                      alt={game.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-45"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent z-10" />

                    <div className="absolute top-3 inset-x-3 flex justify-between items-center z-20 pointer-events-none">
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-white/80 border border-slate-200/80 text-slate-800 text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        {(game.players || 1200) > 1000 ? ((game.players || 1200) / 1000).toFixed(1) + 'k' : game.players} LIVE
                      </span>
                    </div>

                    <div className="absolute bottom-0 inset-x-0 p-4 z-20 flex flex-col justify-end bg-gradient-to-t from-white via-white/95 to-transparent pt-8">
                      <span className={`text-[7px] font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r ${textGrad}`}>
                        ORIGINAL
                      </span>
                      <h4 className="text-slate-900 font-black text-xs sm:text-sm tracking-tight leading-tight line-clamp-1 mt-0.5 group-hover:text-cyan-600 transition-colors">
                        {game.title}
                      </h4>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                        <p className="text-[7px] text-slate-400 font-bold uppercase">RTP {game.rtp}%</p>
                        <div className="flex items-center gap-0.5 px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                          PLAY <Play className="w-1.5 h-1.5 fill-white" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

        </div>

        {/* Live Wins Ticker & Seed Verifier Sandbox */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-100 relative z-10">
          
          {/* Live win feed */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Live Platform Payouts</h4>
              </div>
              
              <div className="space-y-2.5">
                {liveWins.map((win) => (
                  <div key={win.id} className="flex items-center justify-between border border-slate-200 bg-white rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 font-black text-[9px] uppercase italic">
                        {win.gameTitle.split(" ")[0].substring(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800">{win.username}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{win.gameTitle}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-emerald-600 font-mono">₹{win.profit}</span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase font-mono">Mult: {win.multiplier.toFixed(2)}x</span>
                      </div>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{win.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Seed Verifier tool */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-cyan-600" />
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Provably Fair Verifier Sandbox</h4>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Client Seed / Nonce</label>
                    <input 
                      type="text" 
                      value={clientSeed}
                      onChange={(e) => setClientSeed(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Round Nonce</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={nonce}
                        onChange={(e) => setNonce(parseInt(e.target.value) || 1)}
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-cyan-500 w-20"
                      />
                      <button 
                        onClick={() => setNonce(prev => prev + 1)}
                        className="px-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-950 transition-colors cursor-pointer"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Active Server Seed (SHA-256 Hash)</label>
                  <input 
                    type="text" 
                    value={serverSeed}
                    onChange={(e) => setServerSeed(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-800 font-mono font-bold focus:outline-none focus:border-cyan-500 w-full"
                  />
                </div>

                {calculatedHash && (
                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1 shadow-sm">
                    <span className="block text-[8px] text-slate-400 font-black uppercase tracking-widest">RESULTING COMBINED HASH</span>
                    <span className="block text-[9px] text-slate-700 font-mono break-all font-semibold select-all">{calculatedHash}</span>
                    {calculatedMultiplier && (
                      <div className="pt-2 border-t border-slate-100 mt-2 flex justify-between items-center">
                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">VERIFIED OUTCOME</span>
                        <span className="text-xs text-emerald-600 font-black font-mono">{calculatedMultiplier.toFixed(2)}x</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <button 
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-full py-2.5 bg-white hover:bg-slate-50 text-cyan-600 hover:text-cyan-700 font-black text-[10px] uppercase tracking-widest rounded-xl border border-cyan-200 shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                RUN CRYPTOGRAPHIC SHUFFLE
              </button>
            </div>
          </div>

        </div>

      </motion.section>

      {/* ========================================== */}
      {/* CATEGORY 2: AAA CLOUD STREAMING RENTALS */}
      {/* ========================================== */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.6 }} 
        className="w-full mt-6 bg-white border border-slate-200/80 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8 relative z-10 border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] bg-purple-50 border border-purple-250 text-purple-700 font-black tracking-[0.25em] uppercase px-3 py-1 rounded-full w-max flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-purple-600 animate-spin" /> NVIDIA RTX 4090 DEDICATED
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none mt-2">
              AAA <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600 drop-shadow-sm">Cloud Rentals</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Instantly rent high-end gaming rigs. WebRTC 4K streams with less than 1ms node latency.
            </p>
          </div>
          <Link href="/casino" className="text-xs font-black text-slate-400 hover:text-purple-600 uppercase tracking-widest flex items-center gap-1 transition-colors">
            Enter Cloud Arena <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5 relative z-10">
          {aaaCloudRentals.slice(0, 5).map(game => {
            const textGrad = "from-purple-600 to-fuchsia-600";
            return (
              <div key={game.id} className="relative group">
                <Link 
                  href={`/casino/game/${game.id}`}
                  className="block w-full aspect-[4/5] rounded-[1.8rem] overflow-hidden bg-slate-50 border border-slate-150 transition-all duration-500 hover:-translate-y-1.5 hover:border-purple-400 hover:shadow-[0_10px_25px_rgba(0,0,0,0.05)] relative"
                >
                  <img 
                    src={game.image} 
                    alt={game.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-45"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent z-10" />

                  <div className="absolute top-3 inset-x-3 flex justify-between items-center z-20 pointer-events-none">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-white/80 border border-slate-200/80 text-slate-800 text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      {(game.players || 4500) > 1000 ? ((game.players || 4500) / 1000).toFixed(1) + 'k' : game.players} LIVE
                    </span>
                    <span className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm">
                      ₹{game.hourlyRate}/HR
                    </span>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-4 z-20 flex flex-col justify-end bg-gradient-to-t from-white via-white/95 to-transparent pt-8">
                    <span className={`text-[7px] font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r ${textGrad}`}>
                      CLOUD RENTAL
                    </span>
                    <h4 className="text-slate-900 font-black text-xs sm:text-sm tracking-tight leading-tight line-clamp-1 mt-0.5 group-hover:text-purple-600 transition-colors">
                      {game.title}
                    </h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                      <p className="text-[7px] text-slate-400 font-bold uppercase">GPU RTX 4090</p>
                      <div className="flex items-center gap-0.5 px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                        RENT <Play className="w-1.5 h-1.5 fill-white" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* ========================================== */}
      {/* CATEGORY 3: PREMIUM 3D SLOTS */}
      {/* ========================================== */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.6 }} 
        className="w-full mt-6 bg-white border border-slate-200/80 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8 relative z-10 border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] bg-rose-50 border border-rose-250 text-rose-700 font-black tracking-[0.25em] uppercase px-3 py-1 rounded-full w-max flex items-center gap-1.5">
              <Star className="w-3 h-3 text-rose-600" /> CASCADE & CLUSTERS
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none mt-2">
              Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600 drop-shadow-sm">3D Slots</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Stunning visual effects, rolling multipliers, and huge free spin trigger potentials.
            </p>
          </div>
          <Link href="/casino" className="text-xs font-black text-slate-400 hover:text-rose-600 uppercase tracking-widest flex items-center gap-1 transition-colors">
            All Slots <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5 relative z-10">
          {slots3d.slice(0, 5).map(game => {
            const textGrad = "from-pink-600 to-rose-600";
            return (
              <div key={game.id} className="relative group">
                <Link 
                  href={`/casino/game/${game.id}`}
                  className="block w-full aspect-[4/5] rounded-[1.8rem] overflow-hidden bg-slate-50 border border-slate-155 transition-all duration-500 hover:-translate-y-1.5 hover:border-pink-400 hover:shadow-[0_10px_25px_rgba(0,0,0,0.05)] relative"
                >
                  <img 
                    src={game.image} 
                    alt={game.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-45"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent z-10" />

                  <div className="absolute top-3 inset-x-3 flex justify-between items-center z-20 pointer-events-none">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-white/80 border border-slate-200/80 text-slate-800 text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      {(game.players || 18000) > 1000 ? ((game.players || 18000) / 1000).toFixed(1) + 'k' : game.players} LIVE
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-250 text-emerald-700 text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm">
                      RTP {game.rtp || 96.5}%
                    </span>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-4 z-20 flex flex-col justify-end bg-gradient-to-t from-white via-white/95 to-transparent pt-8">
                    <span className={`text-[7px] font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r ${textGrad}`}>
                      VIDEO SLOT
                    </span>
                    <h4 className="text-slate-900 font-black text-xs sm:text-sm tracking-tight leading-tight line-clamp-1 mt-0.5 group-hover:text-pink-600 transition-colors">
                      {game.title}
                    </h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                      <p className="text-[7px] text-slate-400 font-bold uppercase">3D RENDERED</p>
                      <div className="flex items-center gap-0.5 px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                        SPIN <Play className="w-1.5 h-1.5 fill-white" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* ========================================== */}
      {/* CATEGORY 4: LIVE VR & TABLE CASINO */}
      {/* ========================================== */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.6 }} 
        className="w-full mt-6 bg-white border border-slate-200/80 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8 relative z-10 border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] bg-amber-50 border border-amber-250 text-amber-700 font-black tracking-[0.25em] uppercase px-3 py-1 rounded-full w-max flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-amber-600" /> ULTRA-LOW LATENCY STREAM
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none mt-2">
              Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600 drop-shadow-sm">VR Casino</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Interact with real dealers. 4K WebRTC feed broadcasts with physical table integrations.
            </p>
          </div>
          <Link href="/casino" className="text-xs font-black text-slate-400 hover:text-amber-600 uppercase tracking-widest flex items-center gap-1 transition-colors">
            Enter Live Arena <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5 relative z-10">
          {liveVR.slice(0, 5).map(game => {
            const textGrad = "from-yellow-650 to-amber-600";
            return (
              <div key={game.id} className="relative group">
                <Link 
                  href={`/casino/game/${game.id}`}
                  className="block w-full aspect-[4/5] rounded-[1.8rem] overflow-hidden bg-slate-55 border border-slate-150 transition-all duration-500 hover:-translate-y-1.5 hover:border-amber-400 hover:shadow-[0_10px_25px_rgba(0,0,0,0.05)] relative"
                >
                  <img 
                    src={game.image} 
                    alt={game.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-45"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent z-10" />

                  <div className="absolute top-3 inset-x-3 flex justify-between items-center z-20 pointer-events-none">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-white/80 border border-slate-200/80 text-slate-800 text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      {(game.players || 24000) > 1000 ? ((game.players || 24000) / 1000).toFixed(1) + 'k' : game.players} LIVE
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-250 text-emerald-700 text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm">
                      RTP {game.rtp || 97.2}%
                    </span>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-4 z-20 flex flex-col justify-end bg-gradient-to-t from-white via-white/95 to-transparent pt-8">
                    <span className={`text-[7px] font-black uppercase tracking-[0.2em] text-slate-500`}>
                      LIVE DEALER
                    </span>
                    <h4 className="text-slate-900 font-black text-xs sm:text-sm tracking-tight leading-tight line-clamp-1 mt-0.5 group-hover:text-amber-600 transition-colors">
                      {game.title}
                    </h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                      <p className="text-[7px] text-slate-400 font-bold uppercase">4K WebRTC</p>
                      <div className="flex items-center gap-0.5 px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                        JOIN <Play className="w-1.5 h-1.5 fill-white" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* 8. LIVE ACTION FEED & ACTIVITY */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.25 }} className="w-full mt-8 border-t border-slate-200 pt-8">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Platform Activity & Live Wins</h2>
        </div>
        <LiveActionFeed />
      </motion.section>

      {/* 9. QUICK BET SLIP MODAL */}
      <AnimatePresence>
        {selectedBet && (
          <>
            {/* Dim Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBet(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
            >
              {/* Slip Card */}
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] overflow-hidden"
              >
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-red-600" /> Quick Wager Slip
                  </span>
                  <button onClick={() => setSelectedBet(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{selectedBet.matchTitle}</div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-900 text-sm">{selectedBet.selectionName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${selectedBet.type === 'back' ? 'bg-emerald-100 text-emerald-800' : 'bg-pink-100 text-pink-800'}`}>
                      {selectedBet.type} @ {selectedBet.odds.toFixed(2)}
                    </span>
                  </div>

                  {betSuccess ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-xs font-black">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      Bet Placed Successfully!
                    </div>
                  ) : (
                    <>
                      {betError && (
                        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded flex items-center gap-2 text-xs font-semibold">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          {betError}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">Stake Amount (₹)</label>
                        <input 
                          type="number"
                          value={stake}
                          onChange={(e) => setStake(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-bold font-mono focus:outline-none focus:border-red-600 transition-colors"
                        />
                      </div>

                      {/* Quick Stake Buttons */}
                      <div className="grid grid-cols-4 gap-2">
                        {["100", "500", "1000", "5000"].map((s) => (
                          <button
                            key={s}
                            onClick={() => setStake(s)}
                            className={`py-1.5 border rounded text-xs font-bold font-mono transition-colors ${stake === s ? 'bg-red-600 text-white border-red-600' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}`}
                          >
                            ₹{s}
                          </button>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-600">
                        <span>Est. Return</span>
                        <span className="text-slate-900 font-mono text-sm">
                          ₹{((parseFloat(stake) || 0) * selectedBet.odds).toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={handlePlaceBet}
                        disabled={isPlacingBet}
                        className={`w-full py-3 rounded-xl font-black uppercase tracking-wider text-xs shadow-md transition-all ${
                          selectedBet.type === 'back' 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' 
                            : 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-500/20'
                        } disabled:opacity-50`}
                      >
                        {isPlacingBet ? "Processing..." : "Confirm Wager"}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
