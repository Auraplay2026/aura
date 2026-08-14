"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, Zap, Trophy, Activity, CheckCircle2, AlertCircle, 
  X, Flame, TrendingUp, Radio, ShieldCheck, Sparkles, SlidersHorizontal, Eye
} from "lucide-react";
import { useTradingStore, Position } from "@/lib/store";
import { cn } from "@/lib/utils";

export interface ExchangeMatchSelection {
  id: string;
  name: string;
  shortCode: string;
  back: number;
  lay: number;
  backTrend?: "up" | "down" | null;
  layTrend?: "up" | "down" | null;
}

export interface ExchangeMatch {
  id: string;
  sport: "cricket" | "football" | "tennis" | "basketball";
  sportIcon: string;
  league: string;
  title: string;
  team1: string;
  team2: string;
  team1Code: string;
  team2Code: string;
  score: string;
  liveStatus: string;
  ballCommentary: string;
  inPlay: boolean;
  selections: ExchangeMatchSelection[];
}

const INITIAL_EXCHANGE_MATCHES: ExchangeMatch[] = [
  {
    id: "ex-cricket-1",
    sport: "cricket",
    sportIcon: "🏏",
    league: "IPL 2026 • Match 28",
    title: "RCB vs CSK",
    team1: "Royal Challengers Bengaluru",
    team2: "Chennai Super Kings",
    team1Code: "RCB",
    team2Code: "CSK",
    score: "144/3 (14.3 Overs)",
    liveStatus: "Target 186 • Req RR: 7.63",
    ballCommentary: "⚡ 14.3 Ov: Kohli pushes for a quick 2! Strike rotation on point.",
    inPlay: true,
    selections: [
      { id: "rcb", name: "Royal Challengers Bengaluru", shortCode: "RCB", back: 1.90, lay: 1.91 },
      { id: "csk", name: "Chennai Super Kings", shortCode: "CSK", back: 1.96, lay: 1.97 }
    ]
  },
  {
    id: "ex-football-1",
    sport: "football",
    sportIcon: "⚽",
    league: "UEFA Champions League • Semi-Final",
    title: "Manchester City vs Real Madrid",
    team1: "Manchester City",
    team2: "Real Madrid",
    team1Code: "MCI",
    team2Code: "RMA",
    score: "2 - 1 (74')",
    liveStatus: "2nd Half In-Play • Intense Pressure",
    ballCommentary: "🔥 74': De Bruyne delivers a curling free-kick into the 6-yard box!",
    inPlay: true,
    selections: [
      { id: "mci", name: "Manchester City", shortCode: "City", back: 2.10, lay: 2.12 },
      { id: "rma", name: "Real Madrid", shortCode: "Madrid", back: 3.40, lay: 3.45 }
    ]
  },
  {
    id: "ex-tennis-1",
    sport: "tennis",
    sportIcon: "🎾",
    league: "Wimbledon Men's Singles • Final",
    title: "Novak Djokovic vs Carlos Alcaraz",
    team1: "Novak Djokovic",
    team2: "Carlos Alcaraz",
    team1Code: "DJOK",
    team2Code: "ALCA",
    score: "Set 3 • 4-4 (30-30)",
    liveStatus: "Serve: Alcaraz (138 km/h)",
    ballCommentary: "🎾 30-30: 24-shot baseline rally ended with a blistering forehand down the line!",
    inPlay: true,
    selections: [
      { id: "djokovic", name: "Novak Djokovic", shortCode: "Djokovic", back: 1.75, lay: 1.76 },
      { id: "alcaraz", name: "Carlos Alcaraz", shortCode: "Alcaraz", back: 2.10, lay: 2.12 }
    ]
  },
  {
    id: "ex-cricket-2",
    sport: "cricket",
    sportIcon: "🏏",
    league: "ICC T20 World Cup • Super 8",
    title: "India vs Australia",
    team1: "India",
    team2: "Australia",
    team1Code: "IND",
    team2Code: "AUS",
    score: "188/4 (18.4 Overs)",
    liveStatus: "1st Innings • Projected 205",
    ballCommentary: "🚀 18.4 Ov: MAXIMUM! Smashed over deep mid-wicket for a 94m SIX!",
    inPlay: true,
    selections: [
      { id: "ind", name: "India", shortCode: "IND", back: 1.72, lay: 1.74 },
      { id: "aus", name: "Australia", shortCode: "AUS", back: 2.15, lay: 2.18 }
    ]
  },
  {
    id: "ex-football-2",
    sport: "football",
    sportIcon: "⚽",
    league: "Premier League • London Derby",
    title: "Arsenal vs Chelsea",
    team1: "Arsenal",
    team2: "Chelsea",
    team1Code: "ARS",
    team2Code: "CHE",
    score: "1 - 0 (58')",
    liveStatus: "2nd Half In-Play",
    ballCommentary: "🛡️ 58': Saka cuts inside from the right flank, deflected out for a corner.",
    inPlay: true,
    selections: [
      { id: "ars", name: "Arsenal", shortCode: "Arsenal", back: 1.65, lay: 1.67 },
      { id: "che", name: "Chelsea", shortCode: "Chelsea", back: 4.80, lay: 4.90 }
    ]
  },
  {
    id: "ex-basketball-1",
    sport: "basketball",
    sportIcon: "🏀",
    league: "NBA Playoffs • Western Conference",
    title: "LA Lakers vs Golden State Warriors",
    team1: "Los Angeles Lakers",
    team2: "Golden State Warriors",
    team1Code: "LAL",
    team2Code: "GSW",
    score: "Q3 • 84 - 81",
    liveStatus: "3rd Quarter • 3:24 Remaining",
    ballCommentary: "🏀 Curry pulls up from downtown! Swish for three!",
    inPlay: true,
    selections: [
      { id: "lal", name: "LA Lakers", shortCode: "Lakers", back: 1.82, lay: 1.84 },
      { id: "gsw", name: "Golden State Warriors", shortCode: "Warriors", back: 2.02, lay: 2.05 }
    ]
  }
];

export function LiveExchangeWidget() {
  const [matches, setMatches] = useState<ExchangeMatch[]>(INITIAL_EXCHANGE_MATCHES);
  const [activeTab, setActiveTab] = useState<"all" | "cricket" | "football" | "tennis" | "basketball">("all");
  const [turboBet, setTurboBet] = useState(false);
  const [turboStake, setTurboStake] = useState<number>(1000);
  
  // Bet slip state
  const [selectedBet, setSelectedBet] = useState<{
    matchId: string;
    matchTitle: string;
    selectionName: string;
    shortCode: string;
    odds: number;
    type: "back" | "lay";
    team1Code: string;
    team2Code: string;
  } | null>(null);

  const [stakeInput, setStakeInput] = useState<string>("500");
  const [isPlacing, setIsPlacing] = useState(false);
  const [betSuccess, setBetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { isLoggedIn, balance, placeSportsBet, positions } = useTradingStore();

  // Dynamic Live Odds & Score Ticker Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setMatches(prev => prev.map(match => {
        // Random micro odds drift (-0.03 to +0.03)
        const drift = (Math.random() - 0.5) * 0.04;
        const updatedSelections = match.selections.map(sel => {
          const shift = (Math.random() - 0.5) > 0 ? drift : -drift;
          const nextBack = Math.max(1.05, parseFloat((sel.back + shift).toFixed(2)));
          const nextLay = Math.max(nextBack + 0.01, parseFloat((nextBack + 0.01 + Math.random() * 0.02).toFixed(2)));
          
          return {
            ...sel,
            back: nextBack,
            lay: nextLay,
            backTrend: (shift > 0.01 ? "up" : shift < -0.01 ? "down" : null) as ("up" | "down" | null),
            layTrend: (shift > 0.01 ? "up" : shift < -0.01 ? "down" : null) as ("up" | "down" | null)
          };
        });

        // Random cricket over advancement / football minute tick
        let newScore = match.score;
        let newCommentary = match.ballCommentary;

        if (match.sport === "cricket" && Math.random() > 0.6) {
          const runs = [0, 1, 2, 4, 6, 1][Math.floor(Math.random() * 6)];
          const overs = (14 + Math.random() * 5).toFixed(1);
          newScore = `${140 + Math.floor(Math.random() * 30)}/${Math.floor(Math.random() * 4) + 2} (${overs} Overs)`;
          newCommentary = runs === 6 
            ? `🚀 ${overs} Ov: HUGE SIX! Cleared the ropes easily!`
            : runs === 4 
              ? `⚡ ${overs} Ov: CRACKING FOUR! Pierced the off-side field!`
              : `🏏 ${overs} Ov: Single taken, rotating the strike.`;
        }

        return {
          ...match,
          selections: updatedSelections,
          score: newScore,
          ballCommentary: newCommentary
        };
      }));
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Quick sound & haptics trigger
  const triggerHaptics = useCallback(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate([15, 30]); } catch {}
    }
  }, []);

  const handleOddsSelection = (
    match: ExchangeMatch, 
    selection: ExchangeMatchSelection, 
    type: "back" | "lay", 
    odds: number
  ) => {
    triggerHaptics();

    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: "login" } }));
      return;
    }

    // If Turbo Bet is enabled, place instant bet in 1 click!
    if (turboBet) {
      if (balance < turboStake) {
        alert(`Insufficient balance for 1-Click Turbo Bet (₹${turboStake.toLocaleString()}). Please deposit funds.`);
        window.dispatchEvent(new CustomEvent("open-cashier"));
        return;
      }

      const uuid = `TURBO-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      placeSportsBet(match.title, selection.name, odds, turboStake, type === "back" ? "yes" : "no", uuid)
        .then(res => {
          if (res?.success) {
            triggerHaptics();
            setBetSuccess(true);
            setTimeout(() => setBetSuccess(false), 2000);
          } else {
            alert(res?.error || "Turbo bet failed to execute.");
          }
        })
        .catch(err => alert("Bet error: " + err?.message));
      return;
    }

    // Normal flow: Open high-dopamine Quick Bet Slip
    setSelectedBet({
      matchId: match.id,
      matchTitle: match.title,
      selectionName: selection.name,
      shortCode: selection.shortCode,
      odds,
      type,
      team1Code: match.team1Code,
      team2Code: match.team2Code
    });
    setErrorMessage("");
    setBetSuccess(false);
  };

  const handleConfirmWager = async () => {
    if (!selectedBet) return;
    triggerHaptics();

    const stakeVal = parseFloat(stakeInput);
    if (isNaN(stakeVal) || stakeVal <= 0) {
      setErrorMessage("Please enter a valid stake amount.");
      return;
    }

    // Calculate required amount
    const isLay = selectedBet.type === "lay";
    const liability = isLay ? stakeVal * (selectedBet.odds - 1) : 0;
    const totalRequired = stakeVal + liability;

    if (balance < totalRequired) {
      setErrorMessage(`Insufficient balance. Required: ₹${totalRequired.toFixed(2)} (Available: ₹${balance.toLocaleString()})`);
      return;
    }

    setIsPlacing(true);
    setErrorMessage("");

    try {
      const uuid = `EX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const res = await placeSportsBet(
        selectedBet.matchTitle,
        selectedBet.selectionName,
        selectedBet.odds,
        stakeVal,
        selectedBet.type === "back" ? "yes" : "no",
        uuid
      );

      if (res?.success) {
        setBetSuccess(true);
        triggerHaptics();
        setTimeout(() => {
          setSelectedBet(null);
          setBetSuccess(false);
        }, 1600);
      } else {
        setErrorMessage(res?.error || "Failed to place bet. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Communication error.");
    } finally {
      setIsPlacing(false);
    }
  };

  const filteredMatches = activeTab === "all" 
    ? matches 
    : matches.filter(m => m.sport === activeTab);

  const parsedStake = parseFloat(stakeInput) || 0;
  const isSelectedLay = selectedBet?.type === "lay";
  const potentialProfit = selectedBet ? (isSelectedLay ? parsedStake : parsedStake * (selectedBet.odds - 1)) : 0;
  const potentialPayout = selectedBet ? (isSelectedLay ? parsedStake : parsedStake * selectedBet.odds) : 0;
  const layLiability = selectedBet && isSelectedLay ? parsedStake * (selectedBet.odds - 1) : 0;

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden ring-1 ring-slate-100 flex flex-col">
      
      {/* ═══ HEADER: TITLE + TURBO TOGGLE + FULL SPORTSBOOK LINK ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping absolute opacity-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 relative shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
              Live Exchange Matches
              <span className="bg-red-50 text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded border border-red-200 uppercase tracking-wider">
                In-Play
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Turbo 1-Click Bet Mode */}
          <button
            type="button"
            onClick={() => { setTurboBet(!turboBet); triggerHaptics(); }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all border cursor-pointer",
              turboBet
                ? "bg-amber-50 text-amber-700 border-amber-300 shadow-sm"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            )}
            title="When active, tap any Back/Lay chip to place 1-click ₹1K bet instantly"
          >
            <Zap className={cn("w-3.5 h-3.5", turboBet ? "text-amber-600 fill-amber-500" : "text-slate-400")} />
            <span>{turboBet ? "1-Click Bet ON (₹1k)" : "1-Click OFF"}</span>
          </button>

          <Link 
            href="/sportsbook" 
            className="text-xs font-black text-slate-700 hover:text-red-650 uppercase tracking-wider flex items-center gap-0.5 transition-colors ml-1 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
          >
            Full Sportsbook <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ═══ SPORT CATEGORY FILTER PILLS ═══ */}
      <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto scrollbar-none select-none">
        {[
          { id: "all", label: "🔥 All Live", count: matches.length },
          { id: "cricket", label: "🏏 Cricket", count: matches.filter(m => m.sport === "cricket").length },
          { id: "football", label: "⚽ Football", count: matches.filter(m => m.sport === "football").length },
          { id: "tennis", label: "🎾 Tennis", count: matches.filter(m => m.sport === "tennis").length },
          { id: "basketball", label: "🏀 Basketball", count: matches.filter(m => m.sport === "basketball").length },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setActiveTab(tab.id as any); triggerHaptics(); }}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all border cursor-pointer",
              activeTab === tab.id
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            )}
          >
            {tab.label} <span className={cn("ml-1 text-[10px] px-1 rounded-full", activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700")}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ═══ MATCH CARDS LIST ═══ */}
      <div className="space-y-2.5 mt-1">
        {filteredMatches.map(match => (
          <div 
            key={match.id}
            className="border border-slate-200/80 rounded-xl p-3 sm:p-3.5 bg-gradient-to-b from-white to-slate-50/60 hover:border-slate-300 transition-all shadow-xs"
          >
            {/* Match Header: League + Title + Score */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{match.sportIcon}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{match.league}</span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                  {match.team1} <span className="text-slate-400 font-normal">vs</span> {match.team2}
                </h4>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs sm:text-sm font-black font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                  {match.score}
                </div>
                <div className="text-[9px] font-bold text-slate-500 tracking-tight mt-0.5">
                  {match.liveStatus}
                </div>
              </div>
            </div>

            {/* Match Selections: Team 1 & Team 2 with Back & Lay */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {match.selections.map(sel => {
                const isSelectedBack = selectedBet?.matchId === match.id && selectedBet?.selectionName === sel.name && selectedBet?.type === "back";
                const isSelectedLay = selectedBet?.matchId === match.id && selectedBet?.selectionName === sel.name && selectedBet?.type === "lay";

                return (
                  <div 
                    key={sel.id}
                    className="flex items-center justify-between bg-white border border-slate-200/90 rounded-lg p-2 shadow-xs hover:shadow-sm transition-all"
                  >
                    {/* Team Name / Short Code */}
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-[10px] text-slate-800 shrink-0 select-none">
                        {sel.shortCode.substring(0, 3).toUpperCase()}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 truncate">
                        {sel.shortCode}
                      </span>
                    </div>

                    {/* Back & Lay Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* BACK BUTTON (Sky/Emerald) */}
                      <button
                        type="button"
                        onClick={() => handleOddsSelection(match, sel, "back", sel.back)}
                        className={cn(
                          "w-14 sm:w-16 py-1.5 px-1 rounded-md text-center border transition-all cursor-pointer select-none active:scale-95",
                          isSelectedBack
                            ? "bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-300 shadow-sm"
                            : "bg-[#E0F2FE] hover:bg-[#BAE6FD] text-sky-900 border-sky-200/80",
                          sel.backTrend === "up" && "ring-2 ring-emerald-400 animate-pulse"
                        )}
                        title={`Back ${sel.name} at ${sel.back}`}
                      >
                        <span className="block text-[8px] font-black uppercase text-sky-800/80 leading-none">Back</span>
                        <span className="text-xs sm:text-sm font-black font-mono leading-none mt-0.5 block text-slate-950">
                          {sel.back.toFixed(2)}
                        </span>
                      </button>

                      {/* LAY BUTTON (Pink) */}
                      <button
                        type="button"
                        onClick={() => handleOddsSelection(match, sel, "lay", sel.lay)}
                        className={cn(
                          "w-14 sm:w-16 py-1.5 px-1 rounded-md text-center border transition-all cursor-pointer select-none active:scale-95",
                          isSelectedLay
                            ? "bg-pink-500 text-white border-pink-600 ring-2 ring-pink-300 shadow-sm"
                            : "bg-[#FCE7F3] hover:bg-[#FBCFE8] text-pink-900 border-pink-200/80",
                          sel.layTrend === "up" && "ring-2 ring-pink-400 animate-pulse"
                        )}
                        title={`Lay ${sel.name} at ${sel.lay}`}
                      >
                        <span className="block text-[8px] font-black uppercase text-pink-800/80 leading-none">Lay</span>
                        <span className="text-xs sm:text-sm font-black font-mono leading-none mt-0.5 block text-slate-950">
                          {sel.lay.toFixed(2)}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ball-by-ball commentary tick */}
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span className="truncate italic">{match.ballCommentary}</span>
              <span className="font-bold text-slate-600 shrink-0 ml-2 font-mono">0% Commission</span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ BOTTOM-SHEET QUICK BET SLIP (MOBILE & DESKTOP DOCKED) ═══ */}
      <AnimatePresence>
        {selectedBet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBet(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 transition-opacity"
            />

            {/* Slide-Up Bet Slip Container */}
            <motion.div
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-[60] max-w-lg mx-auto bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom,16px)]"
            >
              {/* Slip Header */}
              <div className={cn(
                "p-3.5 px-4 flex items-center justify-between border-b text-white select-none",
                selectedBet.type === "back" 
                  ? "bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 border-sky-500" 
                  : "bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 border-pink-500"
              )}>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-black text-xs">
                    {selectedBet.type === "back" ? "✓" : "✕"}
                  </span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider leading-none">
                      {selectedBet.type === "back" ? "Backing (Win Bet)" : "Laying (Against Bet)"}
                    </h4>
                    <p className="text-[11px] font-bold text-white/90 truncate max-w-[260px] sm:max-w-xs mt-0.5">
                      {selectedBet.selectionName} @ <span className="font-mono font-black text-yellow-300">{selectedBet.odds.toFixed(2)}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBet(null)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
                  aria-label="Close bet slip"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Slip Body */}
              <div className="p-4 space-y-3.5 bg-slate-50/50">
                {/* Match context */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="truncate">{selectedBet.matchTitle}</span>
                  <span className="text-[11px] font-black font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    Odds: {selectedBet.odds.toFixed(2)}
                  </span>
                </div>

                {/* Success Feedback */}
                {betSuccess ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col items-center justify-center text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-2 animate-bounce" />
                    <h4 className="text-base font-black text-emerald-900">Bet Placed & Matched!</h4>
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                      ₹{parsedStake.toLocaleString()} {selectedBet.type.toUpperCase()} on {selectedBet.shortCode} @ {selectedBet.odds.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Error Banner */}
                    {errorMessage && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Stake Input */}
                    <div>
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 px-1">
                        <span>Stake Amount</span>
                        <span>Balance: <span className="font-mono text-slate-900 font-black">₹{balance.toLocaleString()}</span></span>
                      </div>

                      <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-slate-400 shadow-xs">
                        <div className="px-3.5 bg-slate-100 border-r border-slate-200 text-slate-700 font-black text-base">
                          ₹
                        </div>
                        <input
                          type="number"
                          value={stakeInput}
                          onChange={(e) => setStakeInput(e.target.value)}
                          placeholder="500"
                          className="w-full bg-transparent px-3 py-2.5 text-slate-900 font-black text-base font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="flex items-center pr-2 gap-1">
                          <button
                            type="button"
                            onClick={() => setStakeInput(String(Math.max(50, Math.floor(parsedStake / 2))))}
                            className="px-2 py-1 text-[11px] font-black text-slate-600 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                          >
                            ½
                          </button>
                          <button
                            type="button"
                            onClick={() => setStakeInput(String(parsedStake * 2))}
                            className="px-2 py-1 text-[11px] font-black text-slate-600 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                          >
                            2×
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stake Chips (₹100, ₹500, ₹1k, ₹2.5k, ₹5k, ₹10k) */}
                    <div className="grid grid-cols-6 gap-1.5">
                      {[100, 500, 1000, 2500, 5000, 10000].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => { setStakeInput(String(val)); triggerHaptics(); }}
                          className={cn(
                            "py-1.5 rounded-lg font-black text-[11px] transition-all border cursor-pointer select-none",
                            parsedStake === val
                              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          {val >= 1000 ? `${val/1000}k` : val}
                        </button>
                      ))}
                    </div>

                    {/* Instant Profit & Payout Breakdown */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5 shadow-xs">
                      {isSelectedLay ? (
                        <>
                          <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                            <span>Your Profit (if {selectedBet.shortCode} loses):</span>
                            <span className="text-emerald-700 font-mono font-black text-sm">+₹{potentialProfit.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold text-rose-600">
                            <span>Max Liability / Risk:</span>
                            <span className="font-mono font-black text-sm">₹{layLiability.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                            <span>Net Profit:</span>
                            <span className="text-emerald-700 font-mono font-black text-sm">+₹{potentialProfit.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold text-slate-900 border-t border-slate-100 pt-1">
                            <span>Total Estimated Payout:</span>
                            <span className="font-mono font-black text-base text-slate-950">₹{potentialPayout.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* CONFIRM WAGER ACTION BUTTON */}
                    <button
                      type="button"
                      onClick={handleConfirmWager}
                      disabled={isPlacing || parsedStake <= 0}
                      className={cn(
                        "w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest text-white shadow-lg transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2",
                        selectedBet.type === "back"
                          ? "bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25"
                          : "bg-gradient-to-r from-pink-500 via-rose-600 to-pink-600 hover:from-pink-600 hover:to-rose-700 shadow-pink-500/25",
                        isPlacing && "opacity-75 cursor-not-allowed"
                      )}
                    >
                      {isPlacing ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Matching Bet...
                        </span>
                      ) : (
                        <span>
                          ⚡ PLACE {selectedBet.type.toUpperCase()} BET • ₹{parsedStake.toLocaleString()}
                        </span>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
