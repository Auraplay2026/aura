"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Clock, Zap, RotateCcw, AlertTriangle, RefreshCw, 
  Volume2, VolumeX, Shield, Eye, EyeOff, Users, TrendingUp, Trophy, Flame 
} from "lucide-react";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { validateTransactionIdempotency } from "@/lib/mathEngine";

interface RoyalGamingProps {
  isPlaying: boolean;
  betAmount?: number;
  onComplete: (multiplierOrWon: number | boolean, won?: boolean) => void;
  gameId: string;
  gameTitle: string;
  selectedTarget?: string;
  setSelectedTarget?: (t: string) => void;
}

interface PlacedChip {
  id: string;
  targetId: string;
  value: number;
  xPct: number;
  yPct: number;
  x?: number;
  y?: number;
  createdAt?: number;
  wobbleStart?: number;
  rotationAngle?: number;
  isLosing?: boolean;
  isWinning?: boolean;
  sweepStart?: number;
  spawnedFountain?: boolean;
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
  },
  "poker-1": { // Texas Hold'em Bonus
    label: "Texas Hold'em Bonus",
    targets: [
      { id: "ante", name: "Ante Bet", odds: 2.00, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "bonus", name: "Bonus Bet", odds: 8.50, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "flop_bet", name: "Flop Bet", odds: 2.00, color: "bg-white border-[#E2E8F0] text-[#0F172A]" }
    ],
    historyGenerator: () => Math.random() > 0.52 ? "P" : "D"
  },
  "poker-3": { // Triple Card Poker
    label: "Triple Card Poker",
    targets: [
      { id: "ante", name: "Ante", odds: 2.00, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "pair_plus", name: "Pair Plus", odds: 5.50, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "six_card", name: "6 Card Bonus", odds: 15.00, color: "bg-white border-[#E2E8F0] text-[#0F172A]" }
    ],
    historyGenerator: () => Math.random() > 0.5 ? "P" : "D"
  },
  "poker-4": { // Gold Bar Poker Deluxe
    label: "Gold Bar Poker Deluxe",
    targets: [
      { id: "ante", name: "Ante", odds: 2.00, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "gold_bar", name: "Gold Bar Bonus", odds: 3.50, color: "bg-white border-[#E2E8F0] text-[#0F172A]" },
      { id: "royal_flush", name: "Royal Flush Spec", odds: 35.00, color: "bg-white border-[#E2E8F0] text-[#0F172A]" }
    ],
    historyGenerator: () => Math.random() > 0.6 ? "G" : "D"
  }
};

const COIN_VALUES = [100, 500, 1000, 5000, 10000, 50000];

// Simulated live player avatars for social proof (tiny face circles)
const LIVE_PLAYERS = [
  { id: 'p1', initials: 'AK', color: 'from-violet-500 to-fuchsia-600', bet: 5000 },
  { id: 'p2', initials: 'SR', color: 'from-sky-500 to-cyan-600', bet: 10000 },
  { id: 'p3', initials: 'MJ', color: 'from-emerald-500 to-teal-600', bet: 1000 },
  { id: 'p4', initials: 'RK', color: 'from-amber-500 to-orange-600', bet: 50000 },
  { id: 'p5', initials: 'PD', color: 'from-rose-500 to-pink-600', bet: 5000 },
  { id: 'p6', initials: 'VG', color: 'from-indigo-500 to-blue-600', bet: 2000 },
  { id: 'p7', initials: 'NK', color: 'from-lime-500 to-green-600', bet: 500 },
  { id: 'p8', initials: 'TS', color: 'from-purple-500 to-violet-600', bet: 25000 },
];

// Simulated recent live bets feed for social proof
const LIVE_FEED_BETS = [
  { player: 'AceKing\u2605', amount: 50000, target: 'Ante', won: true, time: '2s ago' },
  { player: 'RoyalFlush', amount: 10000, target: 'Bonus', won: false, time: '5s ago' },
  { player: 'PokerMVP', amount: 25000, target: 'Pair Plus', won: true, time: '8s ago' },
  { player: 'DiamondQ', amount: 5000, target: 'Ante', won: true, time: '12s ago' },
  { player: 'HighStakes', amount: 100000, target: 'Bonus', won: false, time: '15s ago' },
  { player: 'GoldRush99', amount: 15000, target: 'Ante', won: true, time: '22s ago' },
];

// Web Audio API Sound Synthesizer (Zero external file dependencies)
const playSynthSound = (type: 'tick' | 'beep' | 'win', isMuted: boolean) => {
  if (isMuted) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(1500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'win') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.1, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.2);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.warn("Web Audio API blocked or not supported", e);
  }
};

// Helper to calculate X starting position offset for each coin value to align with horizontal selector buttons on desktop
const getChipStartXOffset = (value: number, canvasWidth: number) => {
  const index = COIN_VALUES.indexOf(value);
  if (index === -1) return canvasWidth * 0.5;
  // Map index [0..5] to percentage [32% .. 68%] to match the selector layout width
  const pct = 0.32 + (index / (COIN_VALUES.length - 1 || 1)) * 0.36;
  return canvasWidth * pct;
};

// Premium casino chip color palettes matching denominations
const getChipColors = (value: number) => {
  if (value < 500) {
    // ₹100 denomination: Premium Sky blue
    return { base: "#0284C7", light: "#38BDF8", dark: "#0369A1", text: "#0369A1" };
  } else if (value < 1000) {
    // ₹500 denomination: Premium Emerald green
    return { base: "#059669", light: "#34D399", dark: "#047857", text: "#047857" };
  } else if (value < 5000) {
    // ₹1000 denomination: Premium Gold/Amber
    return { base: "#D97706", light: "#FBBF24", dark: "#B45309", text: "#B45309" };
  } else if (value < 10000) {
    // ₹5000 denomination: Premium Rose red
    return { base: "#DC2626", light: "#F87171", dark: "#B91C1C", text: "#B91C1C" };
  } else if (value < 50000) {
    // ₹10000 denomination: Premium Royal Purple
    return { base: "#7C3AED", light: "#A78BFA", dark: "#6D28D9", text: "#6D28D9" };
  } else {
    // ₹50000+ denomination: Premium Obsidian black with gold/silver accents
    return { base: "#1E293B", light: "#64748B", dark: "#090D16", text: "#090D16" };
  }
};

// Cubic ease-out curve for physics-like speed deceleration in flight
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

// Premium casino felt betting spots color palettes and gradients
const getBetButtonStyles = (targetId: string, gameId: string, isSelected: boolean, hasBet: boolean) => {
  const base = "relative overflow-hidden border rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between items-center h-[60px] xs:h-[70px] sm:h-[78px] text-white transition-all cursor-pointer pointer-events-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:scale-[1.03] active:scale-[0.97] group";

  // Specialized styles for Dragon Tiger (royal-6)
  if (gameId.startsWith("royal-6")) {
    if (targetId === "dragon") {
      return cn(
        base,
        isSelected
          ? "bg-gradient-to-b from-rose-900/80 to-rose-950/90 border-rose-500 ring-4 ring-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.45)]"
          : "bg-gradient-to-b from-rose-955/40 to-rose-900/40 border-rose-955/60 hover:border-rose-500/50 hover:bg-rose-900/50 shadow-[0_4px_15px_rgba(244,63,94,0.05)]"
      );
    }
    if (targetId === "tiger") {
      return cn(
        base,
        isSelected
          ? "bg-gradient-to-b from-amber-900/80 to-amber-955/90 border-amber-500 ring-4 ring-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.45)]"
          : "bg-gradient-to-b from-amber-955/40 to-amber-900/40 border-amber-955/60 hover:border-amber-500/50 hover:bg-amber-900/50 shadow-[0_4px_15px_rgba(245,158,11,0.05)]"
      );
    }
    if (targetId === "tie") {
      return cn(
        base,
        isSelected
          ? "bg-gradient-to-b from-emerald-900/80 to-emerald-950/90 border-emerald-500 ring-4 ring-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.45)]"
          : "bg-gradient-to-b from-emerald-950/40 to-emerald-900/40 border-emerald-955/60 hover:border-emerald-500/50 hover:bg-emerald-900/50 shadow-[0_4px_15px_rgba(16,185,129,0.05)]"
      );
    }
  }

  // Specialized styles for Andar Bahar (royal-3)
  if (gameId.startsWith("royal-3")) {
    if (targetId === "andar") {
      return cn(
        base,
        isSelected
          ? "bg-gradient-to-b from-sky-900/80 to-sky-955/90 border-sky-500 ring-4 ring-sky-500/30 shadow-[0_0_25px_rgba(14,165,233,0.45)]"
          : "bg-gradient-to-b from-sky-955/40 to-sky-900/40 border-sky-955/60 hover:border-sky-500/50 hover:bg-sky-900/50 shadow-[0_4px_15px_rgba(14,165,233,0.05)]"
      );
    }
    if (targetId === "bahar") {
      return cn(
        base,
        isSelected
          ? "bg-gradient-to-b from-rose-900/80 to-rose-955/90 border-rose-500 ring-4 ring-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.45)]"
          : "bg-gradient-to-b from-rose-955/40 to-rose-900/40 border-rose-955/60 hover:border-rose-500/50 hover:bg-rose-900/50 shadow-[0_4px_15px_rgba(244,63,94,0.05)]"
      );
    }
  }

  // Specialized styles for European Roulette (royal-7)
  if (gameId.startsWith("royal-7")) {
    if (targetId === "red") {
      return cn(
        base,
        isSelected
          ? "bg-gradient-to-b from-rose-900/85 to-rose-950/95 border-rose-500 ring-4 ring-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.45)]"
          : "bg-gradient-to-b from-rose-955/50 to-rose-900/50 border-rose-955/60 hover:border-rose-500/50 hover:bg-rose-900/55"
      );
    }
    if (targetId === "black") {
      return cn(
        base,
        isSelected
          ? "bg-gradient-to-b from-slate-900/85 to-slate-950/95 border-slate-500 ring-4 ring-slate-500/30 shadow-[0_0_25px_rgba(100,116,139,0.45)]"
          : "bg-gradient-to-b from-slate-955/50 to-slate-900/50 border-slate-955/60 hover:border-slate-500/50 hover:bg-slate-900/55"
      );
    }
    if (targetId === "zero") {
      return cn(
        base,
        isSelected
          ? "bg-gradient-to-b from-emerald-900/85 to-emerald-950/95 border-emerald-500 ring-4 ring-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.45)]"
          : "bg-gradient-to-b from-emerald-955/50 to-emerald-900/50 border-emerald-950/60 hover:border-emerald-500/50 hover:bg-emerald-900/55"
      );
    }
  }

  // Specialized styles for Poker Games (poker-1, poker-3, poker-4)
  if (gameId.startsWith("poker-")) {
    if (targetId === "ante") {
      return cn(
        base,
        isSelected
          ? "bg-gradient-to-b from-amber-900/85 to-amber-955/95 border-amber-500 ring-4 ring-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.45)]"
          : "bg-gradient-to-b from-slate-950/55 to-slate-900/55 border-slate-800/60 hover:border-amber-500/50 hover:bg-slate-900/50"
      );
    }
    if (targetId === "bonus" || targetId === "pair_plus" || targetId === "gold_bar") {
      return cn(
        base,
        isSelected
          ? "bg-gradient-to-b from-rose-900/85 to-rose-950/95 border-rose-500 ring-4 ring-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.45)]"
          : "bg-gradient-to-b from-slate-955/50 to-slate-900/50 border-slate-800/60 hover:border-rose-500/50 hover:bg-slate-900/50"
      );
    }
    // side bets (flop_bet, six_card, royal_flush)
    return cn(
      base,
      isSelected
        ? "bg-gradient-to-b from-purple-900/85 to-purple-955/95 border-purple-500 ring-4 ring-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.45)]"
        : "bg-gradient-to-b from-slate-955/50 to-slate-900/50 border-slate-800/60 hover:border-purple-500/50 hover:bg-slate-900/50"
    );
  }

  // Default theme fallback (e.g. Teen Patti Player A/B, etc.)
  if (targetId.includes("player_a") || targetId.includes("andar") || targetId.includes("runs_over") || targetId.includes("player_8") || targetId.includes("seven_down")) {
    return cn(
      base,
      isSelected
        ? "bg-gradient-to-b from-sky-900/80 to-sky-950/90 border-sky-500 ring-4 ring-sky-500/30 shadow-[0_0_25px_rgba(14,165,233,0.45)]"
        : "bg-gradient-to-b from-sky-955/40 to-sky-900/40 border-sky-955/60 hover:border-sky-500/50 hover:bg-sky-900/50 shadow-[0_4px_15px_rgba(14,165,233,0.05)]"
    );
  }
  if (targetId.includes("player_b") || targetId.includes("bahar") || targetId.includes("runs_under") || targetId.includes("player_9") || targetId.includes("seven_up")) {
    return cn(
      base,
      isSelected
        ? "bg-gradient-to-b from-rose-900/80 to-rose-955/90 border-rose-500 ring-4 ring-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.45)]"
        : "bg-gradient-to-b from-rose-955/40 to-rose-900/40 border-rose-955/60 hover:border-rose-500/50 hover:bg-rose-900/50 shadow-[0_4px_15px_rgba(244,63,94,0.05)]"
    );
  }

  return cn(
    base,
    isSelected 
      ? "bg-gradient-to-b from-amber-900/80 to-amber-950/90 border-amber-500 ring-4 ring-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.45)]" 
      : "bg-gradient-to-b from-slate-955/50 to-slate-900/50 border-slate-955/60 hover:border-slate-500/50 hover:bg-slate-900/55"
  );
};

// Premium background SVG silhouettes representing themed betting icons
const renderBetIcon = (targetId: string, gameId: string) => {
  const iconClass = "absolute right-2.5 bottom-2 w-14 h-14 pointer-events-none transform -rotate-12 transition-all duration-700 group-hover:scale-115 group-hover:-rotate-6 text-white/[0.07] group-hover:text-white/[0.12]";

  if (gameId.startsWith("poker-")) {
    if (targetId === "ante") {
      // Spade icon
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C9 7 4 9 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8c0-5-5-7-8-12z" />
        </svg>
      );
    }
    if (targetId === "bonus" || targetId === "pair_plus" || targetId === "gold_bar") {
      // Heart icon
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    }
    // Diamond icon
    return (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L2 12l10 10 10-10L12 2z" />
      </svg>
    );
  }

  if (gameId.startsWith("royal-6")) {
    // Dragon Tiger
    if (targetId === "dragon") {
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.17 6.83l-1.42 1.42c-.52-.39-1.2-.67-1.92-.79C12.35 8.7 12.7 8 13.5 8c.55 0 1 .45 1.01 1v.01l.66-.18zm-6.34 2c-.55 0-1-.45-1-1v-.01l.66-.18c.53.53.88 1.2 1.01 1.99-.71-.12-1.39-.4-1.91-.79l1.42-1.42c-.09.12-.13.26-.18.41zm5.17-5.5a8 8 0 0 0-2 0l-.34 1.7c.33.06.66.16.98.3l1.36-2zm-4 4.54l-.34-1.7a8 8 0 0 0-2 0l1.36 2c.32-.14.65-.24.98-.3zm1.17 7.7a3.5 3.5 0 0 1-2.5 0l-.34 1.7c.92.17 1.86.17 2.78 0l-.34-1.7v-.01zM12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm0 13a5 5 0 0 1-5-5c0-.98.37-1.87.98-2.56l2.12 2.12c-.09.28-.14.59-.14.94 0 1.66 1.34 3 3 3s3-1.34 3-3c0-.35-.05-.66-.14-.94l2.12-2.12c.61.69.98 1.58.98 2.56a5 5 0 0 1-5 5z" />
        </svg>
      );
    }
    if (targetId === "tiger") {
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11c-.55 0-1-.45-1-1v-2c0-.55.45-1 1-1s1 .45 1 1v2c0 .55-.45 1-1 1zm-3-3c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1s1 .45 1 1v2c0 .55-.45 1-1 1zm-4 4c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm-3-1c-.55 0-1-.45-1-1v-2c0-.55.45-1 1-1s1 .45 1 1v2c0 .55-.45 1-1 1z" />
        </svg>
      );
    }
    if (targetId === "tie") {
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.88 7.37c-.78 0-1.5.3-2.07.82l-2.07 1.9c-.37.34-.86.53-1.37.53s-1-.19-1.37-.53l-2.07-1.9a3.17 3.17 0 00-2.07-.82C5.96 7.37 4.5 8.84 4.5 10.63c0 1.8 1.46 3.26 3.26 3.26.78 0 1.5-.3 2.07-.82l2.07-1.9c.37-.34.86-.53 1.37-.53s1 .19 1.37.53l2.07 1.9c.57.52 1.29.82 2.07.82 1.8 0 3.26-1.46 3.26-3.26 0-1.8-1.46-3.26-3.26-3.26z" />
        </svg>
      );
    }
  }

  if (gameId.startsWith("royal-3")) {
    // Andar Bahar
    if (targetId === "andar") {
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 18H5v-7h7v7zm0-9H5V4h7v7zm7 9h-5v-7h5v7zm0-9h-5V4h5v7z" />
        </svg>
      );
    }
    if (targetId === "bahar") {
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 18H5v-7h7v7zm0-9H5V4h7v7zm7 9h-5v-7h5v7zm0-9h-5V4h5v7z" />
        </svg>
      );
    }
  }

  // Fallback: Poker card deck silhouette
  return (
    <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  );
};

// Premium canvas drawing subroutine for 3D game-themed coins
const drawSingleChip = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: number,
  alpha: number,
  scaleX: number,
  scaleY: number,
  rotation: number,
  isMobile: boolean,
  isTablet: boolean,
  baseX?: number,
  baseY?: number,
  flightProgress?: number,
  gameId: string = "royal-6"
) => {
  ctx.save();
  ctx.globalAlpha = alpha;

  const baseRadius = isMobile ? 12 : (isTablet ? 14 : 17);
  const radius = baseRadius;

  // 1. Draw dynamic oval shadow on the table surface (if baseX and baseY are provided)
  if (baseX !== undefined && baseY !== undefined && flightProgress !== undefined) {
    ctx.beginPath();
    const shadowRadiusX = radius * 1.05 * scaleX;
    const shadowRadiusY = radius * 0.55 * scaleY;
    // Fade/spread shadow when chip is high in the air
    const shadowOpacity = 0.35 - 0.15 * Math.sin(flightProgress * Math.PI);
    ctx.ellipse(baseX, baseY, shadowRadiusX, shadowRadiusY, 0, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity * alpha})`;
    ctx.fill();
  }

  // Translate to chip center, apply scale, rotation, and 3D slant perspective
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY * 0.75); // 3D perspective squish (pitch angle)
  ctx.rotate(rotation);

  const colors = getChipColors(value);

  // Draw Game-Themed Coins!
  if (gameId.startsWith("royal-1") || gameId.startsWith("royal-3")) {
    // ----------------------------------------------------
    // VEDIC GOLD COIN THEME (Teen Patti & Andar Bahar)
    // ----------------------------------------------------
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.05, 0, 0, radius);
    grad.addColorStop(0, "#FCD34D"); // Amber 300
    grad.addColorStop(0.5, "#D97706"); // Amber 600
    grad.addColorStop(1, "#78350F"); // Amber 900
    ctx.fillStyle = grad;
    ctx.fill();

    // Concentric engraved rings
    ctx.strokeStyle = "rgba(253, 230, 138, 0.4)"; // Amber 200
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.85, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.strokeStyle = "rgba(253, 230, 138, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, 0, 2 * Math.PI);
    ctx.stroke();

    // Central Lotus Engraving
    ctx.fillStyle = "rgba(251, 191, 36, 0.8)"; // Gold
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.lineTo(Math.cos(angle) * radius * 0.5, Math.sin(angle) * radius * 0.5);
      ctx.lineTo(Math.cos(angle + Math.PI / 8) * radius * 0.2, Math.sin(angle + Math.PI / 8) * radius * 0.2);
    }
    ctx.closePath();
    ctx.fill();

    // Outer border ridge
    ctx.strokeStyle = "rgba(120, 53, 15, 0.8)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.95, 0, 2 * Math.PI);
    ctx.stroke();

    // Outer rim highlight glint
    ctx.beginPath();
    ctx.arc(0, 0, radius - 0.5, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Value text
    ctx.rotate(-rotation);
    ctx.scale(1, 1.33); // undo slant for text legibility
    ctx.fillStyle = "#FFFBEB"; // Light cream
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 3;
    const fontSize = Math.max(7.5, Math.round(radius * 0.38));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = value >= 1000 ? `${value / 1000}K` : `${value}`;
    ctx.fillText(label, 0, 0);

  } else if (gameId.startsWith("royal-6")) {
    // ----------------------------------------------------
    // DRAGON TIGER LACQUER THEME (East Asian Lacquer & Gold)
    // ----------------------------------------------------
    const isDragonStyle = value === 100 || value === 1000 || value === 10000;
    const lacquerColor = isDragonStyle ? "#991B1B" : "#111827"; // crimson red or dark charcoal
    const edgeColor = isDragonStyle ? "#F59E0B" : "#F43F5E";

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(-radius * 0.2, -radius * 0.2, radius * 0.1, 0, 0, radius);
    grad.addColorStop(0, lacquerColor);
    grad.addColorStop(0.8, lacquerColor);
    grad.addColorStop(1, "#000000");
    ctx.fillStyle = grad;
    ctx.fill();

    // Gold trim edge
    ctx.strokeStyle = "#D97706";
    ctx.lineWidth = radius * 0.12;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.9, 0, 2 * Math.PI);
    ctx.stroke();

    // Asian edge notches
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = radius * 0.14;
    ctx.setLineDash([radius * 0.25, radius * 0.35]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.9, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Golden inner core
    ctx.fillStyle = "#1E293B";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "rgba(217, 119, 6, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Inner glint highlight
    ctx.beginPath();
    ctx.arc(0, 0, radius - 1, -Math.PI * 0.6, -Math.PI * 0.1);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Value text
    ctx.rotate(-rotation);
    ctx.scale(1, 1.33);
    ctx.fillStyle = "#FBBF24"; // Gold text
    const fontSize = Math.max(7.5, Math.round(radius * 0.38));
    ctx.font = `bold ${fontSize}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = value >= 1000 ? `${value / 1000}K` : `${value}`;
    ctx.fillText(label, 0, 0);

  } else if (gameId.startsWith("royal-7") || gameId.startsWith("poker-")) {
    // ----------------------------------------------------
    // CLAY MONTE CARLO CLASSIC THEME (European Roulette)
    // ----------------------------------------------------
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, 0, radius);
    grad.addColorStop(0, colors.light);
    grad.addColorStop(0.7, colors.base);
    grad.addColorStop(1, colors.dark);
    ctx.fillStyle = grad;
    ctx.fill();

    // Outer rim divider
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.88, 0, 2 * Math.PI);
    ctx.stroke();

    // Dual-tone edge spots
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = radius * 0.22;
    ctx.setLineDash([radius * 0.3, radius * 0.4]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.88, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Central white inlay
    ctx.fillStyle = "#F8FAFC";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.62, 0, 2 * Math.PI);
    ctx.fill();

    // Ring shadow recess
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.62, 0, 2 * Math.PI);
    ctx.stroke();

    // Decorative inner dotted ring
    ctx.strokeStyle = colors.light;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([1.5, 2]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.46, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3D glint & bevel shadows
    ctx.beginPath();
    ctx.arc(0, 0, radius - 1, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Value text
    ctx.rotate(-rotation);
    ctx.scale(1, 1.33);
    ctx.fillStyle = colors.text;
    const fontSize = Math.max(8, Math.round(radius * 0.42));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = value >= 1000 ? `${value / 1000}K` : `${value}`;
    ctx.fillText(label, 0, 0);

  } else {
    // ----------------------------------------------------
    // MODERN NEON TOKEN THEME (Super Over & Others)
    // ----------------------------------------------------
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, 0, radius);
    grad.addColorStop(0, "#1E293B"); // Slate 800
    grad.addColorStop(0.8, "#0F172A"); // Slate 900
    grad.addColorStop(1, "#020617"); // Slate 950
    ctx.fillStyle = grad;
    ctx.fill();

    // Glowing outer ring neon
    ctx.strokeStyle = colors.light;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 1, 0, 2 * Math.PI);
    ctx.stroke();

    // Sports ray dashes
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([radius * 0.15, radius * 0.45]);
    ctx.beginPath();
    ctx.arc(0, 0, radius - 1, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Central circular logo core
    ctx.fillStyle = colors.base;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.58, 0, 2 * Math.PI);
    ctx.fill();

    // Value text
    ctx.rotate(-rotation);
    ctx.scale(1, 1.33);
    ctx.fillStyle = "#FFFFFF";
    const fontSize = Math.max(7.5, Math.round(radius * 0.38));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = value >= 1000 ? `${value / 1000}K` : `${value}`;
    ctx.fillText(label, 0, 0);
  }

  ctx.restore();
};

export function RoyalGamingEngine({ isPlaying, betAmount = 100, onComplete, gameId, gameTitle, selectedTarget: externalTarget, setSelectedTarget: setExternalTarget }: RoyalGamingProps) {
  const { balance: rawBalance, playCasino, currentUser } = useTradingStore();
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
  
  // HUD toggleable view states
  const [showOverlay, setShowOverlay] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // 60FPS Canvas particle list
  const particlesRef = useRef<{
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    alpha: number;
    decay: number;
    gravity?: number;
    type?: 'spark' | 'coin' | 'ripple';
    maxSize?: number;
  }[]>([]);

  const spawnLandingRipple = useCallback((x: number, y: number, color: string) => {
    particlesRef.current.push({
      id: `ripple_${Date.now()}_${Math.random()}`,
      x,
      y,
      vx: 0,
      vy: 0,
      color,
      size: 4,
      maxSize: 22,
      alpha: 1,
      decay: 0.05,
      type: 'ripple'
    });

    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.5 + 0.8;
      particlesRef.current.push({
        id: `spark_${Date.now()}_${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        color,
        size: Math.random() * 1.5 + 1.0,
        alpha: 1,
        decay: 0.04,
        gravity: 0.06,
        type: 'spark'
      });
    }
  }, []);

  const spawnWinConfetti = useCallback((x: number, y: number) => {
    const colors = ["#FBBF24", "#F59E0B", "#10B981", "#3B82F6", "#EC4899", "#8B5CF6"];
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1.5;
      particlesRef.current.push({
        id: `confetti_${Date.now()}_${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 2.5 + 1.5,
        alpha: 1,
        decay: 0.025,
        gravity: 0.07,
        type: 'spark'
      });
    }
  }, []);

  const spawnCoinFountain = useCallback((x: number, y: number) => {
    for (let i = 0; i < 12; i++) {
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 2.5 + 3.0;
      particlesRef.current.push({
        id: `coin_${Date.now()}_${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: "#FBBF24",
        size: Math.random() * 3.0 + 2.0,
        alpha: 1,
        decay: 0.02,
        gravity: 0.12,
        type: 'coin'
      });
    }
  }, []);

  const toggleMute = () => setIsMuted(prev => !prev);
  const toggleOverlay = () => setShowOverlay(prev => !prev);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  
  // Scroller matrix loop tracking past round outputs
  const [historyList, setHistoryList] = useState<string[]>([]);

  // Manual betting / target selector states
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [sidebarBetActive, setSidebarBetActive] = useState(false);
  const [sidebarBetAmount, setSidebarBetAmount] = useState(0);
  const [sidebarBetTarget, setSidebarBetTarget] = useState<string | null>(null);

  // Sync external target prop to local state
  useEffect(() => {
    if (externalTarget && externalTarget !== selectedTarget) {
      setSelectedTarget(externalTarget);
    }
  }, [externalTarget]);

  // Sync local state changes back to external prop
  useEffect(() => {
    if (selectedTarget && setExternalTarget) {
      setExternalTarget(selectedTarget);
    }
  }, [selectedTarget]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Prevent stale closures in interval
  const sidebarBetActiveRef = useRef(sidebarBetActive);
  const sidebarBetTargetRef = useRef(sidebarBetTarget);
  const sidebarBetAmountRef = useRef(sidebarBetAmount);

  useEffect(() => {
    sidebarBetActiveRef.current = sidebarBetActive;
    sidebarBetTargetRef.current = sidebarBetTarget;
    sidebarBetAmountRef.current = sidebarBetAmount;
  }, [sidebarBetActive, sidebarBetTarget, sidebarBetAmount]);

  // Set default selection when game/config changes
  useEffect(() => {
    if (currentConfig && currentConfig.targets.length > 0) {
      setSelectedTarget(currentConfig.targets[0].id);
    }
  }, [configKey, currentConfig]);

  // Listen to parent page sidebar isPlaying trigger
  useEffect(() => {
    if (isPlaying && !sidebarBetActive) {
      if (phase !== 'open') {
        // Bets closed, instantly complete with 0 to reset state
        setFeedMsg("BETS CLOSED • WAIT FOR NEXT ROUND");
        setTimeout(() => {
          onCompleteRef.current(0, false);
        }, 1200);
        return;
      }
      
      const targetId = selectedTarget || (currentConfig.targets[0]?.id || "");
      if (!targetId) return;

      setSidebarBetActive(true);
      setSidebarBetAmount(betAmount);
      setSidebarBetTarget(targetId);

      // Add to internal wagers
      setBets(prev => ({
        ...prev,
        [targetId]: (prev[targetId] || 0) + betAmount
      }));

      // Add visual chip to screen
      const targetIdx = currentConfig.targets.findIndex(t => t.id === targetId);
      const total = currentConfig.targets.length;
      let chipX = 50;
      let chipY = 50;
      if (targetIdx !== -1) {
        chipX = 15 + (targetIdx / (total - 1 || 1)) * 70 + (Math.random() - 0.5) * 8;
        chipY = 45 + (Math.random() - 0.5) * 10;
      }
      setPlacedChips(prev => [
        ...prev,
        {
          id: `chip_sidebar_${Date.now()}`,
          targetId,
          value: betAmount,
          xPct: chipX,
          yPct: chipY,
          createdAt: Date.now()
        }
      ]);
      playSynthSound('tick', isMuted);
    }
  }, [isPlaying, phase, selectedTarget, betAmount, currentConfig, isMuted]);

  // Reset states when isPlaying resets
  useEffect(() => {
    if (!isPlaying && sidebarBetActive) {
      setSidebarBetActive(false);
      setSidebarBetAmount(0);
      setSidebarBetTarget(null);
    }
  }, [isPlaying, sidebarBetActive]);
  
  // Simulation visual elements (zero-reflow Dealer Text & Feed)
  const [feedMsg, setFeedMsg] = useState("PLACE YOUR CHIPS");
  const [payoutOverlay, setPayoutOverlay] = useState<{ active: boolean; profit: number; won: boolean }>({ active: false, profit: 0, won: false });

  // Exception Modals State
  const [showLowBalance, setShowLowBalance] = useState(false);
  const [showConnectionLost, setShowConnectionLost] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);

  // Dynamic Ambient Felt Spotlight styles linked to game phases
  const getFeltContainerClass = () => {
    const base = "relative aspect-[4/3] xs:aspect-[1.5] md:aspect-video w-full rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col justify-between p-2 md:p-3 overflow-hidden transform-gpu transition-all duration-1000 ease-in-out border-[6px] md:border-[10px]";
    
    if (phase === 'open') {
      if (countdown <= 4) {
        // Tense red-alert spotlight when betting time is about to close
        return cn(base, "bg-[radial-gradient(circle_at_center,_#3b1111_0%,_#1c0808_100%)] border-rose-900 ring-2 ring-red-500/20 shadow-[inset_0_0_60px_rgba(0,0,0,0.95),_0_0_20px_rgba(239,68,68,0.2)]");
      }
      // Classic deep emerald casino felt with mahogany wood rail and gold accent ring
      return cn(base, "bg-[radial-gradient(circle_at_center,_#14532d_0%,_#052e16_50%,_#02180b_100%)] border-[#25100a] ring-2 ring-amber-500/30 shadow-[inset_0_0_60px_rgba(0,0,0,0.95),_0_20px_45px_-10px_rgba(0,0,0,0.7)]");
    }
    if (phase === 'closed') {
      // Focused obsidian slate for card reveals
      return cn(base, "bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#0f172a_60%,_#020617_100%)] border-slate-900 ring-2 ring-indigo-500/30 shadow-[inset_0_0_60px_rgba(0,0,0,0.95)]");
    }
    if (phase === 'settled') {
      const isWin = payoutOverlay.won;
      if (isWin) {
        // Victory gold/emerald pulse spotlight
        return cn(base, "bg-[radial-gradient(circle_at_center,_#065f46_0%,_#022c22_50%,_#011510_100%)] border-emerald-950 ring-2 ring-emerald-400/40 shadow-[inset_0_0_60px_rgba(0,0,0,0.95),_0_0_30px_rgba(16,185,129,0.25)]");
      }
      // Default settle
      return cn(base, "bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0f172a_60%,_#020617_100%)] border-slate-950 ring-2 ring-slate-800/30 shadow-[inset_0_0_60px_rgba(0,0,0,0.95)]");
    }
    return cn(base, "bg-[radial-gradient(circle_at_center,_#14532d_0%,_#052e16_50%,_#02180b_100%)] border-[#25100a] ring-2 ring-amber-500/30");
  };

  // New live WebRTC and gamification overlay states
  const [ping, setPing] = useState(28);
  const [previousBets, setPreviousBets] = useState<Record<string, number>>({});
  const [dealerCards, setDealerCards] = useState<{ id: string; suit: string; val: string; target: string; anim: boolean }[]>([]);

  // Latency Fluctuation loop (locks wagers if latency > 500ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const isSpike = Math.random() > 0.96;
      const nextPing = isSpike ? Math.floor(Math.random() * 250) + 450 : Math.floor(Math.random() * 30) + 15;
      setPing(nextPing);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Dealer physical reveal overlays
  useEffect(() => {
    if (phase === 'open') {
      setDealerCards([]);
    } else if (phase === 'closed') {
      const suits = ['♠', '♥', '♦', '♣'];
      const values = ['A', 'K', 'Q', 'J', '10', '9', '8'];

      const t1 = setTimeout(() => {
        const suit = suits[Math.floor(Math.random() * suits.length)];
        const val = values[Math.floor(Math.random() * values.length)];
        const target = currentConfig.targets[0]?.id || 'player_a';
        setDealerCards(prev => [...prev, { id: 'c1', suit, val, target, anim: true }]);
      }, 1200);

      const t2 = setTimeout(() => {
        const suit = suits[Math.floor(Math.random() * suits.length)];
        const val = values[Math.floor(Math.random() * values.length)];
        const target = currentConfig.targets[1]?.id || 'player_b';
        setDealerCards(prev => [...prev, { id: 'c2', suit, val, target, anim: true }]);
      }, 2800);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [phase, currentConfig]);

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
      // Adjust size for screen scale & high DPI screen crispness
      const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
      if (canvas.width !== canvas.clientWidth * dpr || canvas.height !== canvas.clientHeight * dpr) {
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      const isMobile = canvas.clientWidth < 450;
      const isTablet = canvas.clientWidth >= 450 && canvas.clientWidth < 768;

      // 1. Draw elegant Casino Felt Golden Guidelines & Arcs (drawn on top of video, behind chips)
      ctx.strokeStyle = phase === 'open' && countdown <= 4 
        ? "rgba(239, 68, 68, 0.18)" // Red warning lines
        : "rgba(245, 158, 11, 0.15)";
      ctx.lineWidth = 1.5;
      
      // Draw a gold border margin line around the entire felt
      ctx.beginPath();
      ctx.roundRect(8, 8, canvas.clientWidth - 16, canvas.clientHeight - 16, isMobile ? 12 : 20);
      ctx.stroke();

      // Draw curved divider felt arcs
      ctx.strokeStyle = phase === 'open' && countdown <= 4
        ? "rgba(239, 68, 68, 0.1)"
        : "rgba(245, 158, 11, 0.08)";
      ctx.lineWidth = isMobile ? 1.5 : 2.5;
      ctx.beginPath();
      ctx.arc(canvas.clientWidth * 0.5, canvas.clientHeight * -0.2, canvas.clientHeight * 0.85, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(canvas.clientWidth * 0.5, canvas.clientHeight * -0.2, canvas.clientHeight * 1.05, 0, Math.PI);
      ctx.stroke();

      // 2. Draw gold embossed "ROYAL CASINO" felt branding in the center
      ctx.save();
      const brandX = canvas.clientWidth * 0.5;
      const brandY = isMobile ? canvas.clientHeight * 0.14 : canvas.clientHeight * 0.18;
      
      // Gold gradient fill
      const goldGrad = ctx.createLinearGradient(brandX - 100, brandY, brandX + 100, brandY);
      const accentColor = phase === 'open' && countdown <= 4 ? "239, 68, 68" : "251, 191, 36";
      goldGrad.addColorStop(0, `rgba(${accentColor}, 0.2)`);
      goldGrad.addColorStop(0.5, `rgba(${accentColor}, 0.35)`);
      goldGrad.addColorStop(1, `rgba(${accentColor}, 0.2)`);
      
      ctx.fillStyle = goldGrad;
      ctx.font = `italic bold ${isMobile ? '9.5px' : '11px'} serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(gameTitle.toUpperCase(), brandX, brandY);
      
      ctx.font = `bold ${isMobile ? '6px' : '7px'} sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx.fillText("PROVABLY FAIR • LIVE STREAM HUD", brandX, brandY + (isMobile ? 10 : 12));
      ctx.restore();

      // 3. Draw Dealer Card outlines in the upper center
      const cardSlotWidth = isMobile ? 32 : (isTablet ? 38 : 42);
      const cardSlotHeight = isMobile ? 46 : (isTablet ? 53 : 58);
      const slotY = isMobile ? canvas.clientHeight * 0.23 : (isTablet ? canvas.clientHeight * 0.26 : canvas.clientHeight * 0.28);
      
      // Draw a gold metallic crest in the center behind the dealer cards
      ctx.save();
      ctx.translate(canvas.clientWidth * 0.5, canvas.clientHeight * 0.45);
      ctx.strokeStyle = "rgba(245, 158, 11, 0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, isMobile ? 36 : 54, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, isMobile ? 32 : 48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(245, 158, 11, 0.06)";
      ctx.font = isMobile ? "9px serif" : "14px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★ ★ ★", 0, 0);
      ctx.restore();

      // Left Slot (Card 1)
      const slot1X = canvas.clientWidth * 0.5 - cardSlotWidth - (isMobile ? 8 : 12);
      ctx.save();
      ctx.strokeStyle = phase === 'open' && countdown <= 4 ? "rgba(239, 68, 68, 0.35)" : "rgba(245, 158, 11, 0.3)";
      ctx.lineWidth = isMobile ? 1.5 : 2;
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.roundRect(slot1X, slotY, cardSlotWidth, cardSlotHeight, isMobile ? 4 : 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      
      // Label Card 1
      ctx.fillStyle = "rgba(245, 158, 11, 0.5)";
      ctx.font = `900 ${isMobile ? '6px' : '7.5px'} sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const card1Label = configKey.startsWith("royal-6") ? "DRAGON" : (configKey.startsWith("royal-3") ? "ANDAR" : (configKey.startsWith("poker-") ? "PLAYER" : "PLAYER A"));
      ctx.fillText(card1Label, slot1X + cardSlotWidth / 2, slotY + cardSlotHeight / 2);

      // Right Slot (Card 2)
      const slot2X = canvas.clientWidth * 0.5 + (isMobile ? 8 : 12);
      ctx.save();
      ctx.strokeStyle = phase === 'open' && countdown <= 4 ? "rgba(239, 68, 68, 0.35)" : "rgba(245, 158, 11, 0.3)";
      ctx.lineWidth = isMobile ? 1.5 : 2;
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.roundRect(slot2X, slotY, cardSlotWidth, cardSlotHeight, isMobile ? 4 : 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      
      // Label Card 2
      ctx.fillStyle = "rgba(245, 158, 11, 0.5)";
      ctx.font = `900 ${isMobile ? '6px' : '7.5px'} sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const card2Label = configKey.startsWith("royal-6") ? "TIGER" : (configKey.startsWith("royal-3") ? "BAHAR" : (configKey.startsWith("poker-") ? "DEALER" : "PLAYER B"));
      ctx.fillText(card2Label, slot2X + cardSlotWidth / 2, slotY + cardSlotHeight / 2);

      // 1. Update and Render Particles (Ripples, Sparks, Coins)
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.gravity) {
          p.vy += p.gravity;
        }
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        if (p.type === 'ripple') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const currentSize = p.size + (p.maxSize! - p.size) * (1 - p.alpha);
          ctx.ellipse(p.x, p.y, currentSize * 1.5, currentSize * 0.75, 0, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (p.type === 'coin') {
          ctx.fillStyle = "#F59E0B";
          ctx.strokeStyle = "#D97706";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          const coinWidth = p.size * Math.abs(Math.sin((Date.now() + i * 50) / 100));
          ctx.ellipse(p.x, p.y, coinWidth, p.size, 0, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Compute visual chip stacking by target
      const stackCounts: Record<string, number> = {};

      placedChips.forEach(chip => {
        const targetId = chip.targetId;
        const elapsed = Date.now() - (chip.createdAt || 0);
        const duration = 650;
        const isLanded = elapsed >= duration;

        // Group stack height (exclude swept chips)
        const currentStackHeight = chip.sweepStart ? 0 : (stackCounts[targetId] || 0);
        const stackOffset = currentStackHeight * (isMobile ? -2.5 : -3.5);

        // Target coordinates in CSS pixels
        let targetX = chip.xPct !== undefined ? (chip.xPct / 100) * canvas.clientWidth : (chip.x || 0);
        let targetY = chip.yPct !== undefined ? (chip.yPct / 100) * canvas.clientHeight : (chip.y || 0);

        if (!chip.sweepStart) {
          targetY += stackOffset;
        }

        // Start coordinates:
        // On desktop (!isMobile), the selector is above the canvas. So start from top and map to the specific chip index.
        // On mobile (isMobile), the selector is below the canvas. So start from bottom center.
        const startX = !isMobile ? getChipStartXOffset(chip.value, canvas.clientWidth) : canvas.clientWidth * 0.5;
        const startY = !isMobile ? -20 : canvas.clientHeight + 40;

        // Fallback random rotation based on chip ID to prevent state rewrite churn
        const initialRotation = (chip.rotationAngle ?? (parseInt(chip.id.replace(/\D/g, '')) || 0) % 360) * (Math.PI / 180);

        if (chip.sweepStart) {
          // Win/Loss Sweeping physics simulation
          const elapsedSweep = Date.now() - chip.sweepStart;
          const sweepDuration = chip.isLosing ? 800 : 1000;
          const progress = Math.min(1, elapsedSweep / sweepDuration);
          const sp = easeOutCubic(progress);

          let destX = canvas.clientWidth * 0.5;
          let destY = chip.isLosing ? -50 : canvas.clientHeight + 40;

          const x = targetX + (destX - targetX) * sp;
          const y = targetY + (destY - targetY) * sp;
          const alpha = 1 - sp;

          if (progress >= 0.95 && !chip.spawnedFountain) {
            chip.spawnedFountain = true;
            if (chip.isWinning) {
              spawnCoinFountain(destX, canvas.clientHeight - 10);
            }
          }

          drawSingleChip(ctx, x, y, chip.value, alpha, 1.0, 1.0, initialRotation, isMobile, isTablet, undefined, undefined, undefined, configKey);
        } else {
          // Normal Flight & Wobbling
          const t = Math.min(1, elapsed / duration);
          const p = easeOutCubic(t);

          const baseX = startX + (targetX - startX) * p;
          const baseY = startY + (targetY - startY) * p;

          const distance = Math.hypot(targetX - startX, targetY - startY);
          const peakHeight = Math.min(130, distance * 0.45);
          const arc = peakHeight * Math.sin(p * Math.PI);

          const x = baseX;
          const y = baseY - arc;

          let scaleX = 1.0;
          let scaleY = 1.0;
          let rotation = initialRotation;

          if (!isLanded) {
            // Spin in mid-air
            rotation += p * Math.PI * 4;
            scaleX = 1.0 + 0.3 * Math.sin(p * Math.PI);
            scaleY = 1.0 + 0.3 * Math.sin(p * Math.PI);
          } else {
            if (!chip.wobbleStart) {
              chip.wobbleStart = Date.now();
              spawnLandingRipple(targetX, targetY, getChipColors(chip.value).light);
            }
            const wobbleElapsed = Date.now() - chip.wobbleStart;
            const wobbleDuration = 350;
            if (wobbleElapsed < wobbleDuration) {
              const w = wobbleElapsed / wobbleDuration;
              // Damped harmonic oscillation for squash/stretch wobble
              const amplitude = 0.25 * Math.exp(-4 * w) * Math.sin(w * Math.PI * 6);
              scaleY = 1.0 - amplitude;
              scaleX = 1.0 + amplitude * 0.5;
            }
            // Increment stack count for this target
            stackCounts[targetId] = currentStackHeight + 1;
          }

          drawSingleChip(ctx, x, y, chip.value, 1.0, scaleX, scaleY, rotation, isMobile, isTablet, baseX, baseY, p, configKey);
        }
      });

      // Render digital OCR drawn card representation during closed/dealing phase
      if (phase === "closed") {
        const cWidth = 70;
        const cHeight = 100;
        const cX = canvas.clientWidth / 2 - cWidth / 2;
        const cY = canvas.clientHeight / 2 - cHeight / 2 - 30;

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

        ctx.font = "bold 36px sans-serif";
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
        // Play warning beep under 4 seconds in open bets phase
        if (phase === 'open' && c <= 4 && c > 1) {
          playSynthSound('beep', isMuted);
        }

        if (c <= 1) {
          // Transition phases
          if (phase === 'open') {
            setPhase('closed');
            setFeedMsg("BETS CLOSED • DEALING CARDS");
            return 5; // 5 seconds dealing phase
          } else if (phase === 'closed') {
            setPhase('settled');
            
            // Determine outcome based on admin settings
            const isDemo = !currentUser || currentUser.accountType === 'demo';
            const winRate = isDemo ? (useTradingStore.getState().demoWinRate ?? 80) : (useTradingStore.getState().realWinRate ?? 30);
            
            let winningTarget;
            const bettedTargets = Object.keys(bets).filter(tid => bets[tid] > 0);
            const nonBettedTargets = currentConfig.targets.filter(t => !bettedTargets.includes(t.id));

            if (bettedTargets.length > 0) {
              const roll = Math.random() * 100;
              if (roll < winRate) {
                // User wins! Select a target they placed bets on
                winningTarget = currentConfig.targets.find(t => t.id === bettedTargets[Math.floor(Math.random() * bettedTargets.length)]);
              } else {
                // User loses! Select a target they did not place bets on
                if (nonBettedTargets.length > 0) {
                  winningTarget = nonBettedTargets[Math.floor(Math.random() * nonBettedTargets.length)];
                } else {
                  winningTarget = currentConfig.targets[Math.floor(Math.random() * currentConfig.targets.length)];
                }
              }
            }
            
            if (!winningTarget) {
              winningTarget = currentConfig.targets[Math.floor(Math.random() * currentConfig.targets.length)];
            }

            const winTargetId = winningTarget.id;
            setRoundWinner(winTargetId);
            setFeedMsg(`ROUND WINNER: ${winningTarget.name.toUpperCase()}`);

            // Mark winning/losing chips and trigger sweep-away glide timers
            setPlacedChips(prev => 
              prev.map(chip => ({
                ...chip,
                isWinning: chip.targetId === winTargetId,
                isLosing: chip.targetId !== winTargetId,
                sweepStart: Date.now()
              }))
            );

            // Spawn celebratory win confetti explosion at the winning target coordinates
            const canvasEl = canvasRef.current;
            if (canvasEl) {
              const targetIdx = currentConfig.targets.findIndex(t => t.id === winTargetId);
              const total = currentConfig.targets.length;
              if (targetIdx !== -1) {
                const tx = 15 + (targetIdx / (total - 1 || 1)) * 70;
                const ty = 50; // target vertical midline
                const pxX = (tx / 100) * canvasEl.clientWidth;
                const pxY = (ty / 100) * canvasEl.clientHeight;
                spawnWinConfetti(pxX, pxY);
              }
            }

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
            const didWin = netProfit > 0;

            // Adjust internal reporting to prevent double-wagering of sidebar bet
            let wagerToReport = totalWager;
            let payoutToReport = totalPayout;

            if (sidebarBetActiveRef.current && sidebarBetTargetRef.current) {
              const sbTarget = sidebarBetTargetRef.current;
              const sbAmount = sidebarBetAmountRef.current;

              wagerToReport = Math.max(0, wagerToReport - sbAmount);
              if (winningTarget.id === sbTarget) {
                const target = currentConfig.targets.find(t => t.id === sbTarget);
                const sbOdds = target ? target.odds : 2.0;
                payoutToReport = Math.max(0, payoutToReport - (sbAmount * sbOdds));
              }

              // Fire parent complete!
              const target = currentConfig.targets.find(t => t.id === sbTarget);
              const sbOdds = target ? target.odds : 2.0;
              const isSbWin = winningTarget.id === sbTarget;
              onCompleteRef.current(isSbWin ? sbOdds : 0, isSbWin);
            }

            if (wagerToReport > 0) {
              playCasino(wagerToReport, payoutToReport, currentConfig.label);
              setPreviousBets(bets);
              setPayoutOverlay({
                active: true,
                profit: Math.round(netProfit),
                won: didWin
              });
              if (didWin) {
                playSynthSound('win', isMuted);
              }
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
    if (ping > 500) {
      setFeedMsg("LATENCY SYNC IN PROGRESS");
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
      
      // Check if click was inside container or came from bottom buttons
      const isInside = 
        event.clientX >= rect.left && 
        event.clientX <= rect.right && 
        event.clientY >= rect.top && 
        event.clientY <= rect.bottom;

      let chipX = 50;
      let chipY = 50;

      if (isInside) {
        chipX = ((event.clientX - rect.left) / rect.width) * 100;
        chipY = ((event.clientY - rect.top) / rect.height) * 100;
      } else {
        // Position chip in corresponding visual target column
        const targetIdx = currentConfig.targets.findIndex(t => t.id === targetId);
        const total = currentConfig.targets.length;
        if (targetIdx !== -1) {
          chipX = 15 + (targetIdx / (total - 1 || 1)) * 70 + (Math.random() - 0.5) * 8;
          chipY = 45 + (Math.random() - 0.5) * 10;
        }
      }

      setPlacedChips(prev => [
        ...prev,
        {
          id: `chip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          targetId,
          value: selectedCoin,
          xPct: chipX,
          yPct: chipY,
          createdAt: Date.now()
        }
      ]);
      playSynthSound('tick', isMuted);
    }

    setBetHistory(prev => [...prev, { ...bets }]);
    setBets(prev => ({
      ...prev,
      [targetId]: (prev[targetId] || 0) + selectedCoin
    }));
  };

  // Modifier Actions
  const handleRepeatBet = () => {
    if (phase !== 'open' || ping > 500) return;
    const previousTotal = Object.values(previousBets).reduce((a, b) => a + b, 0);
    if (previousTotal <= 0) return;
    const validation = validateTransactionIdempotency(balance, previousTotal, 2.0, 'back');
    if (!validation.success) {
      setShowLowBalance(true);
      return;
    }
    
    setBetHistory(prev => [...prev, { ...bets }]);
    setBets(previousBets);

    // Recreate visual chips at target zones
    const newChips: PlacedChip[] = [];
    Object.entries(previousBets).forEach(([targetId, value]) => {
      newChips.push({
        id: `chip_repeat_${Date.now()}_${targetId}_${Math.random().toString(36).substring(2, 6)}`,
        targetId,
        value,
        xPct: 30 + Math.random() * 40,
        yPct: 40 + Math.random() * 30,
        createdAt: Date.now()
      });
    });
    setPlacedChips(newChips);
    playSynthSound('tick', isMuted);
  };

  const handleUndo = () => {
    if (phase !== 'open') return;
    if (betHistory.length === 0) return;
    const previous = betHistory[betHistory.length - 1];
    setBets(previous);
    setPlacedChips(prev => prev.slice(0, -1));
    setBetHistory(prev => prev.slice(0, -1));
    playSynthSound('tick', isMuted);
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
        xPct: chip.xPct,
        yPct: chip.yPct,
        value: chip.value * 2,
        createdAt: Date.now()
      }))
    );
    playSynthSound('tick', isMuted);
  };

  const handleClearAll = () => {
    setBets({});
setPlacedChips([]);
    setBetHistory([]);
    playSynthSound('tick', isMuted);
  };

  const totalActiveBet = Object.values(bets).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full flex flex-col font-sans text-slate-100 bg-[#070b13] p-3 sm:p-5 rounded-3xl border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.85)]">
      
      {/* Game Title & Header Row */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-black tracking-wider text-white uppercase">{currentConfig.label}</span>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-extrabold text-emerald-400 uppercase tracking-widest">Live Betting</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/50 px-2.5 py-1 rounded-sm">
            <span className="text-[10px] font-bold uppercase text-slate-300">Lobby</span>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent("open-lobby"))}
              className="w-8 h-4 bg-slate-650 rounded-full p-0.5 relative transition-colors"
            >
              <div className="w-3 h-3 bg-white rounded-full transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP ONLY CHIP SELECTOR TRAY — Placed directly above video so chips fly down across the felt */}
      <div className="hidden md:flex bg-slate-900/70 backdrop-blur-xl border border-white/5 rounded-2xl p-2 sm:p-2.5 mb-3.5 items-center justify-center gap-2 sm:gap-3 w-full shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        {/* Bet amount label + 1/2 button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={() => {
              const halved = Math.max(50, Math.floor(selectedCoin / 2));
              setSelectedCoin(halved);
            }}
            className="w-7 h-7 flex items-center justify-center bg-slate-800/85 hover:bg-slate-700/85 border border-white/5 text-[9px] font-black text-slate-350 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            ½
          </button>
        </div>

        {/* Chip Coins — Larger on desktop */}
        <div className="flex items-center gap-2 sm:gap-3">
          {COIN_VALUES.map(val => {
            const styles: Record<number, { bg: string, border: string, text: string, shadow: string }> = {
              100: { bg: "from-sky-500 to-sky-700", border: "border-sky-350", text: "text-white", shadow: "shadow-sky-500/40" },
              500: { bg: "from-emerald-500 to-emerald-700", border: "border-emerald-350", text: "text-white", shadow: "shadow-emerald-500/40" },
              1000: { bg: "from-amber-500 to-amber-700", border: "border-amber-350", text: "text-white", shadow: "shadow-amber-500/40" },
              5000: { bg: "from-rose-500 to-rose-700", border: "border-rose-350", text: "text-white", shadow: "shadow-rose-500/40" },
              10000: { bg: "from-purple-500 to-purple-700", border: "border-purple-350", text: "text-white", shadow: "shadow-purple-500/40" },
              50000: { bg: "from-slate-700 to-slate-900", border: "border-slate-600", text: "text-white", shadow: "shadow-slate-700/40" }
            };
            const config = styles[val] || { bg: "from-purple-600 to-purple-800", border: "border-purple-400", text: "text-white", shadow: "shadow-purple-500/40" };
            const isSelected = selectedCoin === val;

            return (
              <button
                key={val}
                onClick={() => {
                  if (balance < val) {
                    setShowLowBalance(true);
                    return;
                  }
                  setSelectedCoin(val);
                  playSynthSound('tick', isMuted);
                }}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center font-black text-[11px] transition-all border-2 border-dashed shadow-md active:scale-90 select-none cursor-pointer relative bg-gradient-to-br",
                  config.bg,
                  config.border,
                  config.text,
                  isSelected 
                    ? `scale-110 ring-2 ring-amber-400 ring-offset-2 ring-offset-[#070b13] ${config.shadow} shadow-lg opacity-100` 
                    : "opacity-75 hover:opacity-100 hover:scale-110"
                )}
              >
                <div className="absolute inset-[1.5px] rounded-full border border-white/20 flex items-center justify-center">
                  <span className="leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{val >= 1000 ? `${val/1000}k` : val}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 2x button + Bet display */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={() => {
              const doubled = selectedCoin * 2;
              if (balance >= doubled) {
                setSelectedCoin(doubled);
              } else {
                setShowLowBalance(true);
              }
            }}
            className="w-7 h-7 flex items-center justify-center bg-slate-800/85 hover:bg-slate-700/85 border border-white/5 text-[9px] font-black text-slate-350 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            2x
          </button>
        </div>

        {/* Current bet value badge */}
        <div className="flex items-center bg-slate-950/80 border border-amber-500/20 rounded-full px-3 py-1 gap-1.5 shadow-inner">
          <span className="text-[8px] text-slate-400 font-extrabold uppercase">Bet</span>
          <span className="text-amber-400 font-black text-[11px] font-mono">₹{selectedCoin.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* WebRTC Video Stream & Interactive Canvas box (Ambient Spotlight & Mahogany wood rail) */}
      <div 
        ref={containerRef} 
        className={getFeltContainerClass()}
        style={{ transform: 'translateZ(0)' }}
      >
        {/* HTML5 WebRTC Video Node with blended screen hologram view */}
        <video
          ref={streamRef}
          autoPlay
          playsInline
          muted
          controls={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 opacity-40 mix-blend-screen"
          style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden', willChange: "transform, opacity" }}
        />

        {/* Holographic grid scanline overlay for futuristic photographic live broadcast blend */}
        <div className="absolute inset-0 z-5 pointer-events-none opacity-[0.04] bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_95%,rgba(255,255,255,1)_95%)] bg-[size:100%_4px]" />
        <div className="absolute inset-0 z-8 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]" />

        {/* 2D Interactive Canvas Overlay (Click-through visual chips layer) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Sequential Live Dealer Physical Card Reveals (Aligned with Felt Slots) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex z-15 pointer-events-none top-[23%] sm:top-[26%] md:top-[28%] gap-[16px] sm:gap-[24px]">
          {dealerCards.map((card) => (
            <motion.div
              key={card.id}
              initial={{ x: 150, y: -200, scale: 0, rotate: 180 }}
              animate={{ x: 0, y: 0, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 13 }}
              className="w-[36px] h-[52px] sm:w-[44px] sm:h-[62px] md:w-[52px] md:h-[72px] bg-gradient-to-b from-white to-slate-50 rounded shadow-[0_12px_28px_rgba(0,0,0,0.5),_0_2px_4px_rgba(0,0,0,0.3)] flex flex-col justify-between p-1 sm:p-1.5 border-[1.5px] border-amber-500/20 font-mono font-black select-none text-slate-900 animate-in fade-in duration-300"
            >
              <div className="flex justify-between items-start leading-none text-[9px] sm:text-[10px] md:text-[11px]">
                <span className={card.suit === '♥' || card.suit === '♦' ? 'text-rose-600 font-bold' : 'text-slate-900 font-bold'}>{card.val}</span>
                <span className={card.suit === '♥' || card.suit === '♦' ? 'text-rose-600' : 'text-slate-900'}>{card.suit}</span>
              </div>
              <div className={cn("text-center leading-none text-[14px] sm:text-[18px] md:text-[22px] mb-0.5", card.suit === '♥' || card.suit === '♦' ? 'text-rose-600' : 'text-slate-900')}>
                {card.suit}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interactive Transparent Glass-morphism Betting Grid Layer */}
        {phase === 'open' && ping <= 500 && showOverlay && (
          <div className="absolute bottom-11 sm:bottom-12 md:bottom-14 inset-x-2 sm:inset-x-4 flex items-end justify-center z-25 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 w-full max-w-md md:max-w-lg">
              {currentConfig.targets.map(target => {
                const activeWager = bets[target.id] || 0;
                return (
                  <button
                    key={`overlay-${target.id}`}
                    onClick={(e) => {
                      setSelectedTarget(target.id);
                      handleBetPlacement(target.id, e);
                    }}
                    className={getBetButtonStyles(target.id, configKey, selectedTarget === target.id, activeWager > 0)}
                  >
                    {/* Iconic Background Silhouette Icon */}
                    {renderBetIcon(target.id, configKey)}

                    <div className="flex justify-between items-center w-full leading-none z-10">
                      <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-serif font-black uppercase tracking-wider text-slate-100">{target.name}</span>
                      <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black text-amber-300 font-mono">x{target.odds.toFixed(2)}</span>
                    </div>
                    
                    <span className={cn(
                      "text-[8px] xs:text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-widest leading-none z-10",
                      activeWager > 0 
                        ? "text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)] animate-pulse" 
                        : "text-white/40"
                    )}>
                      {activeWager > 0 ? `₹${activeWager.toLocaleString('en-IN')}` : "PLACE CHIP"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Live HUD Header: Dealer info, Latency indicator, and circular timer */}
        <div className="absolute top-2 sm:top-3 inset-x-2 sm:inset-x-3 flex justify-between items-start z-20 pointer-events-none">
          {/* Left: Real-time Trust Dealer Status */}
          <div className="flex flex-col gap-0.5 sm:gap-1 bg-black/60 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/5">
            <span className="text-[8px] sm:text-[9px] font-black text-white uppercase tracking-widest leading-none">
              DEALER: KYLIE #702
            </span>
            <span className="hidden sm:block text-[8px] font-bold text-slate-350 leading-none">
              Shift: Night A • Live Status: Verified
            </span>
          </div>

          {/* Middle: Sound & HUD Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg sm:rounded-xl border border-white/5 pointer-events-auto">
            <button 
              onClick={toggleMute}
              className="p-0.5 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isMuted ? "Unmute sounds" : "Mute sounds"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-slate-300" />}
            </button>
            <button 
              onClick={toggleOverlay}
              className="p-0.5 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={showOverlay ? "Hide Overlay Grid" : "Show Overlay Grid"}
            >
              {showOverlay ? <Eye className="w-3.5 h-3.5 text-emerald-450" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>

          {/* Right: Latency Safety Meter & Circular Countdown Timer HUD */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Ping Meter */}
            <div className="flex flex-col items-end gap-0.5 sm:gap-1 bg-black/60 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-white/5 font-mono text-right font-bold">
              <span className={cn("text-[8px] sm:text-[9px] font-black uppercase tracking-widest leading-none", ping > 500 ? "text-rose-400 animate-pulse" : "text-emerald-400")}>
                {ping > 500 ? "HIGH JITTER" : "SUB-300MS WHIP"}
              </span>
              <span className="hidden sm:block text-[8px] font-bold text-slate-350 leading-none">
                Ping: {ping}ms
              </span>
              <span className="block sm:hidden text-[8px] font-bold text-slate-350 leading-none">
                {ping}ms
              </span>
            </div>

            {/* Circular Timer HUD */}
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-black/65 backdrop-blur-md rounded-full border border-white/10">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="2"
                  fill="transparent"
                  className="block sm:hidden"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  stroke={countdown <= 4 ? "#EF4444" : "#3B82F6"}
                  strokeWidth="2"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 14}
                  strokeDashoffset={2 * Math.PI * 14 - (countdown / 15) * 2 * Math.PI * 14}
                  className="transition-all duration-1000 ease-linear block sm:hidden"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="17"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="2.5"
                  fill="transparent"
                  className="hidden sm:block"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="17"
                  stroke={countdown <= 4 ? "#EF4444" : "#3B82F6"}
                  strokeWidth="2.5"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 17}
                  strokeDashoffset={2 * Math.PI * 17 - (countdown / 15) * 2 * Math.PI * 17}
                  className="transition-all duration-1000 ease-linear hidden sm:block"
                />
              </svg>
              <span className={cn("text-[10px] sm:text-[11px] font-black font-mono leading-none", countdown <= 4 ? "text-red-500 animate-pulse" : "text-white")}>
                {countdown}s
              </span>
            </div>
          </div>
        </div>

        {/* Network Safety Overlay: locks bets if ping exceeds threshold */}
        {ping > 500 && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md z-40 flex flex-col items-center justify-center text-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider">Syncing Live Feed...</h4>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Latency: {ping}ms (Limit: 500ms). Betting targets locked.</p>
            </div>
          </div>
        )}

        {/* Middle Overlay: Bets phase announcements */}
        <div className="flex flex-col items-center justify-center text-center my-auto z-20 relative pointer-events-none">
          <AnimatePresence mode="wait">
            {phase === 'open' && (
              <motion.div
                key="open"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="text-xs font-black uppercase text-white bg-black/65 px-4 py-2 rounded-sm tracking-wider">
                  {feedMsg}
                </div>
              </motion.div>
            )}

            {phase === 'closed' && dealerCards.length === 0 && (
              <motion.div
                key="closed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="text-xs font-black text-rose-500 uppercase tracking-widest bg-black/65 px-4 py-2 rounded-sm animate-pulse">
                  BETS CLOSED
                </div>
              </motion.div>
            )}

            {phase === 'settled' && (
              <motion.div
                key="settled"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="text-xs font-black text-indigo-300 uppercase tracking-widest bg-black/65 px-4 py-2 rounded-sm">
                  {feedMsg}
                </div>
                {payoutOverlay.active && (
                  <div className={cn(
                    "px-4 py-1.5 rounded-sm font-black text-xs uppercase shadow-lg border leading-none mt-1.5",
                    payoutOverlay.profit === 0
                      ? "bg-slate-800/80 border-slate-700/30 text-slate-350"
                      : payoutOverlay.won 
                        ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300" 
                        : "bg-rose-955/80 border-rose-500/30 text-rose-300"
                  )}>
                    {payoutOverlay.profit === 0 
                      ? "Push: ₹0" 
                      : payoutOverlay.won 
                        ? `Payout: +₹${payoutOverlay.profit.toLocaleString('en-IN')}` 
                        : `Settled: -₹${Math.abs(payoutOverlay.profit).toLocaleString('en-IN')}`}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stream Bottom Box: Live Players Strip & Total Bet */}
        <div className="border-t border-white/10 pt-2 shrink-0 flex items-center justify-between z-20 w-full relative bg-slate-950/80 p-2 sm:p-2.5 rounded-sm border border-white/5">
          {/* Left: Live Player Avatars */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center -space-x-1.5">
              {LIVE_PLAYERS.slice(0, 6).map((p, i) => (
                <div 
                  key={p.id}
                  className={cn(
                    "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[6px] sm:text-[7px] font-black text-white border-[1.5px] border-slate-950 bg-gradient-to-br shadow-sm select-none",
                    p.color
                  )}
                  style={{ zIndex: LIVE_PLAYERS.length - i }}
                  title={`Player ${p.initials} \u2022 \u20b9${p.bet.toLocaleString('en-IN')}`}
                >
                  {p.initials}
                </div>
              ))}
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[6px] sm:text-[7px] font-black text-slate-300 border-[1.5px] border-slate-950 bg-slate-800 shadow-sm select-none" style={{ zIndex: 0 }}>
                +42
              </div>
            </div>
            <div className="flex flex-col ml-1">
              <span className="text-[8px] sm:text-[9px] font-extrabold text-emerald-400 uppercase leading-none flex items-center gap-0.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                Live Now
              </span>
              <span className="text-[7px] text-slate-500 font-bold leading-none mt-0.5">WHIP WHEP Stream</span>
            </div>
          </div>
          
          {/* Right: Total bet info */}
          <div className="text-right">
            <span className="text-[8px] text-slate-400 font-extrabold block uppercase leading-none mb-0.5">Total Bet</span>
            <span className="text-xs font-black text-white leading-none font-mono">₹{totalActiveBet.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* MOBILE ONLY CONTROL CENTER — Consolidated rows for perfect cellphone usability */}
      <div className="flex md:hidden flex-col gap-3 bg-slate-900/70 backdrop-blur-xl border border-white/5 rounded-2xl p-3 mt-3 w-full shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        {/* Row 1: Quick Actions (Grid aligned) */}
        <div className="grid grid-cols-4 gap-2 w-full">
          <button
            onClick={handleUndo}
            disabled={phase !== 'open' || betHistory.length === 0}
            className="py-2 bg-slate-800/60 hover:bg-slate-700/60 disabled:opacity-25 text-slate-300 hover:text-white rounded-lg border border-white/5 transition-all text-[9.5px] font-black uppercase tracking-wider text-center cursor-pointer select-none"
          >
            Undo
          </button>
          <button
            onClick={handleRepeatBet}
            disabled={phase !== 'open' || Object.keys(previousBets).length === 0}
            className="py-2 bg-slate-800/60 hover:bg-slate-700/60 disabled:opacity-25 text-slate-300 hover:text-white rounded-lg border border-white/5 transition-all text-[9.5px] font-black uppercase tracking-wider text-center cursor-pointer select-none"
          >
            Repeat
          </button>
          <button
            onClick={handleDouble}
            disabled={phase !== 'open' || totalActiveBet === 0}
            className="py-2 bg-slate-800/60 hover:bg-slate-700/60 disabled:opacity-25 text-slate-300 hover:text-white rounded-lg border border-white/5 transition-all text-[9.5px] font-black uppercase tracking-wider text-center cursor-pointer select-none"
          >
            Double
          </button>
          <button
            onClick={handleClearAll}
            disabled={phase !== 'open' || totalActiveBet === 0}
            className="py-2 bg-rose-950/60 hover:bg-rose-900/65 disabled:opacity-25 text-rose-350 hover:text-rose-250 rounded-lg border border-rose-900/35 transition-all text-[9.5px] font-black uppercase tracking-wider text-center cursor-pointer select-none"
          >
            Clear
          </button>
        </div>

        {/* Row 2: Chip selector bar inside a capsule container */}
        <div className="flex items-center justify-between gap-1 bg-slate-950/40 p-2 border border-white/5 rounded-xl overflow-x-auto select-none">
          {COIN_VALUES.map(val => {
            const styles: Record<number, { bg: string, border: string, text: string, shadow: string }> = {
              100: { bg: "from-sky-500 to-sky-700", border: "border-sky-350", text: "text-white", shadow: "shadow-sky-500/40" },
              500: { bg: "from-emerald-500 to-emerald-700", border: "border-emerald-350", text: "text-white", shadow: "shadow-emerald-500/40" },
              1000: { bg: "from-amber-500 to-amber-700", border: "border-amber-350", text: "text-white", shadow: "shadow-amber-500/40" },
              5000: { bg: "from-rose-500 to-rose-700", border: "border-rose-350", text: "text-white", shadow: "shadow-rose-500/40" },
              10000: { bg: "from-purple-500 to-purple-700", border: "border-purple-350", text: "text-white", shadow: "shadow-purple-500/40" },
              50000: { bg: "from-slate-700 to-slate-900", border: "border-slate-600", text: "text-white", shadow: "shadow-slate-700/40" }
            };
            const config = styles[val] || { bg: "from-purple-600 to-purple-800", border: "border-purple-400", text: "text-white", shadow: "shadow-purple-500/40" };
            const isSelected = selectedCoin === val;

            return (
              <button
                key={val}
                onClick={() => {
                  if (balance < val) {
                    setShowLowBalance(true);
                    return;
                  }
                  setSelectedCoin(val);
                  playSynthSound('tick', isMuted);
                }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-black text-[9px] transition-all border-2 border-dashed shadow-md active:scale-90 select-none cursor-pointer relative bg-gradient-to-br shrink-0",
                  config.bg,
                  config.border,
                  config.text,
                  isSelected 
                    ? `scale-105 ring-2 ring-amber-400 ring-offset-2 ring-offset-[#070b13] ${config.shadow} shadow-lg opacity-100` 
                    : "opacity-80 hover:opacity-100"
                )}
              >
                <div className="absolute inset-[1.5px] rounded-full border border-white/20 flex items-center justify-center">
                  <span className="leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{val >= 1000 ? `${val/1000}k` : val}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Row 3: Current Wager + Multipliers (1/2, 2x) */}
        <div className="flex items-center justify-between bg-slate-950/60 border border-white/5 p-2 rounded-xl">
          <div className="flex items-center gap-1.5 pl-1.5">
            <span className="text-[9px] text-slate-400 font-extrabold uppercase">Bet:</span>
            <span className="text-amber-400 font-black text-[12px] font-mono">₹{selectedCoin.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => {
                const halved = Math.max(50, Math.floor(selectedCoin / 2));
                setSelectedCoin(halved);
              }}
              className="px-3 py-1 bg-slate-800/85 hover:bg-slate-700/85 border border-white/5 text-[9px] font-black text-slate-350 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              1/2
            </button>
            <button 
              onClick={() => {
                const doubled = selectedCoin * 2;
                if (balance >= doubled) {
                  setSelectedCoin(doubled);
                } else {
                  setShowLowBalance(true);
                }
              }}
              className="px-3 py-1 bg-slate-800/85 hover:bg-slate-700/85 border border-white/5 text-[9px] font-black text-slate-355 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              2x
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP ONLY QUICK ACTIONS BAR — Compact row below video */}
      <div className="hidden md:flex items-center justify-center gap-1.5 sm:gap-2 mt-2.5 w-full">
        <button
          onClick={handleUndo}
          disabled={phase !== 'open' || betHistory.length === 0}
          className="px-4 py-1.5 bg-slate-800/50 hover:bg-slate-700/60 disabled:opacity-25 text-slate-300 hover:text-white rounded-lg border border-white/5 transition-all cursor-pointer select-none font-mono text-[10px] font-black uppercase tracking-wider"
        >
          Undo
        </button>
        <button
          onClick={handleRepeatBet}
          disabled={phase !== 'open' || Object.keys(previousBets).length === 0}
          className="px-4 py-1.5 bg-slate-800/50 hover:bg-slate-700/60 disabled:opacity-25 text-slate-300 hover:text-white rounded-lg border border-white/5 transition-all cursor-pointer select-none font-mono text-[10px] font-black uppercase tracking-wider"
        >
          Repeat
        </button>
        <button
          onClick={handleDouble}
          disabled={phase !== 'open' || totalActiveBet === 0}
          className="px-4 py-1.5 bg-slate-800/50 hover:bg-slate-700/60 disabled:opacity-25 text-slate-300 hover:text-white rounded-lg border border-white/5 transition-all cursor-pointer select-none font-mono text-[10px] font-black uppercase tracking-wider"
        >
          Double
        </button>
        <button
          onClick={handleClearAll}
          disabled={phase !== 'open' || totalActiveBet === 0}
          className="px-4 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 disabled:opacity-25 text-rose-350 hover:text-rose-250 rounded-lg border border-rose-900/35 transition-all cursor-pointer select-none font-mono text-[10px] font-black uppercase tracking-wider"
        >
          Clear
        </button>
      </div>

      {/* BOTTOM DASHBOARD: Roadmap + Live Activity + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_280px] gap-3 mt-4 w-full items-stretch">
        
        {/* 1. Scorecard Roadmap (Analytics) */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 sm:p-4 select-none w-full shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-2.5 border-b border-white/5 pb-2">
            <span className="text-[10px] font-black text-slate-350 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-450" />
              Roadmap
            </span>
            <span className="text-[8px] text-slate-500 font-extrabold uppercase">Last 15</span>
          </div>
          <div 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className="flex gap-1.5 overflow-x-auto items-center touch-pan-x flex-row-reverse py-1 select-none flex-1"
          >
            {historyList.slice().reverse().map((val, idx) => (
              <span 
                key={idx}
                className={cn(
                  "w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[10px] sm:text-[11px] font-black flex items-center justify-center shrink-0 border border-white/5 shadow-md transition-transform active:scale-95",
                  val === 'A' || val === '8' || val === 'D' || val === 'U' || val === '7'
                    ? "bg-blue-600 text-white shadow-blue-500/20" 
                    : val === 'B' || val === '9' || val === 'T' || val === 'W'
                    ? "bg-red-600 text-white shadow-red-500/20"
                    : "bg-slate-700 text-slate-200"
                )}
              >
                {val}
              </span>
            ))}
          </div>
        </div>

        {/* 2. Live Activity Feed (Social Proof) */}
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 sm:p-4 select-none w-full shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-2.5 border-b border-white/5 pb-2">
            <span className="text-[10px] font-black text-slate-350 uppercase tracking-widest flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Live Bets
            </span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] text-emerald-400 font-extrabold uppercase">48 Online</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-1 overflow-hidden">
            {LIVE_FEED_BETS.slice(0, 4).map((bet, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-white/[0.03] last:border-0">
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[6px] font-black text-white bg-gradient-to-br shadow-sm",
                    LIVE_PLAYERS[i % LIVE_PLAYERS.length].color
                  )}>
                    {bet.player.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-200 leading-none">{bet.player}</span>
                    <span className="text-[7px] text-slate-500 font-bold leading-none mt-0.5">{bet.target} \u2022 {bet.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "text-[9px] font-black font-mono leading-none",
                    bet.won ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {bet.won ? '+' : '-'}\u20b9{bet.amount.toLocaleString('en-IN')}
                  </span>
                  {bet.won && <Trophy className="w-2.5 h-2.5 text-amber-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Live Stats & Trust */}
        <div className="flex flex-col gap-3 w-full">
          {/* Live Table Stats */}
          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3 sm:p-4 select-none shadow-lg flex-1">
            <div className="flex items-center gap-1.5 mb-2.5 border-b border-white/5 pb-2">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px] font-black text-slate-350 uppercase tracking-widest">Table Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950/50 rounded-lg p-2 text-center border border-white/[0.03]">
                <span className="text-[8px] text-slate-500 font-extrabold uppercase block leading-none mb-1">Players</span>
                <span className="text-sm font-black text-white leading-none font-mono">48</span>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-2 text-center border border-white/[0.03]">
                <span className="text-[8px] text-slate-500 font-extrabold uppercase block leading-none mb-1">Volume</span>
                <span className="text-sm font-black text-emerald-400 leading-none font-mono">\u20b9320K</span>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-2 text-center border border-white/[0.03]">
                <span className="text-[8px] text-slate-500 font-extrabold uppercase block leading-none mb-1">Win Rate</span>
                <span className="text-sm font-black text-amber-400 leading-none font-mono">48.6%</span>
              </div>
              <div className="bg-slate-950/50 rounded-lg p-2 text-center border border-white/[0.03]">
                <span className="text-[8px] text-slate-500 font-extrabold uppercase block leading-none mb-1">Max Win</span>
                <span className="text-sm font-black text-[#C084FC] leading-none font-mono">\u20b9150K</span>
              </div>
            </div>
          </div>

          {/* Trust / Affiliate Badge */}
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-white/5 rounded-xl p-3 select-none shadow-lg">
            {gameId.startsWith("royal-1") ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[8px] font-extrabold text-[#C084FC] uppercase tracking-widest block">Referral Program</span>
                  <p className="text-[9px] text-slate-400 leading-snug font-medium truncate">
                    <span className="text-white font-bold">GoldenAce</span> earned <span className="text-emerald-400 font-extrabold">\u20b985K</span> today
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[8px] font-extrabold text-emerald-400 uppercase tracking-widest block">Provably Fair</span>
                  <p className="text-[9px] text-slate-400 leading-snug font-medium">Instant UPI \u2022 &lt;2 min</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Exception Warning Dialog Modals */}
      <AnimatePresence>
        {/* 1. Low Balance Alert Modal */}
        {showLowBalance && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#070b13]/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 max-w-sm w-full p-6 rounded-2xl shadow-2xl text-center space-y-4 text-slate-100">
              <AlertTriangle className="w-12 h-12 text-[#BE185D] mx-auto animate-bounce" />
              <h4 className="text-sm font-black uppercase tracking-wider text-white">Low Balance</h4>
              <p className="text-xs text-slate-400 leading-normal">
                Low Balance: Your balance is low, please visit the cashier.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowLowBalance(false)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-lg text-[10px] font-black uppercase text-slate-300">Cancel</button>
                <button 
                  onClick={() => {
                    setShowLowBalance(false);
                    window.dispatchEvent(new CustomEvent("open-cashier"));
                  }} 
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-lg text-[10px] font-black uppercase tracking-wider"
                >
                  Deposit
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. Connection Lost Alert Modal */}
        {showConnectionLost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#070b13]/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 max-w-sm w-full p-6 rounded-2xl shadow-2xl text-center space-y-4 text-slate-100">
              <RefreshCw className="w-12 h-12 text-indigo-500 mx-auto animate-spin" />
              <h4 className="text-sm font-black uppercase tracking-wider text-white">Connection Lost</h4>
              <p className="text-xs text-slate-400 leading-normal">
                Connection Lost: Attempting to reconnect to live dealer room...
              </p>
            </div>
          </motion.div>
        )}

        {/* 3. Server Maintenance Alert Modal */}
        {showMaintenance && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#070b13]/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 max-w-sm w-full p-6 rounded-2xl shadow-2xl text-center space-y-4 text-slate-100">
              <AlertTriangle className="w-12 h-12 text-[#D97706] mx-auto animate-pulse" />
              <h4 className="text-sm font-black uppercase tracking-wider text-white">Notice</h4>
              <p className="text-xs text-slate-400 leading-normal">
                Notice: Game is under maintenance. Returning to primary game vault selection.
              </p>
              <button 
                onClick={() => {
                  setShowMaintenance(false);
                  window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: 'login' } }));
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-[10px] font-black uppercase tracking-wider border border-white/5"
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
