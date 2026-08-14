"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, Zap, Trophy, Activity, CheckCircle2, AlertCircle, 
  X, Flame, TrendingUp, Radio, ShieldCheck, Sparkles, SlidersHorizontal, 
  Eye, Target, ArrowRight, Gauge, HelpCircle
} from "lucide-react";
import { useTradingStore, Position } from "@/lib/store";
import { cn } from "@/lib/utils";
import { formatOddsByMode, OddsDisplayMode } from "@/lib/bhavEngine";
import { CrexCricketMatchCenter } from "./CrexCricketMatchCenter";

export type OddsFormatMode = OddsDisplayMode;

export interface FancySessionMarket {
  id: string;
  name: string;
  category: "session" | "lambi" | "player" | "wicket";
  noRuns: number;
  yesRuns: number;
  rateNo: number;  // typically 100 in Indian exchange
  rateYes: number; // typically 100 in Indian exchange
}

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
  winProbability1: number; // 0-100
  momentumTeam: string;
  selections: ExchangeMatchSelection[];
  fancySessions?: FancySessionMarket[];
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
    ballCommentary: "⚡ 14.3 Ov: Kohli pushes for 2! Strong running between wickets.",
    inPlay: true,
    winProbability1: 64,
    momentumTeam: "RCB in Command",
    selections: [
      { id: "rcb", name: "Royal Challengers Bengaluru", shortCode: "RCB", back: 1.90, lay: 1.91 },
      { id: "csk", name: "Chennai Super Kings", shortCode: "CSK", back: 1.96, lay: 1.97 }
    ],
    fancySessions: [
      { id: "s-1", name: "15 Over Runs (RCB)", category: "session", noRuns: 149, yesRuns: 151, rateNo: 100, rateYes: 100 },
      { id: "s-2", name: "20 Over Lambi Innings Score", category: "lambi", noRuns: 184, yesRuns: 187, rateNo: 100, rateYes: 100 },
      { id: "s-3", name: "Virat Kohli Total Runs", category: "player", noRuns: 68, yesRuns: 70, rateNo: 100, rateYes: 100 },
      { id: "s-4", name: "Fall of 4th Wicket (RCB)", category: "wicket", noRuns: 162, yesRuns: 165, rateNo: 100, rateYes: 100 }
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
    liveStatus: "2nd Half In-Play • High Attack Rate",
    ballCommentary: "🔥 74': De Bruyne delivers a curling free-kick into the 6-yard box!",
    inPlay: true,
    winProbability1: 72,
    momentumTeam: "Man City Dominating",
    selections: [
      { id: "mci", name: "Manchester City", shortCode: "City", back: 2.10, lay: 2.12 },
      { id: "rma", name: "Real Madrid", shortCode: "Madrid", back: 3.40, lay: 3.45 }
    ],
    fancySessions: [
      { id: "f-1", name: "Total Goals Over 3.5", category: "session", noRuns: 0, yesRuns: 3.5, rateNo: 95, rateYes: 105 },
      { id: "f-2", name: "Next Goal (75'-90')", category: "session", noRuns: 0, yesRuns: 1, rateNo: 80, rateYes: 120 }
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
    winProbability1: 52,
    momentumTeam: "Dead Even Battle",
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
    winProbability1: 68,
    momentumTeam: "India on Charge",
    selections: [
      { id: "ind", name: "India", shortCode: "IND", back: 1.72, lay: 1.74 },
      { id: "aus", name: "Australia", shortCode: "AUS", back: 2.15, lay: 2.18 }
    ],
    fancySessions: [
      { id: "ind-s1", name: "20 Over Lambi Runs (IND)", category: "lambi", noRuns: 202, yesRuns: 205, rateNo: 100, rateYes: 100 },
      { id: "ind-s2", name: "Hardik Pandya Runs", category: "player", noRuns: 34, yesRuns: 36, rateNo: 100, rateYes: 100 }
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
    winProbability1: 78,
    momentumTeam: "Gunners Pressing",
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
    winProbability1: 56,
    momentumTeam: "Lakers Leading by 3",
    selections: [
      { id: "lal", name: "LA Lakers", shortCode: "Lakers", back: 1.82, lay: 1.84 },
      { id: "gsw", name: "Golden State Warriors", shortCode: "Warriors", back: 2.02, lay: 2.05 }
    ]
  }
];

export function LiveExchangeWidget() {
  const [matches, setMatches] = useState<ExchangeMatch[]>(INITIAL_EXCHANGE_MATCHES);
  const [activeTab, setActiveTab] = useState<"all" | "cricket" | "football" | "tennis" | "basketball">("all");
  const [oddsMode, setOddsMode] = useState<OddsFormatMode>("decimal");
  const [expandedSessionsMatchId, setExpandedSessionsMatchId] = useState<string | null>(null);
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
    marketCategory?: string;
    targetLine?: number;
  } | null>(null);

  const [stakeInput, setStakeInput] = useState<string>("500");
  const [isPlacing, setIsPlacing] = useState(false);
  const [betSuccess, setBetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeCrexMatch, setActiveCrexMatch] = useState<string | null>(null);
  const { isLoggedIn, balance, placeSportsBet, positions } = useTradingStore();

  // 1. Continuous Live Match Feed Sync from /api/sports/live
  useEffect(() => {
    let isMounted = true;

    const fetchLiveSportsFeed = async () => {
      try {
        const res = await fetch("/api/sports/live", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const liveList = data.live || [];
        if (liveList.length > 0 && isMounted) {
          const mappedMatches: ExchangeMatch[] = liveList.slice(0, 6).map((m: any, idx: number) => {
            const sportKey = (m.sport || "cricket").toLowerCase();
            const sportIcon = sportKey === "soccer" || sportKey === "football" ? "⚽" : sportKey === "tennis" ? "🎾" : sportKey === "basketball" ? "🏀" : "🏏";
            const team1 = m.team1 || "Team 1";
            const team2 = m.team2 || "Team 2";
            const o1 = m.odds?.team1 || 1.85;
            const o2 = m.odds?.team2 || 1.95;

            const t1Code = team1.split(" ").map((w: string) => w[0]).join("").slice(0, 3).toUpperCase() || "T1";
            const t2Code = team2.split(" ").map((w: string) => w[0]).join("").slice(0, 3).toUpperCase() || "T2";

            return {
              id: m.id || `live-${idx}`,
              sport: sportKey === "soccer" ? "football" : sportKey,
              sportIcon,
              league: m.seriesName || (sportKey === "cricket" ? "IPL 2026 Live" : "Champions League"),
              title: `${team1} vs ${team2}`,
              team1,
              team2,
              team1Code: t1Code,
              team2Code: t2Code,
              score: m.score || (sportKey === "cricket" ? "148/3 (15.2 Ov)" : "1 - 0 (64')"),
              liveStatus: m.status || "● IN-PLAY LIVE",
              ballCommentary: sportKey === "cricket" ? `⚡ ${m.score || "15.2 Ov"}: Live pitch-side radar stream active.` : `🔥 Live attacking momentum: ${team1} pushing forward.`,
              inPlay: true,
              winProbability1: Math.round((1 / o1) / ((1 / o1) + (1 / o2)) * 100) || 55,
              momentumTeam: `${team1} in Command`,
              selections: [
                { id: `sel-1-${m.id}`, name: team1, shortCode: t1Code, back: o1, lay: parseFloat((o1 + 0.02).toFixed(2)) },
                { id: `sel-2-${m.id}`, name: team2, shortCode: t2Code, back: o2, lay: parseFloat((o2 + 0.02).toFixed(2)) }
              ],
              fancySessions: sportKey === "cricket" ? [
                { id: `s1-${m.id}`, name: "15 Over Runs", category: "session", noRuns: 148, yesRuns: 151, rateNo: 100, rateYes: 100 },
                { id: `s2-${m.id}`, name: "20 Over Lambi Innings Total", category: "lambi", noRuns: 185, yesRuns: 188, rateNo: 100, rateYes: 100 },
                { id: `s3-${m.id}`, name: "Next Wicket Fall (Runs)", category: "wicket", noRuns: 160, yesRuns: 163, rateNo: 100, rateYes: 100 }
              ] : undefined
            };
          });
          setMatches(mappedMatches);
        }
      } catch (err) {
        // Fallback gracefully
      }
    };

    fetchLiveSportsFeed();
    const interval = setInterval(fetchLiveSportsFeed, 3000); // 3-second live sync from radar API

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Sub-second Micro-Drift for Live Exchange Order Book Realism
  useEffect(() => {
    const interval = setInterval(() => {
      setMatches(prev => prev.map(match => {
        const drift = (Math.random() - 0.5) * 0.02;
        const updatedSelections = match.selections.map(sel => {
          const shift = (Math.random() - 0.5) > 0 ? drift : -drift;
          const nextBack = Math.max(1.05, parseFloat((sel.back + shift).toFixed(2)));
          const nextLay = Math.max(nextBack + 0.01, parseFloat((nextBack + 0.01 + Math.random() * 0.02).toFixed(2)));
          
          return {
            ...sel,
            back: nextBack,
            lay: nextLay,
            backTrend: (shift > 0.005 ? "up" : shift < -0.005 ? "down" : null) as ("up" | "down" | null),
            layTrend: (shift > 0.005 ? "up" : shift < -0.005 ? "down" : null) as ("up" | "down" | null)
          };
        });

        return {
          ...match,
          selections: updatedSelections
        };
      }));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const triggerHaptics = useCallback(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate([15, 30]); } catch {}
    }
  }, []);

  // Format odds according to Indian Bhav / Multiplier / Decimal engine
  const formatOdds = (odds: number) => formatOddsByMode(odds, oddsMode);

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

  // Session (Fancy / Khayi-Lagai) Selection Handler
  const handleSessionBet = (match: ExchangeMatch, session: FancySessionMarket, type: "yes" | "no") => {
    triggerHaptics();
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: "login" } }));
      return;
    }

    const runs = type === "yes" ? session.yesRuns : session.noRuns;
    const selectionName = `${session.name}: ${runs} (${type.toUpperCase()})`;

    setSelectedBet({
      matchId: match.id,
      matchTitle: match.title,
      selectionName,
      shortCode: type === "yes" ? `${runs} YES` : `${runs} NO`,
      odds: 2.00, // standard even money session payout
      type: type === "yes" ? "back" : "lay",
      team1Code: match.team1Code,
      team2Code: match.team2Code,
      marketCategory: "session",
      targetLine: runs
    });
  };

  const handleConfirmWager = async () => {
    if (!selectedBet) return;
    triggerHaptics();

    const stakeVal = parseFloat(stakeInput);
    if (isNaN(stakeVal) || stakeVal <= 0) {
      setErrorMessage("Please enter a valid stake amount.");
      return;
    }

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
      
      {/* ═══ TOP HEADER: TITLE + INDIAN BHAV FORMAT SWITCHER + TURBO TOGGLE ═══ */}
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

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* Indian Bhav / Multiplier / Decimal Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-extrabold select-none">
            <button
              type="button"
              onClick={() => { setOddsMode("decimal"); triggerHaptics(); }}
              className={cn(
                "px-2 py-0.5 rounded-md transition-all cursor-pointer",
                oddsMode === "decimal" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              1.90
            </button>
            <button
              type="button"
              onClick={() => { setOddsMode("bhav"); triggerHaptics(); }}
              className={cn(
                "px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1",
                oddsMode === "bhav" ? "bg-white text-amber-700 shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
              )}
              title="Indian Paisa Bhav (e.g. 90p, 60p)"
            >
              <span>🇮🇳 Bhav</span>
            </button>
            <button
              type="button"
              onClick={() => { setOddsMode("multiplier"); triggerHaptics(); }}
              className={cn(
                "px-2 py-0.5 rounded-md transition-all cursor-pointer",
                oddsMode === "multiplier" ? "bg-white text-emerald-700 shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
              )}
              title="1 ka 2 / 1 ka 3 Double/Triple format"
            >
              1 ka X
            </button>
          </div>

          {/* Turbo 1-Click Bet Mode */}
          <button
            type="button"
            onClick={() => { setTurboBet(!turboBet); triggerHaptics(); }}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all border cursor-pointer",
              turboBet
                ? "bg-amber-50 text-amber-700 border-amber-300 shadow-sm"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            )}
            title="When active, tap any Back/Lay chip to place 1-click ₹1K bet instantly"
          >
            <Zap className={cn("w-3.5 h-3.5", turboBet ? "text-amber-600 fill-amber-500" : "text-slate-400")} />
            <span>{turboBet ? "1-Click ON" : "1-Click"}</span>
          </button>

          <Link 
            href="/sportsbook" 
            className="text-xs font-black text-slate-700 hover:text-red-650 uppercase tracking-wider flex items-center gap-0.5 transition-colors bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200"
          >
            Sportsbook <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ═══ SPORT CATEGORY FILTER PILLS ═══ */}
      <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto scrollbar-none select-none">
        {[
          { id: "all", label: "🔥 All Live", count: matches.length },
          { id: "cricket", label: "🏏 Cricket & Sessions", count: matches.filter(m => m.sport === "cricket").length },
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
      <div className="space-y-3 mt-1">
        {filteredMatches.map(match => {
          const isSessionsExpanded = expandedSessionsMatchId === match.id;

          return (
            <div 
              key={match.id}
              className="border border-slate-200/90 rounded-2xl p-3.5 bg-gradient-to-b from-white to-slate-50/60 hover:border-slate-300 transition-all shadow-xs flex flex-col gap-2.5"
            >
              {/* Match Header: League + Title + Score */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <Link
                  href={`/sportsbook/match/${match.id || 'aus-xi-vs-ban'}`}
                  className="flex flex-col min-w-0 group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{match.sportIcon}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{match.league}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors truncate">
                    {match.team1} <span className="text-slate-400 font-normal">vs</span> {match.team2}
                  </h4>
                </Link>

                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-black font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                    {match.score}
                  </div>
                  <div className="text-[9px] font-bold text-slate-500 tracking-tight mt-0.5">
                    {match.liveStatus}
                  </div>
                </div>
              </div>

              {/* Live Win Probability & Momentum Bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-600">
                  <span>{match.team1Code}: <strong className="text-slate-900 font-mono">{match.winProbability1}%</strong></span>
                  <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded text-[9px] font-bold flex items-center gap-0.5">
                    <Flame className="w-3 h-3 text-amber-500" /> {match.momentumTeam}
                  </span>
                  <span>{match.team2Code}: <strong className="text-slate-900 font-mono">{100 - match.winProbability1}%</strong></span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${match.winProbability1}%` }}
                  />
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-rose-500 h-full transition-all duration-500"
                    style={{ width: `${100 - match.winProbability1}%` }}
                  />
                </div>
              </div>

              {/* Match Odds Selections: Team 1 & Team 2 (Back & Lay) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {match.selections.map(sel => {
                  const isSelectedBack = selectedBet?.matchId === match.id && selectedBet?.selectionName === sel.name && selectedBet?.type === "back";
                  const isSelectedLay = selectedBet?.matchId === match.id && selectedBet?.selectionName === sel.name && selectedBet?.type === "lay";

                  return (
                    <div 
                      key={sel.id}
                      className="flex items-center justify-between bg-white border border-slate-200/90 rounded-xl p-2 shadow-xs hover:shadow-sm transition-all"
                    >
                      {/* Team Short Code */}
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-[10px] text-slate-800 shrink-0 select-none">
                          {sel.shortCode.substring(0, 3).toUpperCase()}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 truncate">
                          {sel.shortCode}
                        </span>
                      </div>

                      {/* Back & Lay Buttons with Indian Bhav support */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* BACK BUTTON (Lagai) */}
                        <button
                          type="button"
                          onClick={() => handleOddsSelection(match, sel, "back", sel.back)}
                          className={cn(
                            "w-14 sm:w-16 py-1.5 px-1 rounded-lg text-center border transition-all cursor-pointer select-none active:scale-95",
                            isSelectedBack
                              ? "bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-300 shadow-sm"
                              : "bg-[#E0F2FE] hover:bg-[#BAE6FD] text-sky-900 border-sky-200/80",
                            sel.backTrend === "up" && "ring-2 ring-emerald-400 animate-pulse"
                          )}
                          title={`Back ${sel.name}`}
                        >
                          <span className="block text-[8px] font-black uppercase text-sky-800/80 leading-none">Lagai / Back</span>
                          <span className="text-xs sm:text-sm font-black font-mono leading-none mt-0.5 block text-slate-950">
                            {formatOdds(sel.back)}
                          </span>
                        </button>

                        {/* LAY BUTTON (Khayi) */}
                        <button
                          type="button"
                          onClick={() => handleOddsSelection(match, sel, "lay", sel.lay)}
                          className={cn(
                            "w-14 sm:w-16 py-1.5 px-1 rounded-lg text-center border transition-all cursor-pointer select-none active:scale-95",
                            isSelectedLay
                              ? "bg-pink-500 text-white border-pink-600 ring-2 ring-pink-300 shadow-sm"
                              : "bg-[#FCE7F3] hover:bg-[#FBCFE8] text-pink-900 border-pink-200/80",
                            sel.layTrend === "up" && "ring-2 ring-pink-400 animate-pulse"
                          )}
                          title={`Lay ${sel.name}`}
                        >
                          <span className="block text-[8px] font-black uppercase text-pink-800/80 leading-none">Khayi / Lay</span>
                          <span className="text-xs sm:text-sm font-black font-mono leading-none mt-0.5 block text-slate-950">
                            {formatOdds(sel.lay)}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fancy / Session Markets Collapsible Section (Cricket & Football) */}
              {match.fancySessions && match.fancySessions.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedSessionsMatchId(isSessionsExpanded ? null : match.id);
                      triggerHaptics();
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-amber-900 flex items-center justify-between text-xs font-black transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                      Fancy Session Markets (6 Over, Lambi, Players)
                    </span>
                    <span className="text-[10px] bg-amber-200/60 px-1.5 py-0.2 rounded font-mono">
                      {isSessionsExpanded ? "Hide ▲" : `${match.fancySessions.length} Markets ▼`}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isSessionsExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1.5 mt-2 pt-2 border-t border-amber-200/50"
                      >
                        {match.fancySessions.map(session => (
                          <div 
                            key={session.id}
                            className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2 text-xs"
                          >
                            <span className="font-extrabold text-slate-800 truncate pr-2">
                              {session.name}
                            </span>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* NO BUTTON (Khayi) */}
                              <button
                                type="button"
                                onClick={() => handleSessionBet(match, session, "no")}
                                className="w-16 py-1 bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-200 rounded-md text-center cursor-pointer active:scale-95"
                              >
                                <span className="block text-[8px] font-black uppercase text-pink-700 leading-none">NO</span>
                                <span className="text-xs font-black font-mono leading-none mt-0.5 block">{session.noRuns}</span>
                              </button>

                              {/* YES BUTTON (Lagai) */}
                              <button
                                type="button"
                                onClick={() => handleSessionBet(match, session, "yes")}
                                className="w-16 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-md text-center cursor-pointer active:scale-95"
                              >
                                <span className="block text-[8px] font-black uppercase text-emerald-700 leading-none">YES</span>
                                <span className="text-xs font-black font-mono leading-none mt-0.5 block">{session.yesRuns}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Ball-by-ball commentary tick & CREX Scorecard Button */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500">
                <span className="truncate italic">{match.ballCommentary}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveCrexMatch("aus-xi-vs-ban")}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>📋 CREX Scorecard & Pitch</span>
                  </button>
                  <span className="font-bold text-emerald-700 font-mono">0% Fee</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ PERSISTENT FLOATING / DOCKED MOBILE ACTIVE BETS BANNER ═══ */}
      {positions.length > 0 && (
        <div className="mt-3 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 rounded-xl p-3 text-white flex items-center justify-between border border-slate-800 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <h5 className="text-xs font-black uppercase">
                {positions.length} Active {positions.length === 1 ? "Bet" : "Bets"} Live
              </h5>
              <p className="text-[10px] text-slate-400 font-bold">
                Instant In-Play Cash Out Available
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-positions-drawer"));
              triggerHaptics();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
          >
            ⚡ View & Cash Out
          </button>
        </div>
      )}

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
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[90] transition-opacity"
            />

            {/* Slide-Up Bet Slip Container (Elevated above mobile bottom nav) */}
            <motion.div
              initial={{ y: "100%", opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-16 md:bottom-0 left-0 right-0 z-[95] max-w-lg mx-auto bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl overflow-hidden pb-4"
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
                      {selectedBet.type === "back" ? "Lagai (Backing to Win)" : "Khayi (Laying Against)"}
                    </h4>
                    <p className="text-[11px] font-bold text-white/90 truncate max-w-[260px] sm:max-w-xs mt-0.5">
                      {selectedBet.selectionName} @ <span className="font-mono font-black text-yellow-300">{formatOdds(selectedBet.odds)}</span>
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
                    Rate: {formatOdds(selectedBet.odds)}
                  </span>
                </div>

                {/* Success Feedback */}
                {betSuccess ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col items-center justify-center text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-2 animate-bounce" />
                    <h4 className="text-base font-black text-emerald-900">Bet Matched & Confirmed!</h4>
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                      ₹{parsedStake.toLocaleString()} on {selectedBet.shortCode} @ {formatOdds(selectedBet.odds)}
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
                        <span>Stake Amount (₹)</span>
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
                          ⚡ CONFIRM {selectedBet.type === "back" ? "LAGAI" : "KHAYI"} • ₹{parsedStake.toLocaleString()}
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

      {/* ═══ CREX CRICKET MATCH CENTER MODAL ═══ */}
      <AnimatePresence>
        {activeCrexMatch && (
          <div className="fixed inset-0 z-[85] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCrexMatch(null)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />
            <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto z-10 my-4">
              <CrexCricketMatchCenter
                matchId={activeCrexMatch}
                onClose={() => setActiveCrexMatch(null)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
