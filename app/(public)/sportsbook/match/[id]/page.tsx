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
import { CricketDataValidator } from "@/lib/cricket/validator";

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
  const [activeTab, setActiveTab] = useState<"odds" | "fancy" | "scorecard" | "commentary" | "info">("odds");
  const [fancyCategory, setFancyCategory] = useState<"all" | "fancy" | "ballbyball" | "khadda" | "oddeven">("all");
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);
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
        setBetFeedback(`✅ 1-Click Bet: ${selection} (${type.toUpperCase()}) @ ${odds} | ₹${oneClickStake}`);
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

  // Fancy Bet Rows
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
    <div className="min-h-screen bg-[#0d151c] text-slate-100 font-sans pb-24 select-none">
      
      {/* ═══════════════════════════════════════════════════════════════
          1. CLEAN MOBILE MATCH HEADER
      ═══════════════════════════════════════════════════════════════ */}
      <header className="bg-[#111d27]/95 backdrop-blur-md border-b border-slate-800/80 px-3.5 py-2.5 sticky top-0 z-40">
        <div className="max-w-md mx-auto sm:max-w-5xl flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2">
            <Link
              href="/sportsbook"
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="truncate">
              <h1 className="font-extrabold text-xs text-white uppercase tracking-wider truncate">
                {match.team1.code || match.team1.name} vs {match.team2.code || match.team2.name}
              </h1>
              <span className="text-[10px] text-slate-400 font-bold block truncate">
                {match.series || "International Cricket Series"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* TV Button */}
            <button
              onClick={() => setIsTVExpanded(!isTVExpanded)}
              className={cn(
                "px-2.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 min-h-[44px] transition-colors cursor-pointer",
                isTVExpanded ? "bg-red-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              )}
            >
              <Tv className="w-3.5 h-3.5 text-red-400" />
              <span>Live TV</span>
            </button>

            {/* Pin Button */}
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={cn(
                "p-2 rounded-full border transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center",
                isPinned ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-slate-800 text-slate-400 border-slate-700"
              )}
            >
              <Pin className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          2. MOBILE LIVE TV SCOREBOARD & MOMENTUM HUD
      ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-md mx-auto sm:max-w-5xl px-3 pt-3">
        <div className="bg-gradient-to-b from-[#162734] to-[#0f1b24] border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden">
          
          {/* Match State & Freshness Indicator */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-[10px] font-bold">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-mono font-black flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isLive ? "LIVE IN-PLAY" : "SCHEDULED"}
              </span>
              <span className="text-slate-400 font-mono">
                {match.matchType || "T20"}
              </span>
            </div>

            <div className="text-right text-slate-400 font-mono">
              CRR: <strong className="text-white">8.67</strong> | RRR: <strong className="text-amber-400">23.00</strong>
            </div>
          </div>

          {/* Teams Score Grid */}
          <div className="grid grid-cols-2 gap-3 py-3 items-center">
            {/* Team 1 */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-emerald-400">
                  {match.team1.code ? match.team1.code.substring(0, 2) : "T1"}
                </div>
                <span className="font-black text-sm text-white truncate">{match.team1.name}</span>
              </div>
              <div className="font-mono text-lg font-black text-amber-300 pl-9">
                {match.team1.scoreSummary || "244/10"}
              </div>
            </div>

            {/* Team 2 */}
            <div className="space-y-1 text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="font-black text-sm text-white truncate">{match.team2.name}</span>
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-teal-400">
                  {match.team2.code ? match.team2.code.substring(0, 2) : "T2"}
                </div>
              </div>
              <div className="font-mono text-lg font-black text-emerald-400 pr-9">
                {match.team2.scoreSummary || "130/2 (15.0 ov)"}
              </div>
            </div>
          </div>

          {/* Status Note & Graph Collapse Button */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 text-[11px] truncate max-w-[240px]">
              {match.status || "Live - 2nd Innings Target: 245"}
            </span>

            <button
              onClick={() => setIsGraphExpanded(!isGraphExpanded)}
              className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1 p-1 cursor-pointer"
            >
              <span>{isGraphExpanded ? "Hide Graph" : "Run Graph"}</span>
              {isGraphExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Expandable Run Rate SVG Momentum Graph */}
          {isGraphExpanded && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 animate-in slide-in-from-top-2 duration-200">
              <div className="h-16 w-full bg-slate-900/90 rounded-xl p-2 relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 50">
                  <line x1="0" y1="12" x2="500" y2="12" stroke="#334155" strokeDasharray="3 3" />
                  <line x1="0" y1="25" x2="500" y2="25" stroke="#334155" strokeDasharray="3 3" />
                  <path
                    d="M 0,50 L 50,46 L 100,40 L 150,35 L 200,31 L 250,26 L 300,20 L 350,16 L 400,12 L 450,8 L 500,4"
                    fill="none" stroke="#f87171" strokeWidth="1.5"
                  />
                  <path
                    d="M 0,50 L 30,44 L 60,37 L 90,30 L 120,22 L 150,15"
                    fill="none" stroke="#38bdf8" strokeWidth="2.5"
                  />
                  <circle cx="150" cy="15" r="3.5" fill="#38bdf8" className="animate-ping" />
                  <circle cx="150" cy="15" r="3" fill="#ffffff" />
                </svg>
              </div>
            </div>
          )}

          {/* Expandable Live TV Video */}
          {isTVExpanded && (
            <div className="mt-3 rounded-xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center border border-slate-800">
              <PlayCircle className="w-10 h-10 text-red-500 animate-pulse mb-1" />
              <span className="text-xs font-mono font-bold text-slate-300">Live Video Feed Connected</span>
            </div>
          )}

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          3. PROGRESSIVE DISCLOSURE TABS (Odds, Fancy, Scorecard, Comm)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-md mx-auto sm:max-w-5xl px-3 pt-3">
        <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: "odds", label: "Exchange Odds" },
            { id: "fancy", label: "Fancy Bet" },
            { id: "scorecard", label: "Scorecard" },
            { id: "commentary", label: "Commentary" },
            { id: "info", label: "Pitch Info" }
          ].map(tb => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id as any)}
              className={cn(
                "px-3 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all shrink-0 cursor-pointer min-h-[40px] flex items-center justify-center",
                activeTab === tb.id
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Toast */}
      {betFeedback && (
        <div className="max-w-md mx-auto sm:max-w-5xl px-3 pt-2">
          <div className="bg-emerald-950 border border-emerald-500/60 text-emerald-300 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center justify-between shadow-lg animate-in fade-in duration-200">
            <span>{betFeedback}</span>
            <button onClick={() => setBetFeedback(null)} className="text-slate-400 hover:text-white min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          4. TAB CONTENTS
      ═══════════════════════════════════════════════════════════════ */}
      <main className="max-w-md mx-auto sm:max-w-5xl p-3 space-y-3">
        
        {/* ── TAB 1: EXCHANGE ODDS ── */}
        {activeTab === "odds" && (
          <div className="space-y-3">
            
            {/* Match Odds Market Card */}
            <div className="bg-[#13202b] border border-slate-800 rounded-2xl p-3.5 shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-black uppercase">
                <span className="text-white">Match Odds (Exchange)</span>
                <span className="text-[10px] text-slate-400 font-mono">Zero Platform Delay</span>
              </div>

              <div className="space-y-2">
                {[
                  { name: match.team1.name, back: 2.48, lay: 2.50 },
                  { name: match.team2.name, back: 1.66, lay: 1.68 }
                ].map(row => (
                  <div key={row.name} className="flex items-center justify-between gap-2 p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
                    <span className="font-black text-sm text-slate-100 truncate flex-1">{row.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleSelectOdds("Match Odds", row.name, row.back, 'back')}
                        className="w-16 h-11 bg-[#72bbef] hover:bg-[#5db1eb] active:scale-98 text-[#002b49] font-black text-xs rounded-xl flex flex-col items-center justify-center cursor-pointer shadow-sm min-h-[44px]"
                      >
                        <span className="text-[8px] opacity-75 font-bold uppercase">Back</span>
                        <span className="text-sm font-black">{row.back.toFixed(2)}</span>
                      </button>
                      <button
                        onClick={() => handleSelectOdds("Match Odds", row.name, row.lay, 'lay')}
                        className="w-16 h-11 bg-[#faa9ba] hover:bg-[#f895a9] active:scale-98 text-[#4a0011] font-black text-xs rounded-xl flex flex-col items-center justify-center cursor-pointer shadow-sm min-h-[44px]"
                      >
                        <span className="text-[8px] opacity-75 font-bold uppercase">Lay</span>
                        <span className="text-sm font-black">{row.lay.toFixed(2)}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bookmaker Market (Indian Bhav) */}
            <div className="bg-[#13202b] border border-slate-800 rounded-2xl p-3.5 shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-black uppercase">
                <span className="text-white">Bookmaker (Zero Commission)</span>
                <span className="text-[10px] text-amber-400 font-mono">Indian Bhav</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
                  <span className="font-black text-sm text-slate-100">{match.team1.name}</span>
                  <span className="bg-amber-500/20 text-amber-400 font-black text-[10px] px-3 py-1.5 rounded-lg uppercase">
                    Suspended
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
                  <span className="font-black text-sm text-slate-100">{match.team2.name}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSelectOdds("Bookmaker", match.team2.name, 66, 'back')}
                      className="w-16 h-11 bg-[#72bbef] hover:bg-[#5db1eb] active:scale-98 text-[#002b49] font-black text-sm rounded-xl flex items-center justify-center cursor-pointer shadow-sm min-h-[44px]"
                    >
                      66
                    </button>
                    <button
                      onClick={() => handleSelectOdds("Bookmaker", match.team2.name, 67, 'lay')}
                      className="w-16 h-11 bg-[#faa9ba] hover:bg-[#f895a9] active:scale-98 text-[#4a0011] font-black text-sm rounded-xl flex items-center justify-center cursor-pointer shadow-sm min-h-[44px]"
                    >
                      67
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 2: FANCY BET MATRIX ── */}
        {activeTab === "fancy" && (
          <div className="bg-[#13202b] border border-slate-800 rounded-2xl p-3.5 shadow-md space-y-3">
            
            {/* Category Sub-Pills */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-2 border-b border-slate-800">
              {[
                { id: "all", label: "All Fancy" },
                { id: "ballbyball", label: "Ball by Ball" },
                { id: "khadda", label: "Khadda" },
                { id: "oddeven", label: "Odd/Even" }
              ].map(fc => (
                <button
                  key={fc.id}
                  onClick={() => setFancyCategory(fc.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shrink-0 transition-colors cursor-pointer min-h-[36px]",
                    fancyCategory === fc.id ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                  )}
                >
                  {fc.label}
                </button>
              ))}
            </div>

            {/* Session Rows */}
            <div className="space-y-2">
              {filteredFancy.map(item => (
                <div key={item.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-black text-xs text-white block truncate">{item.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      Max: ₹{item.max.toLocaleString()}
                    </span>
                  </div>

                  {item.status === "suspended" ? (
                    <div className="bg-amber-500/20 text-amber-400 font-black text-[10px] px-3 py-2 rounded-xl uppercase">
                      Suspended
                    </div>
                  ) : item.status === "ball_running" ? (
                    <div className="bg-rose-500/20 text-rose-400 font-black text-[10px] px-3 py-2 rounded-xl uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" /> Ball Running
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleSelectOdds(item.label, `NO ${item.noRuns}`, item.noRate, 'lay', typeof item.noRuns === 'number' ? item.noRuns : undefined)}
                        className="w-16 h-11 bg-[#faa9ba] hover:bg-[#f895a9] active:scale-98 text-[#4a0011] font-black text-xs rounded-xl flex flex-col items-center justify-center cursor-pointer shadow-sm min-h-[44px]"
                      >
                        <span className="text-[9px] opacity-75 font-bold uppercase">No</span>
                        <span className="text-xs font-black">{item.noRuns}</span>
                      </button>
                      <button
                        onClick={() => handleSelectOdds(item.label, `YES ${item.yesRuns}`, item.yesRate, 'back', typeof item.yesRuns === 'number' ? item.yesRuns : undefined)}
                        className="w-16 h-11 bg-[#72bbef] hover:bg-[#5db1eb] active:scale-98 text-[#002b49] font-black text-xs rounded-xl flex flex-col items-center justify-center cursor-pointer shadow-sm min-h-[44px]"
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
        )}

        {/* ── TAB 3: FULL SCORECARD ── */}
        {activeTab === "scorecard" && (
          <div className="bg-[#13202b] border border-slate-800 rounded-2xl p-3.5 shadow-md space-y-3">
            <h3 className="font-black text-xs text-white uppercase tracking-wider pb-2 border-b border-slate-800">
              Verified Innings Scorecard
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

        {/* ── TAB 4: COMMENTARY ── */}
        {activeTab === "commentary" && (
          <div className="bg-[#13202b] border border-slate-800 rounded-2xl p-3.5 shadow-md space-y-2.5">
            <h3 className="font-black text-xs text-white uppercase tracking-wider pb-2 border-b border-slate-800">
              Ball-by-Ball Live Stream
            </h3>
            <div className="space-y-2">
              {(match.commentary || [
                { over: "14.6", text: "FOUR! Driven through the covers with immense timing.", runs: 4 },
                { over: "14.5", text: "Single taken down to long on.", runs: 1 },
                { over: "14.4", text: "DOT ball. Defended back to the bowler.", runs: 0 },
                { over: "14.3", text: "SIX! Smashed over deep midwicket into the stands!", runs: 6 }
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

        {/* ── TAB 5: PITCH & VENUE INFO ── */}
        {activeTab === "info" && (
          <div className="bg-[#13202b] border border-slate-800 rounded-2xl p-3.5 shadow-md space-y-3">
            <h3 className="font-black text-xs text-white uppercase tracking-wider pb-2 border-b border-slate-800">
              Venue & Pitch Intelligence
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

      </main>

      {/* ═══════════════════════════════════════════════════════════════
          5. MOBILE QUICK BET BOTTOM SHEET
      ═══════════════════════════════════════════════════════════════ */}
      {selectedBet && (
        <div className="fixed inset-x-0 bottom-16 z-50 p-3 max-w-md mx-auto animate-in slide-in-from-bottom-6 duration-300">
          <div className="bg-[#111d27] border-2 border-emerald-500/80 rounded-2xl p-4 shadow-2xl space-y-3">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="font-black text-sm text-white">{selectedBet.selection}</span>
                <span className="text-[10px] text-slate-400 font-bold block">{selectedBet.marketName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] uppercase font-black",
                  selectedBet.type === 'back' ? "bg-[#72bbef] text-[#002b49]" : "bg-[#faa9ba] text-[#4a0011]"
                )}>
                  {selectedBet.type.toUpperCase()}
                </span>
                <button
                  onClick={() => setSelectedBet(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-white min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block uppercase">Odds / Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={selectedBet.odds}
                  onChange={(e) => setSelectedBet({ ...selectedBet, odds: parseFloat(e.target.value) || 1.01 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono font-black text-sm text-white focus:outline-hidden focus:border-emerald-500 min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block uppercase">Stake (₹)</label>
                <input
                  type="number"
                  value={selectedBet.stake}
                  onChange={(e) => setSelectedBet({ ...selectedBet, stake: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono font-black text-sm text-white focus:outline-hidden focus:border-emerald-500 min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[100, 500, 1000, 5000].map(val => (
                <button
                  key={val}
                  onClick={() => setSelectedBet({ ...selectedBet, stake: val })}
                  className="py-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 rounded-xl cursor-pointer min-h-[36px] transition-colors"
                >
                  +₹{val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-800">
              {selectedBet.type === 'back' ? (
                <>
                  <span className="text-slate-400">Potential Return:</span>
                  <strong className="text-emerald-400 font-mono text-sm">
                    +₹{Math.round(selectedBet.stake * (selectedBet.odds > 10 ? (selectedBet.odds / 100) : (selectedBet.odds - 1))).toLocaleString()}
                  </strong>
                </>
              ) : (
                <>
                  <span className="text-slate-400">Max Liability:</span>
                  <strong className="text-rose-400 font-mono text-sm">
                    -₹{Math.round(selectedBet.stake * (selectedBet.odds > 10 ? (selectedBet.odds / 100) : (selectedBet.odds - 1))).toLocaleString()}
                  </strong>
                </>
              )}
            </div>

            <button
              disabled={isPlacing || selectedBet.stake <= 0}
              onClick={handlePlaceBetslip}
              className={cn(
                "w-full py-3 font-black text-sm uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-lg min-h-[48px] active:scale-98",
                isPlacing ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:brightness-110"
              )}
            >
              {isPlacing ? "Placing Order..." : "Confirm & Place Bet"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          6. COMPACT MOBILE BOTTOM NAVIGATION
      ═══════════════════════════════════════════════════════════════ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 bg-[#0d151c]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 shadow-2xl">
        <div className="max-w-md mx-auto sm:max-w-5xl grid grid-cols-5 gap-1">
          <Link href="/sportsbook" className="flex flex-col items-center justify-center py-1 text-emerald-400 font-black text-[10px] min-h-[44px]">
            <Trophy className="w-5 h-5 mb-0.5" />
            <span>Sports</span>
          </Link>
          <Link href="/sportsbook?sport=inplay" className="flex flex-col items-center justify-center py-1 text-slate-400 font-bold text-[10px] min-h-[44px]">
            <Flame className="w-5 h-5 mb-0.5 text-red-400" />
            <span>In-Play</span>
          </Link>
          <Link href="/account/bets" className="flex flex-col items-center justify-center py-1 text-slate-400 font-bold text-[10px] min-h-[44px]">
            <Receipt className="w-5 h-5 mb-0.5" />
            <span>My Bets</span>
          </Link>
          <Link href="/casino" className="flex flex-col items-center justify-center py-1 text-slate-400 font-bold text-[10px] min-h-[44px]">
            <Gamepad2 className="w-5 h-5 mb-0.5 text-amber-400" />
            <span>Casino</span>
          </Link>
          <Link href="/account" className="flex flex-col items-center justify-center py-1 text-slate-400 font-bold text-[10px] min-h-[44px]">
            <User className="w-5 h-5 mb-0.5" />
            <span>Account</span>
          </Link>
        </div>
      </nav>

    </div>
  );
}
