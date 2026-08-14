"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Star, Calendar, MapPin, Wind, CloudSun, Shield, User, 
  ChevronRight, ArrowRight, Zap, Info, Users, Activity, Flame, HelpCircle
} from "lucide-react";
import { 
  DeepMatchInfo, CrexInningsScorecard, CREX_MATCHES_DATABASE, PLAYERS_DATABASE 
} from "@/lib/sportsDeepData";
import { formatOddsByMode, OddsDisplayMode } from "@/lib/bhavEngine";
import { PlayerProfileModal } from "./PlayerProfileModal";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface CrexCricketMatchCenterProps {
  matchId?: string;
  onClose?: () => void;
}

export function CrexCricketMatchCenter({ matchId = "aus-xi-vs-ban", onClose }: CrexCricketMatchCenterProps) {
  const match: DeepMatchInfo = CREX_MATCHES_DATABASE[matchId] || CREX_MATCHES_DATABASE["aus-xi-vs-ban"];
  const scorecards = match.scorecards || [];

  const [activeInningsIdx, setActiveInningsIdx] = useState(scorecards.length > 0 ? scorecards.length - 1 : 0);
  const [activeTab, setActiveTab] = useState<"scorecard" | "info" | "squads" | "exchange" | "sessions" | "h2h">("scorecard");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [oddsMode, setOddsMode] = useState<OddsDisplayMode>("decimal");

  const { isLoggedIn, balance, placeSportsBet } = useTradingStore();
  const currentInnings: CrexInningsScorecard | undefined = scorecards[activeInningsIdx];

  const handlePlayerClick = (playerId: string) => {
    setSelectedPlayerId(playerId);
  };

  const handlePlaceSessionBet = (sessionName: string, type: "yes" | "no", line: number) => {
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent("open-auth", { detail: { view: "login" } }));
      return;
    }
    const betTitle = `${sessionName}: ${line} (${type.toUpperCase()})`;
    placeSportsBet(match.title, betTitle, 2.00, 500, type === "yes" ? "yes" : "no")
      .then(res => {
        if (res?.success) {
          alert(`🎉 Wager placed: ₹500 on ${betTitle} @ 2.00`);
        } else {
          alert(res?.error || "Failed to place bet.");
        }
      });
  };

  return (
    <div className="w-full bg-white border-2 border-slate-200/90 rounded-3xl shadow-xl overflow-hidden text-slate-900 flex flex-col">
      
      {/* ═══ CREX MATCH HEADER BANNER ═══ */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-4 sm:p-6 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              {match.matchType}
            </span>
            <span className="text-xs font-bold text-slate-300 truncate">
              {match.series}
            </span>
          </div>
          <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>{match.date} • {match.timeIST}</span>
          </div>
        </div>

        {/* Teams & Scores Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black tracking-tight">{match.team1.name}</h3>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-400">{match.team1.scoreSummary}</span>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black tracking-tight">{match.team2.name}</h3>
              <span className="text-base sm:text-lg font-black font-mono text-amber-400">{match.team2.scoreSummary}</span>
            </div>
          </div>

          <div className="sm:border-l sm:border-slate-800 sm:pl-4">
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{match.status}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-bold mt-1.5 truncate">
              📍 {match.venue.stadium}, {match.venue.city}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ CREX NAVIGATION TABS ═══ */}
      <div className="flex items-center gap-1 p-2 bg-slate-100/90 border-b border-slate-200 overflow-x-auto scrollbar-none select-none">
        {[
          { id: "scorecard", label: "📋 Full Scorecard" },
          { id: "info", label: "🏟️ Match Info & Pitch" },
          { id: "squads", label: "👥 Playing XI & Squads" },
          { id: "exchange", label: "⚡ Live Exchange (Bhav)" },
          { id: "sessions", label: "🎯 Fancy Sessions" },
          { id: "h2h", label: "📈 Head to Head" }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer",
              activeTab === tab.id
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB 1: FULL CREX SCORECARD ═══ */}
      {activeTab === "scorecard" && currentInnings && (
        <div className="p-4 sm:p-6 space-y-6">
          
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
                    ? "bg-amber-50 text-amber-950 border-amber-400 ring-2 ring-amber-300 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                {sc.teamCode} {sc.inningsNumber === 1 ? "1st Innings" : "2nd Innings"} ({sc.totalScore.split(' ')[0]})
              </button>
            ))}
          </div>

          {/* Current Innings Total Header */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                {currentInnings.teamName} • {currentInnings.inningsNumber === 1 ? "1st" : "2nd"} Innings
              </span>
              <h4 className="text-xl font-black font-mono text-slate-950">
                {currentInnings.totalScore}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Run Rate</span>
              <span className="text-sm font-black font-mono text-emerald-700">{currentInnings.runRate}</span>
            </div>
          </div>

          {/* ═══ BATTING TABLE ═══ */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider">BATTING</h4>
              <span className="text-[10px] text-slate-400 font-bold">Tap any player to view profile dossier</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-2.5 px-3">Batter</th>
                    <th className="py-2.5 px-2 text-right">R</th>
                    <th className="py-2.5 px-2 text-right">B</th>
                    <th className="py-2.5 px-2 text-right">4s</th>
                    <th className="py-2.5 px-2 text-right">6s</th>
                    <th className="py-2.5 px-3 text-right">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentInnings.batting.map((bt, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <button
                          type="button"
                          onClick={() => handlePlayerClick(bt.playerId)}
                          className="text-left font-black text-slate-900 hover:text-amber-800 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span className="text-xs">{bt.name}</span>
                          <span className="text-[10px] text-slate-400">ℹ️</span>
                        </button>
                        <p className="text-[10px] text-slate-500 font-medium">{bt.dismissal}</p>
                      </td>
                      <td className="py-2.5 px-2 text-right font-black font-mono text-sm text-slate-950">{bt.runs}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-600">{bt.balls}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-700">{bt.fours}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-700">{bt.sixes}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">{bt.strikeRate.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Extras */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Extras: <strong>{currentInnings.extras.total}</strong> ({currentInnings.extras.breakdown})</span>
              <span className="font-mono text-slate-950 font-black">Total: {currentInnings.totalScore}</span>
            </div>
          </div>

          {/* ═══ BOWLING TABLE ═══ */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-900 text-white">
              <h4 className="text-xs font-black uppercase tracking-wider">BOWLING</h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-2.5 px-3">Bowler</th>
                    <th className="py-2.5 px-2 text-right">O</th>
                    <th className="py-2.5 px-2 text-right">M</th>
                    <th className="py-2.5 px-2 text-right">R</th>
                    <th className="py-2.5 px-2 text-right">W</th>
                    <th className="py-2.5 px-3 text-right">ER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {currentInnings.bowling.map((bw, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-sans">
                        <button
                          type="button"
                          onClick={() => handlePlayerClick(bw.playerId)}
                          className="font-black text-slate-900 hover:text-amber-800 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>{bw.name}</span>
                          <span className="text-[10px] text-slate-400">ℹ️</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{bw.overs}</td>
                      <td className="py-2.5 px-2 text-right text-slate-600">{bw.maidens}</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{bw.runs}</td>
                      <td className="py-2.5 px-2 text-right font-black text-emerald-700 text-sm">{bw.wickets}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800">{bw.economy.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══ FALL OF WICKETS (FOW) ═══ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">FALL OF WICKETS</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {currentInnings.fallOfWickets.map((fow, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-xs font-black font-mono text-rose-700 block">{fow.score}</span>
                  <span className="text-[10px] font-bold text-slate-800 truncate block mt-0.5">{fow.batsmanName}</span>
                  <span className="text-[9px] font-mono text-slate-500 block">{fow.over} ov</span>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ PARTNERSHIPS ═══ */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">PARTNERSHIP BREAKDOWN</h4>
            <div className="space-y-2.5">
              {currentInnings.partnerships.map((ps, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="flex justify-between items-center font-extrabold mb-1">
                    <span className="text-slate-800">{ps.batter1.name} ({ps.batter1.runs})</span>
                    <span className="font-mono text-slate-950 bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-black">
                      {ps.wicket}: {ps.totalRuns} runs ({ps.totalBalls} balls)
                    </span>
                    <span className="text-slate-800">{ps.batter2.name} ({ps.batter2.runs})</span>
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

          {/* ═══ YET TO BAT ═══ */}
          {currentInnings.yetToBat && currentInnings.yetToBat.length > 0 && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Yet to Bat</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {currentInnings.yetToBat.map((ytb, idx) => (
                  <span key={idx} className="bg-white border border-slate-200 text-slate-800 text-xs font-extrabold px-3 py-1 rounded-lg">
                    {ytb.name} <span className="text-[10px] text-slate-500 font-mono font-normal">({ytb.role}, Avg {ytb.average})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ═══ TAB 2: MATCH INFO & PITCH REPORT ═══ */}
      {activeTab === "info" && (
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Venue & Capacity */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500" /> Stadium & Venue Details
              </h4>
              <p className="text-sm font-black text-slate-900">{match.venue.stadium}</p>
              <p className="text-xs text-slate-600 font-medium">{match.venue.city}, {match.venue.country}</p>
              <p className="text-xs text-slate-500 font-mono">Spectator Capacity: <strong>{match.venue.capacity}</strong></p>
            </div>

            {/* Weather & Conditions */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CloudSun className="w-4 h-4 text-amber-500" /> Weather & Conditions
              </h4>
              <p className="text-sm font-black text-slate-900">{match.venue.weather.temperature} • {match.venue.weather.condition}</p>
              <p className="text-xs text-slate-600">Humidity: <strong>{match.venue.weather.humidity}</strong> | Rain Chance: <strong>{match.venue.weather.rainProbability}</strong></p>
            </div>
          </div>

          {/* Pitch Report */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" /> Official Pitch Report
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {match.venue.pitchReport}
            </p>
          </div>

          {/* Toss & Umpires */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Toss Decision</span>
              <p className="text-xs font-black text-slate-900 mt-1">{match.toss}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Match Officials</span>
              <p className="text-xs font-bold text-slate-900 mt-1">Umpires: {match.officials.umpires.join(', ')}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Referee: {match.officials.matchReferee}</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 3: PLAYING XI & SQUADS ═══ */}
      {activeTab === "squads" && (
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Team 1 Squad */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between border-b pb-2">
              <span>{match.team1.name} (Playing XI)</span>
              <span className="text-[10px] text-slate-500 font-mono">11 Players</span>
            </h4>
            <div className="space-y-1.5">
              {match.team1.playingXI.map((pid, idx) => {
                const pl = PLAYERS_DATABASE[pid];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePlayerClick(pid)}
                    className="w-full p-2 rounded-xl bg-slate-50 hover:bg-amber-50/80 border border-slate-200 flex items-center justify-between text-xs transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{pl?.avatar || "🏏"}</span>
                      <div>
                        <span className="font-black text-slate-900">{pl?.name || pid}</span>
                        <span className="text-[10px] text-slate-500 block font-normal">{pl?.role || "Player"}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Team 2 Squad */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between border-b pb-2">
              <span>{match.team2.name} (Playing XI)</span>
              <span className="text-[10px] text-slate-500 font-mono">11 Players</span>
            </h4>
            <div className="space-y-1.5">
              {match.team2.playingXI.map((pid, idx) => {
                const pl = PLAYERS_DATABASE[pid];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePlayerClick(pid)}
                    className="w-full p-2 rounded-xl bg-slate-50 hover:bg-amber-50/80 border border-slate-200 flex items-center justify-between text-xs transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{pl?.avatar || "🏏"}</span>
                      <div>
                        <span className="font-black text-slate-900">{pl?.name || pid}</span>
                        <span className="text-[10px] text-slate-500 block font-normal">{pl?.role || "Player"}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB 4: FANCY SESSIONS & BHAV WAGERING ═══ */}
      {activeTab === "sessions" && (
        <div className="p-4 sm:p-6 space-y-3">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-2xl p-3.5 mb-3">
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
              Live Subcontinent Fancy Sessions & Lambi
            </h4>
            <p className="text-[11px] text-amber-800 font-bold mt-0.5">
              Tap YES (Lagai) or NO (Khayi) to place a ₹500 session wager.
            </p>
          </div>

          {[
            { name: "6 Over Powerplay Runs (BAN)", no: 48, yes: 50 },
            { name: "10 Over Innings Runs (BAN)", no: 78, yes: 81 },
            { name: "20 Over Lambi Innings Score", no: 184, yes: 187 },
            { name: "Fall of Next Wicket (FOW)", no: 58, yes: 60 },
            { name: "Tanzid Hasan Total Runs", no: 24, yes: 26 },
            { name: "Campbell Thompson Wickets", no: 2, yes: 3 }
          ].map((ses, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs shadow-xs">
              <span className="font-black text-slate-900 truncate pr-2">{ses.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePlaceSessionBet(ses.name, "no", ses.no)}
                  className="w-16 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-200 rounded-xl text-center cursor-pointer active:scale-95"
                >
                  <span className="block text-[8px] font-black uppercase text-pink-700 leading-none">NO</span>
                  <span className="text-xs font-black font-mono leading-none mt-0.5 block">{ses.no}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePlaceSessionBet(ses.name, "yes", ses.yes)}
                  className="w-16 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-center cursor-pointer active:scale-95"
                >
                  <span className="block text-[8px] font-black uppercase text-emerald-700 leading-none">YES</span>
                  <span className="text-xs font-black font-mono leading-none mt-0.5 block">{ses.yes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ TAB 5: HEAD TO HEAD ═══ */}
      {activeTab === "h2h" && (
        <div className="p-4 sm:p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Historical Head to Head</h4>
            <div className="flex items-center justify-around">
              <div>
                <span className="text-xs font-black text-slate-800">{match.team1.name}</span>
                <span className="text-2xl font-black font-mono text-emerald-700 block">{match.headToHead.team1Wins} Wins</span>
              </div>
              <div className="text-center font-mono font-bold text-xs text-slate-500">
                {match.headToHead.totalPlayed} Played
              </div>
              <div>
                <span className="text-xs font-black text-slate-800">{match.team2.name}</span>
                <span className="text-2xl font-black font-mono text-amber-700 block">{match.headToHead.team2Wins} Wins</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ INTERACTIVE PLAYER PROFILE MODAL ═══ */}
      <PlayerProfileModal
        playerId={selectedPlayerId}
        onClose={() => setSelectedPlayerId(null)}
      />

    </div>
  );
}
