"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Trophy, TrendingUp, ShieldCheck, Zap, User, Star, Activity, 
  Flame, Award, Globe, ArrowRight, ChevronRight, CheckCircle2 
} from "lucide-react";
import { PlayerDossier, PLAYERS_DATABASE } from "@/lib/sportsDeepData";
import { useTradingStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface PlayerProfileModalProps {
  playerId: string | null;
  onClose: () => void;
  onPlaceBet?: (selectionName: string, odds: number) => void;
}

export function PlayerProfileModal({ playerId, onClose, onPlaceBet }: PlayerProfileModalProps) {
  const [activeStatTab, setActiveStatTab] = useState<string>("All");
  const player: PlayerDossier | null = playerId ? (PLAYERS_DATABASE[playerId] || null) : null;
  const { isLoggedIn, placeSportsBet, balance } = useTradingStore();

  const handleQuickPlayerBet = (type: "runs_over" | "runs_under" | "six", odds: number) => {
    if (!player) return;
    const title = type === "six" 
      ? `${player.name} to Hit a 6 in Match` 
      : type === "runs_over" 
        ? `${player.name} Over ${player.marketLine?.runsYes || 25.5} Runs` 
        : `${player.name} Under ${player.marketLine?.runsNo || 25.5} Runs`;

    if (onPlaceBet) {
      onPlaceBet(title, odds);
    } else {
      window.dispatchEvent(new CustomEvent("trigger-quick-bet", {
        detail: {
          selectionName: title,
          odds,
          type: "back"
        }
      }));
    }
  };

  if (!playerId || !player) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white border-2 border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden z-10 my-8 max-h-[90vh] flex flex-col"
        >
          {/* ═══ HEADER: AVATAR + BIO HERO ═══ */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-5 sm:p-6 relative overflow-hidden shrink-0">
            <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10 gap-3">
              <div className="flex items-center gap-3.5 sm:gap-4">
                {/* Avatar Badge */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-2xl sm:text-3xl font-black shadow-lg border-2 border-white/20">
                  {player.avatar}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded border border-white/20 text-amber-300">
                      {player.country} ({player.countryCode})
                    </span>
                    {player.jerseyNumber && (
                      <span className="text-[10px] font-black font-mono bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/30">
                        #{player.jerseyNumber}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight mt-0.5">
                    {player.fullName}
                  </h3>
                  <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {player.role}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close player profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-white/10 text-center">
              <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Age / Born</span>
                <span className="text-xs font-black font-mono text-white">{player.age} yrs • {player.born.split('(')[0]}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Height</span>
                <span className="text-xs font-black font-mono text-white">{player.height}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Batting / Bowling</span>
                <span className="text-xs font-black font-mono text-white truncate block">{player.battingStyle || "Right Hand"}</span>
              </div>
            </div>
          </div>

          {/* ═══ SCROLLABLE CONTENT BODY ═══ */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/70">
            
            {/* ═══ DIRECT PLAYER BETTING PROMPT (HIGH CONVERSION) ═══ */}
            {player.marketLine && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300/80 rounded-2xl p-3.5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                    Live Player Performance Fancy Markets
                  </span>
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    Instant Match
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickPlayerBet("runs_over", 1.90)}
                    className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all cursor-pointer shadow-2xs group"
                  >
                    <span className="text-[9px] font-black text-slate-500 uppercase block">Total Runs</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs font-black text-slate-900 group-hover:text-emerald-700">
                        Over {player.marketLine.runsYes}.5
                      </span>
                      <span className="text-xs font-black font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        1.90
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickPlayerBet("runs_under", 1.90)}
                    className="p-2.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl text-left transition-all cursor-pointer shadow-2xs group"
                  >
                    <span className="text-[9px] font-black text-slate-500 uppercase block">Total Runs</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs font-black text-slate-900 group-hover:text-rose-700">
                        Under {player.marketLine.runsNo}.5
                      </span>
                      <span className="text-xs font-black font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                        1.90
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickPlayerBet("six", 2.25)}
                    className="p-2.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-left transition-all cursor-pointer shadow-2xs group col-span-2 sm:col-span-1"
                  >
                    <span className="text-[9px] font-black text-slate-500 uppercase block">Hit a 6</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs font-black text-slate-900 group-hover:text-amber-800">
                        YES (1+ Six)
                      </span>
                      <span className="text-xs font-black font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                        2.25
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ═══ RECENT MATCH FORM GUIDE ═══ */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" /> Recent Match Form
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {player.recentForm.map((rf, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block truncate">{rf.opponent}</span>
                    <span className="text-sm font-black font-mono text-slate-950 block mt-0.5">{rf.score}</span>
                    <span className="text-[8px] font-extrabold text-slate-400 block mt-0.5">{rf.format}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ CAREER STATISTICS ACROSS FORMATS ═══ */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" /> Career Records by Format
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="pb-2 pr-2">Format</th>
                      <th className="pb-2 px-2 text-right">Mat</th>
                      <th className="pb-2 px-2 text-right">Inns</th>
                      <th className="pb-2 px-2 text-right">Runs / Wkts</th>
                      <th className="pb-2 px-2 text-right">HS / BBI</th>
                      <th className="pb-2 px-2 text-right">Avg</th>
                      <th className="pb-2 pl-2 text-right">SR / Econ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono font-bold text-slate-800">
                    {player.careerStats.map((st, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 pr-2 font-sans font-black text-slate-900">{st.format}</td>
                        <td className="py-2.5 px-2 text-right">{st.matches}</td>
                        <td className="py-2.5 px-2 text-right">{st.innings}</td>
                        <td className="py-2.5 px-2 text-right text-emerald-700 font-black">
                          {st.wickets !== undefined ? `${st.wickets} wkts` : st.runs}
                        </td>
                        <td className="py-2.5 px-2 text-right">{st.bestBowling || st.highestScore}</td>
                        <td className="py-2.5 px-2 text-right">{st.average.toFixed(2)}</td>
                        <td className="py-2.5 pl-2 text-right">{st.economy ? st.economy.toFixed(2) : st.strikeRate.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* ═══ FOOTER ═══ */}
          <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-bold shrink-0">
            <span>Verified Official CREX & Cricbuzz Data Feed</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
