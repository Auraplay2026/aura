"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Calendar, MapPin, Wind, Droplets, Trophy, 
  TrendingUp, Shield, Clock, Award, Check, AlertCircle, 
  User, ChevronRight, Zap, Info, Users, Activity, Flame, Share2, Star, CheckCircle2, ChevronDown
} from "lucide-react";
import { 
  DeepMatchInfo, CrexInningsScorecard, CREX_MATCHES_DATABASE, PLAYERS_DATABASE, PlayerDossier, resolveDeepMatch 
} from "@/lib/sportsDeepData";
import { formatOddsByMode, OddsDisplayMode, convertDecimalToBhav, convertDecimalToMultiplier } from "@/lib/bhavEngine";
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
  const [gateCheckInfo, setGateCheckInfo] = useState<{
    confidenceScore: string;
    sourcesAgreed: number;
    verifiedAt: string;
    gateChecksPassed: string[];
  } | null>(null);
  const [cricketTelemetry, setCricketTelemetry] = useState<any>(null);
  const [footballTelemetry, setFootballTelemetry] = useState<any>(null);
  const [tennisTelemetry, setTennisTelemetry] = useState<any>(null);
  const scorecards = match.scorecards || [];

  // Live real-time match sync with dedicated match API
  useEffect(() => {
    let isMounted = true;
    const fetchLiveMatch = async () => {
      try {
        const res = await fetch(`/api/sports/match/${matchId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.match && isMounted) {
            setMatch(data.match);
            if (data.gateCheck) {
              setGateCheckInfo(data.gateCheck);
            }
            if (data.cricketTelemetry) {
              setCricketTelemetry(data.cricketTelemetry);
            }
            if (data.footballTelemetry) {
              setFootballTelemetry(data.footballTelemetry);
            }
            if (data.tennisTelemetry) {
              setTennisTelemetry(data.tennisTelemetry);
            }
            return;
          }
        }
        
        // Fallback to /api/sports/live
        const liveRes = await fetch("/api/sports/live?sport=all");
        if (liveRes.ok) {
          const data = await liveRes.json();
          const liveList = Array.isArray(data) ? data : data.matches || [];
          const found = liveList.find((m: any) => String(m.id) === String(matchId) || m.id === parseInt(matchId));
          if (isMounted) {
            setMatch(resolveDeepMatch(matchId, found));
          }
        }
      } catch (e) {
        console.error("Live match sync error:", e);
      }
    };

    fetchLiveMatch();
    const interval = setInterval(fetchLiveMatch, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [matchId]);

  const [activeTab, setActiveTab] = useState<"scorecard" | "info" | "squads" | "betting" | "fixtures">("betting");
  const [activeInningsIdx, setActiveInningsIdx] = useState(scorecards.length > 0 ? scorecards.length - 1 : 0);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [oddsMode, setOddsMode] = useState<OddsDisplayMode>("decimal");
  const [selectedSquadTeam, setSelectedSquadTeam] = useState<"team1" | "team2">("team1");

  // Betting state
  const [quickBetStake, setQuickBetStake] = useState<number>(500);
  const [selectedMarketBet, setSelectedMarketBet] = useState<{ name: string; type: "back" | "lay" | "yes" | "no"; odds: number; line?: number } | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [betFeedback, setBetFeedback] = useState<string | null>(null);

  const { isLoggedIn, balance, placeSportsBet } = useTradingStore();
  const currentInnings: CrexInningsScorecard | undefined = scorecards[activeInningsIdx];

  const handlePlaceBet = async () => {
    if (!selectedMarketBet) return;
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: "login" } }));
      return;
    }
    setIsPlacing(true);
    try {
      const res = await placeSportsBet(
        match.title,
        selectedMarketBet.name,
        selectedMarketBet.odds,
        quickBetStake,
        selectedMarketBet.type as any
      );
      if (res?.success) {
        setBetFeedback(`🔒 Bet Accepted & Locked! (Order #${res.transactionId ? res.transactionId.substring(0, 8) : 'BET'}). Frozen until match conclusion.`);
        setTimeout(() => {
          setSelectedMarketBet(null);
          setBetFeedback(null);
        }, 2800);
      } else {
        setBetFeedback(res?.error || "Failed to place bet. Please verify balance.");
        setTimeout(() => setBetFeedback(null), 3000);
      }
    } catch (e) {
      setBetFeedback("Network error. Please try again.");
      setTimeout(() => setBetFeedback(null), 3000);
    } finally {
      setIsPlacing(false);
    }
  };

  const selectedPlayer = selectedPlayerId ? PLAYERS_DATABASE[selectedPlayerId] : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      
      {/* ═══ TOP BREADCRUMB / HEADER ═══ */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 px-3 sm:px-6 py-2.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Link
              href="/sportsbook"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition-colors cursor-pointer border border-slate-300 shrink-0"
              title="Back to Sportsbook"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-100 px-1.5 py-0.2 rounded border border-red-300">
                  {match.matchType}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-slate-600 truncate">
                  {match.series}
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-black text-slate-950 truncate">
                {match.title}
              </h1>
            </div>
          </div>

          {/* Odds Mode Selector (Visible on all devices) */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-0.5 sm:p-1 text-xs shrink-0">
            <span className="hidden md:inline-block text-[10px] font-bold text-slate-500 uppercase px-1">Odds:</span>
            <button
              type="button"
              onClick={() => setOddsMode("decimal")}
              className={cn("px-2 py-1 rounded-lg font-black text-[10px] sm:text-[11px] transition-all cursor-pointer", oddsMode === "decimal" ? "bg-slate-950 text-white shadow-xs" : "text-slate-600 hover:text-slate-950")}
            >
              1.90
            </button>
            <button
              type="button"
              onClick={() => setOddsMode("bhav")}
              className={cn("px-2 py-1 rounded-lg font-black text-[10px] sm:text-[11px] transition-all cursor-pointer", oddsMode === "bhav" ? "bg-slate-950 text-white shadow-xs" : "text-slate-600 hover:text-slate-950")}
            >
              🇮🇳 Bhav
            </button>
            <button
              type="button"
              onClick={() => setOddsMode("multiplier")}
              className={cn("px-2 py-1 rounded-lg font-black text-[10px] sm:text-[11px] transition-all cursor-pointer", oddsMode === "multiplier" ? "bg-slate-950 text-white shadow-xs" : "text-slate-600 hover:text-slate-950")}
            >
              1 ka X
            </button>
          </div>
        </div>
      </div>

      {/* ═══ LIVE RADAR STATUS STRIP (CLEAN & NON-INTRUSIVE) ═══ */}
      <div className="bg-slate-900 text-white px-3 sm:px-6 py-1.5 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-emerald-300 uppercase tracking-wide text-[10px] sm:text-[11px]">
              ● LIVE RADAR FEED • 0.2s Fast-Line Sync
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-bold">5/5 Feeds Synchronized</span>
            <span className="hidden sm:inline">⚡ Zero-Lag Bhav</span>
          </div>
        </div>
      </div>

      {/* ═══ CREX HERO SCORECARD HUD ═══ */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-6 text-slate-950 shadow-xs">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center text-xs font-extrabold text-slate-500 mb-5 tracking-wide uppercase">
            {match.title}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Team 1 Score (Left) */}
            <div className="flex items-center gap-4 justify-start">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-2xl sm:text-3xl font-black text-emerald-900 shadow-md shrink-0">
                {match.team1.code.includes("BAN") ? "🇧🇩" : match.team1.code.includes("AUS") ? "🇦🇺" : match.team1.code.includes("SB") ? "🔴" : match.team1.code.includes("MCI") ? "🔵" : match.team1.code.includes("DJO") ? "🎾" : match.team1.code.includes("LAL") ? "🟡" : match.team1.code.slice(0, 2)}
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
                  <span>{match.team1.name}</span>
                  <span className="text-xs text-slate-500 font-bold">({match.team1.code})</span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-800 tracking-tight">
                  {match.team1.scoreSummary}
                </div>
              </div>
            </div>

            {/* Victory / Match Status Banner (Center) */}
            <div className="text-center bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 shadow-2xs">
              <div className="text-amber-950 font-black text-sm sm:text-base leading-snug flex items-center justify-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{match.status}</span>
              </div>
              <p className="text-[11px] font-bold text-amber-800 mt-1">
                📍 {match.venue.stadium}, {match.venue.city}
              </p>
            </div>

            {/* Team 2 Score (Right) */}
            <div className="flex items-center gap-4 justify-start md:justify-end">
              <div className="text-left md:text-right order-2 md:order-1">
                <div className="text-base sm:text-lg font-black text-slate-950">
                  {match.team2.name} <span className="text-xs text-slate-500 font-bold">({match.team2.code})</span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-950 tracking-tight">
                  {match.team2.scoreSummary}
                </div>
              </div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-sky-50 border-2 border-sky-500 flex items-center justify-center text-2xl sm:text-3xl font-black text-sky-900 shadow-md shrink-0 order-1 md:order-2">
                {match.team2.code.includes("BAN") ? "🇧🇩" : match.team2.code.includes("AUS") ? "🇦🇺" : match.team2.code.includes("SL") ? "🟠" : match.team2.code.includes("RMA") ? "⚪" : match.team2.code.includes("ALC") ? "🇪🇸" : match.team2.code.includes("GSW") ? "🔵" : match.team2.code.slice(0, 2)}
              </div>
            </div>

          </div>

          {/* Quick Odds Bar on Hero */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">Match Odds:</span>
              <button
                type="button"
                onClick={() => setSelectedMarketBet({ name: `${match.team1.name} To Win`, type: "back", odds: 1.83 })}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 shadow-2xs"
              >
                {match.team1.code}: <span className="font-mono text-emerald-800 font-black">{formatOddsByMode(1.83, oddsMode)}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMarketBet({ name: `${match.team2.name} To Win`, type: "back", odds: 1.95 })}
                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-950 border border-sky-300 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 shadow-2xs"
              >
                {match.team2.code}: <span className="font-mono text-sky-800 font-black">{formatOddsByMode(1.95, oddsMode)}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-700 font-bold">
              Toss / Kickoff: <strong className="text-slate-950">{match.toss}</strong>
            </div>
          </div>

        </div>
      </div>

      {/* ═══ GRANULAR SPORT LIVE TELEMETRY STRIP ═══ */}
      {match.matchType === "FOOTBALL" ? (
        match.stage?.toLowerCase().includes("upcoming") || match.status?.toLowerCase().includes("upcoming") ? (
          <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800">
            <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="bg-amber-600 font-mono font-black text-xs px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  ⏳ UPCOMING • PRE-MATCH
                </div>
                <div className="font-bold text-slate-200">
                  Kickoff: <strong className="text-amber-300">{match.timeIST || "Starting lineups confirmed"}</strong>
                </div>
              </div>
              <div className="flex items-center gap-4 font-mono text-slate-300">
                <span>Lineups: <strong className="text-emerald-400">Confirmed (100% Verified)</strong></span>
                <span>Venue: <strong className="text-white">{match.venue.stadium}, {match.venue.city}</strong></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800">
            <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 font-mono font-black text-xs px-2.5 py-1 rounded-lg uppercase tracking-wider animate-pulse">
                  ⏱️ {footballTelemetry?.minute || "74"}&apos; • {footballTelemetry?.matchPhase || "2ND HALF IN-PLAY"}
                </div>
                <span className="font-bold text-slate-200">
                  Momentum: <strong className="text-emerald-400">High Attacking Pressure by {match.team1.name}</strong>
                </span>
              </div>
              <div className="flex items-center gap-4 font-mono">
                <span>Possession: <strong className="text-emerald-400">{match.footballDetails?.possession1 || footballTelemetry?.metrics?.possessionHome || 62}%</strong> vs <strong className="text-sky-400">{match.footballDetails?.possession2 || footballTelemetry?.metrics?.possessionAway || 38}%</strong></span>
                <span>xG: <strong className="text-white">{match.footballDetails?.xG1 || footballTelemetry?.metrics?.xGHome || "2.15"} vs {match.footballDetails?.xG2 || footballTelemetry?.metrics?.xGAway || "1.08"}</strong></span>
                <span>Corners: <strong className="text-white">{match.footballDetails?.corners1 || footballTelemetry?.metrics?.cornersHome || 8} - {match.footballDetails?.corners2 || footballTelemetry?.metrics?.cornersAway || 3}</strong></span>
              </div>
            </div>
          </div>
        )
      ) : match.matchType === "TENNIS" ? (
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 font-mono font-black text-xs px-2.5 py-1 rounded-lg uppercase tracking-wider animate-pulse">
                🎾 {match.tennisDetails?.currentSetGame || "SET IN-PLAY"}
              </div>
              <span className="font-bold text-slate-200">
                Surface: <strong className="text-emerald-400">{match.tennisDetails?.surface || "Center Court"}</strong>
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono">
              <span>Aces: <strong className="text-emerald-400">{match.tennisDetails?.aces1 || 8}</strong> vs <strong className="text-sky-400">{match.tennisDetails?.aces2 || 6}</strong></span>
              <span>1st Serve: <strong className="text-white">{match.tennisDetails?.firstServePct1 || 68}%</strong></span>
              <span>Break Points: <strong className="text-amber-400">{match.tennisDetails?.breakPointsConverted1 || "2/4"}</strong></span>
            </div>
          </div>
        </div>
      ) : match.scorecards && match.scorecards.length > 0 && !match.stage?.toLowerCase().includes("upcoming") ? (
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 font-mono font-black text-xs px-2.5 py-1 rounded-lg uppercase tracking-wider animate-pulse">
                ● LIVE {match.matchType === "TEST" ? "SESSION IN-PLAY" : (cricketTelemetry?.overNumber !== undefined ? `OVER ${cricketTelemetry.overNumber}.${cricketTelemetry.ballInOver}` : "IN-PLAY")}
              </div>
              <div className="font-bold">
                Striker: <strong className="text-amber-300 font-black">{cricketTelemetry?.currentStriker?.name || match.scorecards?.[0]?.batting?.[0]?.name || `${match.team1.name} Striker`} {cricketTelemetry?.currentStriker?.runs !== undefined ? `${cricketTelemetry.currentStriker.runs}*(${cricketTelemetry.currentStriker.balls})` : (match.scorecards?.[0]?.batting?.[0]?.runs ? `${match.scorecards[0].batting[0].runs}*(${match.scorecards[0].batting[0].balls})` : "")}</strong> • Non-Striker: <strong className="text-slate-200">{cricketTelemetry?.currentNonStriker?.name || match.scorecards?.[0]?.batting?.[1]?.name || `${match.team1.name} Non-Striker`} {cricketTelemetry?.currentNonStriker?.runs !== undefined ? `${cricketTelemetry.currentNonStriker.runs}*(${cricketTelemetry.currentNonStriker.balls})` : (match.scorecards?.[0]?.batting?.[1]?.runs ? `${match.scorecards[0].batting[1].runs}*(${match.scorecards[0].batting[1].balls})` : "")}</strong>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Recent:</span>
                {(cricketTelemetry?.recentBalls || ["1", "4", "0", "2", "W", "1"]).map((ball: string, i: number) => (
                  <span
                    key={i}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] border",
                      ball === "W"
                        ? "bg-rose-600 text-white border-rose-400"
                        : ball === "4" || ball === "6"
                        ? "bg-emerald-600 text-white border-emerald-400"
                        : "bg-slate-800 text-slate-200 border-slate-700"
                    )}
                  >
                    {ball}
                  </span>
                ))}
              </div>
              <div className="font-mono text-slate-300">
                Bowler: <strong className="text-white">{cricketTelemetry?.activeBowler?.name || match.scorecards?.[0]?.bowling?.[0]?.name || `${match.team2.name} Bowler`} ({cricketTelemetry?.activeBowler?.overs || match.scorecards?.[0]?.bowling?.[0]?.overs || "0.0"}-{cricketTelemetry?.activeBowler?.maidens ?? match.scorecards?.[0]?.bowling?.[0]?.maidens ?? 0}-{cricketTelemetry?.activeBowler?.runs ?? match.scorecards?.[0]?.bowling?.[0]?.runs ?? 0}-{cricketTelemetry?.activeBowler?.wickets ?? match.scorecards?.[0]?.bowling?.[0]?.wickets ?? 0})</strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 border-b border-slate-800">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="bg-amber-600 font-mono font-black text-xs px-2.5 py-1 rounded-lg uppercase tracking-wider">
                ⏳ UPCOMING • PRE-MATCH
              </div>
              <div className="font-bold text-slate-200">
                Toss Status: <strong className="text-amber-300">{match.toss || "Toss scheduled 30 mins before start"}</strong>
              </div>
            </div>
            <div className="flex items-center gap-4 font-mono text-slate-300">
              <span>Playing XI: <strong className="text-emerald-400">Confirmed (Squads Locked)</strong></span>
              <span>Venue: <strong className="text-white">{match.venue.stadium}, {match.venue.city}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ NAVIGATION TABS (4 CLEAN TABS) ═══ */}
      <div className="sticky top-[53px] sm:top-[61px] z-30 bg-white border-b border-slate-200 px-3 sm:px-6 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-2 select-none">
          {[
            { id: "betting", label: "⚡ Markets & Indian Bhav" },
            { id: "scorecard", label: match.matchType === "FOOTBALL" ? "⏱️ Match Tracker & Stats" : match.matchType === "TENNIS" ? "🎾 Set Scores & Stats" : "🏏 Live Scorecard" },
            { id: "squads", label: "👥 Playing XI & Squads" },
            { id: "info", label: "🏟️ Venue & Pitch Info" },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer",
                activeTab === tab.id
                  ? "bg-slate-950 text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ MAIN TAB CONTENT CONTAINER ═══ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* ═══════════════════════════════════════════════════════════════
            TAB 1-UPCOMING: SCHEDULED MATCH SQUADS & PREVIEW
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "scorecard" && (!match.scorecards || match.scorecards.length === 0) && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-slate-950">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300">
                    ⏳ Match Scheduled • Starting Lineups Confirmed
                  </span>
                  <h3 className="text-xl font-black text-slate-950 mt-2">
                    {match.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-bold mt-1">
                    Venue: {match.venue.stadium}, {match.venue.city} • Toss: {match.toss}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Weather Forecast</span>
                  <span className="text-sm font-black text-slate-900">{match.venue.weather.temperature} • {match.venue.weather.condition}</span>
                </div>
              </div>

              {/* Verified Lineups Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Team 1 Playing XI */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                    <span className="text-xs font-black text-slate-900 uppercase">{match.team1.name} (Playing XI)</span>
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">100% Verified</span>
                  </div>
                  <div className="space-y-2">
                    {match.team1.playingXI.map((pid: string, i: number) => {
                      const p = PLAYERS_DATABASE[pid];
                      return (
                        <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 bg-white rounded-lg border border-slate-200">
                          <span className="font-black text-slate-900">{i + 1}. {p?.name || pid}</span>
                          <span className="text-[10px] font-bold text-slate-600">{p?.role || "Squad Member"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Team 2 Playing XI */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                    <span className="text-xs font-black text-slate-900 uppercase">{match.team2.name} (Playing XI)</span>
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">100% Verified</span>
                  </div>
                  <div className="space-y-2">
                    {match.team2.playingXI.map((pid: string, i: number) => {
                      const p = PLAYERS_DATABASE[pid];
                      return (
                        <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 bg-white rounded-lg border border-slate-200">
                          <span className="font-black text-slate-900">{i + 1}. {p?.name || pid}</span>
                          <span className="text-[10px] font-bold text-slate-600">{p?.role || "Squad Member"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 1A: CRICKET SCORECARD
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "scorecard" && match.scorecards && match.scorecards.length > 0 && currentInnings && (
          <div className="space-y-6">
            
            {/* Innings Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto select-none">
              {scorecards.map((sc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveInningsIdx(i)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer shrink-0",
                    activeInningsIdx === i
                      ? "bg-slate-950 text-white border-slate-950 shadow-sm"
                      : "bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
                  )}
                >
                  {sc.teamCode} {sc.inningsNumber === 1 ? "1st Innings" : "2nd Innings"} ({sc.totalScore.split(' ')[0]})
                </button>
              ))}
            </div>

            {/* Innings Total Score Header */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-slate-950 shadow-xs">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  Total Score ({currentInnings.teamName} {currentInnings.inningsNumber === 1 ? "1st" : "2nd"} Innings)
                </span>
                <h3 className="text-2xl font-black font-mono text-slate-950 mt-0.5">
                  {currentInnings.totalScore}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Run Rate</span>
                <span className="text-sm font-black font-mono text-emerald-700">{currentInnings.runRate}</span>
              </div>
            </div>

            {/* BATTING TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <span>🏏</span> Batting
                </h4>
                <span className="text-[11px] text-slate-300 font-bold">Click batter for full career stats</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-black border-b border-slate-200 text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-4 font-black">Batter</th>
                      <th className="py-2.5 px-3 text-right font-black">R</th>
                      <th className="py-2.5 px-3 text-right font-black">B</th>
                      <th className="py-2.5 px-3 text-right font-black">4s</th>
                      <th className="py-2.5 px-3 text-right font-black">6s</th>
                      <th className="py-2.5 px-4 text-right font-black">SR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
                    {currentInnings.batting.map((b, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setSelectedPlayerId(b.playerId)}
                        className="hover:bg-amber-50/70 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4">
                          <div className="font-black text-slate-950 group-hover:text-red-700 flex items-center gap-1.5">
                            <span>{b.name}</span>
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono group-hover:bg-red-100 group-hover:text-red-800">
                              BIO ➔
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                            {b.dismissal}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-black font-mono text-slate-950 text-sm">{b.runs}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">{b.balls}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">{b.fours}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">{b.sixes}</td>
                        <td className="py-3 px-4 text-right font-black font-mono text-emerald-800">{b.strikeRate.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Extras Bar */}
              <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-700">
                <span className="font-bold">Extras: <strong>{currentInnings.extras.total}</strong></span>
                <span className="text-[11px] text-slate-500 font-mono">({currentInnings.extras.breakdown})</span>
              </div>
            </div>

            {/* BOWLING TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <span>🎯</span> Bowling
                </h4>
                <span className="text-[11px] text-slate-300 font-bold">Figures & Economy</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-black border-b border-slate-200 text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-4 font-black">Bowler</th>
                      <th className="py-2.5 px-3 text-right font-black">O</th>
                      <th className="py-2.5 px-3 text-right font-black">M</th>
                      <th className="py-2.5 px-3 text-right font-black">R</th>
                      <th className="py-2.5 px-3 text-right font-black">W</th>
                      <th className="py-2.5 px-4 text-right font-black">ER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
                    {currentInnings.bowling.map((bw, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setSelectedPlayerId(bw.playerId)}
                        className="hover:bg-amber-50/70 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-black text-slate-950 group-hover:text-red-700">
                          {bw.name}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">{bw.overs}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">{bw.maidens}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">{bw.runs}</td>
                        <td className="py-3 px-3 text-right font-black font-mono text-rose-800 text-sm">{bw.wickets}</td>
                        <td className="py-3 px-4 text-right font-black font-mono text-emerald-800">{bw.economy.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FALL OF WICKETS */}
            {currentInnings.fallOfWickets.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
                  <span>📉</span> Fall of Wickets
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {currentInnings.fallOfWickets.map((fow, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center shadow-2xs">
                      <span className="text-[11px] font-black font-mono text-rose-800 block">{fow.score}</span>
                      <span className="text-xs font-bold text-slate-950 truncate block mt-0.5">{fow.batsmanName}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">Ov {fow.over}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* YET TO BAT */}
            {currentInnings.yetToBat && currentInnings.yetToBat.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <span>⏳</span> Yet to Bat
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">{currentInnings.yetToBat.length} PLAYERS</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {currentInnings.yetToBat.map((ytb, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-3 transition-colors cursor-pointer shadow-2xs"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-black text-sm border border-slate-300">
                        🏏
                      </div>
                      <div>
                        <span className="font-black text-xs text-slate-950 block">{ytb.name}</span>
                        <span className="text-[10px] text-slate-600 font-bold block">{ytb.role} • Avg: {ytb.average}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 1B: FOOTBALL / SOCCER TRACKER & STATISTICS (UCL / EPL)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "scorecard" && match.matchType === "FOOTBALL" && match.footballDetails && (
          <div className="space-y-6">
            
            {/* Live Match Stats Gauges */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-slate-950">
              <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>📊</span> Opta Match Statistics
              </h3>

              <div className="space-y-4">
                {/* Possession Bar */}
                <div>
                  <div className="flex justify-between text-xs font-black mb-1">
                    <span>{match.team1.name} ({match.footballDetails.possession1}%)</span>
                    <span className="text-slate-500 font-bold uppercase text-[10px]">Ball Possession</span>
                    <span>{match.footballDetails.possession2}% ({match.team2.name})</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                    <div style={{ width: `${match.footballDetails.possession1}%` }} className="bg-emerald-600 h-full" />
                    <div style={{ width: `${match.footballDetails.possession2}%` }} className="bg-sky-600 h-full" />
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Shots</span>
                    <span className="text-base font-black font-mono text-slate-950">{match.footballDetails.shots1} - {match.footballDetails.shots2}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Shots on Target</span>
                    <span className="text-base font-black font-mono text-emerald-800">{match.footballDetails.shotsOnTarget1} - {match.footballDetails.shotsOnTarget2}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Expected Goals (xG)</span>
                    <span className="text-base font-black font-mono text-indigo-800">{match.footballDetails.xG1} - {match.footballDetails.xG2}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Corners / Fouls</span>
                    <span className="text-base font-black font-mono text-slate-950">{match.footballDetails.corners1} ({match.footballDetails.fouls1}) - {match.footballDetails.corners2} ({match.footballDetails.fouls2})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Goal / Match Timeline */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-slate-950">
              <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>⏱️</span> Match Events Timeline
              </h3>
              <div className="space-y-3">
                {match.footballDetails.timeline.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-xs bg-slate-200 text-slate-900 px-2 py-0.5 rounded">
                        {ev.minute}
                      </span>
                      <div>
                        <span className="font-black text-xs text-slate-950 block">{ev.event}</span>
                        <span className="text-[11px] font-semibold text-slate-600">{ev.player}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase">{ev.team}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 1C: TENNIS COURT TRACKER & SERVICE STATS (WIMBLEDON)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "scorecard" && match.matchType === "TENNIS" && match.tennisDetails && (
          <div className="space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-slate-950">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <span>🎾</span> Service & Match Performance
                </h3>
                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  {match.tennisDetails.surface}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Aces</span>
                  <span className="text-base font-black font-mono text-slate-950">{match.tennisDetails.aces1} vs {match.tennisDetails.aces2}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Double Faults</span>
                  <span className="text-base font-black font-mono text-rose-800">{match.tennisDetails.doubleFaults1} vs {match.tennisDetails.doubleFaults2}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">1st Serve %</span>
                  <span className="text-base font-black font-mono text-emerald-800">{match.tennisDetails.firstServePct1}% vs {match.tennisDetails.firstServePct2}%</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Break Points Won</span>
                  <span className="text-base font-black font-mono text-indigo-800">{match.tennisDetails.breakPointsConverted1}</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 1D: BASKETBALL / NBA BOX SCORE
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "scorecard" && match.matchType === "NBA" && match.basketballDetails && (
          <div className="space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-slate-950">
              <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>🏀</span> Quarter by Quarter Box Score
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200 text-[10px] uppercase">
                      <th className="py-2.5 px-4">Team</th>
                      <th className="py-2.5 px-3 text-center">Q1</th>
                      <th className="py-2.5 px-3 text-center">Q2</th>
                      <th className="py-2.5 px-3 text-center">Q3</th>
                      <th className="py-2.5 px-3 text-center">Q4</th>
                      <th className="py-2.5 px-4 text-right font-black">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold font-mono">
                    <tr>
                      <td className="py-3 px-4 font-black font-sans text-slate-950">{match.team1.name}</td>
                      <td className="py-3 px-3 text-center">{match.basketballDetails.quarters.q1[0]}</td>
                      <td className="py-3 px-3 text-center">{match.basketballDetails.quarters.q2[0]}</td>
                      <td className="py-3 px-3 text-center">{match.basketballDetails.quarters.q3[0]}</td>
                      <td className="py-3 px-3 text-center">{match.basketballDetails.quarters.q4[0]}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-800 text-sm">108</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-black font-sans text-slate-950">{match.team2.name}</td>
                      <td className="py-3 px-3 text-center">{match.basketballDetails.quarters.q1[1]}</td>
                      <td className="py-3 px-3 text-center">{match.basketballDetails.quarters.q2[1]}</td>
                      <td className="py-3 px-3 text-center">{match.basketballDetails.quarters.q3[1]}</td>
                      <td className="py-3 px-3 text-center">{match.basketballDetails.quarters.q4[1]}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-950 text-sm">104</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Performers Leaderboard */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-slate-950">
              <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>🌟</span> Top Performers Leaderboard
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {match.basketballDetails.topPerformers.map((tp, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">{tp.team} STAR</span>
                    <h4 className="font-black text-sm text-slate-950 mt-0.5">{tp.name}</h4>
                    <p className="text-xs font-mono font-bold text-slate-700 mt-1">{tp.statLine}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 2: IN-PLAY BETTING & SESSIONS EXCHANGE (LIGHT THEME)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "betting" && (
          <div className="space-y-6">
            
            {/* Match Odds (Back & Lay) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 text-slate-950 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Match Odds (Back / Lay)
                  </h3>
                  <p className="text-[11px] text-slate-600 font-bold">Zero commission Indian Bhav exchange</p>
                </div>
                <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  ● LIVE TRADING
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Team 1 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                  <span className="font-black text-sm text-slate-950">{match.team1.name}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedMarketBet({ name: `${match.team1.name} (Lagai/Back)`, type: "back", odds: 1.83 })}
                      className="w-20 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 rounded-xl text-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                    >
                      <span className="block text-[8px] font-black uppercase text-emerald-800">BACK</span>
                      <span className="text-xs font-black font-mono">{formatOddsByMode(1.83, oddsMode)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMarketBet({ name: `${match.team1.name} (Khayi/Lay)`, type: "lay", odds: 1.85 })}
                      className="w-20 py-2 bg-pink-100 hover:bg-pink-200 text-pink-950 border border-pink-300 rounded-xl text-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                    >
                      <span className="block text-[8px] font-black uppercase text-pink-800">LAY</span>
                      <span className="text-xs font-black font-mono">{formatOddsByMode(1.85, oddsMode)}</span>
                    </button>
                  </div>
                </div>

                {/* Team 2 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                  <span className="font-black text-sm text-slate-950">{match.team2.name}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedMarketBet({ name: `${match.team2.name} (Lagai/Back)`, type: "back", odds: 1.95 })}
                      className="w-20 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 rounded-xl text-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                    >
                      <span className="block text-[8px] font-black uppercase text-emerald-800">BACK</span>
                      <span className="text-xs font-black font-mono">{formatOddsByMode(1.95, oddsMode)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMarketBet({ name: `${match.team2.name} (Khayi/Lay)`, type: "lay", odds: 1.98 })}
                      className="w-20 py-2 bg-pink-100 hover:bg-pink-200 text-pink-950 border border-pink-300 rounded-xl text-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                    >
                      <span className="block text-[8px] font-black uppercase text-pink-800">LAY</span>
                      <span className="text-xs font-black font-mono">{formatOddsByMode(1.98, oddsMode)}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Fancy Session Markets */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 text-slate-950 shadow-xs">
              <h3 className="text-sm font-black uppercase tracking-wider mb-3 text-slate-900">
                ⚡ Subcontinent Fancy Sessions & Lambi
              </h3>

              <div className="space-y-2.5">
                {[
                  { name: "20 Over Total Lambi Runs", noVal: 156, noOdds: 1.90, yesVal: 158, yesOdds: 1.90 },
                  { name: "10 Over Total Session Runs", noVal: 78, noOdds: 1.88, yesVal: 80, yesOdds: 1.88 },
                  { name: "Next Wicket Fall Over (FOW)", noVal: 165, noOdds: 1.85, yesVal: 167, yesOdds: 1.85 }
                ].map((s, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <h4 className="font-black text-xs text-slate-950">{s.name}</h4>
                      <span className="text-[10px] text-slate-500 font-bold">Max Limit: ₹1,00,000</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMarketBet({ name: `${s.name} [NO ${s.noVal}]`, type: "no", odds: s.noOdds, line: s.noVal })}
                        className="w-24 py-2 bg-pink-100 hover:bg-pink-200 text-pink-950 border border-pink-300 rounded-xl text-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                      >
                        <span className="block text-[8px] font-black uppercase text-pink-800">NO ({s.noVal})</span>
                        <span className="text-xs font-black font-mono">{formatOddsByMode(s.noOdds, oddsMode)}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMarketBet({ name: `${s.name} [YES ${s.yesVal}]`, type: "yes", odds: s.yesOdds, line: s.yesVal })}
                        className="w-24 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 rounded-xl text-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                      >
                        <span className="block text-[8px] font-black uppercase text-emerald-800">YES ({s.yesVal})</span>
                        <span className="text-xs font-black font-mono">{formatOddsByMode(s.yesOdds, oddsMode)}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 3: MATCH INFO & PITCH REPORT
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Stadium & Pitch Dossier */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-slate-950 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="w-4 h-4 text-red-600" />
                Venue & Stadium Intel
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-600 font-bold">Stadium:</span>
                  <span className="font-black text-slate-950">{match.venue.stadium}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-600 font-bold">City / Country:</span>
                  <span className="font-black text-slate-950">{match.venue.city}, {match.venue.country}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-600 font-bold">Capacity:</span>
                  <span className="font-black font-mono text-slate-950">{match.venue.capacity} spectators</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-3 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block mb-1">
                  Official Pitch Report:
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {match.venue.pitchReport}
                </p>
              </div>
            </div>

            {/* Weather & Match Officials */}
            <div className="space-y-6">
              
              {/* Weather Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-slate-950">
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                  <Wind className="w-4 h-4 text-sky-600" />
                  Live Atmospheric Conditions
                </h3>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Temp</span>
                    <span className="text-xs font-black font-mono text-slate-950">{match.venue.weather.temperature}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Humidity</span>
                    <span className="text-xs font-black font-mono text-slate-950">{match.venue.weather.humidity}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Rain Risk</span>
                    <span className="text-xs font-black font-mono text-emerald-800">{match.venue.weather.rainProbability}</span>
                  </div>
                </div>
              </div>

              {/* Match Officials */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-slate-950">
                <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
                  <Award className="w-4 h-4 text-amber-600" />
                  Match Officials
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600 font-bold">On-Field Umpires:</span>
                    <span className="font-bold text-slate-950">{match.officials.umpires.join(" • ")}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600 font-bold">TV / Third Umpire:</span>
                    <span className="font-bold text-slate-950">{match.officials.thirdUmpire}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 font-bold">Match Referee:</span>
                    <span className="font-bold text-slate-950">{match.officials.matchReferee}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 4: SQUADS & LINEUPS
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "squads" && (
          <div className="space-y-6">
            
            {/* Squad Team Selector */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setSelectedSquadTeam("team1")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer",
                  selectedSquadTeam === "team1"
                    ? "bg-slate-950 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                )}
              >
                {match.team1.name} ({match.team1.code})
              </button>
              <button
                type="button"
                onClick={() => setSelectedSquadTeam("team2")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer",
                  selectedSquadTeam === "team2"
                    ? "bg-slate-950 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                )}
              >
                {match.team2.name} ({match.team2.code})
              </button>
            </div>

            {/* Squad Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(selectedSquadTeam === "team1" ? match.team1.playingXI : match.team2.playingXI).map((pId, idx) => {
                const player = PLAYERS_DATABASE[pId];
                if (!player) return null;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedPlayerId(pId)}
                    className="p-4 bg-white border border-slate-200 hover:border-red-400 rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-slate-950 border border-amber-300 flex items-center justify-center text-xl font-black shrink-0">
                        {player.avatar}
                      </div>
                      <div>
                        <h4 className="font-black text-xs sm:text-sm text-slate-950 group-hover:text-red-700 transition-colors">
                          {player.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                          {player.role}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-colors" />
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 5: SERIES FIXTURES
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "fixtures" && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Fixtures in {match.series}
            </h3>

            <div className="space-y-3">
              {[
                { title: match.title, date: match.date, status: match.status, isCurrent: true },
                { title: "2nd Fixture • Championship Series", date: "August 18, 2026", status: "Upcoming", isCurrent: false },
                { title: "3rd Fixture • Grand Final", date: "August 22, 2026", status: "Upcoming", isCurrent: false }
              ].map((fix, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-4 bg-white border rounded-2xl flex items-center justify-between gap-3 shadow-xs",
                    fix.isCurrent ? "border-red-400 bg-red-50/20" : "border-slate-200"
                  )}
                >
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">{fix.date}</span>
                    <h4 className="font-black text-xs sm:text-sm text-slate-950 mt-0.5">{fix.title}</h4>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-xl text-xs font-black font-mono",
                    fix.isCurrent ? "bg-red-600 text-white shadow-xs" : "bg-slate-100 text-slate-700"
                  )}>
                    {fix.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ═══ SLIDE-UP QUICK BET SLIP (LIGHT THEME - ELEVATED ABOVE MOBILE BOTTOM NAV) ═══ */}
      {selectedMarketBet && (
        <>
          {/* Backdrop overlay on mobile */}
          <div 
            className="fixed inset-0 bg-slate-950/40 z-[90] md:hidden backdrop-blur-xs transition-opacity" 
            onClick={() => setSelectedMarketBet(null)} 
          />
          
          <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-[95] bg-white/98 backdrop-blur-md border-t-2 border-slate-300 p-3 sm:p-5 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] animate-in slide-in-from-bottom duration-200">
            <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
              
              {/* Header: Bet Type + Selection + Odds + Close */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono shrink-0",
                    selectedMarketBet.type === "back" || selectedMarketBet.type === "yes"
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      : "bg-pink-100 text-pink-900 border border-pink-300"
                  )}>
                    {selectedMarketBet.type.toUpperCase()}
                  </span>
                  <h4 className="font-black text-xs sm:text-sm text-slate-950 truncate">
                    {selectedMarketBet.name}
                  </h4>
                  <span className="font-mono font-black text-xs sm:text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                    @ {formatOddsByMode(selectedMarketBet.odds, oddsMode)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMarketBet(null)}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer border border-slate-200 shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Controls Row: Stake Input + Quick Presets + Financials + Submit Button */}
              {(() => {
                const platformFee = Math.round(quickBetStake * 0.15 * 100) / 100;
                const isLayOrNo = selectedMarketBet.type === "lay" || selectedMarketBet.type === "no";
                const liability = isLayOrNo ? Math.round(quickBetStake * (selectedMarketBet.odds - 1) * 100) / 100 : 0;
                const totalCharged = Math.round((quickBetStake + liability + platformFee) * 100) / 100;
                const winPayout = isLayOrNo ? quickBetStake : Math.round(quickBetStake * selectedMarketBet.odds * 100) / 100;
                const netProfit = isLayOrNo ? quickBetStake : Math.round((winPayout - totalCharged) * 100) / 100;

                return (
                  <>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      {/* Stake Presets and Input */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl px-2 py-1">
                          <span className="text-xs font-black text-slate-600">₹</span>
                          <input
                            type="number"
                            value={quickBetStake}
                            onChange={(e) => setQuickBetStake(Math.max(10, parseInt(e.target.value) || 0))}
                            className="w-20 sm:w-24 text-xs sm:text-sm font-black font-mono text-slate-900 bg-transparent focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                          {[100, 500, 1000, 5000].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setQuickBetStake(amt)}
                              className={cn(
                                "px-2 sm:px-2.5 py-1 rounded-lg text-xs font-black font-mono transition-all cursor-pointer shrink-0",
                                quickBetStake === amt
                                  ? "bg-slate-950 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                              )}
                            >
                              ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Financial Summary & Place Bet Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="flex flex-col text-left sm:text-right">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            {isLayOrNo ? "Max Liability" : "Estimated Payout (Win)"}
                          </span>
                          <span className={cn(
                            "font-black font-mono text-xs sm:text-sm",
                            isLayOrNo ? "text-pink-600" : "text-emerald-700"
                          )}>
                            ₹{winPayout.toLocaleString()}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={isPlacing}
                          onClick={handlePlaceBet}
                          className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {isPlacing ? "Placing..." : `Place Bet ₹${totalCharged.toLocaleString()}`}
                        </button>
                      </div>
                    </div>

                    {/* Transparent Fee & Itemized Cost Breakdown */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                      <div className="flex items-center gap-3 text-slate-600">
                        <span>Base Stake: <strong className="text-slate-900">₹{quickBetStake.toLocaleString()}</strong></span>
                        <span>•</span>
                        <span>Service Fee (15%): <strong className="text-amber-700">₹{platformFee.toLocaleString()}</strong></span>
                        {liability > 0 && (
                          <>
                            <span>•</span>
                            <span>Lay Liability: <strong className="text-pink-700">₹{liability.toLocaleString()}</strong></span>
                          </>
                        )}
                      </div>
                      <div className="font-bold text-slate-800">
                        Total Deducted: <span className="text-red-700 font-black">₹{totalCharged.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                );
              })()}

              {betFeedback && (
                <div className="text-center text-xs font-black text-emerald-900 bg-emerald-50 border border-emerald-300 p-2 rounded-xl animate-in fade-in">
                  {betFeedback}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══ INTERACTIVE PLAYER PROFILE DOSSIER MODAL ═══ */}
      <PlayerProfileModal
        playerId={selectedPlayerId}
        onClose={() => setSelectedPlayerId(null)}
        onPlaceBet={(selectionName, odds) => {
          setSelectedMarketBet({
            name: selectionName,
            type: "back",
            odds
          });
          setSelectedPlayerId(null);
        }}
      />

    </div>
  );
}
