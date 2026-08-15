"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Calendar, MapPin, Wind, Droplets, Trophy, 
  TrendingUp, Shield, Clock, Award, Check, AlertCircle, 
  User, ChevronRight, Zap, Info, Users, Activity, Flame, Share2, CheckCircle2, ChevronDown,
  Pin, Settings, PlayCircle, Lock, Tv, RefreshCw, X, Receipt, ChevronUp, SlidersHorizontal, Gamepad2, Wallet
} from "lucide-react";
import { 
  DeepMatchInfo, CrexInningsScorecard, CREX_MATCHES_DATABASE, PLAYERS_DATABASE, PlayerDossier, resolveDeepMatch 
} from "@/lib/sportsDeepData";
import { formatOddsByMode, OddsDisplayMode, convertDecimalToBhav } from "@/lib/bhavEngine";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CricketOddsEngine } from "@/lib/cricketOddsEngine";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MatchDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const matchId = resolvedParams.id || "145357";
  
  const [match, setMatch] = useState<DeepMatchInfo>(() => resolveDeepMatch(matchId));
  const [gateCheckInfo, setGateCheckInfo] = useState<any>(null);
  const [winProbability, setWinProbability] = useState<{ team1: number; team2: number }>({ team1: 50, team2: 50 });
  const [cricketTelemetry, setCricketTelemetry] = useState<any>(null);

  // Tabs & Views (Matching Video Reference)
  const [activeTab, setActiveTab] = useState<"exchange" | "scorecard" | "commentary" | "squads" | "info">("exchange");
  const [fancyCategory, setFancyCategory] = useState<"all" | "fancy" | "ballbyball" | "khadda" | "lottery" | "oddeven">("all");
  const [isTVExpanded, setIsTVExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Quick Bet & Bet Slip State
  const [oneClickBet, setOneClickBet] = useState(false);
  const [oneClickStake, setOneClickStake] = useState(500);
  const [selectedBet, setSelectedBet] = useState<{
    marketName: string;
    selection: string;
    type: 'back' | 'lay';
    odds: number;
    stake: number;
    line?: number;
  } | null>(null);

  const [betFeedback, setBetFeedback] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const walletBalance = useTradingStore(s => s.balance);

  // Real-time Match Telemetry Sync
  useEffect(() => {
    let isMounted = true;
    let eventSource: EventSource | null = null;
    let fallbackInterval: any = null;

    const applyMatchPayload = (data: any) => {
      if (!isMounted || !data) return;
      if (data.match) setMatch(data.match);
      if (data.gateCheck) setGateCheckInfo(data.gateCheck);
      if (data.cricketTelemetry) setCricketTelemetry(data.cricketTelemetry);
      if (data.winProbability) setWinProbability(data.winProbability);
    };

    const fetchLiveMatchFallback = async () => {
      try {
        const res = await fetch(`/api/sports/match/${matchId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.match && isMounted) {
            applyMatchPayload(data);
            return;
          }
        }
      } catch (e) {
        console.warn("Live match fallback sync error:", e);
      }
    };

    fetchLiveMatchFallback();

    try {
      eventSource = new EventSource(`/api/sports/stream?matchId=${matchId}`);
      eventSource.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "TELEMETRY_UPDATE") {
            applyMatchPayload(parsed);
          }
        } catch {
          // ignore
        }
      };

      eventSource.onerror = () => {
        if (!fallbackInterval && isMounted) {
          fallbackInterval = setInterval(fetchLiveMatchFallback, 3000);
        }
      };
    } catch {
      fallbackInterval = setInterval(fetchLiveMatchFallback, 3000);
    }

    return () => {
      isMounted = false;
      if (eventSource) eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [matchId]);

  const handleSelectOdds = (marketName: string, selection: string, odds: number, type: 'back' | 'lay', line?: number) => {
    if (oneClickBet) {
      setIsPlacing(true);
      setTimeout(() => {
        setIsPlacing(false);
        setBetFeedback(`✅ 1-Click Bet: ${selection} (${type.toUpperCase()}) @ ${odds} | PIN ${oneClickStake}`);
        setTimeout(() => setBetFeedback(null), 3500);
      }, 350);
      return;
    }

    setSelectedBet({
      marketName,
      selection,
      type,
      odds,
      stake: 100,
      line
    });
  };

  const handlePlaceBetslip = async () => {
    if (!selectedBet) return;
    setIsPlacing(true);
    try {
      const res = await fetch("/api/sports/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: String(match.id),
          selection: selectedBet.selection,
          type: selectedBet.type,
          odds: selectedBet.odds,
          stake: selectedBet.stake,
          sequenceId: Date.now()
        })
      });
      const data = await res.json();
      if (data.success) {
        setBetFeedback(`✅ Bet Placed: ${selectedBet.selection} @ ${selectedBet.odds}`);
        setSelectedBet(null);
      } else {
        setBetFeedback(`⚠️ ${data.error || "Failed to place bet"}`);
      }
    } catch (e: any) {
      setBetFeedback(`⚠️ Order error: ${e.message}`);
    } finally {
      setIsPlacing(false);
      setTimeout(() => setBetFeedback(null), 3500);
    }
  };

  const isLive = match.status?.toLowerCase().includes("live") || match.status?.toLowerCase().includes("opt to") || match.status?.toLowerCase().includes("need");

  // Multi-Depth Order Ladder (Exact from Video Reference)
  const backDepthTeam1 = [
    { odds: 2.44, volume: "237k" },
    { odds: 2.46, volume: "2.01M" },
    { odds: 2.48, volume: "352k" }
  ];
  const layDepthTeam1 = [
    { odds: 2.50, volume: "95.3k" },
    { odds: 2.52, volume: "46k" },
    { odds: 2.54, volume: "187k" }
  ];

  const backDepthTeam2 = [
    { odds: 1.62, volume: "410k" },
    { odds: 1.64, volume: "1.85M" },
    { odds: 1.66, volume: "620k" }
  ];
  const layDepthTeam2 = [
    { odds: 1.68, volume: "140k" },
    { odds: 1.70, volume: "85k" },
    { odds: 1.72, volume: "310k" }
  ];

  // Fancy Bet Matrix (Exact from Video Reference)
  const fancyMarkets = [
    { id: "f1", cat: "fancy", label: `20 Over ${match.team2.code || "AFG"} Total`, noRuns: 153, noRate: 100, yesRuns: 154, yesRate: 100, status: "active", min: 100, max: 100000 },
    { id: "f2", cat: "fancy", label: `28 Over ${match.team2.code || "AFG"}`, noRuns: 201, noRate: 100, yesRuns: 202, yesRate: 100, status: "active", min: 100, max: 50000 },
    { id: "f3", cat: "fancy", label: `28.3 Over ${match.team2.code || "AFG"}`, noRuns: 0, noRate: 0, yesRuns: 0, yesRate: 0, status: "suspended", min: 100, max: 50000 },
    { id: "f4", cat: "khadda", label: `1st Wkt ${match.team2.code || "AFG"} Runs`, noRuns: 45, noRate: 110, yesRuns: 45, yesRate: 90, status: "active", min: 100, max: 100000 },
    { id: "f5", cat: "ballbyball", label: `Current Over Ball Run`, noRuns: 1, noRate: 100, yesRuns: 2, yesRate: 100, status: "ball_running", min: 100, max: 25000 },
    { id: "f6", cat: "fancy", label: `Top Batter Runs (Match)`, noRuns: 38, noRate: 100, yesRuns: 39, yesRate: 100, status: "active", min: 100, max: 50000 },
    { id: "f7", cat: "oddeven", label: `20 Over Total Odd/Even`, noRuns: "ODD", noRate: 95, yesRuns: "EVEN", yesRate: 95, status: "active", min: 100, max: 50000 }
  ];

  const filteredFancy = fancyMarkets.filter(f => fancyCategory === "all" || f.cat === fancyCategory);

  return (
    <div className="min-h-screen bg-[#111d27] text-slate-100 font-sans select-none pb-20 lg:pb-6">

      {/* ═══════════════════════════════════════════════════════════════
          1. TOP MATCH BAR & NAVIGATION
      ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-[#1b3d2f] border-b border-[#2d5543] px-3 py-2 shadow-md">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2">
            <Link
              href="/sportsbook"
              className="p-1.5 rounded-md bg-[#143024] hover:bg-[#254f3d] text-emerald-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-black text-xs sm:text-sm text-white uppercase tracking-wider">
                {match.team1.name} v {match.team2.name}
              </h1>
              <span className="text-[10px] text-emerald-300/80 font-bold block">
                {match.series || "International Cricket Series"} • {match.matchType || "T20"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTVExpanded(!isTVExpanded)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]",
                isTVExpanded ? "bg-red-600 text-white" : "bg-[#143024] text-emerald-200 hover:bg-[#254f3d] border border-[#2d5543]"
              )}
            >
              <Tv className="w-3.5 h-3.5 text-red-400" />
              <span>Live TV</span>
            </button>

            <button
              onClick={() => setIsPinned(!isPinned)}
              className={cn(
                "p-2 rounded-md border transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center",
                isPinned ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-[#143024] text-slate-300 border-[#2d5543]"
              )}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          2. TV SCOREBOARD & LIVE RUN RATE MOMENTUM GRAPH (Exact Video)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1700px] mx-auto p-2 sm:p-3">
        <div className="bg-[#162734] border border-slate-800 rounded-xl p-3.5 shadow-xl relative overflow-hidden">
          
          {/* Header Line */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/80 gap-1 text-[11px] font-bold">
            <div className="flex items-center gap-2">
              <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> Live In-Play
              </span>
              <span className="text-slate-300 font-mono">
                {match.status || "Ireland: 244 (49.5 ov) vs Afghanistan: 130/2 (28.2 ov)"}
              </span>
            </div>

            <div className="text-slate-400 font-mono text-[10px] sm:text-xs">
              CRR: <strong className="text-white font-black">4.59</strong> | RRR: <strong className="text-amber-400 font-black">5.28</strong> | Target: <strong className="text-emerald-400 font-black">245</strong>
            </div>
          </div>

          {/* Teams Summary & Momentum Curve */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 py-3 items-center">
            
            {/* Team 1 Score */}
            <div className="lg:col-span-3 space-y-1">
              <div className="font-black text-sm text-slate-100 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>{match.team1.name}</span>
              </div>
              <div className="font-mono text-xl font-black text-amber-300 pl-5">
                {match.team1.scoreSummary || "244 (49.5 ov)"}
              </div>
            </div>

            {/* SVG Run Rate Curve (0 to 50 Overs) */}
            <div className="lg:col-span-6 bg-slate-900/90 rounded-xl p-2.5 border border-slate-800">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                <span>0 Overs</span>
                <span className="text-emerald-400 font-mono">Run Rate Momentum Graph (Target vs Current)</span>
                <span>50 Overs</span>
              </div>
              <div className="h-16 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 50">
                  <line x1="0" y1="12" x2="500" y2="12" stroke="#334155" strokeDasharray="3 3" />
                  <line x1="0" y1="25" x2="500" y2="25" stroke="#334155" strokeDasharray="3 3" />
                  <path
                    d="M 0,50 L 50,46 L 100,40 L 150,35 L 200,31 L 250,26 L 300,20 L 350,16 L 400,12 L 450,8 L 500,4"
                    fill="none" stroke="#f87171" strokeWidth="1.5"
                  />
                  <path
                    d="M 0,50 L 50,45 L 100,38 L 150,32 L 200,25 L 250,18 L 282,14"
                    fill="none" stroke="#38bdf8" strokeWidth="2.5"
                  />
                  <circle cx="282" cy="14" r="3.5" fill="#38bdf8" className="animate-ping" />
                  <circle cx="282" cy="14" r="3" fill="#ffffff" />
                </svg>
              </div>
            </div>

            {/* Team 2 Score */}
            <div className="lg:col-span-3 space-y-1 text-left lg:text-right">
              <div className="font-black text-sm text-slate-100 flex items-center lg:justify-end gap-2">
                <span>{match.team2.name}</span>
                <span className="w-3 h-3 rounded-full bg-teal-500" />
              </div>
              <div className="font-mono text-xl font-black text-emerald-400 lg:pr-5">
                {match.team2.scoreSummary || "130/2 (28.2 ov)"}
              </div>
            </div>

          </div>

          {/* Expandable Live TV */}
          {isTVExpanded && (
            <div className="mt-2 rounded-xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center border border-slate-800">
              <PlayCircle className="w-12 h-12 text-red-500 animate-pulse mb-1" />
              <span className="text-xs font-mono font-bold text-slate-300">Live Fast-Stream Active</span>
            </div>
          )}

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          3. MAIN MATCH WORKSPACE (3-Depth Ladder + Fancy Matrix)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1700px] mx-auto p-2 sm:p-3 grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* ── LEFT & CENTER: MATCH MARKETS (9 COLS) ── */}
        <div className="col-span-1 lg:col-span-9 space-y-3">
          
          {/* Match Navigation Tabs */}
          <div className="bg-[#162734] border border-slate-800 rounded-xl p-1 flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: "exchange", label: "Exchange & Fancy" },
              { id: "scorecard", label: "Full Scorecard" },
              { id: "commentary", label: "Ball Commentary" },
              { id: "squads", label: "Playing XI Squads" },
              { id: "info", label: "Pitch & Venue Info" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer min-h-[38px]",
                  activeTab === tab.id
                    ? "bg-[#ffb800] text-slate-950 shadow-xs"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feedback Toast */}
          {betFeedback && (
            <div className="bg-emerald-950 border border-emerald-500/80 text-emerald-300 px-3 py-2 rounded-xl text-xs font-black uppercase flex items-center justify-between shadow-lg">
              <span>{betFeedback}</span>
              <button onClick={() => setBetFeedback(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* ── TAB 1: EXCHANGE 3-DEPTH ORDER LADDER & FANCY MATRIX ── */}
          {activeTab === "exchange" && (
            <div className="space-y-3">
              
              {/* 3-DEPTH MATCH ODDS ORDER BOOK (Exact from Video) */}
              <div className="bg-[#162734] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="bg-[#1f384d] px-3.5 py-2.5 border-b border-slate-700 flex items-center justify-between text-xs font-black text-white uppercase tracking-wider">
                  <span>Match Odds (Exchange)</span>
                  <span className="text-[10px] text-slate-400 font-mono">Matched: PIN 49,820,150.00</span>
                </div>

                <div className="divide-y divide-slate-800/70 text-xs">
                  {/* Team 1 Row */}
                  <div className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <span className="font-black text-sm text-slate-100 flex-1 truncate">{match.team1.name}</span>
                    <div className="flex items-center gap-1 justify-end">
                      {/* 3 Back Columns */}
                      {backDepthTeam1.map((b, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectOdds("Match Odds", match.team1.name, b.odds, 'back')}
                          className="w-14 sm:w-16 h-11 bg-[#72bbef] hover:bg-[#5db1eb] active:scale-98 text-[#002b49] font-black text-xs rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-sm min-h-[44px]"
                        >
                          <span className="text-xs font-black leading-none">{b.odds.toFixed(2)}</span>
                          <span className="text-[8px] opacity-75 font-mono">{b.volume}</span>
                        </button>
                      ))}

                      {/* 3 Lay Columns */}
                      {layDepthTeam1.map((l, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectOdds("Match Odds", match.team1.name, l.odds, 'lay')}
                          className="w-14 sm:w-16 h-11 bg-[#faa9ba] hover:bg-[#f895a9] active:scale-98 text-[#4a0011] font-black text-xs rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-sm min-h-[44px]"
                        >
                          <span className="text-xs font-black leading-none">{l.odds.toFixed(2)}</span>
                          <span className="text-[8px] opacity-75 font-mono">{l.volume}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Team 2 Row */}
                  <div className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <span className="font-black text-sm text-slate-100 flex-1 truncate">{match.team2.name}</span>
                    <div className="flex items-center gap-1 justify-end">
                      {/* 3 Back Columns */}
                      {backDepthTeam2.map((b, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectOdds("Match Odds", match.team2.name, b.odds, 'back')}
                          className="w-14 sm:w-16 h-11 bg-[#72bbef] hover:bg-[#5db1eb] active:scale-98 text-[#002b49] font-black text-xs rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-sm min-h-[44px]"
                        >
                          <span className="text-xs font-black leading-none">{b.odds.toFixed(2)}</span>
                          <span className="text-[8px] opacity-75 font-mono">{b.volume}</span>
                        </button>
                      ))}

                      {/* 3 Lay Columns */}
                      {layDepthTeam2.map((l, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectOdds("Match Odds", match.team2.name, l.odds, 'lay')}
                          className="w-14 sm:w-16 h-11 bg-[#faa9ba] hover:bg-[#f895a9] active:scale-98 text-[#4a0011] font-black text-xs rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-sm min-h-[44px]"
                        >
                          <span className="text-xs font-black leading-none">{l.odds.toFixed(2)}</span>
                          <span className="text-[8px] opacity-75 font-mono">{l.volume}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* BOOKMAKER ZERO COMMISSION MARKET (Indian Bhav) */}
              <div className="bg-[#162734] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="bg-[#1f384d] px-3.5 py-2.5 border-b border-slate-700 flex items-center justify-between text-xs font-black text-white uppercase tracking-wider">
                  <span>Bookmaker (Zero Commission Bhav)</span>
                  <span className="text-[10px] text-amber-400 font-mono">Min: 100 | Max: 50,000</span>
                </div>

                <div className="divide-y divide-slate-800/70 text-xs">
                  <div className="p-3 flex items-center justify-between">
                    <span className="font-black text-sm text-slate-100">{match.team1.name}</span>
                    <span className="bg-amber-500/20 text-amber-400 font-black text-[10px] px-3 py-1.5 rounded uppercase">
                      Suspended
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <span className="font-black text-sm text-slate-100">{match.team2.name}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSelectOdds("Bookmaker", match.team2.name, 66, 'back')}
                        className="w-16 h-11 bg-[#72bbef] hover:bg-[#5db1eb] active:scale-98 text-[#002b49] font-black text-sm rounded-lg flex items-center justify-center cursor-pointer shadow-sm min-h-[44px]"
                      >
                        66
                      </button>
                      <button
                        onClick={() => handleSelectOdds("Bookmaker", match.team2.name, 67, 'lay')}
                        className="w-16 h-11 bg-[#faa9ba] hover:bg-[#f895a9] active:scale-98 text-[#4a0011] font-black text-sm rounded-lg flex items-center justify-center cursor-pointer shadow-sm min-h-[44px]"
                      >
                        67
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* FANCY BET MATRIX (Exact from Video) */}
              <div className="bg-[#162734] border border-slate-800 rounded-xl overflow-hidden shadow-lg space-y-2">
                <div className="bg-[#1f384d] px-3.5 py-2.5 border-b border-slate-700 flex items-center justify-between text-xs font-black text-white uppercase tracking-wider">
                  <span>Fancy Bet Matrix</span>
                  <div className="flex items-center gap-1">
                    {[
                      { id: "all", label: "All" },
                      { id: "fancy", label: "Fancy" },
                      { id: "ballbyball", label: "Ball by Ball" },
                      { id: "khadda", label: "Khadda" },
                      { id: "oddeven", label: "Odd/Even" }
                    ].map(fc => (
                      <button
                        key={fc.id}
                        onClick={() => setFancyCategory(fc.id as any)}
                        className={cn(
                          "px-2.5 py-1 rounded text-[10px] font-black uppercase transition-colors cursor-pointer",
                          fancyCategory === fc.id ? "bg-[#ffb800] text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"
                        )}
                      >
                        {fc.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-slate-800/70 text-xs px-2 pb-2">
                  {filteredFancy.map(item => (
                    <div key={item.id} className="p-2.5 hover:bg-[#1a2d3b] rounded-lg transition-colors flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-black text-xs text-white block truncate">{item.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          Limit: PIN {item.min} / {item.max.toLocaleString()}
                        </span>
                      </div>

                      {item.status === "suspended" ? (
                        <div className="bg-amber-500/20 text-amber-400 font-black text-[10px] px-3 py-2 rounded uppercase">
                          Suspended
                        </div>
                      ) : item.status === "ball_running" ? (
                        <div className="bg-rose-500/20 text-rose-400 font-black text-[10px] px-3 py-2 rounded uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" /> Ball Running
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleSelectOdds(item.label, `NO ${item.noRuns}`, item.noRate, 'lay', typeof item.noRuns === 'number' ? item.noRuns : undefined)}
                            className="w-16 h-11 bg-[#faa9ba] hover:bg-[#f895a9] active:scale-98 text-[#4a0011] font-black text-xs rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-sm min-h-[44px]"
                          >
                            <span className="text-[9px] opacity-75 font-bold uppercase">No</span>
                            <span className="text-xs font-black">{item.noRuns}</span>
                          </button>
                          <button
                            onClick={() => handleSelectOdds(item.label, `YES ${item.yesRuns}`, item.yesRate, 'back', typeof item.yesRuns === 'number' ? item.yesRuns : undefined)}
                            className="w-16 h-11 bg-[#72bbef] hover:bg-[#5db1eb] active:scale-98 text-[#002b49] font-black text-xs rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-sm min-h-[44px]"
                          >
                            <span className="text-[9px] opacity-75 font-bold uppercase">Yes</span>
                            <span className="text-xs font-black">{item.yesRuns}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ── TAB 2: SCORECARD ── */}
          {activeTab === "scorecard" && (
            <div className="bg-[#162734] border border-slate-800 rounded-xl p-3.5 shadow-lg space-y-3">
              <h3 className="font-black text-xs text-white uppercase tracking-wider pb-2 border-b border-slate-800">
                Official Match Scorecard
              </h3>
              {(match.scorecards || []).length === 0 ? (
                <p className="text-xs text-slate-400 font-bold py-4 text-center">Scorecard will populate as innings concludes.</p>
              ) : (
                (match.scorecards || []).map((sc, i) => (
                  <div key={i} className="border border-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-slate-800/80 px-3 py-2 text-xs font-black uppercase flex justify-between">
                      <span>{sc.teamName}</span>
                      <span className="font-mono text-emerald-400">{sc.totalScore || "In-Play"}</span>
                    </div>
                    <div className="divide-y divide-slate-800/50 text-xs">
                      {sc.batting?.map((b: any, idx: number) => (
                        <div key={idx} className="p-2.5 flex justify-between font-bold text-slate-300">
                          <span>{b.name}</span>
                          <span className="font-mono text-white">{b.runs} ({b.balls}b, {b.fours}x4, {b.sixes}x6)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TAB 3: COMMENTARY ── */}
          {activeTab === "commentary" && (
            <div className="bg-[#162734] border border-slate-800 rounded-xl p-3.5 shadow-lg space-y-2.5">
              <h3 className="font-black text-xs text-white uppercase tracking-wider pb-2 border-b border-slate-800">
                Live Ball-by-Ball Stream
              </h3>
              <div className="space-y-2">
                {(match.commentary || [
                  { over: "28.2", text: "FOUR! Beautiful cover drive piercing through the gap for four.", runs: 4 },
                  { over: "28.1", text: "Single taken down to mid-on.", runs: 1 },
                  { over: "27.6", text: "Dot ball. Defended back to the bowler.", runs: 0 },
                  { over: "27.5", text: "SIX! Smashed over wide long on into the stands!", runs: 6 }
                ]).map((comm: any, i: number) => (
                  <div key={i} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start gap-2.5">
                    <span className="bg-emerald-600 text-white font-mono font-black text-xs px-2 py-1 rounded-lg shrink-0">
                      {comm.over}
                    </span>
                    <p className="text-xs text-slate-200 font-medium flex-1">{comm.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 4: SQUADS ── */}
          {activeTab === "squads" && (
            <div className="bg-[#162734] border border-slate-800 rounded-xl p-3.5 shadow-lg space-y-3">
              <h3 className="font-black text-xs text-white uppercase tracking-wider pb-2 border-b border-slate-800">
                Confirmed Playing XI Squads
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <h4 className="font-black text-emerald-400 uppercase mb-2">{match.team1.name} XI</h4>
                  <ul className="space-y-1 font-bold text-slate-300">
                    {(match.team1.playingXI || ["Paul Stirling (C)", "Andrew Balbirnie", "Harry Tector", "Lorcan Tucker (WK)", "Curtis Campher", "George Dockrell", "Mark Adair", "Andy McBrine", "Craig Young", "Graham Hume", "Barry McCarthy"]).map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <h4 className="font-black text-teal-400 uppercase mb-2">{match.team2.name} XI</h4>
                  <ul className="space-y-1 font-bold text-slate-300">
                    {(match.team2.playingXI || ["Rahmanullah Gurbaz (WK)", "Ibrahim Zadran", "Rahmat Shah", "Hashmatullah Shahidi (C)", "Azmatullah Omarzai", "Mohammad Nabi", "Ikram Alikhil", "Rashid Khan", "Nangeyalia Kharote", "Allah Ghazanfar", "Fazalhaq Farooqi"]).map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 5: INFO ── */}
          {activeTab === "info" && (
            <div className="bg-[#162734] border border-slate-800 rounded-xl p-3.5 shadow-lg space-y-3">
              <h3 className="font-black text-xs text-white uppercase tracking-wider pb-2 border-b border-slate-800">
                Venue & Pitch Report
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-bold block mb-0.5">Stadium Venue</span>
                  <strong className="text-white text-sm">
                    {typeof match.venue === 'string' ? match.venue : `${match.venue?.stadium || "Civil Service Cricket Club"}, ${match.venue?.city || "Belfast"}`}
                  </strong>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-bold block mb-0.5">Pitch Behavior</span>
                  <strong className="text-emerald-400 text-sm">
                    {typeof match.venue === 'object' ? match.venue?.pitchReport : "Balanced / Batting Paradise (Avg 1st Inn 265)"}
                  </strong>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── RIGHT COLUMN: STICKY BET SLIP (3 COLS) ── */}
        <aside className="hidden lg:block lg:col-span-3 space-y-3">
          <div className="bg-[#162734] border border-slate-800 rounded-xl overflow-hidden shadow-lg sticky top-3">
            <div className="bg-[#1c3243] px-3.5 py-2.5 border-b border-slate-700 flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" /> Bet Slip
              </span>
              <span className="text-[10px] text-slate-400 font-mono">PIN: {(walletBalance || 25400).toLocaleString()}</span>
            </div>

            {selectedBet ? (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <span className="font-black text-sm text-white">{selectedBet.selection}</span>
                    <span className="text-[10px] text-slate-400 font-bold block">{selectedBet.marketName}</span>
                  </div>
                  <button onClick={() => setSelectedBet(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">Odds</label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedBet.odds}
                      onChange={(e) => setSelectedBet({ ...selectedBet, odds: parseFloat(e.target.value) || 1.01 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 font-mono font-black text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block uppercase">Stake</label>
                    <input
                      type="number"
                      value={selectedBet.stake}
                      onChange={(e) => setSelectedBet({ ...selectedBet, stake: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 font-mono font-black text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1">
                  {[100, 500, 1000, 5000, 10000, 25000, 50000, 100000].map(val => (
                    <button
                      key={val}
                      onClick={() => setSelectedBet({ ...selectedBet, stake: val })}
                      className="py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-200 rounded-md cursor-pointer transition-colors"
                    >
                      +{val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Potential Return:</span>
                  <strong className="text-emerald-400 font-mono">
                    PIN {Math.round(selectedBet.stake * (selectedBet.odds - 1)).toLocaleString()}
                  </strong>
                </div>

                <button
                  disabled={isPlacing || selectedBet.stake <= 0}
                  onClick={handlePlaceBetslip}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 font-black text-xs uppercase tracking-wider rounded-lg shadow-md cursor-pointer transition-all"
                >
                  {isPlacing ? "Placing Order..." : "Place Bet"}
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Receipt className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                <p className="font-bold">Click any odd to create a bet</p>
              </div>
            )}
          </div>
        </aside>

      </div>

      {/* ── SLIDING QUICK BET BOTTOM SHEET (Mobile Only) ── */}
      {selectedBet && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 p-3 max-w-md mx-auto animate-in slide-in-from-bottom-6">
          <div className="bg-[#111d27] border-2 border-emerald-500/80 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="font-black text-sm text-white">{selectedBet.selection}</span>
                <span className="text-[10px] text-slate-400 font-bold block">{selectedBet.marketName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-black", selectedBet.type === 'back' ? "bg-[#72bbef] text-[#002b49]" : "bg-[#faa9ba] text-[#4a0011]")}>
                  {selectedBet.type.toUpperCase()}
                </span>
                <button onClick={() => setSelectedBet(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block uppercase">Odds</label>
                <input
                  type="number"
                  step="0.01"
                  value={selectedBet.odds}
                  onChange={(e) => setSelectedBet({ ...selectedBet, odds: parseFloat(e.target.value) || 1.01 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono font-black text-sm text-white min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block uppercase">Stake</label>
                <input
                  type="number"
                  value={selectedBet.stake}
                  onChange={(e) => setSelectedBet({ ...selectedBet, stake: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono font-black text-sm text-white min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[100, 500, 1000, 5000].map(val => (
                <button
                  key={val}
                  onClick={() => setSelectedBet({ ...selectedBet, stake: val })}
                  className="py-2 bg-slate-800 text-xs font-mono font-bold text-slate-200 rounded-xl cursor-pointer min-h-[36px]"
                >
                  +{val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
            </div>

            <button
              disabled={isPlacing || selectedBet.stake <= 0}
              onClick={handlePlaceBetslip}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 font-black text-sm uppercase tracking-wider rounded-xl cursor-pointer shadow-lg min-h-[48px]"
            >
              {isPlacing ? "Placing Order..." : "Confirm & Place Bet"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
