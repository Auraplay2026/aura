"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  ArrowRight, Trophy, Zap, Gamepad2, TrendingUp, ShieldCheck, Flame, Star, 
  Activity, Crown, Percent, Gift, ChevronRight, ChevronLeft, X, CheckCircle2, AlertCircle,
  Cpu, Monitor, Wifi, Radio, Layers, Gamepad, Play, Shield, Copy, RefreshCw, Terminal, Check,
  MessageCircle, Sparkles, SlidersHorizontal, HelpCircle
} from "lucide-react";
import { getGamesByCategory, GAMES } from "@/lib/games";
import { ARCADE_GAMES } from "@/lib/arcade-games";
import { GameCard } from "@/components/casino/GameCard";
import { LiveActionFeed } from "@/components/casino/LiveActionFeed";
import { LiveExchangeWidget } from "@/components/sportsbook/LiveExchangeWidget";
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
    title: "🏏 India's #1 Live Cricket Bhav Exchange",
    subtitle: "0% Commission Bhav • 0.2s Pitch-Side Radar",
    accent: "₹10,000 WELCOME BONUS ON 1ST UPI DEPOSIT",
    bgUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-emerald-100 via-teal-50 to-slate-50",
    buttonText: "Bet On Live Cricket",
    link: "/sportsbook/cricket"
  },
  {
    id: 2,
    title: "🎴 Desi Teen Patti & Super Andar Bahar",
    subtitle: "Live Hindi Dealers • 10% Instant Daily Cashback",
    accent: "24/7 4K LIVE STREAMING • 1-TAP INSTANT SEATING",
    bgUrl: "https://images.unsplash.com/photo-1518605368461-1e128014792c?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-amber-100 via-orange-50 to-slate-50",
    buttonText: "Enter Desi Club",
    link: "/casino"
  },
  {
    id: 3,
    title: "🚀 Aviator & Turbo Multiplier Arena",
    subtitle: "Cashout up to 10,000x • Instant 15-Sec UPI Payouts",
    accent: "100% PROVABLY FAIR CRYPTOGRAPHIC ENGINE",
    bgUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-sky-100 via-indigo-50 to-slate-50",
    buttonText: "Play Turbo Crash",
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
  const desiLiveGames = GAMES.filter(g => 
    ["royal-1-20", "royal-3", "royal-6", "orig-r6", "royal-5", "royal-1", "royal-4"].includes(g.id)
  );
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

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progressActive, setProgressActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [jackpot, setJackpot] = useState(14892450.40);
  const currentUser = useTradingStore(state => state.currentUser);
  const switchAccountType = useTradingStore(state => state.switchAccountType);
  const isLoggedIn = useTradingStore(state => state.isLoggedIn);
  const accountType = currentUser?.accountType || 'real';

  useEffect(() => {
    const jInterval = setInterval(() => {
      setJackpot(prev => prev + 0.45 + Math.random() * 0.85);
    }, 1500);
    return () => clearInterval(jInterval);
  }, []);
  
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

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-20 w-full overflow-hidden px-4 sm:px-6 lg:px-8 mt-6">
      
      {/* 1. TOP PROMO BANNER CAROUSEL */}
      <div className="relative w-full rounded-2xl overflow-hidden min-h-[220px] md:min-h-[250px] lg:h-[270px] flex items-center bg-slate-50 border border-slate-200/80 shadow-sm group">
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
              className="absolute right-0 top-0 bottom-0 w-1/2 bg-cover bg-center opacity-20 mix-blend-luminosity z-0" 
              style={{ backgroundImage: `url('${CAROUSEL_SLIDES[currentSlide].bgUrl}')` }}
            />
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-transparent to-slate-50 z-10" />
            
            <div className="relative z-20 flex items-center justify-between w-full px-6 md:px-12 py-6">
              <div className="flex flex-col max-w-2xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 fill-indigo-600/10" />
                  <span className="text-indigo-750 font-black tracking-widest uppercase text-xs md:text-sm">
                    {CAROUSEL_SLIDES[currentSlide].title}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight uppercase italic leading-tight">
                  {CAROUSEL_SLIDES[currentSlide].subtitle}
                </h2>
                <div className="mt-2.5 inline-block px-3 py-1 border-2 border-indigo-600 text-indigo-700 bg-indigo-50/80 rounded-lg font-bold text-[11px] md:text-xs w-max uppercase tracking-wider shadow-xs">
                  {CAROUSEL_SLIDES[currentSlide].accent}
                </div>
              </div>
              <Link href={CAROUSEL_SLIDES[currentSlide].link} className="hidden md:flex bg-indigo-600 text-white font-black px-6 py-3 rounded-xl uppercase items-center gap-2 hover:bg-indigo-700 transition-all cursor-pointer shadow-md hover:shadow-lg hover:scale-105 active:scale-95 shrink-0 text-xs tracking-wider">
                {CAROUSEL_SLIDES[currentSlide].buttonText} <ChevronRight className="w-4 h-4" />
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
          className="absolute left-4 z-20 w-8 h-8 rounded-full bg-white/60 hover:bg-white border border-slate-700/50 flex items-center justify-center text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length)}
          className="absolute right-4 z-20 w-8 h-8 rounded-full bg-white/60 hover:bg-white border border-slate-700/50 flex items-center justify-center text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ── 2. SOVEREIGN PROOF OF LIQUIDITY & INDIAN PAYMENT TRUST STRIP ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-sm">
        <div className="flex items-center gap-2.5 p-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
            <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600/10" />
          </div>
          <div>
            <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">Instant Payouts</div>
            <div className="text-xs sm:text-sm font-black font-mono text-emerald-700">⚡ 15-Sec Direct UPI</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-1">
          <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0 shadow-xs">
            <Radio className="w-4 h-4 text-sky-600 animate-pulse" />
          </div>
          <div>
            <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pitch-Side Sync</div>
            <div className="text-xs sm:text-sm font-black font-mono text-slate-900">0.2s Cricket Radar</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-1">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">Solvency Reserve</div>
            <div className="text-xs sm:text-sm font-black font-mono text-slate-900">100% Reserve Backed</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-1">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 shadow-xs">
            <Percent className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">Market Bhav</div>
            <div className="text-xs sm:text-sm font-black font-mono text-slate-900">0% Commission Odds</div>
          </div>
        </div>
      </div>

      {/* ── 3. LIVE SOCIAL PROOF & RECENT INDIAN HIGH-ROLLER WINS TICKER ── */}
      <div className="w-full bg-slate-900 text-white rounded-xl px-4 py-2.5 flex items-center gap-3 overflow-hidden shadow-md border border-slate-800">
        <div className="flex items-center gap-1.5 shrink-0 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          LIVE WINS
        </div>

        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-emerald-400 font-bold">@rahul_delhi</span> won <span className="text-emerald-300 font-mono font-bold">₹84,200</span> on <span className="text-white font-medium">India vs Aus (Back 2.15)</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-sky-400 font-bold">@amit_mumbai</span> cashed out <span className="text-sky-300 font-mono font-bold">₹1,45,000</span> on <span className="text-white font-medium">Aviator 3D (18.4x)</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-amber-400 font-bold">@priya_jaipur</span> won <span className="text-amber-300 font-mono font-bold">₹52,000</span> on <span className="text-white font-medium">Teen Patti 20-20</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-purple-400 font-bold">@deepak_punjab</span> won <span className="text-purple-300 font-mono font-bold">₹2,10,000</span> on <span className="text-white font-medium">IPL RCB vs CSK</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-rose-400 font-bold">@sanjay_blr</span> won <span className="text-rose-300 font-mono font-bold">₹38,500</span> on <span className="text-white font-medium">Super Andar Bahar</span>
          </div>
        </div>
      </div>

      {/* ── 4. SECOND ROW: SPORTS LIVE MATCHES (60%) & CRICKET / BLOG HUB (40%) ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        
        {/* SPORTS LIVE ODDS WIDGET (DYNAMIC LIVE MATCHES & QUICK BET SLIP) */}
        <div className="md:col-span-3">
          <LiveExchangeWidget />
        </div>

        {/* INDIAN PREMIER LEAGUE & SPORTS EXPERT BLOG BANNER */}
        <Link href="/blog" className="md:col-span-2 relative w-full rounded-2xl overflow-hidden aspect-[16/9] md:aspect-auto md:h-auto bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 group cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center p-6 border border-amber-300/60">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />
          <div className="relative z-10 flex flex-col items-center w-full text-center">
            <div className="bg-red-600 text-white font-black text-4xl md:text-5xl italic tracking-tighter px-6 py-2 rounded-2xl shadow-xl transform -rotate-1 mb-3 border-2 border-white">
              MATCH RADAR & BLOG
            </div>
            <p className="text-slate-950 font-black uppercase tracking-widest text-xs mb-5 bg-white/90 px-3 py-1 rounded-full shadow-xs">
              Live Pitch Reports • IPL Match Analysis • Expert Tips
            </p>
            
            <div className="grid grid-cols-3 gap-2 text-slate-900 w-full bg-white/40 backdrop-blur-xs p-3 rounded-xl border border-white/60">
              <div className="flex flex-col items-center gap-1">
                <Trophy className="w-5 h-5 text-slate-900" />
                <span className="text-[10px] font-black uppercase">Cricket IPL</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Activity className="w-5 h-5 text-slate-900" />
                <span className="text-[10px] font-black uppercase">Tennis ATP</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Star className="w-5 h-5 text-slate-900" />
                <span className="text-[10px] font-black uppercase">Football EPL</span>
              </div>
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
             <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">bet<span className="text-rose-400">radar</span></h3>
          </div>
        </Link>

        {/* Evolution */}
        <Link href="/casino?provider=evolution" className="relative w-full rounded-md overflow-hidden aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/10] bg-purple-900 group cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700 opacity-50 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900 to-transparent" />
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-end p-6">
             <div className="flex items-center gap-2 mb-1">
               <Flame className="w-8 h-8 text-slate-900" />
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Evolution</h3>
             </div>
          </div>
        </Link>
        {/* SmartSoft */}
        <Link href="/casino?provider=smartsoft" className="relative w-full rounded-md overflow-hidden aspect-[16/9] sm:aspect-[4/3] md:aspect-[16/10] bg-white group cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-300">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518331647614-7a1f04cd34ce?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700 opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-end p-6">
             <div className="flex items-center gap-2 mb-1">
               <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-slate-900 font-black italic">S</div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter">SmartSoft</h3>
             </div>
          </div>
        </Link>
      </div>

      {/* ── 5. INTERACTIVE GAME OPTIONS, PROGRESSIVE JACKPOT & WHATSAPP COORDINATOR STRIP ── */}
      <div className="flex flex-col gap-4 mt-4">
        
        {/* Progressive Jackpot & WhatsApp Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Mega Jackpot Card */}
          <div className="lg:col-span-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-amber-300/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
            <div className="flex items-center gap-4 text-center sm:text-left relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 backdrop-blur-md shadow-inner">
                <Trophy className="w-7 h-7 text-yellow-200 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-black/25 px-2.5 py-0.5 rounded-full text-amber-100">
                    🔥 LIVE PROGRESSIVE JACKPOT POOL
                  </span>
                  <span className="flex items-center gap-1 text-[9px] text-amber-100 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 14,208 Active Players
                  </span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-black font-mono tracking-tight text-white mt-1 drop-shadow-sm">
                  ₹{jackpot.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2.5 relative z-10 w-full sm:w-auto justify-center">
              <Link 
                href="/casino/game/orig-1"
                className="px-5 py-3 bg-white text-slate-950 hover:bg-amber-50 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" /> Play To Win
              </Link>
            </div>
          </div>

          {/* WhatsApp Direct VIP Coordinator Card */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col justify-between border border-emerald-400/40 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-wider">VIP WhatsApp Desk</span>
              </div>
              <span className="text-[9px] bg-emerald-400/30 text-emerald-100 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Online
              </span>
            </div>
            
            <p className="text-[11px] text-emerald-100 font-medium my-2">
              Coordinate directly on WhatsApp for manual player ID generation, instant UPI deposits & fast withdrawals.
            </p>

            <button
              onClick={() => {
                const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER || "+1 (623) 282-2738";
                const cleanNumber = rawNumber.replace(/[^0-9]/g, "") || "16232822738";
                const msg = encodeURIComponent("👑 *AuraPlay VIP Exchange Concierge*\n\nHello, I want ID.\n\n✨ *Service Request:* Official Betting & Casino ID Setup\n⚡ *Access:* 0% Commission Live Cricket Bhav & 15-Sec Instant UPI Payouts\n🎁 *Bonus:* ₹10,000 First Deposit Match\n\nPlease create and activate my official ID.");
                window.open(`https://wa.me/${cleanNumber}?text=${msg}`, "_blank", "noopener,noreferrer");
              }}
              className="w-full py-3 bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.02] active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              Chat On WhatsApp (+1 623 282-2738)
            </button>
          </div>

        </div>

        {/* Interactive Category Filter Tabs & Wallet Mode */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto">
            {[
              { id: "all", label: "🌟 All Games", count: "250+" },
              { id: "desi", label: "🎴 Desi Teen Patti", count: "Hot" },
              { id: "crash", label: "🚀 Turbo Crash", count: "99% RTP" },
              { id: "slots", label: "🎰 3D Slots", count: "10,000x" },
              { id: "rentals", label: "⚡ Cloud Rentals", count: "RTX 4090" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === tab.id
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[8px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  selectedCategory === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Play Mode:</span>
            <button
              onClick={() => switchAccountType(accountType === 'real' ? 'demo' : 'real')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border cursor-pointer ${
                accountType === 'real' 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                  : 'bg-blue-50 border-blue-300 text-blue-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${accountType === 'real' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
              {accountType === 'real' ? 'Real Cash 🟢' : 'Practice Demo 🔵'}
            </button>
          </div>
        </div>

      </div>

      <div className="h-2" /> {/* Spacer */}

      {/* 4. PREMIUM 3D & AAA HIGH-MOTION LOBBY (TOP 1% OVERHAUL) */}
      
      {/* ========================================== */}
      {/* CATEGORY 1: AURA PLAY IN-HOUSE ORIGINALS */}
      {/* ========================================== */}
      {(selectedCategory === "all" || selectedCategory === "crash") && (
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
            <p className="text-[10px] text-slate-650 font-bold uppercase tracking-wider">
              Ultra High-Frame-Rate physics-based games operating on verifiably fair seed hashes.
            </p>
          </div>
          <Link href="/casino" className="text-xs font-black text-slate-600 hover:text-cyan-600 uppercase tracking-widest flex items-center gap-1 transition-colors">
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
                    <span className="block text-[8px] text-slate-600 font-bold uppercase tracking-wider">RTP RATE</span>
                    <span className="text-[11px] text-emerald-600 font-black font-mono">99.0%</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
                    <span className="block text-[8px] text-slate-600 font-bold uppercase tracking-wider">MAX WIN</span>
                    <span className="text-[11px] text-purple-600 font-black font-mono">10,000x</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link 
                  href="/casino/game/orig-15"
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_4px_15px_rgba(6,182,212,0.2)] hover:shadow-[0_4px_20px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
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
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-100 group-hover:opacity-90"
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
                        <p className="text-[7px] text-slate-600 font-bold uppercase">RTP {game.rtp}%</p>
                        <div className="flex items-center gap-0.5 px-2 py-0.5 bg-white text-slate-900 text-[8px] font-black uppercase tracking-widest rounded-full">
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

      </motion.section>
      )}

      {/* ========================================== */}
      {/* CATEGORY 2: AAA CLOUD STREAMING RENTALS */}
      {/* ========================================== */}
      {(selectedCategory === "all" || selectedCategory === "rentals") && (
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
            <p className="text-[10px] text-slate-650 font-bold uppercase tracking-wider">
              Instantly rent high-end gaming rigs. WebRTC 4K streams with less than 1ms node latency.
            </p>
          </div>
          <Link href="/casino" className="text-xs font-black text-slate-600 hover:text-purple-600 uppercase tracking-widest flex items-center gap-1 transition-colors">
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
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-100 group-hover:opacity-90"
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
                      <p className="text-[7px] text-slate-600 font-bold uppercase">GPU RTX 4090</p>
                      <div className="flex items-center gap-0.5 px-2 py-0.5 bg-white text-slate-900 text-[8px] font-black uppercase tracking-widest rounded-full">
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
      )}

      {/* ========================================== */}
      {/* CATEGORY 3: PREMIUM 3D SLOTS */}
      {/* ========================================== */}
      {(selectedCategory === "all" || selectedCategory === "slots") && (
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
            <span className="text-[9px] bg-rose-50 border border-rose-200 text-rose-700 font-black tracking-[0.25em] uppercase px-3 py-1 rounded-full w-max flex items-center gap-1.5">
              <Star className="w-3 h-3 text-rose-600" /> CASCADE & CLUSTERS
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none mt-2">
              Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600 drop-shadow-sm">3D Slots</span>
            </h2>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              Stunning visual effects, rolling multipliers, and huge free spin trigger potentials.
            </p>
          </div>
          <Link href="/casino" className="text-xs font-black text-slate-700 hover:text-rose-600 uppercase tracking-widest flex items-center gap-1 transition-colors">
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
                  className="block w-full aspect-[4/5] rounded-[1.8rem] overflow-hidden bg-slate-50 border border-slate-200 transition-all duration-500 hover:-translate-y-1.5 hover:border-pink-400 hover:shadow-[0_10px_25px_rgba(0,0,0,0.05)] relative"
                >
                  <img 
                    src={game.image} 
                    alt={game.title} 
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-100 group-hover:opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent z-10" />

                  <div className="absolute top-3 inset-x-3 flex justify-between items-center z-20 pointer-events-none">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-white/90 border border-slate-200 text-slate-800 text-[8px] font-black uppercase tracking-widest rounded-full shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {(game.players || 18000) > 1000 ? ((game.players || 18000) / 1000).toFixed(1) + 'k' : game.players} LIVE
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-black uppercase tracking-widest rounded-full shadow-xs">
                      RTP {game.rtp || 96.5}%
                    </span>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-4 z-20 flex flex-col justify-end bg-gradient-to-t from-white via-white/95 to-transparent pt-8">
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r ${textGrad}`}>
                      VIDEO SLOT
                    </span>
                    <h4 className="text-slate-900 font-black text-xs sm:text-sm tracking-tight leading-tight line-clamp-1 mt-0.5 group-hover:text-pink-600 transition-colors">
                      {game.title}
                    </h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                      <p className="text-[8px] text-slate-600 font-bold uppercase">3D RENDERED</p>
                      <div className="flex items-center gap-0.5 px-2.5 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-xs">
                        SPIN <Play className="w-2 h-2 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </motion.section>
      )}

      {/* ========================================== */}
      {/* CATEGORY 4: DESI LIVE CLUB & TEEN PATTI LOUNGE */}
      {/* ========================================== */}
      {(selectedCategory === "all" || selectedCategory === "desi") && (
      <motion.section 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.6 }} 
        className="w-full mt-6 bg-white border border-amber-200/80 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden shadow-[0_20px_50px_rgba(217,119,6,0.05)]"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8 relative z-10 border-b border-amber-100 pb-5">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] bg-amber-100 border border-amber-300 text-amber-900 font-black tracking-[0.25em] uppercase px-3 py-1 rounded-full w-max flex items-center gap-1.5 shadow-xs">
              <Flame className="w-3 h-3 text-amber-600 animate-pulse" /> 10% DAILY DESI LOSS CASHBACK
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none mt-2">
              Desi <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 drop-shadow-xs">Live Club & Teen Patti</span>
            </h2>
            <p className="text-xs text-slate-700 font-semibold mt-1">
              Interact with real Hindi-speaking live dealers. 4K WebRTC direct stream from Mumbai studios with 1-tap instant table seating.
            </p>
          </div>
          <Link href="/casino" className="text-xs font-black text-amber-700 hover:text-amber-800 uppercase tracking-widest flex items-center gap-1 transition-colors bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            All Desi Tables <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5 relative z-10">
          {desiLiveGames.slice(0, 5).map(game => {
            return (
              <div key={game.id} className="relative group">
                <Link 
                  href={`/casino/game/${game.id}`}
                  className="block w-full aspect-[4/5] rounded-[1.8rem] overflow-hidden bg-slate-50 border border-amber-200/80 transition-all duration-500 hover:-translate-y-1.5 hover:border-amber-500 hover:shadow-[0_10px_30px_rgba(217,119,6,0.15)] relative"
                >
                  <img 
                    src={game.image} 
                    alt={game.title} 
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-100 group-hover:opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent z-10" />

                  <div className="absolute top-3 inset-x-3 flex justify-between items-center z-20 pointer-events-none">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-white/95 border border-slate-200 text-slate-900 text-[8px] font-black uppercase tracking-widest rounded-full shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {(game.players || 24000) > 1000 ? ((game.players || 24000) / 1000).toFixed(1) + 'k' : game.players} LIVE
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 text-[8px] font-black uppercase tracking-widest rounded-full shadow-xs">
                      RTP {game.rtp || 98.4}%
                    </span>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-4 z-20 flex flex-col justify-end bg-gradient-to-t from-white via-white/95 to-transparent pt-8">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-700">
                      HINDI LIVE DEALER
                    </span>
                    <h4 className="text-slate-900 font-black text-xs sm:text-sm tracking-tight leading-tight line-clamp-1 mt-0.5 group-hover:text-amber-700 transition-colors">
                      {game.title}
                    </h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-100 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                      <p className="text-[8px] text-slate-700 font-bold uppercase">4K WebRTC</p>
                      <div className="flex items-center gap-0.5 px-2.5 py-1 bg-amber-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-xs">
                        JOIN TABLE <Play className="w-2 h-2 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </motion.section>
      )}

      {/* 8. LIVE ACTION FEED & ACTIVITY */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.25 }} className="w-full mt-8 border-t border-slate-200 pt-8">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Platform Activity & Live Wins</h2>
        </div>
        <LiveActionFeed />
      </motion.section>



    </div>
  );
}
