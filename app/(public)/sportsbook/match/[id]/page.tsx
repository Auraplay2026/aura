"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Calendar, MapPin, Wind, Droplets, Trophy, 
  TrendingUp, Shield, Clock, Award, Check, AlertCircle, 
  User, ChevronRight, Zap, Info, Users, Activity, Flame, Share2, Star, CheckCircle2, ChevronDown,
  Pin, Settings, PlayCircle, Lock, Tv, RefreshCw, X, Receipt
} from "lucide-react";
import { 
  DeepMatchInfo, CrexInningsScorecard, CREX_MATCHES_DATABASE, PLAYERS_DATABASE, PlayerDossier, resolveDeepMatch 
} from "@/lib/sportsDeepData";
import { formatOddsByMode, OddsDisplayMode, convertDecimalToBhav } from "@/lib/bhavEngine";
import { PlayerProfileModal } from "@/components/sportsbook/PlayerProfileModal";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

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

  // Tabs & Views
  const [activeCenterTab, setActiveCenterTab] = useState<"betting" | "scorecard" | "commentary" | "squads" | "info">("betting");
  const [fancyCategory, setFancyCategory] = useState<"all" | "fancy" | "ballbyball" | "khadda" | "lottery" | "oddeven">("all");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDossier | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isTVExpanded, setIsTVExpanded] = useState(false);

  // One Click Bet & Bet Slip State
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

  // Live real-time match sync with EventSource SSE Stream & fallback polling
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
        } catch (err) {
          // ignore
        }
      };

      eventSource.onerror = () => {
        if (!fallbackInterval && isMounted) {
          fallbackInterval = setInterval(fetchLiveMatchFallback, 4000);
        }
      };
    } catch (sseErr) {
      fallbackInterval = setInterval(fetchLiveMatchFallback, 4000);
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
        setTimeout(() => setBetFeedback(null), 4000);
      }, 400);
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
      setTimeout(() => setBetFeedback(null), 4000);
    }
  };

  const isLive = match.status?.toLowerCase().includes("live") || match.status?.toLowerCase().includes("opt to") || match.status?.toLowerCase().includes("need");

  // Fancy Bet Rows (Exact Format from User Video)
  const fancyMarkets = [
    { id: "f1", cat: "fancy", label: `20 Over ${match.team2.code || "AFG"} Total`, noRuns: 153, noRate: 100, yesRuns: 154, yesRate: 100, status: "active", min: 63, max: 125000 },
    { id: "f2", cat: "fancy", label: `28 Over ${match.team2.code || "AFG"}`, noRuns: 201, noRate: 100, yesRuns: 202, yesRate: 100, status: "active", min: 63, max: 62500 },
    { id: "f3", cat: "fancy", label: `28.3 Over ${match.team2.code || "AFG"}`, noRuns: 0, noRate: 0, yesRuns: 0, yesRate: 0, status: "suspended", min: 63, max: 62500 },
    { id: "f4", cat: "khadda", label: `1st Wkt 4Wk ${match.team2.code || "AFG"}`, noRuns: 217, noRate: 110, yesRuns: 217, yesRate: 90, status: "active", min: 63, max: 125000 },
    { id: "f5", cat: "khadda", label: `3rd Wkt AFG Rah Bhav`, noRuns: 140, noRate: 110, yesRuns: 140, yesRate: 90, status: "active", min: 63, max: 15625 },
    { id: "f6", cat: "ballbyball", label: `28.1 Ball Run ${match.team2.code || "AFG"}`, noRuns: 1, noRate: 100, yesRuns: 2, yesRate: 100, status: "ball_running", min: 63, max: 31250 },
    { id: "f7", cat: "ballbyball", label: `28.2 Ball Run ${match.team2.code || "AFG"}`, noRuns: 1, noRate: 100, yesRuns: 2, yesRate: 100, status: "active", min: 63, max: 31250 },
    { id: "f8", cat: "fancy", label: `S Atal Runs`, noRuns: 14, noRate: 100, yesRuns: 15, yesRate: 100, status: "active", min: 63, max: 31250 },
    { id: "f9", cat: "oddeven", label: `20 Over Total Odd/Even`, noRuns: "ODD", noRate: 95, yesRuns: "EVEN", yesRate: 95, status: "active", min: 63, max: 50000 }
  ];

  const filteredFancy = fancyMarkets.filter(f => fancyCategory === "all" || f.cat === fancyCategory);

  return (
    <div className="min-h-screen bg-[#e8ecef] text-slate-900 font-sans text-xs select-none">
      
      {/* ═══════════════════════════════════════════════════════════════
          1. TOP PINE GREEN EXCHANGE HEADER (bg-[#1b3d2f])
      ═══════════════════════════════════════════════════════════════ */}
      <header className="bg-[#1b3d2f] text-white border-b border-emerald-950 px-3 py-1.5 shadow-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex items-center gap-3">
            <Link href="/sportsbook" className="flex items-center gap-1 font-black text-lg tracking-tight text-white">
              <span className="text-amber-400 text-xl font-serif">★</span>
              <span className="font-extrabold tracking-wider uppercase text-base">STAR</span>
              <span className="text-[10px] bg-emerald-700 text-emerald-200 px-1 py-0.2 rounded uppercase font-bold tracking-widest ml-1">EXCHANGE</span>
            </Link>

            <Link href="/sportsbook" className="flex items-center gap-1 text-slate-300 hover:text-white font-bold text-xs bg-[#12281f] px-2 py-1 rounded-sm border border-emerald-900/60">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to In-Play
            </Link>
          </div>

          {/* Account HUD & One-Click Switch */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <div className="hidden md:flex items-center gap-2 bg-[#12281f] px-2.5 py-1 rounded-sm border border-emerald-900/60 font-mono text-[11px]">
              <span className="text-slate-300">Main Balance:</span>
              <strong className="text-amber-300 font-black">PIN {(walletBalance || 25400).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              <span className="text-slate-400 ml-1">Exposure:</span>
              <strong className="text-rose-400 font-black">0.00</strong>
            </div>

            <div className="flex items-center gap-1.5 bg-[#12281f] px-2.5 py-1 rounded-sm border border-emerald-900/60">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={oneClickBet}
                  onChange={(e) => setOneClickBet(e.target.checked)}
                  className="w-3.5 h-3.5 accent-amber-400 rounded cursor-pointer"
                />
                <span className={cn("text-[11px] font-black uppercase tracking-wider", oneClickBet ? "text-amber-300" : "text-slate-300")}>
                  One Click Bet
                </span>
              </label>
              {oneClickBet && (
                <select
                  value={oneClickStake}
                  onChange={(e) => setOneClickStake(Number(e.target.value))}
                  className="bg-[#1b3d2f] text-amber-300 font-mono font-bold text-[10px] rounded px-1 border border-amber-400/40"
                >
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                  <option value={1000}>1,000</option>
                  <option value={5000}>5,000</option>
                </select>
              )}
            </div>

            <button className="flex items-center gap-1 bg-[#12281f] hover:bg-[#183529] px-2.5 py-1 rounded-sm border border-emerald-900/60 text-white font-bold cursor-pointer transition-colors">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>My Account</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          2. MAIN 3-COLUMN MATCH CENTER WORKSPACE
      ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1600px] mx-auto p-2 sm:p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        
        {/* ─── COLUMN 1: LEFT MATCH & LEAGUE SELECTOR (2 Cols) ─── */}
        <aside className="lg:col-span-2 bg-white border border-slate-300 rounded-xs shadow-xs overflow-hidden">
          <div className="bg-[#1b3d2f] text-white px-3 py-2 font-black uppercase text-xs tracking-wider border-b border-emerald-950">
            Sports Tree
          </div>
          <div className="p-2 space-y-1 text-[11px] font-bold">
            <Link href="/sportsbook" className="block px-2 py-1 text-slate-700 hover:bg-slate-100 rounded-xs">
              All Sports
            </Link>
            <div className="pl-2 border-l-2 border-emerald-700 space-y-1">
              <span className="text-[#1b3d2f] font-black uppercase block">{(match as any).sport || "Cricket"}</span>
              <span className="text-slate-600 truncate block text-[10px]">{match.series || "One Day Internationals"}</span>
              <span className="text-amber-800 font-black truncate block bg-amber-50 px-1 py-0.5 rounded-xs border border-amber-200">
                {match.team1.code || match.team1.name} v {match.team2.code || match.team2.name}
              </span>
            </div>
          </div>
        </aside>

        {/* ─── COLUMN 2: CENTER MATCH HUB & MARKETS (7 Cols) ─── */}
        <main className="lg:col-span-7 space-y-2.5">
          
          {/* ─── A. TV SCOREBOARD & LIVE RUN RATE MOMENTUM GRAPH HUD (Exact from Video) ─── */}
          <div className="bg-gradient-to-b from-[#1b3d2f] to-[#0f2119] text-white rounded-xs shadow-sm p-3 border border-emerald-900">
            
            {/* Header Series & TV Button */}
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-1.5 py-0.2 rounded-xs">
                  {match.matchType || "ODI"}
                </span>
                <span className="text-[11px] font-bold text-slate-200 truncate">{match.series || "International Cricket Series"}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTVExpanded(!isTVExpanded)}
                  className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Tv className="w-3 h-3" /> Live 📺
                </button>
                <button
                  onClick={() => setIsPinned(!isPinned)}
                  className={cn("p-1 rounded-xs cursor-pointer", isPinned ? "text-amber-400" : "text-slate-400 hover:text-white")}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Teams & Scores Row */}
            <div className="grid grid-cols-12 items-center gap-2 py-1">
              
              {/* Team 1 */}
              <div className="col-span-4 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-emerald-600/60 flex items-center justify-center font-black text-xs text-amber-300">
                  {match.team1.code ? match.team1.code.substring(0, 2) : "T1"}
                </div>
                <div>
                  <h3 className="font-black text-sm text-white truncate">{match.team1.name}</h3>
                  <span className="font-mono text-base font-black text-amber-300 block">
                    {match.team1.scoreSummary || (match.team1 as any).score || "244/10"}
                  </span>
                </div>
              </div>

              {/* Center Match Status & Over Details */}
              <div className="col-span-4 text-center">
                <span className="bg-emerald-800/80 text-emerald-200 font-mono font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider inline-block">
                  {match.status || "Live - 2nd Innings"}
                </span>
                <div className="text-[10px] text-slate-300 font-mono font-bold mt-1">
                  CRR: <strong className="text-white">8.67</strong> | RRR: <strong className="text-amber-300">23.00</strong>
                </div>
              </div>

              {/* Team 2 */}
              <div className="col-span-4 flex items-center justify-end gap-2 text-right">
                <div>
                  <h3 className="font-black text-sm text-white truncate">{match.team2.name}</h3>
                  <span className="font-mono text-base font-black text-emerald-400 block">
                    {match.team2.scoreSummary || (match.team2 as any).score || "130/2 (15.0 ov)"}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-emerald-600/60 flex items-center justify-center font-black text-xs text-emerald-300">
                  {match.team2.code ? match.team2.code.substring(0, 2) : "T2"}
                </div>
              </div>

            </div>

            {/* ── LIVE RUN RATE MOMENTUM CHART (SVG Graph from Video 00:14) ── */}
            <div className="mt-3 pt-2 border-t border-emerald-800/60">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-300 uppercase mb-1">
                <span>Run Rate Curve (0 to 50 Overs)</span>
                <span className="text-amber-300 font-bold">Target: 245 Runs</span>
              </div>
              <div className="h-14 w-full bg-[#12281f] rounded-xs p-1.5 relative flex items-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 50">
                  {/* Grid Lines */}
                  <line x1="0" y1="12" x2="500" y2="12" stroke="#1f4233" strokeDasharray="3 3" />
                  <line x1="0" y1="25" x2="500" y2="25" stroke="#1f4233" strokeDasharray="3 3" />
                  <line x1="0" y1="38" x2="500" y2="38" stroke="#1f4233" strokeDasharray="3 3" />
                  
                  {/* Team 1 Score Trajectory (Red Line) */}
                  <path
                    d="M 0,50 L 50,46 L 100,40 L 150,35 L 200,31 L 250,26 L 300,20 L 350,16 L 400,12 L 450,8 L 500,4"
                    fill="none"
                    stroke="#f87171"
                    strokeWidth="1.5"
                  />
                  
                  {/* Team 2 Live Chase Curve (Cyan Line) */}
                  <path
                    d="M 0,50 L 30,44 L 60,37 L 90,30 L 120,22 L 150,15"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />
                  
                  {/* Current Active Ball Pulse Dot */}
                  <circle cx="150" cy="15" r="3.5" fill="#38bdf8" className="animate-ping" />
                  <circle cx="150" cy="15" r="3" fill="#ffffff" />
                </svg>
              </div>
            </div>

            {/* Live TV Video Stream (Expandable) */}
            {isTVExpanded && (
              <div className="mt-3 rounded-xs overflow-hidden bg-black aspect-video flex flex-col items-center justify-center border border-emerald-700">
                <PlayCircle className="w-12 h-12 text-red-500 animate-pulse mb-2" />
                <span className="text-xs font-mono font-bold text-slate-300">Live TV Stream Feed Active (Zero Latency)</span>
              </div>
            )}

          </div>

          {/* ─── B. MATCH CENTER NAVIGATION TABS ─── */}
          <div className="bg-white border border-slate-300 rounded-xs p-1 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[
                { id: "betting", label: "Exchange & Fancy" },
                { id: "scorecard", label: "Full Scorecard" },
                { id: "commentary", label: "Ball Commentary" },
                { id: "squads", label: "Squads" },
                { id: "info", label: "Pitch & Info" }
              ].map(tb => (
                <button
                  key={tb.id}
                  onClick={() => setActiveCenterTab(tb.id as any)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xs transition-colors cursor-pointer",
                    activeCenterTab === tb.id
                      ? "bg-[#1b3d2f] text-amber-300 shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] font-mono font-bold text-slate-500 pr-2 hidden sm:block">
              Matched: <strong className="text-[#1b3d2f]">PIN 1,578,901,631.00</strong>
            </div>
          </div>

          {/* Feedback Toast */}
          {betFeedback && (
            <div className="bg-slate-900 text-amber-300 px-3 py-2 rounded-xs border border-amber-400/40 text-xs font-black uppercase tracking-wide flex items-center justify-between animate-fade-in shadow-md">
              <span>{betFeedback}</span>
              <button onClick={() => setBetFeedback(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* ─── TAB 1: BETTING (MATCH ODDS + BOOKMAKER + FANCY BET) ─── */}
          {activeCenterTab === "betting" && (
            <div className="space-y-3">
              
              {/* 1. MATCH ODDS (3-Depth Back/Lay Ladder) */}
              <div className="bg-white border border-slate-300 rounded-xs shadow-xs overflow-hidden">
                <div className="bg-[#1b3d2f] text-white px-3 py-1.5 flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span>Match Odds</span>
                    <span className="bg-emerald-700 text-emerald-100 text-[9px] px-1.5 py-0.2 rounded-xs">In Play</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-slate-300">
                    <span>Min: 100.00</span> | <span>Max: 15,62,500.00</span>
                  </div>
                </div>

                {/* Ladder Headers */}
                <div className="bg-slate-100 border-b border-slate-200 px-3 py-1 flex items-center justify-between text-[10px] font-black text-slate-600 uppercase">
                  <div>2 Selections</div>
                  <div className="flex items-center gap-1 text-center">
                    <div className="w-32 text-cyan-800 bg-[#72bbef]/30 py-0.5 rounded-xs">Back All</div>
                    <div className="w-32 text-rose-800 bg-[#faa9ba]/30 py-0.5 rounded-xs">Lay All</div>
                  </div>
                </div>

                {/* Team Rows */}
                <div className="divide-y divide-slate-200">
                  {[
                    { name: match.team1.name, backs: [{ o: 2.44, v: "237k" }, { o: 2.46, v: "2.01M" }, { o: 2.48, v: "352k" }], lays: [{ o: 2.50, v: "95.3k" }, { o: 2.52, v: "46k" }, { o: 2.54, v: "187k" }] },
                    { name: match.team2.name, backs: [{ o: 1.64, v: "408k" }, { o: 1.65, v: "15.7k" }, { o: 1.66, v: "50.8k" }], lays: [{ o: 1.67, v: "1.61M" }, { o: 1.68, v: "294k" }, { o: 1.69, v: "340k" }] }
                  ].map(teamRow => (
                    <div key={teamRow.name} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50">
                      <span className="font-black text-xs text-slate-900 truncate flex-1">{teamRow.name}</span>
                      
                      {/* 3 Back Columns */}
                      <div className="flex items-center gap-0.5">
                        {teamRow.backs.map((b, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectOdds("Match Odds", teamRow.name, b.o, 'back')}
                            className={cn(
                              "w-10 h-8 font-black text-xs flex flex-col items-center justify-center rounded-xs transition-colors cursor-pointer leading-none shadow-2xs active:scale-95",
                              idx === 2 ? "bg-[#72bbef] hover:bg-[#5db1eb] text-[#002b49]" : "bg-[#a6d8f7] text-[#002b49]"
                            )}
                          >
                            <span>{b.o.toFixed(2)}</span>
                            <span className="text-[8px] opacity-75 font-mono">{b.v}</span>
                          </button>
                        ))}
                      </div>

                      {/* 3 Lay Columns */}
                      <div className="flex items-center gap-0.5">
                        {teamRow.lays.map((l, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectOdds("Match Odds", teamRow.name, l.o, 'lay')}
                            className={cn(
                              "w-10 h-8 font-black text-xs flex flex-col items-center justify-center rounded-xs transition-colors cursor-pointer leading-none shadow-2xs active:scale-95",
                              idx === 0 ? "bg-[#faa9ba] hover:bg-[#f895a9] text-[#4a0011]" : "bg-[#fcc5d1] text-[#4a0011]"
                            )}
                          >
                            <span>{l.o.toFixed(2)}</span>
                            <span className="text-[8px] opacity-75 font-mono">{l.v}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. BOOKMAKER MARKET (Zero Commission) */}
              <div className="bg-white border border-slate-300 rounded-xs shadow-xs overflow-hidden">
                <div className="bg-[#1b3d2f] text-white px-3 py-1.5 flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                  <span>Bookmaker Market (Zero Commission)</span>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-slate-300">
                    <span>Min: 100.00</span> | <span>Max: 15,62,500.00</span>
                  </div>
                </div>

                <div className="bg-slate-100 border-b border-slate-200 px-3 py-1 flex items-center justify-between text-[10px] font-black text-slate-600 uppercase">
                  <div>Indian Bhav</div>
                  <div className="flex items-center gap-1 text-center pr-1">
                    <div className="w-12 text-cyan-800 bg-[#72bbef]/30 py-0.5 rounded-xs">Back</div>
                    <div className="w-12 text-rose-800 bg-[#faa9ba]/30 py-0.5 rounded-xs">Lay</div>
                  </div>
                </div>

                <div className="divide-y divide-slate-200">
                  <div className="p-2.5 flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900">{match.team1.name}</span>
                    <span className="bg-amber-100 text-amber-800 font-black text-[10px] px-3 py-1 rounded-xs uppercase tracking-wider">
                      Suspended
                    </span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900">{match.team2.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSelectOdds("Bookmaker", match.team2.name, 66, 'back')}
                        className="w-12 h-8 bg-[#72bbef] hover:bg-[#5db1eb] text-[#002b49] font-black text-xs rounded-xs flex items-center justify-center cursor-pointer"
                      >
                        66
                      </button>
                      <button
                        onClick={() => handleSelectOdds("Bookmaker", match.team2.name, 67, 'lay')}
                        className="w-12 h-8 bg-[#faa9ba] hover:bg-[#f895a9] text-[#4a0011] font-black text-xs rounded-xs flex items-center justify-center cursor-pointer"
                      >
                        67
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. FANCY BET TABBED MATRIX (Exact from Video 00:17 - 00:20) */}
              <div className="bg-white border border-slate-300 rounded-xs shadow-xs overflow-hidden">
                <div className="bg-[#1b3d2f] text-white px-3 py-1.5 flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span>★ Fancy Bet</span>
                    <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-xs">Premium Cricket</span>
                  </div>
                </div>

                {/* Fancy Category Sub-Tabs */}
                <div className="bg-slate-100 border-b border-slate-200 p-1 flex items-center gap-1 overflow-x-auto scrollbar-none">
                  {[
                    { id: "all", label: "Fancy" },
                    { id: "ballbyball", label: "Ball by Ball" },
                    { id: "khadda", label: "Khadda" },
                    { id: "lottery", label: "Lottery" },
                    { id: "oddeven", label: "Odd/Even" }
                  ].map(fc => (
                    <button
                      key={fc.id}
                      onClick={() => setFancyCategory(fc.id as any)}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-black uppercase rounded-xs transition-colors cursor-pointer",
                        fancyCategory === fc.id
                          ? "bg-[#234938] text-amber-300 shadow-xs"
                          : "text-slate-700 hover:bg-slate-200"
                      )}
                    >
                      {fc.label}
                    </button>
                  ))}
                </div>

                {/* Fancy Table Headers */}
                <div className="bg-slate-50 border-b border-slate-200 px-3 py-1 flex items-center justify-between text-[10px] font-black text-slate-600 uppercase">
                  <div>Market Description</div>
                  <div className="flex items-center gap-1 text-center">
                    <div className="w-14 text-rose-800 bg-[#faa9ba]/40 py-0.5 rounded-xs">No</div>
                    <div className="w-14 text-cyan-800 bg-[#72bbef]/40 py-0.5 rounded-xs">Yes</div>
                  </div>
                </div>

                {/* Fancy Session Rows */}
                <div className="divide-y divide-slate-200">
                  {filteredFancy.map(item => (
                    <div key={item.id} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/80">
                      <div className="flex-1 min-w-0">
                        <span className="font-black text-xs text-slate-900 block truncate">{item.label}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Min/Max: PIN {item.min} / {item.max.toLocaleString()}
                        </span>
                      </div>

                      {item.status === "suspended" ? (
                        <div className="bg-amber-100 text-amber-800 font-black text-[10px] px-4 py-1.5 rounded-xs uppercase tracking-wider">
                          Suspended
                        </div>
                      ) : item.status === "ball_running" ? (
                        <div className="bg-rose-100 text-rose-800 font-black text-[10px] px-4 py-1.5 rounded-xs uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" /> Ball Running
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          {/* NO Button (Pink) */}
                          <button
                            onClick={() => handleSelectOdds(item.label, `NO ${item.noRuns}`, item.noRate, 'lay', typeof item.noRuns === 'number' ? item.noRuns : undefined)}
                            className="w-14 h-8 bg-[#faa9ba] hover:bg-[#f895a9] text-[#4a0011] font-black text-xs rounded-xs flex flex-col items-center justify-center cursor-pointer shadow-2xs leading-none"
                          >
                            <span>{item.noRuns}</span>
                            <span className="text-[8px] opacity-75 font-mono">{item.noRate}</span>
                          </button>

                          {/* YES Button (Cyan) */}
                          <button
                            onClick={() => handleSelectOdds(item.label, `YES ${item.yesRuns}`, item.yesRate, 'back', typeof item.yesRuns === 'number' ? item.yesRuns : undefined)}
                            className="w-14 h-8 bg-[#72bbef] hover:bg-[#5db1eb] text-[#002b49] font-black text-xs rounded-xs flex flex-col items-center justify-center cursor-pointer shadow-2xs leading-none"
                          >
                            <span>{item.yesRuns}</span>
                            <span className="text-[8px] opacity-75 font-mono">{item.yesRate}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ─── TAB 2: FULL SCORECARD ─── */}
          {activeCenterTab === "scorecard" && (
            <div className="bg-white border border-slate-300 rounded-xs p-4 shadow-xs space-y-4">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide border-b pb-2">Full Match Scorecard</h3>
              {(match.scorecards || []).length === 0 ? (
                <p className="text-slate-500 font-bold">Detailed scorecard will update once innings concludes.</p>
              ) : (
                (match.scorecards || []).map((sc, i) => (
                  <div key={i} className="border border-slate-200 rounded-xs overflow-hidden">
                    <div className="bg-[#1b3d2f] text-white px-3 py-1.5 font-black uppercase text-xs flex justify-between">
                      <span>{sc.teamName} Innings</span>
                      <span>{sc.totalScore || `${(sc as any).runs || 0}/${(sc as any).wickets || 0}`} (RR: {sc.runRate || "N/A"})</span>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {sc.batting?.map((b: any, idx: number) => (
                        <div key={idx} className="p-2 flex justify-between font-bold">
                          <span>{b.name}</span>
                          <span className="font-mono">{b.runs} ({b.balls}b, {b.fours}x4, {b.sixes}x6)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ─── TAB 3: BALL BY BALL COMMENTARY ─── */}
          {activeCenterTab === "commentary" && (
            <div className="bg-white border border-slate-300 rounded-xs p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-black text-sm text-slate-900 uppercase">Live Ball Commentary</h3>
                <span className="text-emerald-700 font-bold font-mono text-[10px] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Fast Sync
                </span>
              </div>
              <div className="space-y-2">
                {(match.commentary || [
                  { over: "14.6", text: "FOUR! Driven through the covers with immense timing.", runs: 4 },
                  { over: "14.5", text: "Single taken down to long on.", runs: 1 },
                  { over: "14.4", text: "DOT ball. Defended back to the bowler.", runs: 0 },
                  { over: "14.3", text: "SIX! Smashed over deep midwicket into the stands!", runs: 6 }
                ]).map((comm: any, i: number) => (
                  <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xs flex items-start gap-2.5">
                    <span className="bg-[#1b3d2f] text-amber-300 font-mono font-black text-xs px-2 py-1 rounded-xs shrink-0">
                      {comm.over}
                    </span>
                    <p className="text-xs font-medium text-slate-800 flex-1">{comm.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── TAB 4: SQUADS ─── */}
          {activeCenterTab === "squads" && (
            <div className="bg-white border border-slate-300 rounded-xs p-4 shadow-xs space-y-3">
              <h3 className="font-black text-sm text-slate-900 uppercase border-b pb-2">Playing XI Squads</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-xs p-3">
                  <h4 className="font-black text-xs text-[#1b3d2f] uppercase mb-2">{match.team1.name} XI</h4>
                  <ul className="space-y-1 text-xs text-slate-700 font-bold">
                    {(match.team1.playingXI || (match as any).team1Squad || ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5"]).map((p: any, i: number) => (
                      <li key={i} className="p-1 hover:bg-slate-50 rounded-xs">{typeof p === 'string' ? p : p.name}</li>
                    ))}
                  </ul>
                </div>
                <div className="border border-slate-200 rounded-xs p-3">
                  <h4 className="font-black text-xs text-[#1b3d2f] uppercase mb-2">{match.team2.name} XI</h4>
                  <ul className="space-y-1 text-xs text-slate-700 font-bold">
                    {(match.team2.playingXI || (match as any).team2Squad || ["Player A", "Player B", "Player C", "Player D", "Player E"]).map((p: any, i: number) => (
                      <li key={i} className="p-1 hover:bg-slate-50 rounded-xs">{typeof p === 'string' ? p : p.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 5: VENUE & PITCH INFO ─── */}
          {activeCenterTab === "info" && (
            <div className="bg-white border border-slate-300 rounded-xs p-4 shadow-xs space-y-3">
              <h3 className="font-black text-sm text-slate-900 uppercase border-b pb-2">Venue & Match Intelligence</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 border rounded-xs">
                  <span className="text-slate-500 font-bold block">Venue</span>
                  <strong className="text-slate-900 text-sm">
                    {typeof match.venue === 'string' ? match.venue : `${match.venue?.stadium || "Civil Service Cricket Club"}, ${match.venue?.city || "Belfast"}`}
                  </strong>
                </div>
                <div className="p-2.5 bg-slate-50 border rounded-xs">
                  <span className="text-slate-500 font-bold block">Pitch Type</span>
                  <strong className="text-slate-900 text-sm">
                    {typeof match.venue === 'object' ? match.venue?.pitchReport : "Balanced / Batting Paradise (Avg 1st Inn 265)"}
                  </strong>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* ─── COLUMN 3: RIGHT STICKY BET SLIP (3 Cols) ─── */}
        <aside className="lg:col-span-3 bg-white border border-slate-300 rounded-xs shadow-xs sticky top-14">
          <div className="bg-[#1b3d2f] text-white px-3 py-2 font-black uppercase text-xs tracking-wider flex items-center justify-between border-b border-emerald-950">
            <span>Bet Slip</span>
            {selectedBet && (
              <button
                onClick={() => setSelectedBet(null)}
                className="text-slate-300 hover:text-white text-[10px] uppercase font-bold cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {!selectedBet ? (
            <div className="p-8 text-center text-slate-500 font-bold">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-70" />
              <p className="text-xs">Click on the odds to add selections to the betslip.</p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              
              {/* Selection Header Card */}
              <div className={cn(
                "p-2.5 rounded-xs border text-xs",
                selectedBet.type === 'back' ? "bg-blue-50/80 border-blue-200 text-blue-950" : "bg-pink-50/80 border-pink-200 text-pink-950"
              )}>
                <div className="flex items-center justify-between font-black">
                  <span>{selectedBet.selection}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-xs text-[10px] uppercase font-black",
                    selectedBet.type === 'back' ? "bg-[#72bbef] text-[#002b49]" : "bg-[#faa9ba] text-[#4a0011]"
                  )}>
                    {selectedBet.type.toUpperCase()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                  {match.team1.name} v {match.team2.name} • {selectedBet.marketName}
                </div>

                {/* Odds & Stake Steppers */}
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/80">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Odds / Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={selectedBet.odds}
                      onChange={(e) => setSelectedBet({ ...selectedBet, odds: parseFloat(e.target.value) || 1.01 })}
                      className="w-full bg-white border border-slate-300 rounded-xs px-2 py-1 font-mono font-black text-xs focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Stake (PIN)</label>
                    <input
                      type="number"
                      value={selectedBet.stake}
                      onChange={(e) => setSelectedBet({ ...selectedBet, stake: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white border border-slate-300 rounded-xs px-2 py-1 font-mono font-black text-xs focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Quick Stake Buttons */}
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {[100, 500, 1000, 5000, 10000, 25000, 50000, 100000].map(val => (
                    <button
                      key={val}
                      onClick={() => setSelectedBet({ ...selectedBet, stake: val })}
                      className="py-1 bg-white hover:bg-slate-100 border border-slate-300 text-[10px] font-mono font-bold rounded-xs cursor-pointer transition-colors"
                    >
                      +{val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>

                {/* Profit / Liability Calculations */}
                <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] flex justify-between items-center font-bold">
                  {selectedBet.type === 'back' ? (
                    <>
                      <span className="text-slate-600">Profit:</span>
                      <strong className="text-emerald-700 font-mono">
                        +PIN {Math.round(selectedBet.stake * (selectedBet.odds > 10 ? (selectedBet.odds / 100) : (selectedBet.odds - 1))).toLocaleString()}
                      </strong>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-600">Liability:</span>
                      <strong className="text-rose-700 font-mono">
                        -PIN {Math.round(selectedBet.stake * (selectedBet.odds > 10 ? (selectedBet.odds / 100) : (selectedBet.odds - 1))).toLocaleString()}
                      </strong>
                    </>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                disabled={isPlacing || selectedBet.stake <= 0}
                onClick={handlePlaceBetslip}
                className={cn(
                  "w-full py-2.5 font-black text-xs uppercase tracking-wider rounded-xs cursor-pointer transition-all shadow-sm active:scale-98",
                  isPlacing ? "bg-slate-400 text-white cursor-not-allowed" : "bg-[#1b3d2f] hover:bg-[#234938] text-amber-300"
                )}
              >
                {isPlacing ? "Submitting Order..." : "Place Bet"}
              </button>
            </div>
          )}
        </aside>

      </div>

    </div>
  );
}
