"use client";

import { useState, use } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Trophy, Calendar, MapPin, Wind, CloudSun, Shield, 
  User, ChevronRight, Zap, Info, Users, Activity, Flame, Share2, Star, CheckCircle2, ChevronDown
} from "lucide-react";
import { 
  DeepMatchInfo, CrexInningsScorecard, CREX_MATCHES_DATABASE, PLAYERS_DATABASE, PlayerDossier 
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
  const matchId = resolvedParams.id || "aus-xi-vs-ban";
  const match: DeepMatchInfo = CREX_MATCHES_DATABASE[matchId] || CREX_MATCHES_DATABASE["aus-xi-vs-ban"];
  const scorecards = match.scorecards || [];

  const [activeTab, setActiveTab] = useState<"scorecard" | "info" | "squads" | "betting" | "fixtures">("scorecard");
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
        setBetFeedback(`🎉 Bet Placed Successfully! Stake: ₹${quickBetStake.toLocaleString()}`);
        setTimeout(() => {
          setSelectedMarketBet(null);
          setBetFeedback(null);
        }, 2500);
      } else {
        setBetFeedback(res?.error || "Failed to place bet");
      }
    } catch {
      setBetFeedback("Network error placing bet");
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-24">
      
      {/* ═══ TOP APP BAR (PURE LIGHT THEME) ═══ */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-3 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/sportsbook"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition-colors cursor-pointer border border-slate-300"
              title="Back to Sportsbook"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                  {match.matchType}
                </span>
                <span className="text-xs font-extrabold text-slate-700 truncate max-w-[200px] sm:max-w-md">
                  {match.series}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-950 truncate">
                {match.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Odds Mode Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setOddsMode("decimal")}
                className={cn("px-2.5 py-1 rounded-lg font-black text-[11px] transition-all cursor-pointer", oddsMode === "decimal" ? "bg-slate-950 text-white shadow-xs" : "text-slate-600 hover:text-slate-950")}
              >
                1.90
              </button>
              <button
                type="button"
                onClick={() => setOddsMode("bhav")}
                className={cn("px-2.5 py-1 rounded-lg font-black text-[11px] transition-all cursor-pointer", oddsMode === "bhav" ? "bg-slate-950 text-white shadow-xs" : "text-slate-600 hover:text-slate-950")}
              >
                🇮🇳 Bhav
              </button>
              <button
                type="button"
                onClick={() => setOddsMode("multiplier")}
                className={cn("px-2.5 py-1 rounded-lg font-black text-[11px] transition-all cursor-pointer", oddsMode === "multiplier" ? "bg-slate-950 text-white shadow-xs" : "text-slate-600 hover:text-slate-950")}
              >
                1 ka X
              </button>
            </div>

            <Link
              href="/sportsbook"
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs"
            >
              Live Sportsbook
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ CREX HERO SCORECARD HUD (EXACT SCREENSHOT 1 MATCH) ═══ */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-6 text-slate-950 shadow-xs">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center text-xs font-extrabold text-slate-500 mb-5 tracking-wide uppercase">
            {match.title}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Team 1 Score (Left) */}
            <div className="flex items-center gap-4 justify-start">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-3xl shadow-md shrink-0">
                🇧🇩
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
                  <span>{match.team1.code}</span>
                  <span className="text-xs text-slate-600 font-bold">263 (75.5)</span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-800 tracking-tight">
                  54-10 <span className="text-xs text-slate-600 font-bold">(22.0)</span>
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
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-950 tracking-tight">
                  355 <span className="text-xs text-slate-600 font-bold">(87.2)</span>
                </div>
                <div className="text-base sm:text-lg font-black text-slate-950">
                  {match.team2.code}
                </div>
              </div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-sky-50 border-2 border-sky-500 flex items-center justify-center text-3xl shadow-md shrink-0 order-1 md:order-2">
                🇦🇺
              </div>
            </div>

          </div>

          {/* Quick Odds Bar on Hero */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">Match Odds:</span>
              <button
                type="button"
                onClick={() => setSelectedMarketBet({ name: `${match.team1.name} To Win`, type: "back", odds: 3.40 })}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 shadow-2xs"
              >
                {match.team1.code}: <span className="font-mono text-emerald-800 font-black">{formatOddsByMode(3.40, oddsMode)}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMarketBet({ name: `${match.team2.name} To Win`, type: "back", odds: 1.30 })}
                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-950 border border-sky-300 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 shadow-2xs"
              >
                {match.team2.code}: <span className="font-mono text-sky-800 font-black">{formatOddsByMode(1.30, oddsMode)}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-700 font-bold">
              Toss: <strong className="text-slate-950">{match.toss}</strong>
            </div>
          </div>

        </div>
      </div>

      {/* ═══ CREX NAVIGATION TABS (MATCHING SCREENSHOTS) ═══ */}
      <div className="sticky top-[61px] z-30 bg-white border-b border-slate-200 px-4 sm:px-6 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none py-2.5 select-none">
          {[
            { id: "scorecard", label: "Scorecard" },
            { id: "betting", label: "⚡ In-Play Exchange & Sessions" },
            { id: "info", label: "Match info" },
            { id: "squads", label: "Squads" },
            { id: "fixtures", label: "Series Fixtures" }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer",
                activeTab === tab.id
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
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
            TAB 1: FULL SCORECARD (MATCHING SCREENSHOT 1)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "scorecard" && currentInnings && (
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

            {/* Scorecard Layout: Batting & Bowling Left, Yet to Bat Right (Like Screenshot 1) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left 2 Cols: Batting & Bowling & FOW */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* ═══ BATTING CARD ═══ */}
                <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <span>🏏</span> BATTING
                    </h4>
                    <span className="text-[10px] text-slate-300 font-bold">Click batter for full career stats</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase text-slate-700 tracking-wider">
                          <th className="py-3 px-4">Batter</th>
                          <th className="py-3 px-2 text-right">R</th>
                          <th className="py-3 px-2 text-right">B</th>
                          <th className="py-3 px-2 text-right">4s</th>
                          <th className="py-3 px-2 text-right">6s</th>
                          <th className="py-3 px-4 text-right">SR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentInnings.batting.map((bt, idx) => (
                          <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => setSelectedPlayerId(bt.playerId)}
                                className="text-left font-black text-slate-950 hover:text-red-700 transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <span className="text-xs font-black">{bt.name}</span>
                                <span className="text-[10px] text-slate-400">ℹ️</span>
                              </button>
                              <p className="text-[11px] text-slate-600 font-semibold mt-0.5">{bt.dismissal}</p>
                            </td>
                            <td className="py-3 px-2 text-right font-black font-mono text-sm text-slate-950">{bt.runs}</td>
                            <td className="py-3 px-2 text-right font-mono text-slate-800 font-bold">{bt.balls}</td>
                            <td className="py-3 px-2 text-right font-mono text-slate-800 font-bold">{bt.fours}</td>
                            <td className="py-3 px-2 text-right font-mono text-slate-800 font-bold">{bt.sixes}</td>
                            <td className="py-3 px-4 text-right font-mono font-black text-slate-950">{bt.strikeRate.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Extras & Total */}
                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Extras: <strong className="text-slate-950">{currentInnings.extras.total}</strong> ({currentInnings.extras.breakdown})</span>
                    <span className="font-mono text-slate-950 font-black">Total: {currentInnings.totalScore}</span>
                  </div>
                </div>

                {/* ═══ BOWLING CARD ═══ */}
                <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-3.5 bg-slate-900 text-white">
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <span>🎯</span> BOWLING
                    </h4>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase text-slate-700 tracking-wider">
                          <th className="py-3 px-4">Bowler</th>
                          <th className="py-3 px-2 text-right">O</th>
                          <th className="py-3 px-2 text-right">M</th>
                          <th className="py-3 px-2 text-right">R</th>
                          <th className="py-3 px-2 text-right">W</th>
                          <th className="py-3 px-4 text-right">ER</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {currentInnings.bowling.map((bw, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-sans">
                              <button
                                type="button"
                                onClick={() => setSelectedPlayerId(bw.playerId)}
                                className="font-black text-slate-950 hover:text-red-700 transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <span>{bw.name}</span>
                                <span className="text-[10px] text-slate-400">ℹ️</span>
                              </button>
                            </td>
                            <td className="py-3 px-2 text-right text-slate-800 font-bold">{bw.overs}</td>
                            <td className="py-3 px-2 text-right text-slate-800 font-bold">{bw.maidens}</td>
                            <td className="py-3 px-2 text-right text-slate-800 font-bold">{bw.runs}</td>
                            <td className="py-3 px-2 text-right font-black text-emerald-700 text-sm">{bw.wickets}</td>
                            <td className="py-3 px-4 text-right font-black text-slate-950">{bw.economy.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ═══ FALL OF WICKETS (FOW) ═══ */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-slate-950 shadow-xs">
                  <h4 className="text-xs font-black uppercase tracking-wider mb-3 text-slate-700">
                    FALL OF WICKETS
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {currentInnings.fallOfWickets.map((fow, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <span className="text-xs font-black font-mono text-rose-700 block">{fow.score}</span>
                        <span className="text-[10px] font-black text-slate-900 truncate block mt-0.5">{fow.batsmanName}</span>
                        <span className="text-[9px] font-mono text-slate-600 font-bold block">{fow.over} ov</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ═══ PARTNERSHIPS ═══ */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-slate-950 shadow-xs">
                  <h4 className="text-xs font-black uppercase tracking-wider mb-3 text-slate-700">
                    PARTNERSHIP BREAKDOWN
                  </h4>
                  <div className="space-y-2.5">
                    {currentInnings.partnerships.map((ps, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <div className="flex justify-between items-center font-black mb-1">
                          <span className="text-slate-900">{ps.batter1.name} ({ps.batter1.runs})</span>
                          <span className="font-mono text-slate-950 bg-amber-100 text-amber-950 px-2 py-0.5 rounded font-black border border-amber-300">
                            {ps.wicket}: {ps.totalRuns} runs ({ps.totalBalls}b)
                          </span>
                          <span className="text-slate-900">{ps.batter2.name} ({ps.batter2.runs})</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-sky-500 h-full"
                            style={{ width: `${(ps.batter1.runs / (ps.totalRuns || 1)) * 100}%` }}
                          />
                          <div 
                            className="bg-emerald-500 h-full"
                            style={{ width: `${(ps.batter2.runs / (ps.totalRuns || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Yet to Bat with Player Portraits (Matching Screenshot 1) */}
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-slate-950 shadow-xs">
                  <h4 className="text-xs font-black uppercase tracking-wider mb-3 text-slate-800 flex items-center justify-between">
                    <span>Yet to bat</span>
                    <span className="text-[10px] text-slate-600 font-mono font-bold">{currentInnings.yetToBat.length} Players</span>
                  </h4>

                  <div className="space-y-2.5">
                    {currentInnings.yetToBat.map((ytb, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-amber-400 transition-colors shadow-2xs"
                      >
                        {/* Player Avatar */}
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-300 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                          🏏
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-slate-950">{ytb.name}</h5>
                          <p className="text-[10px] text-slate-600 font-mono font-bold">Avg: {ytb.average.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick In-Play Bet CTA */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-300 rounded-2xl p-4 text-amber-950 shadow-xs">
                  <h5 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
                    In-Play Fancy Betting Active
                  </h5>
                  <p className="text-[11px] text-amber-900 font-bold mt-1">
                    Live 6-Over, 10-Over, and Lambi session markets are active for this fixture.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("betting")}
                    className="w-full mt-3 py-2 bg-slate-950 hover:bg-slate-800 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                  >
                    View In-Play Markets ➔
                  </button>
                </div>
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
                      onClick={() => setSelectedMarketBet({ name: `${match.team1.name} (Lagai/Back)`, type: "back", odds: 3.40 })}
                      className="w-20 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 rounded-xl text-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                    >
                      <span className="block text-[8px] font-black uppercase text-emerald-800">BACK</span>
                      <span className="text-xs font-black font-mono">{formatOddsByMode(3.40, oddsMode)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMarketBet({ name: `${match.team1.name} (Khayi/Lay)`, type: "lay", odds: 3.45 })}
                      className="w-20 py-2 bg-pink-100 hover:bg-pink-200 text-pink-950 border border-pink-300 rounded-xl text-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                    >
                      <span className="block text-[8px] font-black uppercase text-pink-800">LAY</span>
                      <span className="text-xs font-black font-mono">{formatOddsByMode(3.45, oddsMode)}</span>
                    </button>
                  </div>
                </div>

                {/* Team 2 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                  <span className="font-black text-sm text-slate-950">{match.team2.name}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedMarketBet({ name: `${match.team2.name} (Lagai/Back)`, type: "back", odds: 1.30 })}
                      className="w-20 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 rounded-xl text-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                    >
                      <span className="block text-[8px] font-black uppercase text-emerald-800">BACK</span>
                      <span className="text-xs font-black font-mono">{formatOddsByMode(1.30, oddsMode)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMarketBet({ name: `${match.team2.name} (Khayi/Lay)`, type: "lay", odds: 1.32 })}
                      className="w-20 py-2 bg-pink-100 hover:bg-pink-200 text-pink-950 border border-pink-300 rounded-xl text-center cursor-pointer transition-all active:scale-95 shadow-2xs"
                    >
                      <span className="block text-[8px] font-black uppercase text-pink-800">LAY</span>
                      <span className="text-xs font-black font-mono">{formatOddsByMode(1.32, oddsMode)}</span>
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
                  { name: "6 Over Powerplay Runs (BAN)", no: 48, yes: 50 },
                  { name: "10 Over Innings Runs (BAN)", no: 78, yes: 81 },
                  { name: "20 Over Lambi Innings Score", no: 184, yes: 187 },
                  { name: "Fall of Next Wicket (FOW)", no: 58, yes: 60 },
                  { name: "Tanzid Hasan Total Runs", no: 24, yes: 26 },
                  { name: "Campbell Thompson Wickets", no: 2, yes: 3 }
                ].map((ses, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                    <span className="font-black text-xs text-slate-950 truncate pr-2">{ses.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedMarketBet({ name: `${ses.name} NO (${ses.no})`, type: "no", odds: 2.00, line: ses.no })}
                        className="w-20 py-1.5 bg-pink-100 hover:bg-pink-200 text-pink-950 border border-pink-300 rounded-xl text-center cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <span className="block text-[8px] font-black uppercase text-pink-800">NO</span>
                        <span className="text-xs font-black font-mono">{ses.no}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMarketBet({ name: `${ses.name} YES (${ses.yes})`, type: "yes", odds: 2.00, line: ses.yes })}
                        className="w-20 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 rounded-xl text-center cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <span className="block text-[8px] font-black uppercase text-emerald-800">YES</span>
                        <span className="text-xs font-black font-mono">{ses.yes}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 3: SQUADS WITH PLAYER PORTRAITS (MATCHING SCREENSHOT 3)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "squads" && (
          <div className="space-y-6">
            
            {/* Squad Team Selector Tabs */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedSquadTeam("team1")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer",
                  selectedSquadTeam === "team1"
                    ? "bg-slate-950 text-white border-slate-950 shadow-sm"
                    : "bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
                )}
              >
                <span>🇧🇩</span>
                <span>{match.team1.name} (16 Players)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSquadTeam("team2")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer",
                  selectedSquadTeam === "team2"
                    ? "bg-slate-950 text-white border-slate-950 shadow-sm"
                    : "bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
                )}
              >
                <span>🇦🇺</span>
                <span>{match.team2.name} (13 Players)</span>
              </button>
            </div>

            {/* Categorized Squad Grid (Batters, Bowlers, WKs) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-950 space-y-6 shadow-xs">
              
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2 mb-4">
                  Batters & All-Rounders
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {(selectedSquadTeam === "team1" ? match.team1.playingXI : match.team2.playingXI).map((pid, idx) => {
                    const pl = PLAYERS_DATABASE[pid];
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedPlayerId(pid)}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center hover:border-red-500 hover:shadow-md transition-all cursor-pointer shadow-2xs group"
                      >
                        {/* Player Portrait Avatar */}
                        <div className="w-14 h-14 rounded-full bg-white border-2 border-slate-300 group-hover:border-red-500 flex items-center justify-center text-2xl shadow-xs mb-2.5 transition-all">
                          {pl?.avatar || "🏏"}
                        </div>
                        <h5 className="text-xs font-black text-slate-950 group-hover:text-red-700 transition-colors truncate w-full">
                          {pl?.name || pid}
                        </h5>
                        <p className="text-[10px] text-slate-600 font-bold mt-0.5 truncate w-full">
                          {pl?.role || "Batsman"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 4: MATCH INFO & PITCH REPORT (LIGHT THEME)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "info" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-600" /> Stadium & Venue Details
                </h4>
                <p className="text-sm font-black text-slate-950">{match.venue.stadium}</p>
                <p className="text-xs text-slate-700 font-bold">{match.venue.city}, {match.venue.country}</p>
                <p className="text-xs text-slate-600 font-mono">Spectator Capacity: <strong className="text-slate-950">{match.venue.capacity}</strong></p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CloudSun className="w-4 h-4 text-amber-600" /> Weather & Conditions
                </h4>
                <p className="text-sm font-black text-slate-950">{match.venue.weather.temperature} • {match.venue.weather.condition}</p>
                <p className="text-xs text-slate-700 font-bold">Humidity: <strong className="text-slate-950">{match.venue.weather.humidity}</strong> | Rain Chance: <strong className="text-slate-950">{match.venue.weather.rainProbability}</strong></p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-700" /> Official Pitch Report
              </h4>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {match.venue.pitchReport}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Toss Decision</span>
                <p className="text-xs font-black text-slate-950 mt-1">{match.toss}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Match Officials</span>
                <p className="text-xs font-bold text-slate-950 mt-1">Umpires: {match.officials.umpires.join(', ')}</p>
                <p className="text-[11px] text-slate-700 mt-0.5">Referee: {match.officials.matchReferee}</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            TAB 5: SERIES FIXTURES (MATCHING SCREENSHOT 2)
        ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "fixtures" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-slate-950 space-y-4 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
              {match.series} Schedule
            </h4>

            <div className="space-y-3">
              {/* Match 1 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] text-slate-600 font-black uppercase block">Wednesday, August 5 • Warm-Up Match</span>
                  <h5 className="text-sm font-black text-slate-950 mt-0.5">AUS-XI vs BAN</h5>
                  <p className="text-xs text-amber-800 font-black mt-0.5">AUS-XI Won by an inn & 38 runs 🏆</p>
                </div>
                <div className="text-right font-mono text-xs font-black text-slate-950">
                  <div>AUS-XI 355 (87.2)</div>
                  <div className="text-slate-600">BAN 263 & 54</div>
                </div>
              </div>

              {/* Match 2 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] text-slate-600 font-black uppercase block">Wednesday, August 12 • 1st Test</span>
                  <h5 className="text-sm font-black text-slate-950 mt-0.5">AUS vs BAN</h5>
                  <p className="text-xs text-emerald-800 font-black mt-0.5">Stumps Day 3</p>
                </div>
                <div className="text-right font-mono text-xs font-black text-slate-950">
                  <div>BAN 351/6 (110.0)</div>
                  <div className="text-slate-600">AUS 198 (53.0)</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ═══ SLIDE-UP QUICK BET SLIP (LIGHT THEME) ═══ */}
      <AnimatePresence>
        {selectedMarketBet && (
          <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 bg-white/95 backdrop-blur-md border-t-2 border-red-600 shadow-2xl">
            <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center text-lg font-black shrink-0 border border-amber-300">
                  ⚡
                </div>
                <div>
                  <h5 className="text-xs sm:text-sm font-black text-slate-950">{selectedMarketBet.name}</h5>
                  <p className="text-[10px] font-mono text-emerald-800 font-black">
                    Odds: {formatOddsByMode(selectedMarketBet.odds, oddsMode)} | Potential Return: ₹{Math.round(quickBetStake * selectedMarketBet.odds).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Stake Presets & Submit */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {[100, 500, 1000, 5000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQuickBetStake(amt)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-mono font-black border transition-all cursor-pointer",
                      quickBetStake === amt
                        ? "bg-slate-950 text-white border-slate-950"
                        : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
                    )}
                  >
                    ₹{amt}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handlePlaceBet}
                  disabled={isPlacing}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer shrink-0"
                >
                  {isPlacing ? "Matching..." : `Bet ₹${quickBetStake}`}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMarketBet(null)}
                  className="p-2 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {betFeedback && (
              <div className="text-center text-xs font-black text-emerald-800 mt-2">
                {betFeedback}
              </div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* ═══ INTERACTIVE PLAYER PROFILE MODAL ═══ */}
      <PlayerProfileModal
        playerId={selectedPlayerId}
        onClose={() => setSelectedPlayerId(null)}
      />

    </div>
  );
}
