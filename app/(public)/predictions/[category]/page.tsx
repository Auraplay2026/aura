"use client";

import { motion, useMotionTemplate, useMotionValue, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, ChevronRight, BarChart2, Star, X, CheckCircle2, AlertCircle } from "lucide-react";
import { use, useState, MouseEvent, useEffect } from "react";
import { redirect } from "next/navigation";

import { useTradingStore } from "@/lib/store";
import { useLiveMarkets } from "@/hooks/useLiveMarkets";
import { RoobetPredictionsUI } from "@/components/predictions/RoobetPredictionsUI";

function Sparkline({ data, color }: { data: number[], color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="w-full h-12 relative flex items-end">
      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={`0,100 ${points} 100,100`}
          fill={`url(#grad-${color})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_0_8px_currentColor]"
        />
      </svg>
    </div>
  );
}

function PremiumMarketCard({ market, onTrade }: { market: any, onTrade: (market: any, side: 'yes' | 'no') => void }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const isTrendingUp = market.yes > market.history[0];
  const trendColor = isTrendingUp ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)";
  const glowTheme = isTrendingUp ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-3xl border border-slate-200 bg-slate-50/60 overflow-hidden backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] cursor-pointer"
      style={{ boxShadow: `0 0 40px ${glowTheme}` }}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background: useMotionTemplate`radial-gradient(650px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.1), transparent 80%)` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.05),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(34,197,94,0.05),transparent_50%)] z-0 pointer-events-none" />

      <div className="relative z-10 p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-inner">
              <Star className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
            </div>
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-600 bg-white/80 px-3 py-1.5 rounded-full border border-slate-200/80">
              <DollarSign className="w-3 h-3 text-neon-yellow" /> {market.volume} Vol
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 px-3 py-1.5 rounded-full border border-slate-200/50 bg-white/40">
            <Activity className="w-3 h-3" /> LIVE
          </div>
        </div>

        <h3 className="text-2xl font-black text-slate-900 leading-tight mb-8 pr-4 drop-shadow-md">{market.title}</h3>

        <div className="mb-6 relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-transparent via-slate-800/20 to-transparent z-0 blur-sm" />
          <div className="relative z-10"><Sparkline data={market.history} color={trendColor} /></div>
          <div className="flex justify-between items-center mt-2 px-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">7D History</span>
            <span className={`text-[10px] font-bold flex items-center gap-1 ${isTrendingUp ? 'text-green-500' : 'text-red-500'}`}>
              {isTrendingUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(market.yes - market.history[0])}% change
            </span>
          </div>
        </div>

        <div className="w-full h-3 bg-white rounded-full overflow-hidden flex mb-6 relative border border-slate-200/80 shadow-inner">
          <motion.div initial={{ width: 0 }} animate={{ width: `${market.yes}%` }} transition={{ duration: 1, type: "spring" }} className="h-full bg-gradient-to-r from-green-500 to-neon-green shadow-[0_0_15px_rgba(34,197,94,0.8)] relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:15px_15px] animate-[shimmer_1s_linear_infinite]" />
          </motion.div>
          <motion.div initial={{ width: 0 }} animate={{ width: `${market.no}%` }} transition={{ duration: 1, type: "spring" }} className="h-full bg-gradient-to-r from-red-500 to-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-auto">
          <button onClick={() => onTrade(market, 'yes')} className="relative group/btn overflow-hidden rounded-2xl bg-white border border-green-500/30 hover:border-green-500 transition-all duration-300">
            <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            <div className="relative z-10 py-4 px-6 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-green-500/80 uppercase tracking-widest mb-1 group-hover/btn:text-green-600 transition-colors">Trade Yes</span>
              <span className="text-3xl font-black text-slate-900 group-hover/btn:text-neon-green transition-colors font-mono">{market.yes}¢</span>
            </div>
            <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50 group-hover/btn:opacity-100 transition-opacity" />
          </button>

          <button onClick={() => onTrade(market, 'no')} className="relative group/btn overflow-hidden rounded-2xl bg-white border border-red-500/30 hover:border-red-500 transition-all duration-300">
            <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            <div className="relative z-10 py-4 px-6 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-red-500/80 uppercase tracking-widest mb-1 group-hover/btn:text-red-600 transition-colors">Trade No</span>
              <span className="text-3xl font-black text-slate-900 group-hover/btn:text-red-500 transition-colors font-mono">{market.no}¢</span>
            </div>
            <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50 group-hover/btn:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function PredictionsCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const unwrappedParams = use(params);
  const categoryName = unwrappedParams.category.replace("-", " ");
  
  // Sports has its own dedicated page — redirect there
  if (categoryName.toLowerCase() === "sports") {
    redirect('/sportsbook');
  }

  // Connect to global live markets
  const predictions = useLiveMarkets(categoryName);

  // Connect to global trading store
  const { balance, placeTrade } = useTradingStore();
  
  return <RoobetPredictionsUI categoryName={categoryName} predictions={predictions} balance={balance} placeTrade={placeTrade} />;
}
