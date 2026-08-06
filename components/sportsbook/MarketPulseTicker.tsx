"use client";

import { useEffect, useState } from "react";
import { Activity, Flame, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface PulseMatch {
  id: string;
  sport: "Cricket" | "Soccer" | "Tennis";
  title: string;
  score: string;
  status: string;
  oddsA: number;
  oddsB: number;
}

const LIVE_PULSE_DATA: PulseMatch[] = [
  { id: "p-1", sport: "Cricket", title: "India vs Australia (T20)", score: "IND 184/4 (18.2 Overs)", status: "6 Over Runs: 48.5 Line", oddsA: 1.85, oddsB: 1.95 },
  { id: "p-2", sport: "Soccer", title: "Arsenal vs Chelsea", score: "ARS 2 - 1 CHE (74')", status: "Live Match Odds", oddsA: 2.10, oddsB: 3.40 },
  { id: "p-3", sport: "Tennis", title: "Alcaraz vs Djokovic", score: "Set 2: 4 - 3", status: "Break Point Active", oddsA: 1.72, oddsB: 2.15 },
  { id: "p-4", sport: "Cricket", title: "England vs South Africa", score: "ENG 142/2 (14.0 Overs)", status: "Next Ball Boundary", oddsA: 1.90, oddsB: 1.90 },
];

export function MarketPulseTicker() {
  const [matches, setMatches] = useState<PulseMatch[]>(LIVE_PULSE_DATA);

  // Dynamic odds pulse ticker interval
  useEffect(() => {
    const interval = setInterval(() => {
      setMatches((prev) =>
        prev.map((m) => {
          const shift = (Math.random() - 0.5) * 0.08;
          return {
            ...m,
            oddsA: Math.max(1.05, parseFloat((m.oddsA + shift).toFixed(2))),
            oddsB: Math.max(1.05, parseFloat((m.oddsB - shift).toFixed(2))),
          };
        })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-slate-900 text-white py-2.5 px-4 border-b border-slate-800 flex items-center gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden scroll-smooth select-none z-20">
      <div className="flex items-center gap-2 shrink-0 bg-red-600/20 text-red-400 px-2.5 py-1 rounded-full border border-red-500/30 text-[10px] font-black uppercase tracking-widest">
        <Activity className="w-3.5 h-3.5 animate-pulse" />
        <span>LIVE MARKET PULSE</span>
      </div>

      <div className="flex items-center gap-4 flex-nowrap shrink-0">
        {matches.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm"
          >
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{m.sport} · {m.title}</span>
              <span className="text-amber-400 font-mono text-xs">{m.score}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-black">
                {m.oddsA.toFixed(2)}
              </span>
              <span className="text-slate-500">/</span>
              <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded border border-rose-500/30 font-black">
                {m.oddsB.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
